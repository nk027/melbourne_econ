import React from "react";
import { ChevronLeft, ChevronRight } from "./Icons";
import { getSourceColor } from "../utils/colorUtils";
import { formatTime } from "../utils/dateUtils";
import { getLocalDateKey } from "../utils/dateUtils";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function WeekView({
  currentDate,
  navigateWeek,
  getWeekGrid,
  eventsByDate,
  onEventClick,
}) {
  const weekGrid = getWeekGrid(currentDate);

  // Calculate grid template columns based on content
  const gridCols = weekGrid
    .map((day) => {
      const dateKey = getLocalDateKey(day);
      const dayEvents = eventsByDate[dateKey] || [];
      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
      const isEmpty = dayEvents.length === 0;

      return isWeekend && isEmpty ? "minmax(80px, 0.5fr)" : "1fr";
    })
    .join(" ");

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => navigateWeek(-1)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ChevronLeft />
        </button>
        <h2 className="text-lg md:text-xl font-bold">
          Week of{" "}
          {weekGrid[0].toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </h2>
        <button
          onClick={() => navigateWeek(1)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Day headers - hidden on mobile */}
      <div
        className="hidden md:grid gap-3"
        style={{ gridTemplateColumns: gridCols }}
      >
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-gray-700 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid/stack */}
      <div
        className="space-y-3 md:space-y-0 md:grid md:gap-3"
        style={{ gridTemplateColumns: gridCols }}
      >
        {weekGrid.map((day, idx) => {
          const dateKey = getLocalDateKey(day);
          const dayEvents = eventsByDate[dateKey] || [];
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div
              key={idx}
              className={`md:min-h-[180px] p-3 border rounded-lg overflow-hidden ${
                isToday
                  ? "bg-blue-50 border-blue-300"
                  : "bg-white border-gray-200"
              }`}
            >
              {/* Mobile: show day name with date */}
              <div className="flex items-baseline gap-2 mb-3 md:block">
                <span className="text-sm font-semibold text-gray-600 md:hidden">
                  {WEEK_DAYS[day.getDay()]}
                </span>
                <div
                  className={`text-base font-bold ${
                    isToday ? "text-blue-600" : "text-gray-700"
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>
              <div className="space-y-2">
                {dayEvents.map((event, eventIdx) => {
                  const colors = getSourceColor(event.source);
                  const startTime = formatTime(event.start);
                  const endTime = event.end ? formatTime(event.end) : null;
                  const isAllDay =
                    startTime === "00:00" && (!endTime || endTime === "00:00");
                  const displayTime = isAllDay
                    ? "All Day"
                    : `${startTime}${endTime ? `–${endTime}` : ""}`;

                  return (
                    <div
                      key={eventIdx}
                      onClick={() => onEventClick(event)}
                      className={`text-sm p-2 ${colors.bg} rounded ${colors.hover} cursor-pointer border ${colors.border} overflow-hidden`}
                    >
                      <div className="font-bold text-gray-800 mb-1 truncate">
                        {displayTime}
                      </div>
                      <div className="font-semibold text-gray-700 mb-1 break-words">
                        {event.summary}
                      </div>
                      {event.location && (
                        <div className="text-xs text-gray-600 truncate">
                          📍 {event.location}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
