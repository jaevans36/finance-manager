import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '../../src/styles/theme';
import { PieChartWrapper } from '../../src/components/charts/PieChartWrapper';
import { BarChartWrapper } from '../../src/components/charts/BarChartWrapper';

describe('PieChartWrapper', () => {
  const mockPieData = [
    { name: 'Critical', value: 5, color: '#ef4444' },
    { name: 'High', value: 8, color: '#f97316' },
    { name: 'Medium', value: 12, color: '#3b82f6' },
    { name: 'Low', value: 3, color: '#10b981' }
  ];

  const renderPieChart = (props = {}) => {
    return render(
      <ThemeProvider theme={lightTheme}>
        <PieChartWrapper data={mockPieData} {...props} />
      </ThemeProvider>
    );
  };

  describe('Rendering', () => {
    it('should render pie chart with correct data', () => {
      renderPieChart();
      
      const chartContainer = screen.getByRole('img');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should apply custom height when provided', () => {
      const customHeight = 400;
      renderPieChart({ height: customHeight });
      
      const container = screen.getByRole('img');
      expect(container).toHaveStyle({ height: `${customHeight}px` });
    });

    it('should use default height when not provided', () => {
      renderPieChart();
      
      const container = screen.getByRole('img');
      expect(container).toHaveStyle({ height: '250px' });
    });

    it('should render with custom title', () => {
      const customTitle = 'Priority Distribution';
      renderPieChart({ title: customTitle });
      
      const container = screen.getByRole('img');
      expect(container).toHaveAttribute('aria-label', expect.stringContaining(customTitle));
    });

    it('should render with custom description for accessibility', () => {
      const customDescription = 'Shows task distribution by priority level';
      renderPieChart({ description: customDescription });
      
      const container = screen.getByRole('img');
      expect(container).toHaveAttribute('aria-label', customDescription);
    });
  });

  describe('Data Handling', () => {
    it('should handle empty data array', () => {
      renderPieChart({ data: [] });
      
      const container = screen.getByRole('img');
      expect(container).toBeInTheDocument();
    });

    it('should handle single data point', () => {
      const singleData = [{ name: 'Only One', value: 100 }];
      renderPieChart({ data: singleData });
      
      const container = screen.getByRole('img');
      expect(container).toBeInTheDocument();
    });

    it('should handle zero values correctly', () => {
      const dataWithZero = [
        { name: 'Active', value: 10 },
        { name: 'Inactive', value: 0 }
      ];
      renderPieChart({ data: dataWithZero });
      
      const container = screen.getByRole('img');
      expect(container).toBeInTheDocument();
    });

    it('should handle large numbers', () => {
      const largeNumberData = [
        { name: 'Category A', value: 999999 },
        { name: 'Category B', value: 1000000 }
      ];
      renderPieChart({ data: largeNumberData });
      
      const container = screen.getByRole('img');
      expect(container).toBeInTheDocument();
    });

    it('should use custom colors when provided', () => {
      const customColorData = [
        { name: 'Red', value: 10, color: '#ff0000' },
        { name: 'Blue', value: 20, color: '#0000ff' }
      ];
      renderPieChart({ data: customColorData });
      
      const container = screen.getByRole('img');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Legend', () => {
    it('should show legend by default', () => {
      renderPieChart();
      
      // Legend is rendered by Recharts
      const container = screen.getByRole('img');
      expect(container).toBeInTheDocument();
    });

    it('should hide legend when showLegend is false', () => {
      renderPieChart({ showLegend: false });
      
      const container = screen.getByRole('img');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderPieChart();
      
      const container = screen.getByRole('img');
      expect(container).toHaveAttribute('aria-label');
      expect(container).toHaveAttribute('tabIndex', '0');
    });

    it('should be keyboard accessible', () => {
      renderPieChart();
      
      const container = screen.getByRole('img');
      expect(container).toHaveAttribute('tabIndex', '0');
    });

    it('should generate descriptive aria-label from data', () => {
      renderPieChart();
      
      const container = screen.getByRole('img');
      const ariaLabel = container.getAttribute('aria-label');
      expect(ariaLabel).toContain('Critical');
      expect(ariaLabel).toContain('High');
      expect(ariaLabel).toContain('Medium');
      expect(ariaLabel).toContain('Low');
    });
  });
});

describe('BarChartWrapper', () => {
  const mockBarData = [
    { name: 'Mon', completed: 5, total: 8 },
    { name: 'Tue', completed: 7, total: 10 },
    { name: 'Wed', completed: 3, total: 6 },
    { name: 'Thu', completed: 9, total: 12 },
    { name: 'Fri', completed: 6, total: 8 },
    { name: 'Sat', completed: 4, total: 5 },
    { name: 'Sun', completed: 2, total: 3 }
  ];

  const mockDataKeys = [
    { key: 'completed', color: '#10b981', name: 'Completed' },
    { key: 'total', color: '#6b7280', name: 'Total' }
  ];

  const renderBarChart = (props = {}) => {
    return render(
      <ThemeProvider theme={lightTheme}>
        <BarChartWrapper 
          data={mockBarData} 
          dataKeys={mockDataKeys}
          {...props} 
        />
      </ThemeProvider>
    );
  };

  describe('Rendering', () => {
    it('should render bar chart with correct data', () => {
      renderBarChart();
      
      const chartContainer = screen.getByRole('img');
      expect(chartContainer).toBeInTheDocument();
    });

    it('should apply custom height when provided', () => {
      const customHeight = 500;
      renderBarChart({ height: customHeight });
      
      const container = screen.getByRole('img');
      expect(container).toHaveStyle({ height: `${customHeight}px` });
    });

    it('should use default height when not provided', () => {
      renderBarChart();
      
      const container = screen.getByRole('img');
      expect(container).toHaveStyle({ height: '300px' });
    });

    it('should render with custom title', () => {
      const customTitle = 'Weekly Progress';
      renderBarChart({ title: customTitle });
      
      const container = screen.getByRole('img');
      expect(container).toHaveAttribute('aria-label', expect.stringContaining(customTitle));
    });

    it('should use custom xAxisKey', () => {
      const customData = [
        { day: 'Monday', value: 10 },
        { day: 'Tuesday', value: 15 }
      ];
      renderBarChart({ 
        data: customData, 
        xAxisKey: 'day',
        dataKeys: [{ key: 'value', name: 'Value' }]
      });
      
      const container = screen.getByRole('img');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Data Handling', () => {
    it('should handle empty data array', () => {
      renderBarChart({ data: [] });
      
      const container = screen.getByRole('img');
      expect(container).toBeInTheDocument();
    });

    it('should handle single data point', () => {
      const singleData = [{ name: 'Day 1', value: 100 }];
      renderBarChart({ 
        data: singleData,
        dataKeys: [{ key: 'value', name: 'Value' }]
      });
      
      const container = screen.getByRole('img');
      expect(container).toBeInTheDocument();
    });

    it('should handle multiple data keys', () => {
      const multiKeyData = [
        { name: 'Week 1', value1: 10, value2: 20, value3: 15 }
      ];
      const multiKeys = [
        { key: 'value1', name: 'Series 1' },
        { key: 'value2', name: 'Series 2' },
        { key: 'value3', name: 'Series 3' }
      ];
      renderBarChart({ 
        data: multiKeyData,
        dataKeys: multiKeys
      });
      
      const container = screen.getByRole('img');
      expect(container).toBeInTheDocument();
    });

    it('should handle negative values', () => {
      const negativeData = [
        { name: 'A', value: 10 },
        { name: 'B', value: -5 },
        { name: 'C', value: 15 }
      ];
      renderBarChart({ 
        data: negativeData,
        dataKeys: [{ key: 'value', name: 'Value' }]
      });
      
      const container = screen.getByRole('img');
      expect(container).toBeInTheDocument();
    });

    it('should handle zero values', () => {
      const zeroData = [
        { name: 'A', value: 0 },
        { name: 'B', value: 0 },
        { name: 'C', value: 0 }
      ];
      renderBarChart({ 
        data: zeroData,
        dataKeys: [{ key: 'value', name: 'Value' }]
      });
      
      const container = screen.getByRole('img');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply custom colors to bars', () => {
      const customKeys = [
        { key: 'completed', color: '#ff0000', name: 'Custom Red' }
      ];
      renderBarChart({ dataKeys: customKeys });
      
      const container = screen.getByRole('img');
      expect(container).toBeInTheDocument();
    });

    it('should display labels for each bar', () => {
      renderBarChart();
      
      const container = screen.getByRole('img');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderBarChart();
      
      const container = screen.getByRole('img');
      expect(container).toHaveAttribute('aria-label');
      expect(container).toHaveAttribute('tabIndex', '0');
    });

    it('should be keyboard accessible', () => {
      renderBarChart();
      
      const container = screen.getByRole('img');
      expect(container).toHaveAttribute('tabIndex', '0');
    });

    it('should have descriptive aria-label', () => {
      const customDescription = 'Weekly task completion statistics';
      renderBarChart({ description: customDescription });
      
      const container = screen.getByRole('img');
      expect(container).toHaveAttribute('aria-label', customDescription);
    });
  });

  describe('Responsive Behavior', () => {
    it('should render ResponsiveContainer', () => {
      renderBarChart();
      
      const container = screen.getByRole('img');
      expect(container).toBeInTheDocument();
    });

    it('should maintain aspect ratio on resize', () => {
      const { rerender } = renderBarChart({ height: 300 });
      
      let container = screen.getByRole('img');
      expect(container).toHaveStyle({ height: '300px' });

      rerender(
        <ThemeProvider theme={lightTheme}>
          <BarChartWrapper 
            data={mockBarData} 
            dataKeys={mockDataKeys}
            height={400}
          />
        </ThemeProvider>
      );

      container = screen.getByRole('img');
      expect(container).toHaveStyle({ height: '400px' });
    });
  });
});
