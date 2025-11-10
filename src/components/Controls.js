import React from 'react';
import { List, Calendar, Search, Filter } from './Icons';

export default function Controls({
  view,
  handleViewChange,
  searchTerm,
  setSearchTerm,
  showFilters,
  setShowFilters,
}) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div className="flex gap-2">
        <button
          onClick={() => handleViewChange('list')}
          className={`flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg ${
            view === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <List />
          List
        </button>
        <button
          onClick={() => handleViewChange('week')}
          className={`flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg ${
            view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <Calendar />
          Week
        </button>
        <button
          onClick={() => handleViewChange('calendar')}
          className={`flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg ${
            view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <Calendar />
          Month
        </button>
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
      >
        <Filter />
        Filters
      </button>
    </div>
  );
}
