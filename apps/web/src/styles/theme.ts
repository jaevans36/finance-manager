export interface Theme {
  name: 'light' | 'dark';
  colors: {
    // Primary colors
    primary: string;
    primaryHover: string;
    primaryDisabled: string;

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
    error: string;
    errorBackground: string;
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
  };
}

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    // Primary colors
    primary: '#007bff',
    primaryHover: '#0056b3',
    primaryDisabled: '#cce5ff',

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
    error: '#dc3545',
    errorBackground: '#f8d7da',
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
  },
};

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    // Primary colors
    primary: '#4dabf7',
    primaryHover: '#339af0',
    primaryDisabled: '#1c4966',

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
    error: '#ff6b6b',
    errorBackground: '#3d2b2b',
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
  },
};
