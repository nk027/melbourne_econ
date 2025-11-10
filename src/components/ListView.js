import React from 'react';
import { getSourceColor } from '../utils/colorUtils';
import { formatDate, formatTime } from '../utils/dateUtils';
import { downloadICS, subscribeToCalendar, hasCalendarSubscription } from '../utils/icsGenerator';

function EventItem({ event, onEventClick }) {
  const colors = getSourceColor(event.source);
  const startTime = formatTime(event.start);
  const endTime = event.end ? formatTime(event.end) : null;
  const canSubscribe = hasCalendarSubscription(event.source);

  const handleDownloadEventClick = (e) => {
    // This stops the click from "bubbling up" to the parent div.
    // Without this, clicking Download would ALSO trigger onEventClick.
    e.stopPropagation();
    downloadICS(event);
  };

  const handleSubscribeCalendarClick = (e) => {
    e.stopPropagation();
    subscribeToCalendar(event.source);
  };

  return (
    <div
      onClick={() => onEventClick(event)}
      className={`p-3 border-l-4 ${colors.border} ${colors.bg} rounded-lg ${colors.hover} cursor-pointer transition-colors`}
    >
      <div className="flex items-start justify-between">
        {/* Left side: Details (takes up remaining space) */}
        <div className="flex-1 overflow-hidden pr-3">
          {/* Smaller title, truncates if too long */}
          <h3 className="font-semibold text-base text-gray-800 truncate">
            {event.summary}
          </h3>
          {/* Tighter spacing for details */}
          <div className="mt-1.5 space-y-1 text-sm text-gray-600">
            {/* Combined Date & Time on one line */}
            <div className="flex flex-wrap items-center">
              <span className="whitespace-nowrap">
                📅 {formatDate(event.start)}
              </span>
              <span className="ml-3 whitespace-nowrap">
                🕐 {startTime}
                {endTime && ` - ${endTime}`}
              </span>
              <span className="ml-3 whitespace-nowrap">📍</span>
              <span className="truncate whitespace-nowrap">{event.location}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end ml-2 flex-shrink-0 gap-1.5">
          {/* Source Tag */}
          <span
            className={`px-2.5 py-0.5 ${colors.bg} ${colors.text} rounded-full text-xs font-medium whitespace-nowrap`}
          >
            {event.source}
          </span>
          {/* Buttons Row */}
          <div className="flex flex-row gap-1.5">
            {/* Subscribe to Calendar Button - only show if subscription is available */}
            {canSubscribe && (
              <button
                onClick={handleSubscribeCalendarClick}
                className={`inline-block px-2.5 py-0.5 bg-green-400 text-white hover:bg-green-600 transition-colors rounded-full text-xs font-medium cursor-pointer whitespace-nowrap`}
              >
                Subscribe
              </button>
            )}
            {/* Event ICS Button */}
            <button
              onClick={handleDownloadEventClick}
              className={`inline-block px-2.5 py-0.5 bg-blue-400 text-white hover:bg-blue-600 transition-colors rounded-full text-xs font-medium cursor-pointer whitespace-nowrap`}
            >
              Event ICS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthHeader({ label }) {
  return (
    <div className="mt-4 mb-2">
      {/* Reduced bottom padding */}
      <h2 className="text-xl font-bold text-gray-800 border-b-2 border-gray-300 pb-1">
        {label}
      </h2>
    </div>
  );
}

function WeekHeader({ label }) {
  return (
    <div className="mt-3 mb-1.5">
      <h3 className="text-base font-semibold text-gray-700 ml-1">
        {label}
      </h3>
    </div>
  );
}

// --- Main ListView Component ---
export default function ListView({ groupedListEvents, onEventClick }) {
  return (
    <div className="space-y-2.5">
      {groupedListEvents.map((item, idx) => {
        // Use the event's unique ID for the key if possible.
        // This is crucial for performance and avoiding bugs.
        // We fall back to index only as a last resort.
        const key = item.data?.id || `item-${item.label}-${idx}`;

        switch (item.type) {
          case 'month':
            return <MonthHeader key={key} label={item.label} />;
          case 'week':
            return <WeekHeader key={key} label={item.label} />;
          case 'event':
            return (
              <EventItem
                key={key}
                event={item.data}
                onEventClick={onEventClick}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
