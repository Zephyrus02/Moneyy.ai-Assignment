import React from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ 
  placeholder = "Search...", 
  value, 
  onChange, 
  className = "" 
}) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
      <input
        type="text"
        placeholder={placeholder}
        className={`pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:border-purple-500 ${className}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;