import React, { useState, useEffect } from 'react';
import { Bell, LogOut } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import StatCard from '../components/StatCard';
import Chart from '../components/Chart';
import PieChart from '../components/PieChart';
import StrategyPerformance from '../components/StrategyPerformance';
import RecentTrades from '../components/RecentTrades';
import Wallet from '../components/Wallet';
import { getDashboardData, getRecentTrades, getSectorAllocation, getPortfolioData, getTradeHistory, getCompanyData } from '../api';

// Strategy metrics calculation
const calculateStrategyMetrics = async (portfolio) => {
  return await Promise.all(portfolio.map(async stock => {
    const historicalData = await getCompanyData({
      symbol: stock.symbol,
      startDate: '2025-01-01',
      endDate: new Date().toISOString()
    });

    const startPrice = historicalData[0]?.closing_price || stock.avg_price;
    const endPrice = stock.current_price;
    
    const roi = ((endPrice - stock.avg_price) / stock.avg_price) * 100;
    const cagr = calculateCAGR(startPrice, endPrice);
    const drawdown = calculateDrawdown(historicalData);
    const totalPortfolioValue = portfolio.reduce((sum, s) => sum + s.total_value, 0);
    const allocation = (stock.total_value / totalPortfolioValue) * 100;

    return {
      id: stock.symbol,
      name: stock.symbol,
      roi: Number(roi.toFixed(2)),
      cagr: cagr,
      drawdown: drawdown,
      allocation: Number(allocation.toFixed(2))
    };
  }))
  .then(metrics => metrics.sort((a, b) => b.roi - a.roi).slice(0, 3));
};

const calculateCAGR = (startPrice, endPrice) => {
  // Fixed start date of 2025-01-01
  const startDate = new Date('2025-01-01');
  const endDate = new Date();
  
  // Calculate time period in years
  const timePeriodInYears = (endDate - startDate) / (365 * 24 * 60 * 60 * 1000);
  
  if (timePeriodInYears === 0) return 0;

  // Calculate CAGR
  const cagr = (Math.pow(endPrice / startPrice, 1 / timePeriodInYears) - 1) * 100;
  return Number(cagr.toFixed(2));
};

const calculateDrawdown = (historicalData) => {
  if (!historicalData || historicalData.length === 0) return 0;
  
  let maxPrice = historicalData[0].closing_price;
  let maxDrawdown = 0;

  historicalData.forEach(dataPoint => {
    const currentPrice = dataPoint.closing_price;
    maxPrice = Math.max(maxPrice, currentPrice);
    const currentDrawdown = ((maxPrice - currentPrice) / maxPrice) * 100;
    maxDrawdown = Math.max(maxDrawdown, currentDrawdown);
  });

  return Number(maxDrawdown.toFixed(2));
};

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

const calculateBestSector = (portfolioData) => {
  if (!portfolioData?.length) {
    return { sector: 'N/A', roi: 0 };
  }

  // Group by sector and calculate performance
  const sectorPerformance = portfolioData.reduce((acc, holding) => {
    const sector = holding.sector || 'Unknown';
    
    if (!acc[sector]) {
      acc[sector] = {
        totalInvested: 0,
        currentValue: 0,
        sectorName: sector
      };
    }
    
    const invested = holding.avg_price * holding.quantity;
    const current = holding.current_price * holding.quantity;
    
    acc[sector].totalInvested += invested;
    acc[sector].currentValue += current;
    return acc;
  }, {});

  // Calculate ROI for each sector
  const sectorROIs = Object.entries(sectorPerformance)
    .filter(([_, values]) => values.totalInvested > 0)
    .map(([sector, values]) => {
      const roi = ((values.currentValue - values.totalInvested) / values.totalInvested) * 100;
      return {
        sector: values.sectorName,
        roi: Number(roi.toFixed(2))
      };
    });

  if (!sectorROIs.length) {
    return { sector: 'N/A', roi: 0 };
  }

  return sectorROIs.reduce((best, current) => 
    current.roi > best.roi ? current : best, 
    sectorROIs[0]
  );
};

// Update calculation helper with proper defaults
const calculatePortfolioStats = (portfolioData) => {
  if (!portfolioData?.length) {
    return {
      totalValue: 0,
      investedValue: 0,
      dailyPnL: 0,
      dailyPnLPercentage: 0,
      totalReturn: 0,
      bestSector: 'N/A',
      bestSectorReturn: 0
    };
  }

  const stats = portfolioData.reduce((acc, holding) => ({
    totalValue: acc.totalValue + (holding.current_price * holding.quantity) || 0,
    investedValue: acc.investedValue + (holding.avg_price * holding.quantity) || 0,
    dailyPnL: acc.dailyPnL + ((holding.current_price - holding.avg_price) * holding.quantity) || 0
  }), { totalValue: 0, investedValue: 0, dailyPnL: 0 });

  const bestSectorData = calculateBestSector(portfolioData);

  return {
    ...stats,
    dailyPnLPercentage: stats.investedValue ? (stats.dailyPnL / stats.investedValue) * 100 : 0,
    totalReturn: stats.investedValue ? ((stats.totalValue - stats.investedValue) / stats.investedValue) * 100 : 0,
    bestSector: bestSectorData.sector,
    bestSectorReturn: bestSectorData.roi
  };
};

