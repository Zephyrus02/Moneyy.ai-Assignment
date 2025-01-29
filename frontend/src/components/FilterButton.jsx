import React from 'react';
import { Filter } from 'lucide-react';

const FilterButton = ({ showFilters, setShowFilters }) => {
  return (
    <button 
      className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
      onClick={() => setShowFilters(!showFilters)}
    >
      <Filter size={20} />
      <span>Filter</span>
    </button>
  );
};

export default FilterButton;