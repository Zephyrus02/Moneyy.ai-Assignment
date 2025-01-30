const Portfolio = require('../models/Portfolio');
const TradeHistory = require('../models/TradeHistory');
const Company = require('../models/Company');
const User = require('../models/User');

const USER_ID = process.env.USER_ID;

exports.buyShares = async (req, res) => {
  try {
    const { symbol, quantity, buyDate } = req.body;
    const userId = USER_ID;
    const parsedQuantity = parseInt(quantity);

    // Get user and check balance
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    const companyData = await Company.findOne({
      symbol,
      date: { $lte: new Date(buyDate) }
    }).sort({ date: -1 }).limit(1);

    if (!companyData) {
      console.log('No company data found for:', symbol, buyDate);
      return res.status(404).json({ error: 'No price data found for this date' });
    }

    const totalCost = companyData.closing_price * parsedQuantity;
    if (user.balance < totalCost) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Deduct from user balance
    user.balance -= totalCost;
    await user.save();

    // Create trade history with pending status
    const tradeHistory = new TradeHistory({
      symbol,
      company_name: companyData.company_name,
      sector: companyData.sector,
      type: 'BUY',
      status: 'Pending',
      date: new Date(buyDate),
      price: companyData.closing_price,
      quantity: parsedQuantity,
      total: companyData.closing_price * parsedQuantity
    });

    await tradeHistory.save();

    // Update portfolio after 1 minute
    setTimeout(async () => {
      tradeHistory.status = 'Completed';
      await tradeHistory.save();

      // Update or create portfolio entry
      let portfolio = await Portfolio.findOne({ symbol });
      if (!portfolio) {
        portfolio = new Portfolio({
          symbol,
          quantity: parsedQuantity,
          avg_price: companyData.closing_price
        });
      } else {
        const totalQuantity = portfolio.quantity + parsedQuantity;
        const totalCost = (portfolio.avg_price * portfolio.quantity) + (companyData.closing_price * parsedQuantity);
        portfolio.quantity = totalQuantity;
        portfolio.avg_price = totalCost / totalQuantity;
      }
      await portfolio.save();
    }, 60000);

    res.json({ 
      message: 'Buy order placed successfully', 
      tradeId: tradeHistory._id,
      status: 'Pending'
    });

  } catch (error) {
    console.error('Buy shares error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.sellShares = async (req, res) => {
  try {
    const { symbol, quantity, sellDate } = req.body;
    const userId = "679a3497cf47a1fb86c7f84f"; // Hardcoded test user ID
    const parsedQuantity = parseInt(quantity);

    console.log('Sell request:', { symbol, quantity, sellDate, userId });

    // Get user first
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Find portfolio entry
    const portfolio = await Portfolio.findOne({ symbol });
    console.log('Portfolio found:', portfolio);
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Stock not found in portfolio' });
    }

    if (portfolio.quantity < parsedQuantity) {
      return res.status(400).json({ error: 'Insufficient shares to sell' });
    }

    // Get latest company data
    const companyData = await Company.findOne({
      symbol,
      date: { $lte: new Date(sellDate) }
    }).sort({ date: -1 }).limit(1);

    console.log('Company data found:', companyData);

    if (!companyData) {
      return res.status(404).json({ error: 'No price data found for this date' });
    }

    // Create trade with Pending status
    const tradeHistory = new TradeHistory({
      symbol,
      company_name: companyData.company_name,
      sector: companyData.sector,
      type: 'SELL',
      status: 'Pending',
      date: new Date(sellDate),
      price: companyData.closing_price,
      quantity: parsedQuantity,
      total: companyData.closing_price * parsedQuantity,
      pnl: (companyData.closing_price - portfolio.avg_price) * parsedQuantity,
      pnlPercent: ((companyData.closing_price - portfolio.avg_price) / portfolio.avg_price) * 100
    });

    await tradeHistory.save();
    console.log('Trade history created:', tradeHistory);

    // Update portfolio immediately
    portfolio.quantity -= parsedQuantity;
    if (portfolio.quantity === 0) {
      await Portfolio.deleteOne({ symbol });
    } else {
      await portfolio.save();
    }

    // Send initial response
    res.json({ 
      message: 'Sell order placed successfully',
      tradeId: tradeHistory._id,
      status: 'Pending'
    });

    // Update status and balance after 1 minute
    setTimeout(async () => {
      tradeHistory.status = 'Completed';
      await tradeHistory.save();
      
      const saleAmount = companyData.closing_price * parsedQuantity;
      user.balance += saleAmount;
      await user.save();
      
      console.log('Trade completed, balance updated:', user.balance);
    }, 60000);

  } catch (error) {
    console.error('Sell shares error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.find();
    
    // Get company data to include sector information
    const companies = await Company.find({
      symbol: { $in: portfolio.map(p => p.symbol) }
    }).sort({ date: -1 });

    // Transform portfolio data with sector info
    const portfolioData = portfolio.map(holding => {
      const companyInfo = companies.find(c => c.symbol === holding.symbol);
      return {
        ...holding.toObject(),
        sector: companyInfo?.sector || 'Unknown',
        current_price: companyInfo?.closing_price || holding.avg_price,
        total_value: holding.quantity * (companyInfo?.closing_price || holding.avg_price)
      };
    });

    res.json(portfolioData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTradeHistory = async (req, res) => {
  try {
    const { limit } = req.query;
    const query = {};
    
    const history = await TradeHistory.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit) || 0);
      
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDashboardData = async (req, res) => {
  try {
    const { date } = req.query;
    const queryDate = new Date(date);

    const portfolioData = await Portfolio.aggregate([
      {
        $lookup: {
          from: 'companies',
          localField: 'symbol',
          foreignField: 'symbol',
          as: 'companyData'
        }
      },
      {
        $unwind: '$companyData'
      },
      {
        $match: {
          'companyData.date': {
            $lte: queryDate
          }
        }
      }
    ]);

    // Calculate portfolio metrics
    const totalValue = portfolioData.reduce((sum, item) => sum + item.total_value, 0);
    const dailyPnL = portfolioData.reduce((sum, item) => 
      sum + (item.companyData.daily_pnl * item.quantity), 0);
    const dailyPnLPercentage = (dailyPnL / totalValue) * 100;

    res.json({
      totalValue,
      dailyPnL,
      dailyPnLPercentage,
      portfolioData,
      date: queryDate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSectorAllocation = async (req, res) => {
  try {
    const sectorData = await Portfolio.aggregate([
      {
        $lookup: {
          from: 'companies',
          localField: 'symbol',
          foreignField: 'symbol',
          as: 'companyData'
        }
      },
      {
        $unwind: '$companyData'
      },
      {
        $group: {
          _id: '$companyData.sector',
          value: {
            $sum: { $multiply: ['$quantity', '$avg_price'] }
          }
        }
      },
      {
        $project: {
          sector: '$_id',
          value: 1,
          _id: 0
        }
      }
    ]);
    
    res.json(sectorData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPortfolioHistory = async (req, res) => {
  try {
    const trades = await TradeHistory.find().sort('date');
    const companies = await Company.find().sort('date');
    
    // Get last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const dailyValues = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59);

      // Get portfolio snapshot for this date
      const portfolioValue = await Portfolio.aggregate([
        {
          $lookup: {
            from: 'companies',
            localField: 'symbol',
            foreignField: 'symbol',
            pipeline: [
              {
                $match: {
                  date: { $lte: dayEnd }
                }
              },
              { $sort: { date: -1 } },
              { $limit: 1 }
            ],
            as: 'latestPrice'
          }
        },
        { $unwind: '$latestPrice' },
        {
          $group: {
            _id: null,
            value: {
              $sum: { $multiply: ['$quantity', '$latestPrice.closing_price'] }
            }
          }
        }
      ]);

      dailyValues.push({
        date: currentDate.toISOString().split('T')[0],
        value: portfolioValue[0]?.value || 0
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json(dailyValues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};