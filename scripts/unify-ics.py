#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
unify_ics.py
Merge & normalize multiple ICS files into one:
 - Handles folded lines (RFC 5545)
 - Converts timed events to Australia/Melbourne timezone
 - Keeps all-day events as VALUE=DATE
 - Preserves SUMMARY, LOCATION, DESCRIPTION, URL, STATUS, TRANSP
 - De-duplicates by (UID, DTSTART, SUMMARY) keeping latest LAST-MODIFIED/DTSTAMP
 - Sorts by start time
 - (Optional) Formats DESCRIPTION and redacts signup links

Usage:
  python unify_ics.py -o unified_calendar.ics custom-events.ics unimelb-econ.ics monash_ebs.ics

Optional cleanup:
  --clean-description
  --redact-signup-links
  --redact-domain forms.gle --redact-domain mydept.edu/register
"""

from __future__ import annotations
import argparse
import os
import re
import html
from collections import defaultdict
from datetime import datetime, date, UTC
from typing import List, Tuple, Dict, Any, Iterable
from zoneinfo import ZoneInfo

MEL_TZ = ZoneInfo("Australia/Melbourne")

# ---------- ICS helpers ----------

def read_unfolded(path: str) -> List[str]:
    """Read ICS file and unfold folded lines per RFC 5545."""
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        raw = f.read().replace("\r\n", "\n").replace("\r", "\n")
    lines = raw.split("\n")
    unfolded: List[str] = []
    for line in lines:
        if line.startswith(" ") or line.startswith("\t"):
            if unfolded:
                unfolded[-1] += line[1:]
        else:
            unfolded.append(line)
    return unfolded

class Prop(Tuple[str, Dict[str, str], str]):  # (name, params, value)
    __slots__ = ()

def parse_prop(line: str) -> Prop | None:
    """Parse a single ICS content line into (name, params, value)."""
    if ":" not in line:
        return None
    head, value = line.split(":", 1)
    parts = head.split(";")
    name = parts[0].strip().upper()
    params: Dict[str, str] = {}
    for p in parts[1:]:
        if "=" in p:
            k, v = p.split("=", 1)
            params[k.strip().upper()] = v.strip()
        else:
            params[p.strip().upper()] = "TRUE"  # rare param without value
    return Prop((name, params, value))

def dt_from_prop(prop: Prop):
    """Turn DTSTART/DTEND/DTSTAMP/LAST-MODIFIED into datetime/date."""
    name, params, val = prop
    val = val.strip()
    # All-day date?
    is_date = params.get("VALUE", "").upper() == "DATE" or (len(val) == 8 and val.isdigit())
    if is_date:
        try:
            return datetime.strptime(val, "%Y%m%d").date()
        except Exception:
            return None
    # UTC?
    if val.endswith("Z"):
        try:
            return datetime.strptime(val, "%Y%m%dT%H%M%SZ").replace(tzinfo=ZoneInfo("UTC"))
        except Exception:
            pass
    # Local with possible TZID
    tzid = params.get("TZID")
    for fmt in ("%Y%m%dT%H%M%S", "%Y%m%dT%H%M"):
        try:
            naive = datetime.strptime(val, fmt)
            tz = ZoneInfo(tzid) if tzid else MEL_TZ
            return naive.replace(tzinfo=tz)
        except Exception:
            continue
    return None

def prop_to_line(name: str, value: str, params: Dict[str, str] | None = None) -> str:
    p = ""
    if params:
        for k, v in params.items():
            p += f";{k}={v}"
    return f"{name}{p}:{value}"

def ics_escape(
    s: str,
    *,
    escape_anything: bool = False,
    escape_commas: bool = False,
    escape_semicolons: bool = False
) -> str:
    """
    Minimal ICS text escaping:
    - backslash -> \\
    - newline -> \\n
    - comma -> \\,
    - semicolon -> \\;
    """
    if escape_anything:
        s = s.replace("\\", "\\\\")
        s = s.replace("\r\n", "\n").replace("\r", "\n")
        s = s.replace("\n", "\\n")
        if escape_commas:
            s = s.replace(",", "\\,")
        if escape_semicolons:
            s = s.replace(";", "\\;")

    return s

def sanitize_text(text: str) -> str:
    return (text or "").strip()

# ---------- DESCRIPTION formatting & redaction ----------

DEFAULT_REDACT_DOMAINS: tuple[str, ...] = (
    # common signup/registration hosts
    "docs.google.com", "forms.gle", "forms.office.com", "eventbrite.com",
    "zoom.us", "qualtrics.com", "signup.", "register.", "trybooking.com",
)

URL_RE = re.compile(r"https?://[^\s>\"')]+", re.IGNORECASE)

def looks_like_signup_url(url: str, extra_domains: Iterable[str]) -> bool:
    host = url.split("/", 3)[2] if "://" in url else url
    host = host.lower()
    domains = set(d.lower() for d in DEFAULT_REDACT_DOMAINS)
    for d in extra_domains:
        domains.add(d.lower())
    return any(d in host for d in domains)

def strip_html_preserve_breaks(html_text: str) -> str:
    """
    Convert lightweight HTML to plain text:
      - <br>, <br/>, <p>, <div>, <li>, <h1-6> -> newline
      - remove remaining tags
      - unescape entities
      - collapse 3+ newlines -> 2, trim whitespace
    """
    if not html_text:
        return ""
    t = html_text

    # normalize newlines for block-ish tags
    t = re.sub(r"(?i)</?(br|p|div|li|ul|ol|h[1-6])\b[^>]*>", "\n", t)
    # strip remaining tags
    t = re.sub(r"<[^>]+>", "", t)
    # unescape entities
    t = html.unescape(t)
    # normalize whitespace
    t = re.sub(r"[ \t]+\n", "\n", t)
    t = re.sub(r"\n[ \t]+", "\n", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return t.strip()

def redact_signup_links(text: str, extra_domains: Iterable[str], replacement: str = "[signup link removed]") -> str:
    if not text:
        return text
    def _repl(m: re.Match) -> str:
        url = m.group(0)
        return replacement if looks_like_signup_url(url, extra_domains) else url
    return URL_RE.sub(_repl, text)

def format_description(raw: str, *, clean: bool, redact_links: bool, extra_redact_domains: Iterable[str]) -> str:
    """
    Format DESCRIPTION:
      - If clean=True: convert HTML to plain, normalize whitespace
      - If redact_links=True: replace matching signup/registration URLs with placeholder
    """
    text = raw or ""
    if clean:
        text = strip_html_preserve_breaks(text)
    if redact_links:
        text = redact_signup_links(text, extra_redact_domains)
    return text

# ---------- Parsing / normalization / rendering ----------

def parse_events(lines: List[str], source_name: str) -> List[Dict[str, Any]]:
    """Extract VEVENTs into dicts of interesting props."""
    events: List[Dict[str, Any]] = []
    in_event = False
    buf: List[str] = []
    for line in lines:
        L = line.strip().upper()
        if L == "BEGIN:VEVENT":
            in_event = True
            buf = []
            continue
        if L == "END:VEVENT":
            ev: Dict[str, Any] = {"__source__": source_name}
            for l in buf:
                p = parse_prop(l)
                if not p:
                    continue
                key = p[0]
                if key in ("DTSTART", "DTEND", "DTSTAMP", "LAST-MODIFIED"):
                    ev[key] = dt_from_prop(p)
                    if key == "DTSTART" and isinstance(ev[key], date) and not isinstance(ev[key], datetime):
                        ev["__all_day__"] = True
                elif key in ("SUMMARY", "LOCATION", "DESCRIPTION", "UID", "SEQUENCE", "STATUS", "TRANSP", "URL"):
                    ev[key] = p[2].strip()
            ev["SUMMARY"] = sanitize_text(ev.get("SUMMARY", ""))
            events.append(ev)
            in_event = False
            buf = []
            continue
        if in_event:
            buf.append(line)
    return events

def normalize_event(ev: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize to consistent fields and tz."""
    out = dict(ev)
    all_day = ev.get("__all_day__", False)

    if all_day:
        ds = ev.get("DTSTART")
        de = ev.get("DTEND")
        if isinstance(ds, date) and not isinstance(ds, datetime):
            out["DTSTART_OUT"] = ("VALUE=DATE", ds.strftime("%Y%m%d"))
        if isinstance(de, date) and not isinstance(de, datetime):
            out["DTEND_OUT"] = ("VALUE=DATE", de.strftime("%Y%m%d"))
    else:
        for fld in ("DTSTART", "DTEND"):
            v = ev.get(fld)
            if isinstance(v, datetime):
                v2 = v.astimezone(MEL_TZ)
                out[f"{fld}_OUT"] = ("TZID=Australia/Melbourne", v2.strftime("%Y%m%dT%H%M%S"))
            elif isinstance(v, date):
                out["__all_day__"] = True
                out[f"{fld}_OUT"] = ("VALUE=DATE", v.strftime("%Y%m%d"))
    return out

