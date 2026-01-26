import { css } from 'styled-components';

/**
 * Spacing System
 * Consistent spacing values used across the application
 * Based on 4px scale for better visual rhythm
 */

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '40px',
  '5xl': '48px',
} as const;

/**
 * Border Radius System
 */
export const borderRadius = {
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

/**
 * Transition Presets
 */
export const transitions = {
  fast: 'all 0.2s ease',
  normal: 'all 0.3s ease',
  slow: 'all 0.5s ease',
} as const;

/**
 * Reusable CSS Mixins
 */

export const flexCenter = css`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const flexBetween = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const truncateText = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const truncateMultiline = (lines: number) => css`
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: ${lines};
  -webkit-box-orient: vertical;
`;

export const scrollbar = css`
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.textSecondary};
  }
`;

/**
 * Responsive breakpoints
 */
export const breakpoints = {
  mobile: '600px',
  tablet: '768px',
  desktop: '968px',
  wide: '1200px',
} as const;

export const mediaQueries = {
  mobile: `@media (max-width: ${breakpoints.mobile})`,
  tablet: `@media (max-width: ${breakpoints.tablet})`,
  desktop: `@media (max-width: ${breakpoints.desktop})`,
  wide: `@media (max-width: ${breakpoints.wide})`,
} as const;
