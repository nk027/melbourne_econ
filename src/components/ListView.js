import React from 'react';
import { getSourceColor } from '../utils/colorUtils';
import { formatDate, formatTime } from '../utils/dateUtils';
import { downloadICS } from '../utils/icsGenerator';

function EventItem({ event, onEventClick }) {
  const colors = getSourceColor(event.source, true);

  const startTime = formatTime(event.start);
  const endTime = event.end ? formatTime(event.end) : null;
  const isAllDay = startTime === '00:00' && (!endTime || endTime === '00:00');
  const displayTime = isAllDay ? 'All Day' : `${startTime}${endTime ? `–${endTime}` : ''}`;

  const handleDownloadEventClick = (e) => {
    e.stopPropagation();
    downloadICS(event);
  };

  return (
    <div
      onClick={() => onEventClick(event)}
      className={`p-3 border-l-4 ${colors.border} ${colors.bg} rounded-lg ${colors.hover} cursor-pointer transition-colors`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 overflow-hidden pr-3">
          <h3 className="font-semibold text-base text-gray-800 truncate">
            {event.summary}
          </h3>
          <div className="mt-1.5 space-y-1 text-sm text-gray-600">
            <div className="flex flex-wrap items-center">
              <span className="whitespace-nowrap">
                🕐 {displayTime}
              </span>
              {event.location && (
                <>
                  <span className="ml-2 whitespace-nowrap">📍</span>
                  <span className="truncate whitespace-nowrap">{event.location}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end ml-2 flex-shrink-0 gap-1.5">
          <span
            className={`px-2.5 py-0.5 ${colors.bg} ${colors.text} rounded-full text-xs font-medium whitespace-nowrap hidden sm:inline-block`}
          >
            {event.source}
          </span>
        </div>
      </div>
    </div>
  );
}

function MonthHeader({ label }) {
  return (
    <div className="mt-4 mb-2">
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

function DayHeader({ label }) {
  return (
    <div className="mt-2 mb-1">
      <h4 className="text-sm font-medium text-gray-600 ml-1">
        {label}
      </h4>
    </div>
  );
}

export default function ListView({ groupedListEvents, onEventClick }) {
  let lastMonth = null;
  let lastWeek = null;
  let lastDay = null;

  return (
    <div className="space-y-2.5">
      {groupedListEvents.map((item) => {
        const key = item.id ?? (
          item.type === 'event'
            ? (item.data?.id || `event-${item.data?.summary || 'unknown'}-${+new Date(item.data?.start)}`)
            : `${item.type}:${item.label}`
        );

        if (item.type === 'month') {
          if (item.label === lastMonth) return null;
          lastMonth = item.label;
          lastWeek = null;
          lastDay = null;
          return <MonthHeader key={key} label={item.label} />;
        }

        if (item.type === 'week') {
          if (item.label === lastWeek) return null;
          lastWeek = item.label;
          lastDay = null;
          return <WeekHeader key={key} label={item.label} />;
        }

        if (item.type === 'day') {
          if (item.label === lastDay) return null;
          lastDay = item.label;
          return <DayHeader key={key} label={item.label} />;
        }

        if (item.type === 'event') {
          return (
            <EventItem
              key={key}
              event={item.data}
              onEventClick={onEventClick}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