def pick_latest(existing: Dict[str, Any], candidate: Dict[str, Any]) -> Dict[str, Any]:
    """Prefer event with newer LAST-MODIFIED or DTSTAMP."""
    def get_ts(ev):
        for key in ("LAST-MODIFIED", "DTSTAMP"):
            v = ev.get(key)
            if isinstance(v, datetime):
                return v
            if isinstance(v, str) and v.endswith("Z"):
                try:
                    return datetime.strptime(v, "%Y%m%dT%H%M%SZ").replace(tzinfo=ZoneInfo("UTC"))
                except Exception:
                    pass
        return None
    e_ts, c_ts = get_ts(existing), get_ts(candidate)
    if e_ts and c_ts:
        return existing if e_ts >= c_ts else candidate
    if c_ts and not e_ts:
        return candidate
    # Fallback: prefer richer DESCRIPTION
    return candidate if len(candidate.get("DESCRIPTION", "")) > len(existing.get("DESCRIPTION", "")) else existing

def start_key(ev: Dict[str, Any]) -> str:
    if ev.get("__all_day__") and "DTSTART_OUT" in ev:
        _, v = ev["DTSTART_OUT"]
        return v
    if "DTSTART_OUT" in ev:
        _, v = ev["DTSTART_OUT"]
        return v
    v = ev.get("DTSTART")
    if isinstance(v, datetime):
        return v.astimezone(MEL_TZ).strftime("%Y%m%dT%H%M%S")
    if isinstance(v, date):
        return v.strftime("%Y%m%d")
    return ""

