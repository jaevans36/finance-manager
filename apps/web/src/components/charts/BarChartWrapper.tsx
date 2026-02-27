import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
  title?: string;
  description?: string;
}

export const BarChartWrapper = ({ 
  data, 
  dataKeys,
  height = 300,
  xAxisKey = 'name',
  title = 'Bar Chart',
  description,
}: BarChartWrapperProps) => {
  const ariaLabel = description || `${title} showing data distribution across categories`;
  
  return (
    <div className="w-full" style={{ height, minHeight: height }} role="img" aria-label={ariaLabel} tabIndex={0}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart 
          data={data} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          aria-label={ariaLabel}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridLines} />
          <XAxis 
            dataKey={xAxisKey} 
            style={{ fontSize: 12 }} 
            aria-label="X Axis"
          />
          <YAxis 
            style={{ fontSize: 12 }} 
            aria-label="Y Axis"
          />
          <Tooltip 
            contentStyle={{
              background: chartColors.tooltipBackground,
              border: `1px solid ${chartColors.border}`,
              borderRadius: '4px',
            }}
            cursor={{ fill: chartColors.tooltipCursor }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          {dataKeys.map((item) => (
            <Bar 
              key={item.key}
              dataKey={item.key} 
              fill={item.color || chartColors.primary}
              name={item.name || item.key}
              aria-label={`${item.name || item.key} data series`}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};
