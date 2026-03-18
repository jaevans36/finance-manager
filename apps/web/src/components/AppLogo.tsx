interface AppLogoProps {
  size?: number;
  className?: string;
}

/**
 * Life Manager brand mark — a 2×2 priority grid.
 *
 * The four squares use staggered opacity to mirror the Eisenhower matrix:
 *   top-left  = solid (urgent + important)
 *   top-right = 60%   (not urgent + important)
 *   btm-left  = 30%   (urgent + not important)
 *   btm-right = outline only (not urgent + not important)
 *
 * Fill uses the CSS custom property `--brand` so it adapts to light/dark mode.
 */
export function AppLogo({ size = 24, className }: AppLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Top-left — solid, highest priority */}
      <rect
        x="1" y="1" width="10" height="10" rx="2"
        style={{ fill: 'hsl(var(--brand))' }}
      />
      {/* Top-right — important, not urgent */}
      <rect
        x="13" y="1" width="10" height="10" rx="2"
        style={{ fill: 'hsl(var(--brand))', opacity: 0.55 }}
      />
      {/* Bottom-left — urgent, not important */}
      <rect
        x="1" y="13" width="10" height="10" rx="2"
        style={{ fill: 'hsl(var(--brand))', opacity: 0.28 }}
      />
      {/* Bottom-right — outline only, lowest priority */}
      <rect
        x="13" y="13" width="10" height="10" rx="2"
        style={{ stroke: 'hsl(var(--brand))', strokeWidth: 1.5 }}
      />
    </svg>
  );
}
