import { useState, useMemo, useEffect, useRef } from 'react';
import { parseICS } from './utils/icsParser';
import { getSourceColor } from './utils/colorUtils';
import {
  formatDate,
  formatTime,
  getMonthGrid,
  getWeekGrid,
  getLocalDateKey,
} from './utils/dateUtils';
import { DEFAULT_SOURCES, PRESET_TAGS } from './constants';

import { Calendar, Upload } from './components/Icons';
import Controls from './components/Controls';
import FilterPanel from './components/FilterPanel';
import ListView from './components/ListView';
import WeekView from './components/WeekView';
import MonthView from './components/MonthView';
import EventModal from './components/EventModal';
import AboutSection from './components/AboutSection';

export default function App() {
  const [events, setEvents] = useState([]);
  const [sources, setSources] = useState([]);
  const [activeTab, setActiveTab] = useState('events');
  const [view, setView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSources, setSelectedSources] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState('upcoming');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState(null);
  const [allTags, setAllTags] = useState(new Set(PRESET_TAGS));
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [focusedSource, setFocusedSource] = useState(null);
  const [focusedTag, setFocusedTag] = useState(null);

  // Load default sources on mount
  const sourcesLoaded = useRef(false);
  useEffect(() => {
    if (sourcesLoaded.current) return;
    sourcesLoaded.current = true;
    DEFAULT_SOURCES.forEach(({ name, url }) => {
      loadICSFromURL(url, name);
    });
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const sourceName = file.name.replace('.ics', '');
      const parsed = parseICS(content, sourceName);

      setEvents((prev) => [...prev, ...parsed]);
      setSources((prev) => Array.from(new Set([...prev, sourceName])));
      setSelectedSources((prev) => new Set(prev).add(sourceName));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const loadICSFromURL = async (url, sourceName) => {
    try {
      const response = await fetch(url.replace('.', import.meta.env.BASE_URL));
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

  const toggleSource = (source) => {
    setSelectedSources(prev => {
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

  const toggleTag = (tag) => {
    setSelectedTags(prev => {
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

  const handleAddICSURL = async () => {
    const url = prompt('Enter ICS URL or paste ICS content:');
    if (!url) return;

    const sourceName = prompt('Enter a name for this calendar source:');
    if (!sourceName) return;

    if (url.startsWith('http://') || url.startsWith('https://')) {
      await loadICSFromURL(url, sourceName);
    } else {
      const parsed = parseICS(url, sourceName);
      setEvents(prev => [...prev, ...parsed]);
      setSources(prev => Array.from(new Set([...prev, sourceName])));
      setSelectedSources(prev => new Set(prev).add(sourceName));
    }
  };

  const filteredEvents = useMemo(() => {
    let filtered = events.filter((event) => {
      if (!selectedSources.has(event.source)) {
        return false;
      }

      const summaryLower = event.summary.toLowerCase();
      const descriptionLower = (event.description || '').toLowerCase();
      const eventText = summaryLower + ' ' + descriptionLower;

      const searchMatch =
        searchTerm === '' ||
        summaryLower.includes(searchTerm.toLowerCase()) ||
        descriptionLower.includes(searchTerm.toLowerCase());

      const tagMatch =
        selectedTags.size === 0 ||
        [...selectedTags].some((tag) => event.summary.includes(tag));

      return searchMatch && tagMatch;
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (dateFilter) {
      case 'past':
        filtered = filtered.filter((event) => event.start < today);
        break;
      case 'upcoming':
        filtered = filtered.filter((event) => event.start >= today);
        break;
      case 'custom':
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
  }, [events, selectedSources, searchTerm, selectedTags, dateFilter, customStartDate, customEndDate]);

  // Keyboard navigation effect
  useEffect(() => {
    if (!selectedEvent) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedEvent(null);
        setSelectedEventIndex(null);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (selectedEventIndex + 1) % filteredEvents.length;
        setSelectedEventIndex(nextIndex);
        setSelectedEvent(filteredEvents[nextIndex]);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (selectedEventIndex - 1 + filteredEvents.length) % filteredEvents.length;
        setSelectedEventIndex(prevIndex);
        setSelectedEvent(filteredEvents[prevIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedEvent, selectedEventIndex, filteredEvents]);


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

  const groupedListEvents = useMemo(() => {
    const groups = [];
    let currentMonth = null;
    let currentWeek = null;

    filteredEvents.forEach((event) => {
      const eventDate = event.start;
      const monthKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}`;
      const weekStart = new Date(eventDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (monthKey !== currentMonth) {
        currentMonth = monthKey;
        groups.push({
          type: 'month',
          label: eventDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }),
          date: eventDate,
        });
      }

      if (weekKey !== currentWeek) {
        currentWeek = weekKey;
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        groups.push({
          type: 'week',
          label: `Week of ${weekStart.toLocaleDateString('en-AU', {
            month: 'short',
            day: 'numeric',
          })} - ${weekEnd.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })}`,
          date: weekStart,
        });
      }

      groups.push({
        type: 'event',
        data: event,
      });
    });

    return groups;
  }, [filteredEvents]);

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

  const handleViewChange = (newView) => {
    setView(newView);
    if (newView === 'list') {
      setDateFilter('upcoming');
    } else {
      setDateFilter('all');
    }
  };

  // Select event and its index
  const selectEvent = (event) => {
    const index = filteredEvents.findIndex(e => e === event);
    setSelectedEvent(event);
    setSelectedEventIndex(index);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-2">
        <div className="bg-white rounded-lg shadow-lg p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl md:text-3xl font-bold text-gray-800">Melbourne Econ Events</h1>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 font-medium transition-colors relative rounded-t-lg ${
                activeTab === 'events'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-4 py-2 font-medium transition-colors relative rounded-t-lg ${
                activeTab === 'about'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 font-medium transition-colors relative rounded-t-lg ${
                activeTab === 'notifications'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Email Notifications
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'events' && (
            <>
              {/* Controls */}
              <Controls
                view={view}
                handleViewChange={handleViewChange}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
              />

              {/* Filters Panel */}
              {showFilters && (
                <FilterPanel
                  sources={sources}
                  selectedSources={selectedSources}
                  toggleSource={toggleSource}
                  handleSourceDoubleClick={handleSourceDoubleClick}
                  allTags={allTags}
                  selectedTags={selectedTags}
                  toggleTag={toggleTag}
                  handleTagDoubleClick={handleTagDoubleClick}
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  customStartDate={customStartDate}
                  setCustomStartDate={setCustomStartDate}
                  customEndDate={customEndDate}
                  setCustomEndDate={setCustomEndDate}
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
              ) : view === 'list' ? (
                <ListView
                  groupedListEvents={groupedListEvents}
                  onEventClick={selectEvent}
                />
              ) : view === 'week' ? (
                <WeekView
                  currentDate={currentDate}
                  navigateWeek={navigateWeek}
                  getWeekGrid={getWeekGrid}
                  eventsByDate={eventsByDate}
                  onEventClick={selectEvent}
                />
              ) : (
                <MonthView
                  currentDate={currentDate}
                  navigateMonth={navigateMonth}
                  getMonthGrid={getMonthGrid}
                  eventsByDate={eventsByDate}
                  onEventClick={selectEvent}
                />
              )}
            </>
          )}

          {activeTab === 'about' && (
            <div className="py-4">
              <AboutSection type="about" />
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="py-4">
              <AboutSection type="notifications" />
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => {
            setSelectedEvent(null);
            setSelectedEventIndex(null);
          }}
        />
      )}
    </div>
  );
}
