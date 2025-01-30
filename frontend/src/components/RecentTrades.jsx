import React from 'react';

const RecentTrades = ({ trades }) => {
  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Recent Trades</h2>
      <div className="space-y-4">
        {trades.map(trade => (
          <div key={trade.id} className="flex justify-between items-center p-4 rounded-lg bg-gray-50">
            <div>
              <div className="font-medium">{trade.symbol}</div>
              <div className="text-sm text-gray-500">{trade.date}</div>
            </div>
            <div className="text-right">
              <div className="font-medium">${trade.price.toFixed(2)}</div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(trade.type)}`}>
                {trade.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTrades;