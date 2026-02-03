import { useState, useMemo, useEffect, useRef } from "react";
import { parseICS } from "../utils/icsParser";
import { fuzzyIncludes, useDebouncedValue } from "../utils/fuzzySearch.js";
import { getLocalDateKey } from "../utils/dateUtils";
import { DEFAULT_SOURCES, PRESET_TAGS } from "../constants";

/**
 * Custom hook for managing calendar state including events, filters, and URL synchronization.
 * 
 * @returns {Object} Calendar state and handlers
 * @returns {Array} events - All loaded events
 * @returns {Array} filteredEvents - Events after applying filters
 * @returns {Array} sources - Available calendar sources
 * @returns {string} view - Current view mode (list/week/month)
 * @returns {Object} filters - Current filter values
 * @returns {Object} handlers - Functions to update state
 * @returns {Object} derived - Derived data structures (eventsByDate, groupedListEvents)
 */
export function useCalendarState() {
  // Core state
  const [events, setEvents] = useState([]);
  const [sources, setSources] = useState([]);
  const [view, setView] = useState("list");
  const [rawQuery, setRawQuery] = useState("");
  const searchTerm = useDebouncedValue(rawQuery, 200);
  
  // Filter state
  const [selectedSources, setSelectedSources] = useState(new Set());
  const [dateFilter, setDateFilter] = useState("upcoming");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [allTags] = useState(new Set(PRESET_TAGS));
  
  // Focus state for double-click behavior
  const [focusedSource, setFocusedSource] = useState(null);
  const [focusedTag, setFocusedTag] = useState(null);
  
  // Navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState(null);

  // Load default sources on mount
  const sourcesLoaded = useRef(false);
  useEffect(() => {
    if (sourcesLoaded.current) return;
    sourcesLoaded.current = true;
    DEFAULT_SOURCES.forEach(({ name, url }) => {
      loadICSFromURL(url, name);
    });
  }, []);

  // Load ICS from URL
  const loadICSFromURL = async (url, sourceName) => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}${url}`);
      const content = await response.text();
      const parsed = parseICS(content, sourceName);

      setEvents((prev) => [...prev, ...parsed]);
      setSources((prev) => Array.from(new Set([...prev, sourceName])));
      setSelectedSources((prev) => new Set(prev).add(sourceName));
    } catch (error) {
      console.error(`Failed to load ICS from ${url}:`, error);
      alert(`Failed to load calendar: ${sourceName}`);
    }
  };

  // Source filtering handlers
  const toggleSource = (source) => {
    setSelectedSources((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(source)) {
        newSet.delete(source);
      } else {
        newSet.add(source);
      }
      return newSet;
    });
  };

  const handleSourceDoubleClick = (source) => {
    if (focusedSource === source) {
      // Second double-click: reset to all
      setSelectedSources(new Set(sources));
      setFocusedSource(null);
    } else {
      // First double-click: focus only this source
      setSelectedSources(new Set([source]));
      setFocusedSource(source);
    }
  };

  // Tag filtering handlers
  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  };

  const handleTagDoubleClick = (tag) => {
    if (focusedTag === tag) {
      // Second double-click: reset to all
      setSelectedTags(new Set(allTags));
      setFocusedTag(null);
    } else {
      // First double-click: focus only this tag
      setSelectedTags(new Set([tag]));
      setFocusedTag(tag);
    }
  };

  // Filter events based on all criteria
  const filteredEvents = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    let filtered = events.filter((event) => {
      if (!selectedSources.has(event.source)) {
        return false;
      }

      const summaryLower = event.summary.toLowerCase();
      const descriptionLower = (event.description || "").toLowerCase();
      const eventText = summaryLower + " " + descriptionLower;

      const searchMatch =
        q === "" ||
        fuzzyIncludes(eventText, q) ||
        summaryLower.includes(q.toLowerCase()) ||
        descriptionLower.includes(q.toLowerCase());

      const tagMatch =
        selectedTags.size === 0 ||
        [...selectedTags].some((tag) => event.summary.includes(tag));

      return searchMatch && tagMatch;
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateFilter) {
      case "past":
        filtered = filtered.filter((event) => event.start < today);
        break;
      case "upcoming":
        filtered = filtered.filter((event) => event.start >= today);
        break;
      case "custom":
        if (customStartDate) {
          const startDate = new Date(customStartDate);
          filtered = filtered.filter((event) => event.start >= startDate);
        }
        if (customEndDate) {
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59);
          filtered = filtered.filter((event) => event.start <= endDate);
        }
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => a.start - b.start);
  }, [
    events,
    selectedSources,
    searchTerm,
    selectedTags,
    dateFilter,
    customStartDate,
    customEndDate,
  ]);

  // Keyboard navigation for event modal
  useEffect(() => {
    if (!selectedEvent) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedEvent(null);
        setSelectedEventIndex(null);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextIndex = (selectedEventIndex + 1) % filteredEvents.length;
        setSelectedEventIndex(nextIndex);
        setSelectedEvent(filteredEvents[nextIndex]);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevIndex =
          (selectedEventIndex - 1 + filteredEvents.length) %
          filteredEvents.length;
        setSelectedEventIndex(prevIndex);
        setSelectedEvent(filteredEvents[prevIndex]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedEvent, selectedEventIndex, filteredEvents]);

  // URL state synchronization (write to URL)
  useEffect(() => {
    const p = new URLSearchParams({
      view,
      q: searchTerm,
      start: customStartDate || "",
      end: customEndDate || "",
      date: currentDate.toISOString().slice(0, 10),
      src: [...selectedSources].join(","),
      tags: [...selectedTags].join(","),
      range: dateFilter,
    });
    history.replaceState(null, "", `?${p}`);
  }, [
    view,
    searchTerm,
    customStartDate,
    customEndDate,
    currentDate,
    selectedSources,
    selectedTags,
    dateFilter,
  ]);

  // URL state initialization (read from URL on mount)
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const initialView = p.get("view") || "list";
    setView(initialView);
    setRawQuery(p.get("q") || "");
    setCustomStartDate(p.get("start") || "");
    setCustomEndDate(p.get("end") || "");
    setCurrentDate(p.get("date") ? new Date(p.get("date")) : new Date());
    if (p.get("src")) setSelectedSources(new Set(p.get("src").split(",")));
    if (p.get("tags")) setSelectedTags(new Set(p.get("tags").split(",")));
    setDateFilter(p.get("range") || (initialView === "list" ? "upcoming" : "all"));
  }, []);

  // Derived data: events grouped by date
  const eventsByDate = useMemo(() => {
    const grouped = {};
    filteredEvents.forEach((event) => {
      const dateKey = getLocalDateKey(event.start);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [filteredEvents]);

  // Derived data: grouped list events with month/week/day headers
  const groupedListEvents = useMemo(() => {
    const groups = [];
    let currentMonthId = null;
    let currentWeekId = null;
    let currentDayId = null;

    const startOfWeek = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - d.getDay());
      return d;
    };

    const isoDate = (d) => {
      const z = new Date(d);
      z.setHours(0, 0, 0, 0);
      const y = z.getFullYear();
      const m = String(z.getMonth() + 1).padStart(2, "0");
      const day = String(z.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    filteredEvents.forEach((event) => {
      const eventDate = new Date(event.start);
      const monthId = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = eventDate.toLocaleDateString("en-AU", {
        month: "long",
        year: "numeric",
      });

      const wkStart = startOfWeek(eventDate);
      const wkEnd = new Date(wkStart);
      wkEnd.setDate(wkEnd.getDate() + 6);

      const weekId = `week-${monthId}-${isoDate(wkStart)}`;
      const dayId = `day-${isoDate(eventDate)}`;

      const weekLabel = `Week of ${wkStart.toLocaleDateString("en-AU", { month: "short", day: "numeric", year: "numeric" })} - ${wkEnd.toLocaleDateString("en-AU", { month: "short", day: "numeric", year: "numeric" })}`;
      const dayLabel = eventDate.toLocaleDateString("en-AU", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      if (monthId !== currentMonthId) {
        currentMonthId = monthId;
        currentWeekId = null;
        currentDayId = null;
        groups.push({
          type: "month",
          id: `month-${monthId}`,
          label: monthLabel,
          date: eventDate,
        });
      }

      if (weekId !== currentWeekId) {
        currentWeekId = weekId;
        currentDayId = null;
        groups.push({
          type: "week",
          id: weekId,
          label: weekLabel,
          date: wkStart,
        });
      }

      if (dayId !== currentDayId) {
        currentDayId = dayId;
        groups.push({
          type: "day",
          id: dayId,
          label: dayLabel,
          date: eventDate,
        });
      }

      const eventId =
        event.id ||
        event.uid ||
        `${event.source || "src"}::${+new Date(event.start)}::${event.summary || ""}`;

      groups.push({
        type: "event",
        id: `event-${eventId}`,
        data: event,
      });
    });

    return groups;
  }, [filteredEvents]);

  // View change handler
  const handleViewChange = (newView) => {
    setView(newView);
    if (newView === "list") {
      setDateFilter("upcoming");
    } else {
      setDateFilter("all");
    }
  };

  // Navigation handlers
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  // Event selection handler
  const selectEvent = (event) => {
    const index = filteredEvents.findIndex((e) => e === event);
    setSelectedEvent(event);
    setSelectedEventIndex(index);
  };

  // Return API
  return {
    // Core data
    events,
    filteredEvents,
    sources,
    
    // View state
    view,
    
    // Filters
    filters: {
      rawQuery,
      searchTerm,
      selectedSources,
      dateFilter,
      customStartDate,
      customEndDate,
      selectedTags,
      allTags,
      focusedSource,
      focusedTag,
    },
    
    // Navigation state
    currentDate,
    
    // Modal state
    selectedEvent,
    selectedEventIndex,
    
    // Handlers
    handlers: {
      setRawQuery,
      toggleSource,
      handleSourceDoubleClick,
      toggleTag,
      handleTagDoubleClick,
      setDateFilter,
      setCustomStartDate,
      setCustomEndDate,
      handleViewChange,
      navigateMonth,
      navigateWeek,
      selectEvent,
      closeModal: () => {
        setSelectedEvent(null);
        setSelectedEventIndex(null);
      },
    },
    
    // Derived data
    derived: {
      eventsByDate,
      groupedListEvents,
    },
  };
}
