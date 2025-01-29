const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  symbol: String,
  company_name: String,
  sector: String,
  date: Date,
  closing_price: Number,
  daily_pnl: Number,
  volume_traded: Number,
  market_cap: Number
});

module.exports = mongoose.model('Company', companySchema, 'companies');