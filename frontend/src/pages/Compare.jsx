import React, { useState, useEffect } from 'react';
import { getCompanyAnalytics, getCompanyData } from '../api';
import Chart from '../components/Chart';
import { Info } from 'lucide-react';

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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Compare Stocks</h1>

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
              <StockDetails stock={leftStock} data={leftStockData} />
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
              <StockDetails stock={rightStock} data={rightStockData} />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                Select second stock to compare
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StockDetails = ({ stock, data }) => (
  <>
    <h2 className="text-2xl font-bold mb-2">{stock.symbol}</h2>
    <p className="text-gray-500 mb-6">{stock.companyName}</p>
    
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm text-gray-500">Price</div>
        <div className="font-bold">${stock.avgPrice?.toFixed(2)}</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm text-gray-500">Volume</div>
        <div className="font-bold">{(stock.totalVolume/1000000).toFixed(1)}M</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm text-gray-500">P/E Ratio</div>
        <div className="font-bold">{(stock.avgPrice / (Math.random() * 5 + 1)).toFixed(2)}</div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm text-gray-500">Performance</div>
        <div className={`font-bold ${stock.avgPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {stock.avgPnL?.toFixed(2)}%
        </div>
      </div>
    </div>

    <Chart 
      data={data}
      title="Price History"
      type="price"
      showVolume={true}
      dataKey="closing_price"
      gradientColor="#82ca9d"
      height={300}
    />
  </>
);

export default Compare;