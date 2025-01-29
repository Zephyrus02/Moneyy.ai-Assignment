const Portfolio = require('../models/Portfolio');
const TradeHistory = require('../models/TradeHistory');
const Company = require('../models/Company');

exports.buyShares = async (req, res) => {
  try {
    const { symbol, quantity, buyDate } = req.query;
    const parsedQuantity = parseInt(quantity);

    const companyData = await Company.findOne({
      symbol,
      date: new Date(buyDate)
    });

    if (!companyData) {
      return res.status(404).json({ error: 'No price data found for this date' });
    }

    let portfolio = await Portfolio.findOne({ symbol });
    
    if (!portfolio) {
      // First purchase
      const initialTotalValue = companyData.closing_price * parsedQuantity;
      
      portfolio = new Portfolio({
        symbol,
        company_name: companyData.company_name,
        sector: companyData.sector,
        buy_dates: [buyDate],
        buy_prices: [companyData.closing_price],
        sell_dates: [],
        sell_prices: [],
        quantity: parsedQuantity,
        avg_price: companyData.closing_price,
        total_value: initialTotalValue
      });
    } else {
      // Calculate new values
      const newPurchaseCost = parsedQuantity * companyData.closing_price;
      const totalQuantity = portfolio.quantity + parsedQuantity;
      const newAveragePrice = (portfolio.total_value + newPurchaseCost) / totalQuantity;
      const newTotalValue = portfolio.total_value + newPurchaseCost;
      
      // Update portfolio
      portfolio.buy_dates.push(buyDate);
      portfolio.buy_prices.push(companyData.closing_price);
      portfolio.quantity = totalQuantity;
      portfolio.avg_price = Number(newAveragePrice.toFixed(2));
      portfolio.total_value = Number(newTotalValue.toFixed(2));
    }

    await portfolio.save();

    // Record in trade history
    const tradeHistory = new TradeHistory({
      symbol,
      company_name: companyData.company_name,
      sector: companyData.sector,
      status: 'buy',
      date: buyDate,
      price: companyData.closing_price,
      quantity: parsedQuantity
    });

    await tradeHistory.save();

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.sellShares = async (req, res) => {
  try {
    const { symbol, quantity, sellDate } = req.body;

    // Get company data for sell date
    const companyData = await Company.findOne({
      symbol,
      date: new Date(sellDate)
    });

    if (!companyData) {
      return res.status(404).json({ error: 'No price data found for this date' });
    }

    // Update portfolio
    const portfolio = await Portfolio.findOne({ symbol });
    
    if (!portfolio || portfolio.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient shares to sell' });
    }

    portfolio.sell_dates.push(sellDate);
    portfolio.sell_prices.push(companyData.closing_price);
    portfolio.quantity -= parseInt(quantity);
    portfolio.total_value -= companyData.closing_price * quantity;


    // If quantity becomes 0, reset avg_price
    if (portfolio.quantity === 0) {
      portfolio.avg_price = 0;
      portfolio.total_value = 0;
    }

    await portfolio.save();

    // Record in trade history
    const tradeHistory = new TradeHistory({
      symbol,
      company_name: companyData.company_name,
      sector: companyData.sector,
      status: 'sell',
      date: sellDate,
      price: companyData.closing_price,
      quantity
    });

    await tradeHistory.save();

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.find();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Get current prices
    const symbols = portfolio.map(item => item.symbol);
    const prices = await Company.find({
      symbol: { $in: symbols },
      date: {
        $gte: yesterday,
        $lte: today
      }
    }).sort({ date: -1 });

    const portfolioData = portfolio.map(holding => {
      const todayPrice = prices.find(
        price => price.symbol === holding.symbol && 
        new Date(price.date).toISOString().split('T')[0] === today
      )?.closing_price || holding.avg_price;

      const yesterdayPrice = prices.find(
        price => price.symbol === holding.symbol && 
        new Date(price.date).toISOString().split('T')[0] === yesterday
      )?.closing_price || todayPrice;

      return {
        ...holding.toObject(),
        current_price: todayPrice,
        daily_change: ((todayPrice - yesterdayPrice) / yesterdayPrice) * 100,
        total_value: holding.quantity * todayPrice
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
        $group: {
          _id: '$sector',
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
      },
      {
        $match: {
          value: { $gt: 0 }
        }
      }
    ]);
    
    res.json(sectorData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};