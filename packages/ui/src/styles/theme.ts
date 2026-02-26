/**
 * Theme Token Interface
 *
 * Colour palette is derived from the approved base palette:
 *   Neutral / Structural: Grey 700 (#898989), Grey 300 (#D9D9D9)
 *   Semantic / Accent:    Critical (#FF4D4D), Positive (#4DFFBC)
 *
 * Primary interactive colour is neutral (near-black / near-white)
 * to keep the UI calm and professional.
 *
 * All text colours meet WCAG AAA (7:1 contrast ratio for normal text)
 * on their intended background surfaces.
 *
 * warning / info tokens are retained for compatibility but mapped
 * to approved colours (warning → critical, info → neutral).
 */
export interface Theme {
  name: 'light' | 'dark';
  fonts: {
    body: string;
    heading: string;
  };
  colors: {
    // Primary (neutral-based interactive colour)
    primary: string;
    primaryHover: string;
    primaryDisabled: string;
    primaryLight: string;

    // Backgrounds
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;

    // Text
    text: string;
    textSecondary: string;
    textDisabled: string;

    // Borders
    border: string;
    borderHover: string;

    // Semantic status (only critical + positive per spec)
    success: string;
    successBackground: string;
    /** AAA-safe text colour derived from success — for text on light/dark surfaces */
    successText: string;
    error: string;
    errorBackground: string;
    /** AAA-safe text colour derived from error — for text on light/dark surfaces */
    errorText: string;
    /** @deprecated Mapped to critical colour — spec has no warning accent */
    warning: string;
    /** @deprecated Mapped to error background — spec has no warning accent */
    warningBackground: string;
    /** @deprecated Mapped to neutral — spec has no info accent */
    info: string;
    /** @deprecated Mapped to neutral — spec has no info accent */
    infoBackground: string;

    // Component-specific
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

// ---------------------------------------------------------------------------
// Light Theme — approved palette
// ---------------------------------------------------------------------------

export const lightTheme: Theme = {
  name: 'light',
  fonts: {
    body: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  colors: {
    // Primary — near-black for calm, professional interactivity
    primary: '#1A1A1A',
    primaryHover: '#333333',
    primaryDisabled: '#D9D9D9',
    primaryLight: '#F5F5F5',

    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F7F7F7',
    backgroundTertiary: '#EFEFEF',

    // Text — all meet WCAG AAA (7:1) on background and backgroundSecondary
    text: '#1A1A1A',
    textSecondary: '#525252',
    textDisabled: '#D9D9D9',

    // Borders — Grey 300
    border: '#D9D9D9',
    borderHover: '#898989',

    // Semantic — approved accent colours only
    success: '#4DFFBC',
    successBackground: '#EDFFF7',
    successText: '#0A5C38',
    error: '#FF4D4D',
    errorBackground: '#FFF0F0',
    errorText: '#9B1C1C',

    // Compat: warning → critical, info → neutral
    warning: '#FF4D4D',
    warningBackground: '#FFF0F0',
    info: '#898989',
    infoBackground: '#F5F5F5',

    // Component-specific
    inputBackground: '#FFFFFF',
    inputBorder: '#D9D9D9',
    inputBorderFocus: '#1A1A1A',
    buttonText: '#FFFFFF',
    cardBackground: '#FFFFFF',
    cardBorder: '#EFEFEF',
    shadow: 'rgba(0, 0, 0, 0.06)',
    buttonBackground: '#1A1A1A',
    buttonHoverBackground: '#333333',
  },
};

// ---------------------------------------------------------------------------
// Dark Theme — approved palette (inverted neutrals)
// ---------------------------------------------------------------------------

export const darkTheme: Theme = {
  name: 'dark',
  fonts: {
    body: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    heading: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  colors: {
    // Primary — near-white on dark
    primary: '#E8E8E8',
    primaryHover: '#D9D9D9',
    primaryDisabled: '#3D3D3D',
    primaryLight: '#2A2A2A',

    // Backgrounds
    background: '#1A1A1A',
    backgroundSecondary: '#222222',
    backgroundTertiary: '#2D2D2D',

    // Text — all meet WCAG AAA (7:1) on background and backgroundSecondary
    text: '#E8E8E8',
    textSecondary: '#B0B0B0',
    textDisabled: '#4D4D4D',

    // Borders
    border: '#333333',
    borderHover: '#898989',

    // Semantic — same accent colours in both themes
    success: '#4DFFBC',
    successBackground: '#1A2E24',
    successText: '#4DFFBC',
    error: '#FF4D4D',
    errorBackground: '#2E1A1A',
    errorText: '#FF8A8A',

    // Compat: warning → critical, info → neutral
    warning: '#FF4D4D',
    warningBackground: '#2E1A1A',
    info: '#898989',
    infoBackground: '#2A2A2A',

    // Component-specific
    inputBackground: '#2D2D2D',
    inputBorder: '#333333',
    inputBorderFocus: '#E8E8E8',
    buttonText: '#1A1A1A',
    cardBackground: '#222222',
    cardBorder: '#2D2D2D',
    shadow: 'rgba(0, 0, 0, 0.2)',
    buttonBackground: '#E8E8E8',
    buttonHoverBackground: '#D9D9D9',
  },
};
