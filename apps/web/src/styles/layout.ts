import { css } from 'styled-components';

/**
 * Border Radius System
 * Maximum of 2 design values per spec, plus `full` utility for pills/circles.
 */
export const borderRadius = {
  /** Small elements — buttons, inputs, badges */
  sm: '6px',
  /** Large elements — cards, modals, containers */
  lg: '12px',
  /** Pill / circular shapes (utility) */
  full: '9999px',
} as const;

/**
 * Shadow / Elevation System
 * Minimal: one level for modals/overlays only. Everything else: no shadow.
 */
export const shadows = {
  /** Modals, overlays, dropdowns — the only permitted elevation */
  elevated: '0 4px 16px rgba(0, 0, 0, 0.08)',
} as const;

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

/**
 * Responsive breakpoints
 */
const breakpoints = {
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
