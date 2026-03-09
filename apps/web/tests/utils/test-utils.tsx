/**
 * Shared test render utilities.
 *
 * Provides a `renderWithProviders` helper that wraps components in the same
 * provider stack used by the real application (ThemeProvider, BrowserRouter,
 * ToastProvider).  All component tests should use this instead of bare
 * `render()` to ensure theme context and CSS tokens are available.
 *
 * Usage:
 *   import { renderWithProviders } from '../utils/test-utils';
 *   renderWithProviders(<MyComponent />);
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { ThemeProvider } from '@life-manager/ui';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../../src/contexts/ToastContext';

interface ProviderOptions {
  /** Include BrowserRouter — default true */
  withRouter?: boolean;
  /** Include ToastProvider — default true */
  withToast?: boolean;
}

/**
 * Render a React element wrapped in test providers.
 *
 * By default wraps with ThemeProvider, BrowserRouter and ToastProvider.
 * Pass options to disable individual providers if needed.
 */
export const renderWithProviders = (
  ui: ReactElement,
  { withRouter = true, withToast = true, ...renderOptions }: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
): RenderResult => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    let wrapped = (
      <ThemeProvider>
        {children}
      </ThemeProvider>
    );

    if (withToast) {
      wrapped = (
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      );
    }

    if (withRouter) {
      wrapped = (
        <BrowserRouter>
          {wrapped}
        </BrowserRouter>
      );
    }

    return wrapped;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything from @testing-library/react for convenience
export * from '@testing-library/react';
// Override render with our custom version
export { renderWithProviders as render };
