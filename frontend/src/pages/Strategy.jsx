import React, { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import { 
  TrendingUp,
  TrendingDown,
  Info,
  X
} from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import FilterButton from '../components/FilterButton';
import SearchBar from '../components/SearchBar';
import Chart from '../components/Chart';
import { getCompanyAnalytics, getCompanyData, buyShares } from '../api';
import Wallet from '../components/Wallet';

const Strategy = () => {
  // Add new state
  const { balance, updateBalance } = useWallet();
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState('');
  const [selectedStockForBuy, setSelectedStockForBuy] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedStockData, setSelectedStockData] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'price', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sector: 'all',
    price: { min: '', max: '' },
    marketCap: 'all',
    performance: 'all'
  });

  // Fetch company analytics
  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        const data = await getCompanyAnalytics();
        
        // Transform data
        const transformedData = data.map(company => ({
          symbol: company._id,
          name: company.companyName,
          sector: company.sector,
          price: company.avgPrice,
          change: company.avgPnL,
          volume: company.totalVolume,
          marketCap: calculateMarketCap(company.avgPrice, company.totalVolume),
          pe: calculatePE(company.avgPrice),
          dividend: calculateDividend(company.avgPnL)
        }));
        
        setStocks(transformedData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  // Fetch detailed data when stock is selected
  useEffect(() => {
    const fetchStockDetails = async () => {
      if (!selectedStock) return;

      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);

        const data = await getCompanyData({
          symbol: selectedStock.symbol,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

        // Transform historical data
        const historicalData = data.map(item => ({
          date: new Date(item.date),
          price: item.closing_price,
          volume: item.volume_traded
        }));

        setSelectedStockData(historicalData);
      } catch (err) {
        console.error('Error fetching stock details:', err);
      }
    };

    fetchStockDetails();
  }, [selectedStock]);

  // Helper functions
  const calculateMarketCap = (price, volume) => {
    const cap = price * volume;
    return cap >= 1e12 ? `${(cap/1e12).toFixed(1)}T` :
           cap >= 1e9 ? `${(cap/1e9).toFixed(1)}B` :
           `${(cap/1e6).toFixed(1)}M`;
  };

  const calculatePE = (price) => {
    return (price / (Math.random() * 5 + 1)).toFixed(1);
  };

  const calculateDividend = (pnl) => {
    return (Math.abs(pnl) * 0.3).toFixed(2);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchTerm) => {
      setSearchTerm(searchTerm);
    }, 300),
    []
  );

  // Filter stocks
  const filteredStocks = stocks.filter(stock => {
    // Search filter
    const searchMatch = 
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Sector filter
    const sectorMatch = 
      filters.sector === 'all' || stock.sector === filters.sector;
    
    // Price filter
    const priceMatch = 
      (!filters.price.min || stock.price >= Number(filters.price.min)) &&
      (!filters.price.max || stock.price <= Number(filters.price.max));
    
    // Market cap filter
    const marketCapMatch = 
      filters.marketCap === 'all' ||
      (filters.marketCap === 'large' && stock.marketCap.includes('T')) ||
      (filters.marketCap === 'mid' && stock.marketCap.includes('B')) ||
      (filters.marketCap === 'small' && !stock.marketCap.includes('T') && !stock.marketCap.includes('B'));
    
    // Performance filter
    const performanceMatch = 
      filters.performance === 'all' ||
      (filters.performance === 'positive' && stock.change > 0) ||
      (filters.performance === 'negative' && stock.change < 0);

    return searchMatch && sectorMatch && priceMatch && marketCapMatch && performanceMatch;
  });

  const resetFilters = () => {
    setFilters({
      sector: 'all',
      price: { min: '', max: '' },
      marketCap: 'all',
      performance: 'all'
    });
  };

  // Add buy handler
  const handleBuy = async (stock, quantity) => {
    try {
      const totalCost = stock.price * quantity;
      
      if (totalCost > balance) {
        alert('Insufficient funds');
        return;
      }

      await buyShares({
        symbol: stock.symbol,
        quantity: parseInt(quantity),
        buyDate: new Date().toISOString().split('T')[0]
      });

      // Update wallet balance
      updateBalance(-totalCost);
      
      setShowBuyModal(false);
      setBuyQuantity('');
      setSelectedStockForBuy(null);
    } catch (error) {
      console.error('Error buying shares:', error);
      alert('Failed to buy shares: ' + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Strategy Builder</h1>
        <div className="flex items-center space-x-4">
          <Wallet />
          <SearchBar
            placeholder="Search stocks..."
            value={searchTerm}
            onChange={debouncedSearch}
          />
          <FilterButton showFilters={showFilters} setShowFilters={setShowFilters} />
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

            {/* Sector Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sector
              </label>
              <select
                className="w-full p-2 border rounded-lg"
                value={filters.sector}
                onChange={(e) => setFilters({...filters, sector: e.target.value})}
              >
                <option value="all">All Sectors</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Metals">Metals</option>
                <option value="Energy">Energy</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="flex space-x-4">
                <input
                  type="number"
                  placeholder="Min"
                  className="w-1/2 p-2 border rounded-lg"
                  value={filters.price.min}
                  onChange={(e) => setFilters({
                    ...filters,
                    price: {...filters.price, min: e.target.value}
                  })}
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="w-1/2 p-2 border rounded-lg"
                  value={filters.price.max}
                  onChange={(e) => setFilters({
                    ...filters,
                    price: {...filters.price, max: e.target.value}
                  })}
                />
              </div>
            </div>

            {/* Market Cap Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Market Cap
              </label>
              <select
                className="w-full p-2 border rounded-lg"
                value={filters.marketCap}
                onChange={(e) => handleFilterChange('marketCap', e.target.value)}
              >
                <option value="all">All</option>
                <option value="large">Large Cap (&gt;$10B)</option>
                <option value="mid">Mid Cap ($2B-$10B)</option>
                <option value="small">Small Cap (&lt;$2B)</option>
              </select>
            </div>

            {/* Performance Filter */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Performance
              </label>
              <select
                className="w-full p-2 border rounded-lg"
                value={filters.performance}
                onChange={(e) => handleFilterChange('performance', e.target.value)}
              >
                <option value="all">All</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
              </select>
            </div>

            {/* Actions */}
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

      <div className="grid grid-cols-12 gap-6">
        {/* Stock List */}
        <div className="col-span-4 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Available Stocks</h2>
          </div>
          <div className="divide-y max-h-[800px] overflow-auto">
            {filteredStocks.map(stock => (
              <div 
                key={stock.symbol}
                className={`p-4 hover:bg-gray-50 ${
                  selectedStock?.symbol === stock.symbol ? 'bg-purple-50' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="cursor-pointer" onClick={() => setSelectedStock(stock)}>
                    <h3 className="font-medium">{stock.symbol}</h3>
                    <p className="text-sm text-gray-500">{stock.name}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="font-medium">${stock.price.toFixed(2)}</div>
                    <div className={`text-sm ${stock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stock.change >= 0 ? '+' : ''}{stock.change}%
                    </div>
                    <button
                      className="mt-2 px-4 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
                      onClick={() => {
                        setSelectedStockForBuy(stock);
                        setShowBuyModal(true);
                      }}
                    >
                      Buy
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>Vol: {(stock.volume/1000000).toFixed(1)}M</span>
                  <span>P/E: {stock.pe}</span>
                  <span>Div: {stock.dividend}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buy Modal */}
        {showBuyModal && selectedStockForBuy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-96">
              <h3 className="text-xl font-bold mb-4">Buy {selectedStockForBuy.symbol}</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={buyQuantity}
                  onChange={(e) => setBuyQuantity(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Total Cost: ${((selectedStockForBuy.price * buyQuantity) || 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  Available Balance: ${balance.toLocaleString()}
                </p>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  className="px-4 py-2 text-gray-600"
                  onClick={() => {
                    setShowBuyModal(false);
                    setBuyQuantity('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg"
                  onClick={() => handleBuy(selectedStockForBuy, buyQuantity)}
                  disabled={!buyQuantity || buyQuantity <= 0 || selectedStockForBuy.price * buyQuantity > balance}
                >
                  Buy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stock Details */}
        <div className="col-span-8">
          {selectedStock ? (
            <div className="space-y-6">
              {/* Stock Info */}
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedStock.name}</h2>
                    <p className="text-gray-500">{selectedStock.sector}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${selectedStock.price.toFixed(2)}</div>
                    <div className={`text-lg ${selectedStock.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedStock.change >= 0 ? (
                        <TrendingUp className="inline mr-1" size={20} />
                      ) : (
                        <TrendingDown className="inline mr-1" size={20} />
                      )}
                      {selectedStock.change}%
                    </div>
                  </div>
                </div>

                {/* Stock Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Market Cap</div>
                    <div className="font-bold">{selectedStock.marketCap}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Volume</div>
                    <div className="font-bold">{(selectedStock.volume/1000000).toFixed(1)}M</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">P/E Ratio</div>
                    <div className="font-bold">{selectedStock.pe}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Dividend Yield</div>
                    <div className="font-bold">{selectedStock.dividend}%</div>
                  </div>
                </div>
              </div>

              {/* Price Chart */}
              {selectedStock && selectedStockData && (
                <Chart 
                  data={selectedStockData}
                  title="Price History"
                  type="price"
                  showVolume={true}
                  dataKey="price"
                  gradientColor="#82ca9d"
                />
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Info size={48} className="mx-auto mb-4" />
                <p>Select a stock to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Strategy;