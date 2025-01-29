const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const portfolioController = require('../controllers/portfolioController');

router.get('/company-data', companyController.getCompanyData);
router.get('/portfolio-performance', companyController.getPortfolioPerformance);
router.get('/strategy-analytics', companyController.getStrategyAnalytics);
router.get('/sector-allocation', portfolioController.getSectorAllocation);
router.post('/buy', portfolioController.buyShares);
router.post('/sell', portfolioController.sellShares);
router.get('/portfolio', portfolioController.getPortfolio);
router.get('/trade-history', portfolioController.getTradeHistory);
router.get('/dashboard', portfolioController.getDashboardData);
router.get('/sector-allocation', portfolioController.getSectorAllocation);

module.exports = router;