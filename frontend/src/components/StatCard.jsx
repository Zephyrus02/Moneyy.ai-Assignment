import React from 'react';
import useCountUp from '../hooks/useCountUp';

const StatCard = ({ title, value, change, isPercentage }) => {
  const animatedValue = useCountUp(value, 1000, isPercentage ? 1 : 2);
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md">
      <h3 className="text-gray-500 mb-2">{title}</h3>
      <div className="text-2xl font-bold mb-2">
        {isPercentage ? 
          `${animatedValue}%` : 
          `$${animatedValue.toLocaleString()}`
        }
      </div>
      {change && (
        <div className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
        </div>
      )}
    </div>
  );
};

export default StatCard;