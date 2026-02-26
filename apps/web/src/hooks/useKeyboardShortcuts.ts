import { useEffect, useRef } from 'react';

interface KeyboardShortcuts {
  [key: string]: (event: KeyboardEvent) => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts, dependencies: unknown[] = []) => {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      const isInputField = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Allow '/' shortcut even in input fields if it's meant to focus search
      const isSlashShortcut = event.key === '/';
      
      if (isInputField && !isSlashShortcut) {
        // Allow Escape in input fields
        if (event.key === 'Escape' && shortcutsRef.current['Escape']) {
          shortcutsRef.current['Escape'](event);
        }
        return;
      }

      const key = event.key.toLowerCase();
      const handler = shortcutsRef.current[key] || shortcutsRef.current[event.key];

      if (handler) {
        event.preventDefault();
        handler(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, dependencies);
};
