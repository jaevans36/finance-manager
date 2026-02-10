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
  '2xl': '16px',
  full: '9999px',
} as const;

/**
 * Shadow / Elevation System
 * Consistent elevation levels used across the application.
 * Each level is defined for both light and dark contexts via theme.colors.shadow.
 */
export const shadows = {
  /** Subtle lift — cards, inputs on focus */
  sm: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
  /** Default card elevation */
  md: '0 2px 8px rgba(0, 0, 0, 0.1)',
  /** Raised elements — dropdowns, popovers */
  lg: '0 8px 24px rgba(0, 0, 0, 0.12)',
  /** Modals & dialogs */
  xl: '0 12px 40px rgba(0, 0, 0, 0.16)',
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

/**
 * Focus ring for keyboard-accessible interactive elements.
 * Uses :focus-visible so the ring only appears on keyboard navigation.
 */
export const focusRing = css`
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
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
