import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { toast as sonnerToast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * ToastProvider — wraps your app and provides toast functionality via Sonner.
 *
 * Maintains backward-compatible API surface (`showToast`, `success`, `error`,
 * `warning`, `info`) so existing consumers work without changes.
 */
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const showToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const opts = duration ? { duration } : undefined;
    switch (type) {
      case 'success':
        sonnerToast.success(message, opts);
        break;
      case 'error':
        sonnerToast.error(message, opts);
        break;
      case 'warning':
        sonnerToast.warning(message, opts);
        break;
      case 'info':
        sonnerToast.info(message, opts);
        break;
    }
  }, []);

  const success = useCallback(
    (message: string, duration?: number) => showToast('success', message, duration),
    [showToast],
  );
  const error = useCallback(
    (message: string, duration?: number) => showToast('error', message, duration),
    [showToast],
  );
  const warning = useCallback(
    (message: string, duration?: number) => showToast('warning', message, duration),
    [showToast],
  );
  const info = useCallback(
    (message: string, duration?: number) => showToast('info', message, duration),
    [showToast],
  );

  const value = useMemo(
    () => ({ showToast, success, error, warning, info }),
    [showToast, success, error, warning, info],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
