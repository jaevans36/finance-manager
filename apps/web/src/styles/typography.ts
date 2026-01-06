import { css } from 'styled-components';

/**
 * Typography System
 * Consistent font sizes and styles used across the application
 */

export const typography = {
  // Page and Section Headings
  pageTitle: css`
    font-size: 24px;
    font-weight: 600;
    line-height: 1.2;
  `,
  
  sectionHeading: css`
    font-size: 18px;
    font-weight: 600;
    line-height: 1.3;
  `,
  
  cardTitle: css`
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
  `,
  
  // Body Text
  bodyLarge: css`
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
  `,
  
  body: css`
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
  `,
  
  bodySmall: css`
    font-size: 12px;
    font-weight: 400;
    line-height: 1.5;
  `,
  
  // Special Text
  label: css`
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
  `,
  
  caption: css`
    font-size: 12px;
    font-weight: 400;
    line-height: 1.4;
  `,
  
  badge: css`
    font-size: 11px;
    font-weight: 500;
    line-height: 1;
  `,
  
  // Display Text (for large numbers/stats)
  displayLarge: css`
    font-size: 32px;
    font-weight: 700;
    line-height: 1.2;
  `,
  
  displayMedium: css`
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
  `,
  
  displaySmall: css`
    font-size: 18px;
    font-weight: 600;
    line-height: 1.3;
  `,
};

/**
 * Font Weight Constants
 */
export const fontWeights = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/**
 * Line Height Constants
 */
export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;
