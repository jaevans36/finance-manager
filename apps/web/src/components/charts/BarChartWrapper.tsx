import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styled from 'styled-components';
import { chartColors } from './chartTheme';

interface BarChartData {
  name: string;
  [key: string]: string | number;
}

interface BarChartWrapperProps {
  data: BarChartData[];
  dataKeys: { key: string; color?: string; name?: string }[];
  height?: number;
  xAxisKey?: string;
}

const ChartContainer = styled.div<{ height: number }>`
  width: 100%;
  height: ${props => props.height}px;
  min-height: ${props => props.height}px;
`;

export const BarChartWrapper: React.FC<BarChartWrapperProps> = ({ 
  data, 
  dataKeys,
  height = 300,
  xAxisKey = 'name'
}) => {
  return (
    <ChartContainer height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridLines} />
          <XAxis dataKey={xAxisKey} style={{ fontSize: 12 }} />
          <YAxis style={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {dataKeys.map((item, index) => (
            <Bar 
              key={item.key}
              dataKey={item.key} 
              fill={item.color || chartColors.primary}
              name={item.name || item.key}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
