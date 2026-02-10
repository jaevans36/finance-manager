import { lightTheme, darkTheme } from '../../styles/theme';

export const getChartColors = (isDark: boolean) => {
  const theme = isDark ? darkTheme : lightTheme;
  return {
    primary: theme.colors.success,
    secondary: theme.colors.error,
    urgent: theme.colors.error,
    warning: theme.colors.warning,
    info: theme.colors.info,

    // Priority colours
    critical: theme.colors.error,
    high: theme.colors.warning,
    medium: theme.colors.warning,
    low: theme.colors.success,

    // Chart background
    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
    gridLines: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',

    // Tooltip
    tooltipBackground: theme.colors.cardBackground,
    tooltipCursor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    border: theme.colors.border,

    // Text
    text: theme.colors.text,
    textLight: theme.colors.textSecondary,
  };
};

/** @deprecated Use getChartColors(isDark) instead for theme-aware colours */
export const chartColors = {
  primary: '#4CAF50',
  secondary: '#fa4f4fff',
  urgent: '#f44336',
  warning: '#FF9800',
  info: '#2196F3',
  critical: '#d32f2f',
  high: '#f57c00',
  medium: '#fbc02d',
  low: '#388e3c',
  background: 'rgba(255, 255, 255, 0.05)',
  gridLines: 'rgba(0, 0, 0, 0.1)',
  tooltipBackground: '#ffffff',
  tooltipCursor: 'rgba(0, 0, 0, 0.05)',
  border: 'rgba(0, 0, 0, 0.1)',
  text: '#333',
  textLight: '#666',
};

export const chartTheme = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSize: 12,
  fontWeight: 400,
};
