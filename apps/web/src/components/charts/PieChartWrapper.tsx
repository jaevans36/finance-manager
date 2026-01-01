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
  title?: string;
  description?: string;
}

const ChartContainer = styled.div<{ height: number }>`
  width: 100%;
  height: ${props => props.height}px;
  min-height: ${props => props.height}px;
`;

export const PieChartWrapper: React.FC<PieChartWrapperProps> = ({ 
  data, 
  showLegend = true,
  height = 250,
  title = 'Pie Chart',
  description,
}) => {
  const COLORS = data.map(item => item.color || chartColors.primary);
  const ariaLabel = description || `${title} showing distribution of ${data.map(d => d.name).join(', ')}`;

  return (
    <ChartContainer height={height} role="img" aria-label={ariaLabel} tabIndex={0}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart aria-label={ariaLabel}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill={chartColors.primary}
            dataKey="value"
            aria-label="Pie chart data"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]}
                aria-label={`${entry.name}: ${entry.value}`}
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              background: chartColors.tooltipBackground,
              border: `1px solid ${chartColors.border}`,
              borderRadius: '4px',
            }}
          />
          {showLegend && <Legend wrapperStyle={{ paddingTop: '10px' }} />}
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