def render_event(ev: Dict[str, Any], *, clean_desc: bool, redact_links: bool, extra_domains: Iterable[str]) -> str:
    lines: List[str] = []
    lines.append("BEGIN:VEVENT")

    uid = ev.get("UID")
    if not uid:
        s = re.sub(r"[^a-zA-Z0-9]+", "-", (ev.get("SUMMARY") or "event")).strip("-").lower()
        if ev.get("DTSTART"):
            if isinstance(ev["DTSTART"], datetime):
                stamp = ev["DTSTART"].strftime("%Y%m%dT%H%M%S")
            elif isinstance(ev["DTSTART"], date):
                stamp = ev["DTSTART"].strftime("%Y%m%d")
            else:
                stamp = datetime.now(MEL_TZ).strftime("%Y%m%dT%H%M%S")
        else:
            stamp = datetime.now(MEL_TZ).strftime("%Y%m%dT%H%M%S")
        uid = f"{s}-{stamp}@unified"
    lines.append(prop_to_line("UID", uid))

    # DTSTART / DTEND
    if ev.get("__all_day__") and "DTSTART_OUT" in ev:
        _, v = ev["DTSTART_OUT"]
        lines.append(prop_to_line("DTSTART", v, {"VALUE": "DATE"}))
        if "DTEND_OUT" in ev:
            _, v2 = ev["DTEND_OUT"]
            lines.append(prop_to_line("DTEND", v2, {"VALUE": "DATE"}))
    else:
        for fld in ("DTSTART_OUT", "DTEND_OUT"):
            if fld in ev:
                params, val = ev[fld]
                if params.startswith("TZID="):
                    tzid = params.split("=", 1)[1]
                    lines.append(prop_to_line(fld.replace("_OUT", ""), val, {"TZID": tzid}))
                else:
                    lines.append(prop_to_line(fld.replace("_OUT", ""), val))

    # Textual fields
    if ev.get("SUMMARY"):
        lines.append(prop_to_line("SUMMARY", ics_escape(ev["SUMMARY"])))
    if ev.get("LOCATION"):
        lines.append(prop_to_line("LOCATION", ics_escape(ev["LOCATION"])))
    if "DESCRIPTION" in ev and ev["DESCRIPTION"] is not None:
        desc = format_description(
            ev["DESCRIPTION"],
            clean=clean_desc,
            redact_links=redact_links,
            extra_redact_domains=extra_domains,
        )
        lines.append(prop_to_line("DESCRIPTION", ics_escape(desc)))

    # Fresh DTSTAMP (timezone-aware UTC; avoids deprecation warnings)
    now_utc = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    lines.append(prop_to_line("DTSTAMP", now_utc))

    for k in ("STATUS", "TRANSP", "URL"):
        if ev.get(k):
            lines.append(prop_to_line(k, ev[k]))

    lines.append("END:VEVENT")
    return "\n".join(lines)

