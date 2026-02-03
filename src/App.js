import { useState, useEffect } from "react";
import { getMonthGrid, getWeekGrid } from "./utils/dateUtils";
import { useCalendarState } from "./hooks/useCalendarState";

import { Calendar } from "./components/Icons";
import Controls from "./components/Controls";
import FilterPanel from "./components/FilterPanel";
import ListView from "./components/ListView";
import WeekView from "./components/WeekView";
import MonthView from "./components/MonthView";
import EventModal from "./components/EventModal";
import AboutSection from "./components/AboutSection";

export default function App() {
  // Use the calendar state hook
  const {
    events,
    filteredEvents,
    sources,
    view,
    filters,
    currentDate,
    selectedEvent,
    handlers,
    derived,
  } = useCalendarState();

  // Local UI state (not related to calendar state)
  const [activeTab, setActiveTab] = useState("events");
  const [showFilters, setShowFilters] = useState(false);

  // Sync activeTab to URL
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    p.set("tab", activeTab);
    history.replaceState(null, "", `?${p}`);
  }, [activeTab]);

  // Initialize activeTab from URL on mount
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setActiveTab(p.get("tab") || "events");
  }, []);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-2">
        <div className="bg-white rounded-lg shadow-lg p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl md:text-3xl font-bold text-gray-800">
              Melbourne Economics Events
            </h1>
          </div>
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("events")}
              className={`px-4 py-2 font-medium transition-colors relative rounded-t-lg ${
                activeTab === "events"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`px-4 py-2 font-medium transition-colors relative rounded-t-lg ${
                activeTab === "about"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              }`}
            >
              About
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "events" && (
            <>
              {/* Controls */}
              <Controls
                view={view}
                handleViewChange={handlers.handleViewChange}
                searchTerm={filters.rawQuery}
                setSearchTerm={handlers.setRawQuery}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
              />

              {/* Filters Panel */}
              {showFilters && (
                <FilterPanel
                  sources={sources}
                  selectedSources={filters.selectedSources}
                  toggleSource={handlers.toggleSource}
                  handleSourceDoubleClick={handlers.handleSourceDoubleClick}
                  allTags={filters.allTags}
                  selectedTags={filters.selectedTags}
                  toggleTag={handlers.toggleTag}
                  handleTagDoubleClick={handlers.handleTagDoubleClick}
                  dateFilter={filters.dateFilter}
                  setDateFilter={handlers.setDateFilter}
                  customStartDate={filters.customStartDate}
                  setCustomStartDate={handlers.setCustomStartDate}
                  customEndDate={filters.customEndDate}
                  setCustomEndDate={handlers.setCustomEndDate}
                />
              )}

              {/* Events Display */}
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto text-gray-400 mb-2 h-12 w-12" />
                  <p className="text-gray-600">
                    No events loaded. Upload or add an ICS URL to get started.
                  </p>
                </div>
              ) : view === "list" ? (
                <ListView
                  groupedListEvents={derived.groupedListEvents}
                  onEventClick={handlers.selectEvent}
                />
              ) : view === "week" ? (
                <WeekView
                  currentDate={currentDate}
                  navigateWeek={handlers.navigateWeek}
                  getWeekGrid={getWeekGrid}
                  eventsByDate={derived.eventsByDate}
                  onEventClick={handlers.selectEvent}
                />
              ) : (
                <MonthView
                  currentDate={currentDate}
                  navigateMonth={handlers.navigateMonth}
                  getMonthGrid={getMonthGrid}
                  eventsByDate={derived.eventsByDate}
                  onEventClick={handlers.selectEvent}
                />
              )}
            </>
          )}

          {activeTab === "about" && (
            <div className="py-4">
              <AboutSection type="about" />
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={handlers.closeModal}
        />
      )}

      <footer className="text-center p-6 text-xs text-gray-500">
        <p>
          Event data is provided "as is". Please verify event details with the
          source institutions.
        </p>
      </footer>
    </div>
  );
}