// Helper function to calculate daily win rate
const calculateDailyWinRate = (portfolioData) => {
  if (!portfolioData || portfolioData.length === 0) return {
    winRate: 0,
    dailyChange: 0,
    isPositive: false
  };

  const today = new Date().toISOString().split('T')[0];
  const todayPortfolio = portfolioData.filter(item => 
    new Date(item.date).toISOString().split('T')[0] === today
  );

  const previousDayPortfolio = portfolioData.filter(item => {
    const itemDate = new Date(item.date);
    itemDate.setDate(itemDate.getDate() + 1);
    return itemDate.toISOString().split('T')[0] === today;
  });

  if (!todayPortfolio.length || !previousDayPortfolio.length) {
    return {
      winRate: 0,
      dailyChange: 0,
      isPositive: false
    };
  }

  const todayValue = todayPortfolio.reduce((sum, item) => 
    sum + (item.current_price * item.quantity), 0
  );

  const previousValue = previousDayPortfolio.reduce((sum, item) => 
    sum + (item.current_price * item.quantity), 0
  );

  const dailyChange = ((todayValue - previousValue) / previousValue) * 100;
  const isPositive = dailyChange > 0;

  return {
    winRate: Number(dailyChange.toFixed(2)),
    dailyChange: Number(Math.abs(dailyChange).toFixed(2)),
    isPositive
  };
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
  const [winRate, setWinRate] = useState(0);
  const [dailyChange, setDailyChange] = useState(0);
  const [isPositive, setIsPositive] = useState(false);

  // Update the fetchDashboardData function
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getPortfolioData();
      
      if (!data?.length) {
        setPortfolioData({
          totalValue: 0,
          dailyPnL: 0,
          dailyPnLPercentage: 0,
          winRate: 0,
          bestSector: 'N/A',
          bestSectorReturn: 0
        });
        setLoading(false);
        return;
      }

      const stats = calculatePortfolioStats(data);
      const sectorReturns = calculateSectorReturns(data);
      
      // Find best sector only if we have sector data
      const bestSector = sectorReturns?.length ? 
        sectorReturns.reduce((best, current) => 
          current.returnPercentage > best.returnPercentage ? current : best, 
          { sector: 'N/A', returnPercentage: 0 }
        ) : { sector: 'N/A', returnPercentage: 0 };
      
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

  // Update fetchPerformanceData function
  const fetchPerformanceData = async () => {
    try {
      const trades = await getTradeHistory();
      const portfolioHistory = [];
      let totalInvested = 0;
      let currentValue = 0;

      // Sort trades by date
      const sortedTrades = trades.sort((a, b) => new Date(a.date) - new Date(b.date));
      const startDate = new Date(sortedTrades[0]?.date || new Date());

      // Create daily portfolio value entries
      for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
        const currentDate = d.toISOString().split('T')[0];
        
        // Find trades for this date
        const dayTrades = sortedTrades.filter(trade => 
          new Date(trade.date).toISOString().split('T')[0] === currentDate
        );

        // Update portfolio value based on trades
        dayTrades.forEach(trade => {
          if (trade.type === 'BUY') {
            totalInvested += trade.price * trade.quantity;
            currentValue += trade.price * trade.quantity;
          } else if (trade.type === 'SELL') {
            currentValue -= trade.price * trade.quantity;
          }
        });

        portfolioHistory.push({
          date: new Date(currentDate),
          value: currentValue,
          invested: totalInvested,
          change: ((currentValue - totalInvested) / totalInvested * 100) || 0
        });
      }

      setPerformanceData(portfolioHistory);
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

        const transformedData = data.map(sector => ({
          name: sector.sector || 'Unknown',
          value: Number(sector.value.toFixed(2))
        }));
        
        setSectorAllocation(transformedData);
      } catch (err) {
        console.error('Error fetching sector data:', err);
        setSectorAllocation([]);
      }
    };

    fetchSectorData();
  }, []);

  // Add new useEffect for strategy data
  useEffect(() => {
    const fetchStrategyData = async () => {
      try {
        const portfolioData = await getPortfolioData();
        const strategyData = await calculateStrategyMetrics(portfolioData);
        setStrategies(strategyData);
      } catch (err) {
        console.error('Error fetching strategy data:', err);
      }
    };

    fetchStrategyData();
  }, []);

  // Update in useEffect
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getPortfolioData();
        const dailyStats = calculateDailyWinRate(data);
        setWinRate(dailyStats.winRate);
        setDailyChange(dailyStats.dailyChange);
        setIsPositive(dailyStats.isPositive);
      } catch (err) {
        console.error('Error fetching portfolio data:', err);
      }
    };

    fetchDashboardData();
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
            title="Portfolio Growth"
            type="performance"
            showVolume={false}
            dataKey="value"
            compareKey="invested"
            gradientColor="#8B5CF6"
            height={400}
            xAxisFormatter={(date) => new Date(date).toLocaleDateString()}
            tooltipFormatter={(value) => `$${value.toLocaleString()}`}
            tooltipLabelFormatter={(date) => new Date(date).toLocaleDateString()}
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