# ---------- Orchestration ----------

def unify_ics(
        paths: List[str],
        output_path: str,
        *,
        clean_desc: bool,
        redact_links: bool,
        extra_domains: List[str],
        grep_patterns: List[str] | None = None,
) -> None:
    all_events: List[Dict[str, Any]] = []
    counts = defaultdict(int)

    for p in paths:
        if not os.path.exists(p):
            print(f"[warn] File not found: {p}")
            continue
        lines = read_unfolded(p)
        events = parse_events(lines, os.path.basename(p))
        counts[os.path.basename(p)] += len(events)
        all_events.extend(events)

    normalized = [normalize_event(e) for e in all_events]

    dedup: Dict[tuple, Dict[str, Any]] = {}
    for ev in normalized:
        key = (ev.get("UID"), start_key(ev), ev.get("SUMMARY", ""))
        if key in dedup:
            dedup[key] = pick_latest(dedup[key], ev)
        else:
            dedup[key] = ev

    final_events = list(dedup.values())

    if grep_patterns:
        compiled = []
        for p in grep_patterns:
            try:
                compiled.append(re.compile(p, re.IGNORECASE))
            except re.error as e:
                print(f"[warn] Invalid regex for --grep-summary '{p}': {e}. Skipping this pattern.")

        def _match_summary(ev: Dict[str, Any]) -> bool:
            s = (ev.get("SUMMARY") or "")
            return any(rx.search(s) for rx in compiled) if compiled else True

        final_events = [e for e in final_events if _match_summary(e)]

    final_events.sort(key=start_key)

    cal_header = [
        "BEGIN:VCALENDAR",
        "PRODID:-//Monash Unified ICS//EN",
        "VERSION:2.0",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Unified Calendar",
        "X-WR-TIMEZONE:Australia/Melbourne",
    ]
    cal_footer = ["END:VCALENDAR"]
    event_blocks = [
        render_event(e, clean_desc=clean_desc, redact_links=redact_links, extra_domains=extra_domains)
        for e in final_events
    ]
    unified_ics = "\n".join(cal_header + event_blocks + cal_footer)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(unified_ics)

    # Summary
    print("\n=== Merge Summary ===")
    for src, n in counts.items():
        print(f"{src:25s} : {n:4d}")
    print(f"{'(after dedupe, total)':25s} : {len(final_events):4d}")
    print(f"\nWrote unified ICS to: {output_path}")

def main():
    ap = argparse.ArgumentParser(description="Unify and standardize multiple ICS files into one.")
    ap.add_argument("inputs", nargs="*", help="Input .ics files")
    ap.add_argument("-o", "--output", default="unified_calendar.ics", help="Output .ics path")

    # New formatting/redaction flags
    ap.add_argument("--clean-description", action="store_true", help="Normalize DESCRIPTION: strip HTML, unescape entities, tidy whitespace.")
    ap.add_argument("--redact-signup-links", action="store_true", help="Redact likely signup URLs in DESCRIPTION.")
    ap.add_argument("--redact-domain", action="append", default=[], help="Additional domain substring to treat as signup (repeatable).")
    ap.add_argument("--grep-sm", dest="grep_summary", action="append", default=[], help="Regex to match SUMMARY; keep events whose SUMMARY matches. Repeatable; any match passes.")

    args = ap.parse_args()

    inputs = args.inputs
    if not inputs:
        defaults = ["custom-events.ics", "unimelb-econ.ics", "monash_ebs.ics"]
        existing = [p for p in defaults if os.path.exists(p)]
        if not existing:
            ap.error("No input files provided and none of the default files exist in the current directory.")
        inputs = existing

    unify_ics(
        inputs,
        args.output,
        clean_desc=args.clean_description,
        redact_links=args.redact_signup_links,
        extra_domains=args.redact_domain,
        grep_patterns=args.grep_summary,
    )

if __name__ == "__main__":
    main()
