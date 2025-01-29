import React from 'react';

const RecentTrades = ({ trades }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Recent Trades</h2>
      <div className="space-y-4">
        {trades.map(trade => (
          <div key={trade.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
            <div>
              <span className={`font-semibold ${trade.type === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                {trade.type}
              </span>
              <span className="ml-2 font-medium">{trade.symbol}</span>
            </div>
            <div className="text-right">
              <div className="font-medium">${trade.price.toFixed(2)}</div>
              <div className="text-sm text-gray-500">{trade.amount} shares</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTrades;