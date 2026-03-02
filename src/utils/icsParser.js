// Parse ICS content with proper line folding support
const parseICSDate = (dateStr) => {
  if (!dateStr) return null;

  // Handle DATE format (YYYYMMDD)
  if (dateStr.length === 8) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return new Date(year, parseInt(month) - 1, day);
  }

  // Handle DATETIME format
  const isUTC = dateStr.endsWith('Z');
  const cleanDate = dateStr.replace(/[TZ]/g, '');
  const year = cleanDate.substring(0, 4);
  const month = cleanDate.substring(4, 6);
  const day = cleanDate.substring(6, 8);
  const hour = cleanDate.substring(8, 10) || '00';
  const minute = cleanDate.substring(10, 12) || '00';
  const second = cleanDate.substring(12, 14) || '00';

  if (isUTC) {
    return new Date(Date.UTC(year, parseInt(month) - 1, day, hour, minute, second));
  } else {
    // Note: This assumes the date is in the user's local timezone if not UTC.
    // For more robust parsing, a library like ical.js might be needed
    // if you encounter non-UTC, non-local timezones (e.g., DTSTART;TZID=America/New_York:...)
    return new Date(year, parseInt(month) - 1, day, hour, minute, second);
  }
};

// Clean text and preserve useful HTML
const cleanText = (text) => {
  return text
    // ICS unescaping
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    // Convert <br> tags to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    // Extract and preserve links from <a> tags
    .replace(/<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi, '<a href="$1">$2</a>')
    // Strip remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Unescape HTML entities
    .replace(/&nbsp;?/gi, ' ')
    .replace(/&amp;?/gi, '&')
    .replace(/&lt;?/gi, '<')
    .replace(/&gt;?/gi, '>')
    .replace(/&quot;?/gi, '"')
    .replace(/&#39;?/gi, "'")
    // Convert plain URLs to links
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>')
    // Convert emails to mailto links
    .replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1">$1</a>')
    .trim();
};

const extractVenueFromDescription = (description = '') => {
  const text = description.replace(/\r\n?/g, '\n');
  const patterns = [
    /(?:^|\n)\s*Venue\s*[:-]\s*([^\n]+)/i,
    /(?:^|\n)\s*Where\s*[:-]\s*([^\n]+)/i,
    /(?:^|\n)\s*Location\s*[:-]\s*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match || !match[1]) continue;

    const venue = match[1].trim().replace(/\s{2,}/g, ' ');
    if (venue.length >= 3 && venue.length <= 120) {
      return venue;
    }
  }

  return null;
};

// Extract value from field, handling parameters like DTSTART;TZID=...
const extractValue = (line) => {
  const colonIndex = line.indexOf(':');
  return colonIndex > 0 ? line.substring(colonIndex + 1) : '';
};

export const parseICS = (content, sourceName) => {
  // Handle line folding
  const rawLines = content.split(/\r?\n/);
  const unfoldedLines = [];
  let currentLine = '';

  for (const rawLine of rawLines) {
    if (rawLine.length > 0 && (rawLine[0] === ' ' || rawLine[0] === '\t')) {
      currentLine += rawLine.substring(1);
    } else {
      if (currentLine) unfoldedLines.push(currentLine);
      currentLine = rawLine;
    }
  }
  if (currentLine) unfoldedLines.push(currentLine);

  const events = [];
  let currentEvent = null;
  let inEvent = false;

  for (const line of unfoldedLines) {
    const trimmedLine = line.trim();

    if (trimmedLine === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = { source: sourceName };
    } else if (trimmedLine === 'END:VEVENT' && currentEvent) {
      if (!currentEvent.location && currentEvent.description) {
        currentEvent.location = extractVenueFromDescription(currentEvent.description);
      }

      if (currentEvent.start && currentEvent.summary) {
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        if (currentEvent.start >= twoYearsAgo) {
          events.push(currentEvent);
        }
      }
      currentEvent = null;
      inEvent = false;
    } else if (inEvent && currentEvent) {
      if (trimmedLine.startsWith('SUMMARY:')) {
        currentEvent.summary = cleanText(trimmedLine.substring(8));
      } else if (trimmedLine.startsWith('DTSTART')) {
        const dateStr = extractValue(trimmedLine, 'DTSTART');
        currentEvent.start = parseICSDate(dateStr);
      } else if (trimmedLine.startsWith('DTEND')) {
        const dateStr = extractValue(trimmedLine, 'DTEND');
        currentEvent.end = parseICSDate(dateStr);
      } else if (trimmedLine.startsWith('DESCRIPTION:')) {
        currentEvent.description = cleanText(trimmedLine.substring(12));
      } else if (trimmedLine.startsWith('LOCATION:')) {
        currentEvent.location = cleanText(trimmedLine.substring(9));
      }
    }
  }

  return events;
};
