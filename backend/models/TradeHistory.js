const mongoose = require('mongoose');

const tradeHistorySchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true
  },
  company_name: String,
  sector: String,
  type: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true
  },
  status: {
    type: String,
    enum: ['Completed', 'Pending', 'Cancelled'],
    default: 'Pending'
  },
  date: {
    type: Date,
    default: Date.now
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  pnl: {
    type: Number,
    default: 0
  },
  pnlPercent: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('TradeHistory', tradeHistorySchema, 'trade_history');