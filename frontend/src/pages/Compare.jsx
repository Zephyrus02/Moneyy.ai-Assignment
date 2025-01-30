import React, { useState, useEffect } from 'react';
import { getCompanyAnalytics, getCompanyData } from '../api';
import Chart from '../components/Chart';
import { Info } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { buyShares } from '../api';
import Wallet from '../components/Wallet';

const Compare = () => {
  const [sectors, setSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState('');
  const [sectorStocks, setSectorStocks] = useState([]);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [stocksData, setStocksData] = useState([]);
  const [leftStock, setLeftStock] = useState(null);
  const [rightStock, setRightStock] = useState(null);
  const [leftStockData, setLeftStockData] = useState(null);
  const [rightStockData, setRightStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedStockForBuy, setSelectedStockForBuy] = useState(null);
  const [buyQuantity, setBuyQuantity] = useState('');
  const { balance, updateBalance } = useWallet();

  // Fetch sectors on mount
  useEffect(() => {
    const fetchSectors = async () => {
      const data = await getCompanyAnalytics();
      const uniqueSectors = [...new Set(data.map(company => company.sector))];
      setSectors(uniqueSectors);
    };
    fetchSectors();
  }, []);

  // Fetch stocks when sector is selected
  useEffect(() => {
    const fetchSectorStocks = async () => {
      if (!selectedSector) return;
      try {
        const data = await getCompanyAnalytics();
        const filteredStocks = data
          .filter(stock => stock.sector === selectedSector)
          .map(stock => ({
            symbol: stock._id,
            name: stock.companyName,
            sector: stock.sector,
            avgPrice: stock.avgPrice,
            totalVolume: stock.totalVolume,
            avgPnL: stock.avgPnL
          }));
        setSectorStocks(filteredStocks);
      } catch (error) {
        console.error('Error fetching sector stocks:', error);
      }
    };
    fetchSectorStocks();
  }, [selectedSector]);

  // Fetch detailed data for selected stocks
  useEffect(() => {
    const fetchStocksData = async () => {
      if (selectedStocks.length === 0) return;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const stocksDetails = await Promise.all(
        selectedStocks.map(async (stock) => {
          const data = await getCompanyData({
            symbol: stock.symbol,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          });
          return {
            ...stock,
            historicalData: data
          };
        })
      );
      setStocksData(stocksDetails);
    };
    fetchStocksData();
  }, [selectedStocks]);

  const handleLeftStockSelect = async (symbol) => {
    setLoading(true);
    const stock = sectorStocks.find(s => s.symbol === symbol);
    const data = await fetchStockData(stock);
    setLeftStock(stock);
    setLeftStockData(data);
    setLoading(false);
  };

  const handleRightStockSelect = async (symbol) => {
    setLoading(true);
    const stock = sectorStocks.find(s => s.symbol === symbol);
    const data = await fetchStockData(stock);
    setRightStock(stock);
    setRightStockData(data);
    setLoading(false);
  };

  const fetchStockData = async (stock) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    const data = await getCompanyData({
      symbol: stock.symbol,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    return data;
  };

  const handleBuy = async (stock, quantity) => {
    try {
      const totalCost = Number((stock.avgPrice * quantity).toFixed(2));
      
      if (totalCost > balance) {
        alert('Insufficient funds');
        return;
      }

      await buyShares({
        symbol: stock.symbol,
        quantity: parseInt(quantity),
        buyDate: new Date().toISOString().split('T')[0]
      });

      updateBalance(-totalCost);
      
      setShowBuyModal(false);
      setBuyQuantity('');
      setSelectedStockForBuy(null);
    } catch (error) {
      console.error('Error buying shares:', error);
      alert('Failed to buy shares: ' + error.message);
    }
  };

  return (
    <div className="p-8">
      {/* Header with Wallet */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Compare Stocks</h1>
        <div className="flex items-center space-x-4">
          <Wallet />
        </div>
      </div>

      {/* Sector Selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Sector
        </label>
        <select
          className="w-full md:w-1/3 p-2 border rounded-lg"
          value={selectedSector}
          onChange={(e) => {
            setSelectedSector(e.target.value);
            setLeftStock(null);
            setRightStock(null);
          }}
        >
          <option value="">Choose a sector...</option>
          {sectors.map(sector => (
            <option key={sector} value={sector}>{sector}</option>
          ))}
        </select>
      </div>

      {selectedSector && (
        <div className="grid grid-cols-2 gap-8">
          {/* Left Side */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <select
              className="w-full p-2 border rounded-lg mb-4"
              value={leftStock?.symbol || ''}
              onChange={(e) => handleLeftStockSelect(e.target.value)}
            >
              <option value="">Select first stock</option>
              {sectorStocks.map(stock => (
                <option 
                  key={stock.symbol} 
                  value={stock.symbol}
                  disabled={stock.symbol === rightStock?.symbol}
                >
                  {stock.symbol} - {stock.name || stock.symbol}
                </option>
              ))}
            </select>
            
            {loading && !leftStock ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              </div>
            ) : leftStock ? (
              <StockDetails 
                stock={leftStock} 
                data={leftStockData}
                onBuyClick={(stock) => {
                  setSelectedStockForBuy(stock);
                  setShowBuyModal(true);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                Select first stock to compare
              </div>
            )}
          </div>

          {/* Right Side */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <select
              className="w-full p-2 border rounded-lg mb-4"
              value={rightStock?.symbol || ''}
              onChange={(e) => handleRightStockSelect(e.target.value)}
            >
              <option value="">Select second stock</option>
              {sectorStocks.map(stock => (
                <option 
                  key={stock.symbol} 
                  value={stock.symbol}
                  disabled={stock.symbol === leftStock?.symbol}
                >
                  {stock.symbol} - {stock.name || stock.symbol}
                </option>
              ))}
            </select>
            
            {loading && !rightStock ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              </div>
            ) : rightStock ? (
              <StockDetails 
                stock={rightStock} 
                data={rightStockData}
                onBuyClick={(stock) => {
                  setSelectedStockForBuy(stock);
                  setShowBuyModal(true);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                Select second stock to compare
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Buy Modal */}
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
                Total Cost: ${Number((selectedStockForBuy.avgPrice * buyQuantity) || 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">
                Available Balance: ${Number(balance).toFixed(2)}
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
                disabled={!buyQuantity || buyQuantity <= 0 || selectedStockForBuy.avgPrice * buyQuantity > balance}
              >
                Buy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StockDetails = ({ 
  stock, 
  data, 
  onBuyClick 
}) => {
  // Helper calculations
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
    return (Math.abs(pnl || 0) * 0.3).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Stock Info */}
      <div className="bg-white rounded-xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">{stock.name || stock.symbol}</h2>
            <p className="text-gray-500">{stock.sector}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${stock.avgPrice?.toFixed(2)}</div>
            <div className={`text-lg ${stock.avgPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stock.avgPnL >= 0 ? '+' : ''}{stock.avgPnL?.toFixed(2)}%
            </div>
            <button
              className="mt-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              onClick={() => onBuyClick(stock)}
            >
              Buy
            </button>
          </div>
        </div>

        {/* Stock Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Market Cap</div>
            <div className="font-bold">
              {calculateMarketCap(stock.avgPrice, stock.totalVolume)}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Volume</div>
            <div className="font-bold">
              {(stock.totalVolume/1000000).toFixed(1)}M
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">P/E Ratio</div>
            <div className="font-bold">
              {calculatePE(stock.avgPrice)}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500">Dividend Yield</div>
            <div className="font-bold">
              {calculateDividend(stock.avgPnL)}%
            </div>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      {data && (
        <Chart 
          data={data}
          title="Price History"
          type="price"
          showVolume={true}
          dataKey="closing_price"
          gradientColor="#82ca9d"
          height={300}
        />
      )}
    </div>
  );
};

export default Compare;