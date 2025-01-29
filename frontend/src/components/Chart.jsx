import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea
} from 'recharts';
import { format } from "date-fns";

const CustomTooltip = ({ active, payload, label, type = "price" }) => {
  if (!active || !payload || !payload.length) return null;

  const date = new Date(label);
  const formattedDate = !isNaN(date.getTime()) 
    ? format(date, 'MMM dd, yyyy')
    : 'Invalid Date';

  return (
    <div className="bg-white p-3 border rounded shadow-sm">
      <p className="text-gray-600">{formattedDate}</p>
      <p className="font-semibold">
        Value: ${payload[0].value.toLocaleString()}
      </p>
      {payload[0].payload.change && (
        <p className={`${payload[0].payload.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          Change: {payload[0].payload.change.toFixed(2)}%
        </p>
      )}
    </div>
  );
};

const Chart = ({ 
  data, 
  height = 400,
  title = "Chart",
  type = "price", // 'price' or 'performance'
  showVolume = false,
  gradientColor = "#8884d8",
  dataKey = "value",
  className = ""
}) => {
  const [left, setLeft] = useState('dataMin');
  const [right, setRight] = useState('dataMax');
  const [refAreaLeft, setRefAreaLeft] = useState('');
  const [refAreaRight, setRefAreaRight] = useState('');

  const zoom = () => {
    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setRefAreaLeft('');
      setRefAreaRight('');
      return;
    }

    // xAxis domain
    if (refAreaLeft > refAreaRight) {
      setLeft(refAreaRight);
      setRight(refAreaLeft);
    } else {
      setLeft(refAreaLeft);
      setRight(refAreaRight);
    }

    setRefAreaLeft('');
    setRefAreaRight('');
  };

  const zoomOut = () => {
    setLeft('dataMin');
    setRight('dataMax');
  };

  return (
    <div className={`bg-white p-6 rounded-xl shadow-sm ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button 
          onClick={zoomOut}
          className="px-3 py-1 text-sm bg-purple-100 text-purple-600 rounded hover:bg-purple-200"
        >
          Reset Zoom
        </button>
      </div>
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 30, bottom: 0 }}
            onMouseDown={e => e && setRefAreaLeft(e.activeLabel)}
            onMouseMove={e => refAreaLeft && e && setRefAreaRight(e.activeLabel)}
            onMouseUp={zoom}
          >
            <defs>
              <linearGradient id={`color${type}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientColor} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={gradientColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date"
              domain={[left, right]}
              tickFormatter={(date) => new Date(date).toLocaleDateString()}
            />
            <YAxis />
            <Tooltip content={<CustomTooltip type={type} />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={gradientColor}
              fill={`url(#color${type})`}
              fillOpacity={0.3}
            />
            {refAreaLeft && refAreaRight ? (
              <ReferenceArea
                x1={refAreaLeft}
                x2={refAreaRight}
                strokeOpacity={0.3}
              />
            ) : null}
            {showVolume && (
              <Area
              type="monotone"
              dataKey="price"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorPrice)"
            />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        Drag to zoom in, click "Reset Zoom" to zoom out
      </p>
    </div>
  );
};

export default Chart;