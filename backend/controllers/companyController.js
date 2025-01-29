const mongoose = require('mongoose');
const Company = require('../models/Company');

exports.getCompanyData = async (req, res) => {
  try {
    const { startDate, endDate, symbol } = req.query;
    
    const query = {};
    if (symbol) query.symbol = symbol;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const data = await Company.find(query).sort({ date: 1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPortfolioPerformance = async (req, res) => {
  try {
    const performance = await Company.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalValue: { $sum: "$closing_price" },
          totalPnL: { $sum: "$daily_pnl" },
          volumeTraded: { $sum: "$volume_traded" },
          totalMarketCap: { $sum: "$market_cap" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStrategyAnalytics = async (req, res) => {
  try {
    const analytics = await Company.aggregate([
      {
        $group: {
          _id: "$symbol",
          companyName: { $first: "$company_name" },
          sector: { $first: "$sector" },
          avgPrice: { $avg: "$closing_price" },
          totalVolume: { $sum: "$volume_traded" },
          avgPnL: { $avg: "$daily_pnl" }
        }
      }
    ]);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};