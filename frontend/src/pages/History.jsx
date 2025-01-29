import React, { useState, useEffect } from 'react';
import { 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import FilterButton from '../components/FilterButton';
import StatCard from '../components/StatCard';
import { getTradeHistory } from '../api';
import Wallet from '../components/Wallet';

// Add calculation functions at the top
const calculateTradeStats = (trades) => {
  console.log('Calculating stats for trades:', trades); // Debug log
  
  if (!trades || trades.length === 0) {
    return {
      totalInvested: 0,
      totalReceived: 0,
      winRate: 0,
      averagePnL: 0
    };
  }

  const stats = trades.reduce((acc, trade) => {
    const quantity = Number(trade.quantity) || 0;
    const buyPrice = Number(trade.buy_price) || 0;
    const sellPrice = Number(trade.sell_price) || 0;
    
    const invested = quantity * buyPrice;
    const received = sellPrice ? quantity * sellPrice : 0;
    const isProfitable = received > invested;

    console.log('Trade calculation:', { // Debug log
      quantity,
      buyPrice,
      sellPrice,
      invested,
      received,
      isProfitable
    });

    return {
      totalInvested: acc.totalInvested + invested,
      totalReceived: acc.totalReceived + received,
      wins: acc.wins + (isProfitable ? 1 : 0),
      totalPnL: acc.totalPnL + (received - invested)
    };
  }, { totalInvested: 0, totalReceived: 0, wins: 0, totalPnL: 0 });

  const result = {
    totalInvested: Number(stats.totalInvested.toFixed(2)) || 0,
    totalReceived: Number(stats.totalReceived.toFixed(2)) || 0,
    winRate: Number(((stats.wins / trades.length) * 100).toFixed(1)) || 0,
    averagePnL: Number((stats.totalPnL / trades.length).toFixed(2)) || 0
  };

  console.log('Final stats:', result); // Debug log
  return result;
};

const History = () => {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateRange: {
      start: null,
      end: null
    }
  });

  // Fetch trade history
  const fetchTradeHistory = async () => {
    try {
      setLoading(true);
      const data = await getTradeHistory({
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        type: filters.type !== 'all' ? filters.type : undefined,
        status: filters.status !== 'all' ? filters.status : undefined
      });
      
      console.log('Fetched trade data:', data); // Debug log
      
      // Transform data if needed
      const transformedData = data.map(trade => ({
        ...trade,
        quantity: Number(trade.quantity),
        buy_price: Number(trade.buy_price),
        sell_price: Number(trade.sell_price || 0)
      }));
      
      console.log('Transformed trade data:', transformedData); // Debug log
      
      setTrades(transformedData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching trade history:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Calculate trade statistics
  const calculateTotalTradedValue = (trades) => {
    return trades.reduce((sum, trade) => {
      const tradeValue = trade.price * trade.shares;
      return sum + tradeValue;
    }, 0);
  };

  useEffect(() => {
    fetchTradeHistory();
  }, [filters.dateRange.start, filters.dateRange.end, filters.type, filters.status]);

  const handleFilterClick = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleSort = (key) => {
    setSortConfig(prevSort => ({
      key,
      direction: prevSort.key === key 
        ? prevSort.direction === 'asc' 
          ? 'desc' 
          : 'asc'
        : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={16} className="text-gray-400" />;
    if (sortConfig.direction === 'asc') return <ArrowUp size={16} className="text-purple-600" />;
    return <ArrowDown size={16} className="text-purple-600" />;
  };

  // Filter handlers
  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const resetFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      dateRange: {
        start: null,
        end: null
      }
    });
  };

  // Filter trades based on search term
  const filteredTrades = trades.filter(trade => 
    trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trade.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort filtered trades
  const sortedTrades = [...filteredTrades].sort((a, b) => {
    if (sortConfig.direction === 'asc') {
      return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
    }
    return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
  });

  const tradeStats = calculateTradeStats(trades);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Trade History</h1>
        <div className="flex items-center space-x-4">
          <Wallet />
          <SearchBar
            placeholder="Search trades..."
            value={searchTerm}
            onChange={handleSearch}
          />
          <FilterButton 
            showFilters={showFilters}
            setShowFilters={handleFilterClick}
            activeFilters={Object.entries(filters).filter(([_, value]) => 
              value !== 'all' && value !== null
            ).length}
          />
        </div>
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Filters</h2>
              <button onClick={() => setShowFilters(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Trade Type Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trade Type
              </label>
              <select
                className="w-full p-2 border rounded-lg"
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <option value="all">All</option>
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                className="w-full p-2 border rounded-lg"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">All</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="flex space-x-4">
                <input
                  type="date"
                  className="w-1/2 p-2 border rounded-lg"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    start: e.target.value
                  })}
                />
                <input
                  type="date"
                  className="w-1/2 p-2 border rounded-lg"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    end: e.target.value
                  })}
                />
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                onClick={resetFilters}
              >
                Reset
              </button>
              <button
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                onClick={() => setShowFilters(false)}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trade Statistics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Invested"
          value={tradeStats.totalInvested}
          isPercentage={false}
          isCurrency={true}
        />
        <StatCard
          title="Total Received"
          value={tradeStats.totalReceived}
          isPercentage={false}
          isCurrency={true}
        />
        <StatCard
          title="Win Rate"
          value={tradeStats.winRate}
          isPercentage={true}
          decimals={1}
        />
        <StatCard
          title="Average P&L"
          value={tradeStats.averagePnL}
          isPercentage={false}
          isCurrency={true}
          isPositive={tradeStats.averagePnL > 0}
        />
      </div>

      {/* Trade History Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleSort('date')}>
                  <span>Date</span>
                  {getSortIcon('date')}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Symbol</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleSort('shares')}>
                  <span>Shares</span>
                  {getSortIcon('shares')}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleSort('price')}>
                  <span>Price</span>
                  {getSortIcon('price')}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleSort('total')}>
                  <span>Total</span>
                  {getSortIcon('total')}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleSort('pnl')}>
                  <span>P&L</span>
                  {getSortIcon('pnl')}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedTrades.map((trade) => (
              <tr key={trade.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{trade.date || 'N/A'}</td>
                <td className="px-6 py-4 font-medium">{trade.symbol || 'N/A'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    trade.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {trade.type || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4">{trade.quantity || 0}</td>
                <td className="px-6 py-4">${(trade.price || 0).toFixed(2)}</td>
                <td className="px-6 py-4">${((trade.quantity || 0) * (trade.price || 0)).toFixed(2)}</td>
                <td className="px-6 py-4">
                  <div className={`flex items-center ${(trade.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {(trade.pnl || 0) >= 0 ? 
                      <TrendingUp size={16} className="mr-1" /> : 
                      <TrendingDown size={16} className="mr-1" />
                    }
                    ${Math.abs(trade.pnl || 0).toFixed(2)} ({(trade.pnlPercent || 0).toFixed(2)}%)
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">
                    {trade.status || 'N/A'}
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

// Add these helper functions inside History.jsx
const calculatePnL = (trade) => {
  if (trade.type === 'BUY') {
    return 0; // P&L calculated on sell
  }
  return (trade.price - trade.avgPrice) * trade.quantity;
};

const calculatePnLPercent = (trade) => {
  if (trade.type === 'BUY' || !trade.avgPrice) {
    return 0;
  }
  return ((trade.price - trade.avgPrice) / trade.avgPrice) * 100;
};

export default History;