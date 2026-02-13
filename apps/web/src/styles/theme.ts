export interface Theme {
  name: 'light' | 'dark';
  fonts: {
    body: string;
    heading: string;
  };
  colors: {
    // Primary colors
    primary: string;
    primaryHover: string;
    primaryDisabled: string;
    primaryLight: string;

    // Background colors
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;

    // Text colors
    text: string;
    textSecondary: string;
    textDisabled: string;

    // Border colors
    border: string;
    borderHover: string;

    // Status colors
    success: string;
    successBackground: string;
    successText: string;
    error: string;
    errorBackground: string;
    errorText: string;
    warning: string;
    warningBackground: string;
    info: string;
    infoBackground: string;

    // Component specific
    inputBackground: string;
    inputBorder: string;
    inputBorderFocus: string;
    buttonText: string;
    cardBackground: string;
    cardBorder: string;
    shadow: string;
    buttonBackground: string;
    buttonHoverBackground: string;
  };
}

export const lightTheme: Theme = {
  name: 'light',
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  colors: {
    // Primary colors
    primary: '#007bff',
    primaryHover: '#0056b3',
    primaryDisabled: '#cce5ff',
    primaryLight: '#e7f3ff',

    // Background colors
    background: '#ffffff',
    backgroundSecondary: '#f8f9fa',
    backgroundTertiary: '#e9ecef',

    // Text colors
    text: '#212529',
    textSecondary: '#6c757d',
    textDisabled: '#adb5bd',

    // Border colors
    border: '#dee2e6',
    borderHover: '#adb5bd',

    // Status colors
    success: '#28a745',
    successBackground: '#d4edda',
    successText: '#0A5C38',
    error: '#dc3545',
    errorBackground: '#f8d7da',
    errorText: '#9B1C1C',
    warning: '#ffc107',
    warningBackground: '#fff3cd',
    info: '#17a2b8',
    infoBackground: '#d1ecf1',

    // Component specific
    inputBackground: '#ffffff',
    inputBorder: '#ced4da',
    inputBorderFocus: '#80bdff',
    buttonText: '#ffffff',
    cardBackground: '#ffffff',
    cardBorder: '#dee2e6',
    shadow: 'rgba(0, 0, 0, 0.1)',
    buttonBackground: '#007bff',
    buttonHoverBackground: '#0056b3',
  },
};

export const darkTheme: Theme = {
  name: 'dark',
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    heading: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  colors: {
    // Primary colors
    primary: '#4dabf7',
    primaryHover: '#339af0',
    primaryDisabled: '#1c4966',
    primaryLight: '#0c2d48',

    // Background colors
    background: '#1a1a1a',
    backgroundSecondary: '#242424',
    backgroundTertiary: '#2d2d2d',

    // Text colors
    text: '#e9ecef',
    textSecondary: '#adb5bd',
    textDisabled: '#6c757d',

    // Border colors
    border: '#3d3d3d',
    borderHover: '#4d4d4d',

    // Status colors
    success: '#51cf66',
    successBackground: '#2b3930',
    successText: '#4DFFBC',
    error: '#ff6b6b',
    errorBackground: '#3d2b2b',
    errorText: '#FF8A8A',
    warning: '#ffd43b',
    warningBackground: '#3d3a2b',
    info: '#4dabf7',
    infoBackground: '#2b3540',

    // Component specific
    inputBackground: '#2d2d2d',
    inputBorder: '#3d3d3d',
    inputBorderFocus: '#4dabf7',
    buttonText: '#ffffff',
    cardBackground: '#242424',
    cardBorder: '#3d3d3d',
    shadow: 'rgba(0, 0, 0, 0.3)',
    buttonBackground: '#4dabf7',
    buttonHoverBackground: '#339af0',
  },
};
