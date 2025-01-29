import React, { useState, useEffect } from 'react';
import { Bell, LogOut } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import StatCard from '../components/StatCard';
import Chart from '../components/Chart';
import PieChart from '../components/PieChart';
import StrategyPerformance from '../components/StrategyPerformance';
import RecentTrades from '../components/RecentTrades';
import Wallet from '../components/Wallet';
import { getDashboardData, getRecentTrades, getSectorAllocation, getPortfolioData } from '../api';

// Helper function to calculate win rate
const calculateWinRate = (portfolioData) => {
  if (!portfolioData || portfolioData.length === 0) return 0;
  
  const winningTrades = portfolioData.filter(trade => trade.dailyPnL > 0);
  return Number(((winningTrades.length / portfolioData.length) * 100).toFixed(2));
};

// Strategy metrics calculation
const calculateStrategyMetrics = (portfolio) => {
  return portfolio
    .map(stock => {
      const roi = ((stock.current_price - stock.avg_price) / stock.avg_price) * 100;
      const cagr = calculateCAGR(stock.avg_price, stock.current_price);
      const drawdown = calculateDrawdown(stock.current_price, stock.avg_price);
      const totalPortfolioValue = portfolio.reduce((sum, s) => sum + s.total_value, 0);
      const allocation = (stock.total_value / totalPortfolioValue) * 100;

      return {
        id: stock.symbol,
        name: stock.symbol,
        roi: Number(roi),
        cagr: Number(cagr),
        drawdown: Number(drawdown),
        allocation: Number(allocation)
      };
    })
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 3);
};

const calculateCAGR = (startPrice, endPrice) => {
  const timePeriod = 1;
  return Number((Math.pow(endPrice / startPrice, 1 / timePeriod) - 1) * 100).toFixed(2);
};

const calculateDrawdown = (currentPrice, avgPrice) => {
  return Number(((avgPrice - currentPrice) / avgPrice) * 100).toFixed(2);
};

// Add this helper function after other helper functions
const calculateSectorReturns = (portfolioData) => {
  // Group holdings by sector and calculate returns
  const sectorReturns = portfolioData.reduce((acc, holding) => {
    const sector = holding.sector;
    if (!acc[sector]) {
      acc[sector] = {
        totalValue: 0,
        investedValue: 0,
      };
    }
    
    acc[sector].totalValue += holding.current_price * holding.quantity;
    acc[sector].investedValue += holding.avg_price * holding.quantity;
    return acc;
  }, {});

  // Calculate return percentage for each sector
  return Object.entries(sectorReturns).map(([sector, values]) => ({
    sector,
    returnPercentage: ((values.totalValue - values.investedValue) / values.investedValue) * 100
  }));
};

// Update calculation helper 
const calculatePortfolioStats = (portfolioData) => {
  if (!portfolioData || portfolioData.length === 0) {
    return {
      totalValue: 0,
      investedValue: 0,
      dailyPnL: 0,
      dailyPnLPercentage: 0,
      totalReturn: 0
    };
  }

  const stats = portfolioData.reduce((acc, holding) => ({
    totalValue: acc.totalValue + (holding.current_price * holding.quantity),
    investedValue: acc.investedValue + (holding.avg_price * holding.quantity),
    dailyPnL: acc.dailyPnL + ((holding.current_price - holding.avg_price) * holding.quantity)
  }), { totalValue: 0, investedValue: 0, dailyPnL: 0 });

  stats.dailyPnLPercentage = (stats.dailyPnL / stats.investedValue) * 100;
  stats.totalReturn = ((stats.totalValue - stats.investedValue) / stats.investedValue) * 100;

  return stats;
};

