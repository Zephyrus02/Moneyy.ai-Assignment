import axios from 'axios';

// Update your api.js to export the api instance
export const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? '/api' 
    : 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add new method to api.js
export const getCompanyAnalytics = async () => {
  try {
    const response = await api.get('/strategy-analytics');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCompanyData = async (params) => {
  try {
    const response = await api.get('/company-data', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPortfolioData = async () => {
  try {
    const portfolioResponse = await api.get('/portfolio');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Get current prices for all symbols
    const symbols = portfolioResponse.data.map(item => item.symbol);
    const pricesResponse = await api.get('/company-data', {
      params: {
        symbols: symbols.join(','),
        startDate: yesterday,
        endDate: today
      }
    });

    // Transform and calculate metrics
    const transformedData = portfolioResponse.data.map(holding => {
      const todayPrice = pricesResponse.data.find(
        price => price.symbol === holding.symbol && 
        new Date(price.date).toISOString().split('T')[0] === today
      )?.closing_price || holding.avg_price;

      const yesterdayPrice = pricesResponse.data.find(
        price => price.symbol === holding.symbol && 
        new Date(price.date).toISOString().split('T')[0] === yesterday
      )?.closing_price || todayPrice;

      const currentValue = holding.quantity * todayPrice;
      const investedValue = holding.quantity * holding.avg_price;
      const dailyChange = ((todayPrice - yesterdayPrice) / yesterdayPrice) * 100;
      const totalReturn = ((currentValue - investedValue) / investedValue) * 100;

      return {
        ...holding,
        currentPrice: todayPrice,
        value: currentValue,
        dailyChange,
        totalReturn
      };
    });

    return transformedData;
  } catch (error) {
    throw error;
  }
};

export const buyShares = async (params) => {
  try {
    const { symbol, quantity, buyDate } = params;
    const response = await api.post('/buy', null, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const sellShares = async ({ symbol, quantity, sellDate }) => {
  try {
    const response = await api.post('/sell', {
      symbol,
      quantity: parseInt(quantity),
      sellDate
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
};

export const getTradeHistory = async () => {
  try {
    const response = await api.get('/trade-history');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDashboardData = async (date) => {
  try {
    const response = await api.get('/dashboard', { 
      params: { date: date.toISOString() }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRecentTrades = async (limit = 3) => {
  try {
    const response = await api.get('/trade-history', { 
      params: { limit }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSectorAllocation = async () => {
  try {
    const response = await api.get('/sector-allocation');
    return response.data;
  } catch (error) {
    throw error;
  }
};