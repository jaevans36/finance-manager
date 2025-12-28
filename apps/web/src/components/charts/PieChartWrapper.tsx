import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import styled from 'styled-components';
import { chartColors } from './chartTheme';

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartWrapperProps {
  data: PieChartData[];
  showLegend?: boolean;
  height?: number;
}

const ChartContainer = styled.div<{ height: number }>`
  width: 100%;
  height: ${props => props.height}px;
  min-height: ${props => props.height}px;
`;

export const PieChartWrapper: React.FC<PieChartWrapperProps> = ({ 
  data, 
  showLegend = true,
  height = 250
}) => {
  const COLORS = data.map(item => item.color || chartColors.primary);

  return (
    <ChartContainer height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill={chartColors.primary}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          {showLegend && <Legend />}
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
