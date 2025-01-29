const mongoose = require('mongoose');

const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', new mongoose.Schema({
  symbol: String,
  company_name: String,
  sector: String,
  buy_dates: [Date],
  buy_prices: [Number],
  sell_dates: [Date],
  sell_prices: [Number],
  avg_price: { type: Number, default: 0 },
  quantity: { type: Number, default: 0 },
  invested_value: { type: Number, default: 0 },
  return_value: { type: Number, default: 0 }
}), 'portfolio');

module.exports = Portfolio;