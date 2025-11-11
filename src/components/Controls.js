import React, { useEffect, useRef } from 'react';
import { List, Calendar, Search, Filter } from './Icons';

export default function Controls({
  view,
  handleViewChange,
  searchTerm,
  setSearchTerm,
  showFilters,
  setShowFilters,
}) {
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (searchTerm) {
          setSearchTerm('');
          searchInputRef.current?.blur();
          e.preventDefault();
        }
        return;
      }
      if (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA') {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey ||
          e.key === 'Tab' || e.key.startsWith('Arrow')) {
        return;
      }
      if (e.key.length === 1) {
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm, setSearchTerm]);

  return (
    <div className="mb-6" role="region" aria-label="View controls">
      {/* Wide screens: single row */}
      <div className="hidden md:flex gap-4 items-center">
        {/* View toggle buttons */}
        <div className="flex gap-2" role="group" aria-label="Change calendar view">
          <button
            onClick={() => handleViewChange('list')}
            className={`flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg ${
              view === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            aria-pressed={view === 'list'}
            aria-label="List view"
          >
            <List aria-hidden="true" />
            <span>List</span>
          </button>
          <button
            onClick={() => handleViewChange('week')}
            className={`flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg ${
              view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            aria-pressed={view === 'week'}
            aria-label="Week view"
          >
            <Calendar aria-hidden="true" />
            <span>Week</span>
          </button>
          <button
            onClick={() => handleViewChange('calendar')}
            className={`flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg ${
              view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            aria-pressed={view === 'calendar'}
            aria-label="Month view"
          >
            <Calendar aria-hidden="true" />
            <span>Month</span>
          </button>
        </div>

        {/* Search input */}
        <div className="flex-1 relative" role="search">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <label htmlFor="searchInput" className="sr-only">
            Search
          </label>
          <input
            id="searchInput"
            ref={searchInputRef}
            type="text"
            placeholder="Search ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search items"
          />
        </div>

        {/* Filter button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          aria-expanded={showFilters}
          aria-controls="filter-panel"
          aria-label="Toggle filters"
        >
          <Filter aria-hidden="true" />
          <span>Filter</span>
        </button>
      </div>

      {/* Narrow screens: two rows with even distribution */}
      <div className="md:hidden space-y-4">
        {/* Row 1: View buttons */}
        <div className="flex justify-between gap-2" role="group" aria-label="Change calendar view">
          <button
            onClick={() => handleViewChange('list')}
            className={`flex-1 flex cursor-pointer items-center justify-center gap-2 px-4 py-2 rounded-lg ${
              view === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            aria-pressed={view === 'list'}
            aria-label="List view"
          >
            <List aria-hidden="true" />
            <span>List</span>
          </button>
          <button
            onClick={() => handleViewChange('week')}
            className={`flex-1 flex cursor-pointer items-center justify-center gap-2 px-4 py-2 rounded-lg ${
              view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            aria-pressed={view === 'week'}
            aria-label="Week view"
          >
            <Calendar aria-hidden="true" />
            <span>Week</span>
          </button>
          <button
            onClick={() => handleViewChange('calendar')}
            className={`flex-1 flex cursor-pointer items-center justify-center gap-2 px-4 py-2 rounded-lg ${
              view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
            aria-pressed={view === 'calendar'}
            aria-label="Month view"
          >
            <Calendar aria-hidden="true" />
            <span>Month</span>
          </button>
        </div>

        {/* Row 2: Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative" role="search">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden="true"
            />
            <input
              id="searchInput"
              ref={searchInputRef}
              type="text"
              placeholder="Search ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search items"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 whitespace-nowrap"
            aria-expanded={showFilters}
            aria-controls="filter-panel"
            aria-label="Toggle filters"
          >
            <Filter aria-hidden="true" />
            <span>Filter</span>
          </button>
        </div>
      </div>
    </div>
  );
}
