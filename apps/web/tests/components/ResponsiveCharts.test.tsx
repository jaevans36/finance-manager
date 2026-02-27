import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { lightTheme } from '../../src/styles/theme';
import { PieChartWrapper } from '../../src/components/charts/PieChartWrapper';
import { BarChartWrapper } from '../../src/components/charts/BarChartWrapper';

// Mock window.matchMedia for responsive testing
const createMatchMedia = (width: number) => {
  return (query: string) => ({
    matches: query.includes(`max-width: ${width}px`) || query.includes(`min-width: ${width}px`),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
};

describe('Responsive Chart Tests (T241)', () => {
  const mockPieData = [
    { name: 'Critical', value: 5, color: '#ef4444' },
    { name: 'High', value: 8, color: '#f97316' },
    { name: 'Medium', value: 12, color: '#3b82f6' },
    { name: 'Low', value: 3, color: '#10b981' }
  ];

  const mockBarData = [
    { name: 'Mon', completed: 5, total: 10 },
    { name: 'Tue', completed: 8, total: 12 },
    { name: 'Wed', completed: 3, total: 8 },
    { name: 'Thu', completed: 6, total: 10 },
    { name: 'Fri', completed: 9, total: 15 },
  ];

  beforeEach(() => {
    // Reset viewport size
    global.innerWidth = 1024;
    global.innerHeight = 768;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('PieChart Responsive Behavior', () => {
    it('should render on mobile viewport (320px)', () => {
      global.innerWidth = 320;
      global.matchMedia = createMatchMedia(320) as unknown as typeof window.matchMedia;

      render(
        <ThemeProvider theme={lightTheme}>
          <PieChartWrapper data={mockPieData} />
        </ThemeProvider>
      );

      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveClass('w-full');
    });

    it('should render on tablet viewport (768px)', () => {
      global.innerWidth = 768;
      global.matchMedia = createMatchMedia(768) as unknown as typeof window.matchMedia;

      render(
        <ThemeProvider theme={lightTheme}>
          <PieChartWrapper data={mockPieData} />
        </ThemeProvider>
      );

      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveClass('w-full');
    });

    it('should render on desktop viewport (1920px)', () => {
      global.innerWidth = 1920;
      global.matchMedia = createMatchMedia(1920) as unknown as typeof window.matchMedia;

      render(
        <ThemeProvider theme={lightTheme}>
          <PieChartWrapper data={mockPieData} />
        </ThemeProvider>
      );

      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveClass('w-full');
    });

    it('should maintain aspect ratio on small screens', () => {
      global.innerWidth = 375;
      global.matchMedia = createMatchMedia(375) as unknown as typeof window.matchMedia;

      const { container } = render(
        <ThemeProvider theme={lightTheme}>
          <PieChartWrapper data={mockPieData} height={250} />
        </ThemeProvider>
      );

      const chartContainer = container.firstChild as HTMLElement;
      expect(chartContainer).toHaveStyle({ height: '250px' });
    });

    it('should handle very narrow viewports (280px)', () => {
      global.innerWidth = 280;
      global.matchMedia = createMatchMedia(280) as unknown as typeof window.matchMedia;

      render(
        <ThemeProvider theme={lightTheme}>
          <PieChartWrapper data={mockPieData} />
        </ThemeProvider>
      );

      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
    });

    it('should handle ultra-wide viewports (2560px)', () => {
      global.innerWidth = 2560;
      global.matchMedia = createMatchMedia(2560) as unknown as typeof window.matchMedia;

      render(
        <ThemeProvider theme={lightTheme}>
          <PieChartWrapper data={mockPieData} />
        </ThemeProvider>
      );

      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
    });
  });

  describe('BarChart Responsive Behavior', () => {
    it('should render on mobile viewport (320px)', () => {
      global.innerWidth = 320;
      global.matchMedia = createMatchMedia(320) as unknown as typeof window.matchMedia;

      render(
        <ThemeProvider theme={lightTheme}>
          <BarChartWrapper data={mockBarData} dataKeys={[{ key: 'completed' }, { key: 'total' }]} />
        </ThemeProvider>
      );

      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveClass('w-full');
    });

    it('should render on tablet viewport (768px)', () => {
      global.innerWidth = 768;
      global.matchMedia = createMatchMedia(768) as unknown as typeof window.matchMedia;

      render(
        <ThemeProvider theme={lightTheme}>
          <BarChartWrapper data={mockBarData} dataKeys={[{ key: 'completed' }, { key: 'total' }]} />
        </ThemeProvider>
      );

      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveClass('w-full');
    });

    it('should render on desktop viewport (1920px)', () => {
      global.innerWidth = 1920;
      global.matchMedia = createMatchMedia(1920) as unknown as typeof window.matchMedia;

      render(
        <ThemeProvider theme={lightTheme}>
          <BarChartWrapper data={mockBarData} dataKeys={[{ key: 'completed' }, { key: 'total' }]} />
        </ThemeProvider>
      );

      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveClass('w-full');
    });

    it('should maintain custom height on different viewports', () => {
      const customHeight = 400;
      
      // Test on mobile
      global.innerWidth = 375;
      const { rerender } = render(
        <ThemeProvider theme={lightTheme}>
          <BarChartWrapper data={mockBarData} dataKeys={[{ key: 'completed' }]} height={customHeight} />
        </ThemeProvider>
      );

      let chart = screen.getByRole('img');
      expect(chart).toHaveStyle({ height: `${customHeight}px` });

      // Test on desktop
      global.innerWidth = 1440;
      rerender(
        <ThemeProvider theme={lightTheme}>
          <BarChartWrapper data={mockBarData} dataKeys={[{ key: 'completed' }]} height={customHeight} />
        </ThemeProvider>
      );

      chart = screen.getByRole('img');
      expect(chart).toHaveStyle({ height: `${customHeight}px` });
    });

    it('should handle very narrow viewports with bar chart', () => {
      global.innerWidth = 280;
      global.matchMedia = createMatchMedia(280) as unknown as typeof window.matchMedia;

      render(
        <ThemeProvider theme={lightTheme}>
          <BarChartWrapper data={mockBarData} dataKeys={[{ key: 'completed' }]} />
        </ThemeProvider>
      );

      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
    });
  });

  describe('ResponsiveContainer Behavior', () => {
    it('should use 100% width for pie chart responsive container', () => {
      const { container } = render(
        <ThemeProvider theme={lightTheme}>
          <PieChartWrapper data={mockPieData} />
        </ThemeProvider>
      );

      const chartContainer = container.firstChild as HTMLElement;
      expect(chartContainer).toHaveClass('w-full');
    });

    it('should use 100% width for bar chart responsive container', () => {
      const { container } = render(
        <ThemeProvider theme={lightTheme}>
          <BarChartWrapper data={mockBarData} dataKeys={[{ key: 'completed' }]} />
        </ThemeProvider>
      );

      const chartContainer = container.firstChild as HTMLElement;
      expect(chartContainer).toHaveClass('w-full');
    });

    it('should handle viewport resize simulation', () => {
      global.innerWidth = 1024;
      
      const { rerender } = render(
        <ThemeProvider theme={lightTheme}>
          <PieChartWrapper data={mockPieData} />
        </ThemeProvider>
      );

      let chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();

      // Simulate resize to mobile
      global.innerWidth = 375;
      global.matchMedia = createMatchMedia(375) as unknown as typeof window.matchMedia;
      
      rerender(
        <ThemeProvider theme={lightTheme}>
          <PieChartWrapper data={mockPieData} />
        </ThemeProvider>
      );

      chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
      expect(chart).toHaveClass('w-full');
    });
  });

  describe('Legend Responsive Behavior', () => {
    it('should render legend on desktop', () => {
      global.innerWidth = 1440;
      
      render(
        <ThemeProvider theme={lightTheme}>
          <PieChartWrapper data={mockPieData} showLegend={true} />
        </ThemeProvider>
      );

      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
    });

    it('should hide legend when disabled on any viewport', () => {
      global.innerWidth = 375;
      
      render(
        <ThemeProvider theme={lightTheme}>
          <PieChartWrapper data={mockPieData} showLegend={false} />
        </ThemeProvider>
      );

      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
    });

    it('should render bar chart legend on different viewports', () => {
      const viewports = [320, 768, 1920];

      viewports.forEach(width => {
        global.innerWidth = width;
        global.matchMedia = createMatchMedia(width) as unknown as typeof window.matchMedia;

        const { unmount } = render(
          <ThemeProvider theme={lightTheme}>
            <BarChartWrapper 
              data={mockBarData} 
              dataKeys={[{ key: 'completed' }, { key: 'total' }]}
            />
          </ThemeProvider>
        );

        const chart = screen.getByRole('img');
        expect(chart).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('Data Visualization at Different Scales', () => {
    it('should render small dataset on mobile', () => {
      global.innerWidth = 375;
      const smallData = [{ name: 'A', value: 10 }];

      render(
        <ThemeProvider theme={lightTheme}>
          <PieChartWrapper data={smallData} />
        </ThemeProvider>
      );

      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
    });

    it('should render large dataset on mobile', () => {
      global.innerWidth = 375;
      const largeData = Array.from({ length: 20 }, (_, i) => ({
        name: `Item ${i + 1}`,
        value: Math.random() * 100
      }));

      render(
        <ThemeProvider theme={lightTheme}>
          <PieChartWrapper data={largeData} />
        </ThemeProvider>
      );

      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
    });

    it('should render bar chart with many data points on mobile', () => {
      global.innerWidth = 375;
      const manyBars = Array.from({ length: 30 }, (_, i) => ({
        name: `Day ${i + 1}`,
        value: Math.random() * 100
      }));

      render(
        <ThemeProvider theme={lightTheme}>
          <BarChartWrapper data={manyBars} dataKeys={[{ key: 'value' }]} />
        </ThemeProvider>
      );

      const chart = screen.getByRole('img');
      expect(chart).toBeInTheDocument();
    });
  });

  describe('Accessibility on Different Viewports', () => {
    it('should maintain aria-labels on mobile', () => {
      global.innerWidth = 375;

      render(
        <ThemeProvider theme={lightTheme}>
          <PieChartWrapper 
            data={mockPieData} 
            title="Task Distribution"
            description="Distribution of tasks by priority"
          />
        </ThemeProvider>
      );

      const chart = screen.getByRole('img');
      expect(chart).toHaveAttribute('aria-label');
      expect(chart.getAttribute('aria-label')).toContain('Distribution of tasks by priority');
    });

    it('should maintain keyboard navigation on all viewports', () => {
      const viewports = [320, 768, 1440];

      viewports.forEach(width => {
        global.innerWidth = width;

        const { unmount } = render(
          <ThemeProvider theme={lightTheme}>
            <PieChartWrapper data={mockPieData} />
          </ThemeProvider>
        );

        const chart = screen.getByRole('img');
        expect(chart).toHaveAttribute('tabIndex', '0');
        
        unmount();
      });
    });

    it('should provide accessible bar chart on mobile', () => {
      global.innerWidth = 375;

      render(
        <ThemeProvider theme={lightTheme}>
          <BarChartWrapper 
            data={mockBarData} 
            dataKeys={[{ key: 'completed' }]}
            title="Completion Progress"
          />
        </ThemeProvider>
      );

      const chart = screen.getByRole('img');
      expect(chart).toHaveAttribute('aria-label');
      expect(chart).toHaveAttribute('tabIndex', '0');
    });
  });
});
