const mongoose = require('mongoose');

const tradeHistorySchema = new mongoose.Schema({
  symbol: String,
  company_name: String,
  sector: String,
  status: {
    type: String,
    enum: ['buy', 'sell']
  },
  date: Date,
  price: Number,
  quantity: Number
}, { timestamps: true });

module.exports = mongoose.model('TradeHistory', tradeHistorySchema, 'trade_history');