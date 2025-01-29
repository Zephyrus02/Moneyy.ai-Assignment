import React, { useEffect, useState } from 'react';
import { 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown,
  X,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import FilterButton from '../components/FilterButton';
import StatCard from '../components/StatCard';
import SearchBar from '../components/SearchBar';
import { getPortfolioData } from '../api';

// Assume holdings will be populated with portfolio data
const Portfolio = () => {
  const [sortConfig, setSortConfig] = useState({ key: 'value', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    shares: { min: '', max: '' },
    performance: 'all',
    sector: 'all',
    value: { min: '', max: '' }
  });
  const [showFilters, setShowFilters] = useState(false);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const data = await getPortfolioData();
        // Transform backend data into the format we need
        const transformedData = data.map(item => ({
          symbol: item.symbol,
          sector: item.sector,
          shares: item.quantity,
          avgPrice: item.avg_price,
          currentPrice: item.current_price || item.avg_price, // Fallback to avg_price if current not available
          value: item.total_value,
          dailyChange: ((item.current_price - item.avg_price) / item.avg_price) * 100,
          totalReturn: ((item.total_value - (item.avg_price * item.quantity)) / (item.avg_price * item.quantity)) * 100
        }));
        setPortfolio(transformedData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const handleSort = (key) => {
    setSortConfig(prevSort => ({
      key,
      direction: prevSort.key === key 
        ? prevSort.direction === 'asc' 
          ? 'desc' 
          : prevSort.direction === 'desc' 
            ? null 
            : 'asc'
        : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={16} className="text-gray-400" />;
    if (sortConfig.direction === 'asc') return <ArrowUp size={16} className="text-purple-600" />;
    if (sortConfig.direction === 'desc') return <ArrowDown size={16} className="text-purple-600" />;
    return <ArrowUpDown size={16} className="text-gray-400" />;
  };

  // Filter portfolio data based on search and filters
  const filteredPortfolio = portfolio.filter(holding => {
    const searchMatch = holding.symbol.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Add your existing filter logic here
    const sharesFilter = (!filters.shares.min || holding.shares >= Number(filters.shares.min)) &&
                        (!filters.shares.max || holding.shares <= Number(filters.shares.max));
    
    const performanceFilter = filters.performance === 'all' ||
                            (filters.performance === 'positive' && holding.dailyChange > 0) ||
                            (filters.performance === 'negative' && holding.dailyChange < 0);
    
    const sectorFilter = filters.sector === 'all' || holding.sector === filters.sector;
    
    const valueFilter = (!filters.value.min || holding.value >= Number(filters.value.min)) &&
                       (!filters.value.max || holding.value <= Number(filters.value.max));
    
    return searchMatch && sharesFilter && performanceFilter && sectorFilter && valueFilter;
  });

  // Sort filtered data
  const sortedPortfolio = [...filteredPortfolio].sort((a, b) => {
    if (!sortConfig.direction) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const sectors = [...new Set(portfolio.map(h => h.sector))];

  const resetFilters = () => {
    setFilters({
      shares: { min: '', max: '' },
      performance: 'all',
      sector: 'all',
      value: { min: '', max: '' }
    });
  };

  // Calculate portfolio statistics
  const portfolioStats = {
    totalValue: portfolio.reduce((sum, holding) => sum + holding.value, 0),
    investedValue: portfolio.reduce((sum, holding) => 
      sum + (holding.avgPrice * holding.shares), 0),
    dailyPnL: portfolio.reduce((sum, holding) => sum + holding.value, 0) - 
      portfolio.reduce((sum, holding) => sum + (holding.avgPrice * holding.shares), 0),
    totalReturn: portfolio.length ? 
      ((portfolio.reduce((sum, holding) => sum + holding.value, 0) - 
        portfolio.reduce((sum, holding) => sum + (holding.avgPrice * holding.shares), 0)) /
        portfolio.reduce((sum, holding) => sum + (holding.avgPrice * holding.shares), 0) * 100).toFixed(2)
      : 0
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Portfolio Holdings</h1>
        <div className="flex items-center space-x-4">
          <SearchBar
            placeholder="Search holdings..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <FilterButton showFilters={showFilters} setShowFilters={setShowFilters} />
        </div>
      </div>

      {/* Filter Modal/Dropdown */}
      {showFilters && (
        <div className="absolute right-8 top-24 w-80 bg-white rounded-lg shadow-lg border p-4 z-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Filters</h3>
            <button onClick={() => setShowFilters(false)}>
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Shares Filter */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700">Shares Range</label>
            <div className="flex space-x-2 mt-1">
              <input
                type="number"
                placeholder="Min"
                className="w-1/2 px-3 py-2 border rounded"
                value={filters.shares.min}
                onChange={e => setFilters({...filters, shares: {...filters.shares, min: e.target.value}})}
              />
              <input
                type="number"
                placeholder="Max"
                className="w-1/2 px-3 py-2 border rounded"
                value={filters.shares.max}
                onChange={e => setFilters({...filters, shares: {...filters.shares, max: e.target.value}})}
              />
            </div>
          </div>

          {/* Performance Filter */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700">Performance</label>
            <select
              className="w-full mt-1 px-3 py-2 border rounded"
              value={filters.performance}
              onChange={e => setFilters({...filters, performance: e.target.value})}
            >
              <option value="all">All</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
            </select>
          </div>

          {/* Sector Filter */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700">Sector</label>
            <select
              className="w-full mt-1 px-3 py-2 border rounded"
              value={filters.sector}
              onChange={e => setFilters({...filters, sector: e.target.value})}
            >
              <option value="all">All Sectors</option>
              {sectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.entries(filters).map(([key, value]) => {
              if (value === 'all' || (typeof value === 'object' && !value.min && !value.max)) return null;
              return (
                <span key={key} className="px-2 py-1 bg-purple-100 text-purple-600 rounded-full text-sm flex items-center">
                  {key}: {typeof value === 'object' ? `${value.min || 0} - ${value.max || '∞'}` : value}
                  <X 
                    size={14} 
                    className="ml-1 cursor-pointer"
                    onClick={() => setFilters({...filters, [key]: typeof value === 'object' ? { min: '', max: '' } : 'all'})}
                  />
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Portfolio Summary */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Portfolio Value"
          value={portfolioStats.totalValue}
          isPercentage={false}
        />
        <StatCard
          title="Invested Value"
          value={portfolioStats.investedValue}
          isPercentage={false}
        />
        <StatCard
          title="Daily P&L"
          value={portfolioStats.dailyPnL}
          isPercentage={false}
        />
        <StatCard
          title="Total Return"
          value={portfolioStats.totalReturn}
          isPercentage={true}
        />
      </div>

      {/* Holdings Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-2">
                  <span>Symbol</span>
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('shares')}
              >
                <div className="flex items-center space-x-2">
                  <span>Shares</span>
                  {getSortIcon('shares')}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('avgPrice')}
              >
                <div className="flex items-center space-x-2">
                  <span>Avg Price</span>
                  {getSortIcon('avgPrice')}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('currentPrice')}
              >
                <div className="flex items-center space-x-2">
                  <span>Current Price</span>
                  {getSortIcon('currentPrice')}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('value')}
              >
                <div className="flex items-center space-x-2">
                  <span>Value</span>
                  {getSortIcon('value')}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('dailyChange')}
              >
                <div className="flex items-center space-x-2">
                  <span>Daily Change</span>
                  {getSortIcon('dailyChange')}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalReturn')}
              >
                <div className="flex items-center space-x-2">
                  <span>Total Return</span>
                  {getSortIcon('totalReturn')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedPortfolio.map((holding) => (
              <tr 
                key={holding.symbol}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <div className="font-medium">{holding.symbol}</div>
                  <div className="text-sm text-gray-500">{holding.sector}</div>
                </td>
                <td className="px-6 py-4">{holding.shares}</td>
                <td className="px-6 py-4">${holding.avgPrice.toFixed(2)}</td>
                <td className="px-6 py-4">${holding.currentPrice.toFixed(2)}</td>
                <td className="px-6 py-4">${holding.value.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className={`flex items-center ${holding.dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {holding.dailyChange >= 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                    {Math.abs(holding.dailyChange).toFixed(2)}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={holding.totalReturn >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {holding.totalReturn.toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Portfolio;