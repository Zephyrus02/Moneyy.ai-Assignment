import React from 'react';
import { PieChart as RechartsPie, Pie, Cell, Tooltip, Legend } from 'recharts';

const PieChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <RechartsPie width={500} height={500}>
      <Pie
        data={data}
        cx={250}
        cy={180}  // Moved up to make room for legend
        innerRadius={80}
        outerRadius={120}
        fill="#8884d8"
        paddingAngle={5}
        dataKey="value"
        nameKey="name"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip 
        formatter={(value) => `$${value.toLocaleString()}`}
        labelStyle={{ color: '#666' }}
      />
      <Legend 
        layout="horizontal"
        align="center"
        verticalAlign="bottom"
        iconType="circle"
        wrapperStyle={{
          paddingTop: '40px',
          paddingLeft: '20px',
          fontSize: '14px',
          fontWeight: 500,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center'
        }}
        formatter={(value, entry) => value}
        itemsPerRow={3}
      />
    </RechartsPie>
  );
};

export default PieChart;