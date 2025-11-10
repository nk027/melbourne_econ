import { DEFAULT_SOURCES } from '../constants';

export function generateICS(event) {
  const formatICSDate = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const escape = (str) => {
    return str.replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Melbourne Econ Seminars//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.uid || Date.now() + '@melb-econ-seminars'}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(event.start)}`,
    event.end ? `DTEND:${formatICSDate(event.end)}` : '',
    `SUMMARY:${escape(event.summary)}`,
    event.description ? `DESCRIPTION:${escape(event.description)}` : '',
    event.location ? `LOCATION:${escape(event.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR'
  ].filter(Boolean).join('\r\n');

  return icsContent;
}

export function downloadICS(event) {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.summary.replace(/[^a-z0-9]/gi, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getCalendarURL(sourceName) {
  const source = DEFAULT_SOURCES.find(s => s.name === sourceName);
  if (source && source.subscriptionUrl) {
    // Return the original subscription URL (e.g., Google Calendar URL)
    return source.subscriptionUrl;
  }
  return null;
}

export function hasCalendarSubscription(sourceName) {
  const source = DEFAULT_SOURCES.find(s => s.name === sourceName);
  return source && source.subscriptionUrl ? true : false;
}

export function subscribeToCalendar(sourceName) {
  const url = getCalendarURL(sourceName);
  if (url) {
    // Try to copy the URL to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        alert(
          `Calendar subscription URL copied to clipboard!\n\n` +
          `To subscribe in your calendar app:\n` +
          `• Google Calendar: Settings → Add calendar → From URL → Paste URL\n` +
          `• Apple Calendar: File → New Calendar Subscription → Paste URL\n` +
          `• Outlook: Add calendar → Subscribe from web → Paste URL\n\n` +
          `URL: ${url}`
        );
      }).catch(() => {
        // Fallback if clipboard fails
        alert(
          `Copy this URL to subscribe in your calendar app:\n\n${url}\n\n` +
          `Instructions:\n` +
          `• Google Calendar: Settings → Add calendar → From URL\n` +
          `• Apple Calendar: File → New Calendar Subscription\n` +
          `• Outlook: Add calendar → Subscribe from web`
        );
      });
    } else {
      // Fallback for browsers without clipboard API
      alert(
        `Copy this URL to subscribe in your calendar app:\n\n${url}\n\n` +
        `Instructions:\n` +
        `• Google Calendar: Settings → Add calendar → From URL\n` +
        `• Apple Calendar: File → New Calendar Subscription\n` +
        `• Outlook: Add calendar → Subscribe from web`
      );
    }
  } else {
    alert('Calendar subscription not available for this source.');
  }
}