const Dashboard = () => {
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 0,
    dailyPnL: 0,
    dailyPnLPercentage: 0,
    winRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recentTrades, setRecentTrades] = useState([]);
  const [sectorAllocation, setSectorAllocation] = useState([]);
  const [strategies, setStrategies] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);

  // Update the fetchDashboardData function
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getPortfolioData();
      const stats = calculatePortfolioStats(data);
      const sectorReturns = calculateSectorReturns(data);
      
      // Find best performing sector
      const bestSector = sectorReturns.reduce((best, current) => 
        current.returnPercentage > best.returnPercentage ? current : best
      );
      
      setPortfolioData({
        totalValue: stats.totalValue,
        dailyPnL: stats.dailyPnL,
        dailyPnLPercentage: stats.dailyPnLPercentage,
        winRate: stats.totalReturn,
        bestSector: bestSector.sector,
        bestSectorReturn: bestSector.returnPercentage
      });
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Update fetchRecentTrades function
  const fetchRecentTrades = async () => {
    try {
      const data = await getRecentTrades(3);
      if (!data || data.length === 0) {
        setRecentTrades([]);
        return;
      }
      
      const transformedTrades = data.map(trade => ({
        id: trade._id,
        symbol: trade.symbol,
        type: trade.status.toUpperCase(),
        price: trade.price,
        amount: trade.quantity,
        date: new Date(trade.date).toLocaleDateString()
      }));
      setRecentTrades(transformedTrades);
    } catch (err) {
      console.error('Error fetching recent trades:', err);
      setRecentTrades([]);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const data = await getPortfolioData();
      const performanceHistory = data.map(item => ({
        date: new Date(),
        value: item.total_value,
        change: item.daily_change
      }));
      setPerformanceData(performanceHistory);
    } catch (err) {
      console.error('Error fetching performance data:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchRecentTrades();
    fetchPerformanceData();
  }, []);

  useEffect(() => {
    const fetchSectorData = async () => {
      try {
        const data = await getSectorAllocation();
        
        if (!data || data.length === 0) {
          setSectorAllocation([]);
          return;
        }

        const totalValue = data.reduce((sum, sector) => sum + sector.value, 0);
        
        const transformedData = data.map(sector => ({
          name: sector.sector,
          value: Number(((sector.value / totalValue) * 100).toFixed(2))
        }));
        
        setSectorAllocation(transformedData);
      } catch (err) {
        console.error('Error fetching sector data:', err);
      }
    };

    fetchSectorData();
  }, []);

  // Add new useEffect for strategy data
  useEffect(() => {
    const fetchStrategyData = async () => {
      try {
        const portfolioData = await getPortfolioData();
        const strategyData = calculateStrategyMetrics(portfolioData);
        setStrategies(strategyData);
      } catch (err) {
        console.error('Error fetching strategy data:', err);
      }
    };

    fetchStrategyData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex-1 p-8">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Wallet />
          <SearchBar
            placeholder="Search strategies..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <Bell className="text-gray-600 cursor-pointer" />
          <LogOut className="text-gray-600 cursor-pointer" />
        </div>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Portfolio Value"
          value={portfolioData.totalValue}
          change={portfolioData.dailyPnLPercentage}
        />
        <StatCard
          title="Daily P&L"
          value={portfolioData.dailyPnL}
          change={portfolioData.dailyPnLPercentage}
        />
        <StatCard
          title="Win Rate"
          value={portfolioData.winRate}
          isPercentage={true}
        />
        <StatCard
          title={`Best Sector ROI: ${portfolioData.bestSector}`}
          value={portfolioData.bestSectorReturn}
          isPercentage={true}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2">
          <Chart 
            data={performanceData}
            title="Portfolio Performance"
            type="performance"
            showVolume={true}
            gradientColor="#8B5CF6"
            height={400}
          />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Sector Allocation</h2>
          <div className="h-[300px] flex items-center justify-center">
            {sectorAllocation.length > 0 ? (
              <PieChart data={sectorAllocation} />
            ) : (
              <div>No sector data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Strategy Performance and Recent Trades */}
      <div className="grid grid-cols-3 gap-6">
        <StrategyPerformance 
          strategies={strategies} 
          onStrategyClick={setSelectedStrategy}
        />
        {recentTrades.length > 0 ? (
          <RecentTrades trades={recentTrades} />
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Recent Trades</h2>
            <div className="text-gray-500 text-center py-8">
              No trades available
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;