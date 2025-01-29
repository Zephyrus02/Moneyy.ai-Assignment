import React from 'react';

const StrategyPerformance = ({ strategies, onStrategyClick }) => {
  return (
    <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Top Performing Stocks</h2>
      <div className="grid grid-cols-3 gap-4">
        {strategies.map(strategy => (
          <div 
            key={strategy.id}
            className="p-4 border rounded-lg cursor-pointer hover:border-purple-500"
            onClick={() => onStrategyClick(strategy)}
          >
            <h3 className="font-semibold mb-2">{strategy.name}</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">ROI</span>
                <span className={`font-medium ${strategy.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {strategy.roi.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">CAGR</span>
                <span className="font-medium">{strategy.cagr}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Drawdown</span>
                <span className="font-medium text-red-500">{strategy.drawdown}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Allocation</span>
                <span className="font-medium">{strategy.allocation.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StrategyPerformance;