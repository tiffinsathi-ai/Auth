    import React from 'react';
import { Search, Filter } from 'lucide-react';

const SearchFilter = ({
  searchTerm,
  onSearchChange,
  filterValue,
  onFilterChange,
  filterOptions,
  searchPlaceholder = "Search...",
  filterPlaceholder = "Filter"
}) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full rounded-lg border-0 py-3 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="relative min-w-[200px]">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Filter className="h-5 w-5 text-gray-400" />
        </div>
        <select
          className="block w-full rounded-lg border-0 py-3 pl-10 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
          value={filterValue}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          {filterOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SearchFilter;