import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export interface ShortcutRegistration {
  key: string;       // e.g. 'n', 'g+t', '?'
  description: string;
  group: string;
  handler: (e: KeyboardEvent) => void;
}

interface ShortcutContextValue {
  register: (shortcut: ShortcutRegistration) => () => void;
  shortcuts: ShortcutRegistration[];
  cheatSheetOpen: boolean;
  setCheatSheetOpen: (open: boolean) => void;
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

export function useShortcutContext() {
  const ctx = useContext(ShortcutContext);
  if (!ctx) throw new Error('useShortcutContext must be used within KeyboardShortcutProvider');
  return ctx;
}

export function KeyboardShortcutProvider({ children }: { children: React.ReactNode }) {
  const [shortcuts, setShortcuts] = useState<ShortcutRegistration[]>([]);
  const [cheatSheetOpen, setCheatSheetOpen] = useState(false);
  const chordPending = useRef<string | null>(null);
  const chordTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const register = useCallback((shortcut: ShortcutRegistration) => {
    setShortcuts(prev => [...prev, shortcut]);
    return () => setShortcuts(prev => prev.filter(s => s !== shortcut));
  }, []);

  useEffect(() => {
    const isInputFocused = () => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el as HTMLElement).isContentEditable;
    };

    const handle = (e: KeyboardEvent) => {
      // Always allow Escape
      if (e.key === 'Escape') {
        shortcuts.find(s => s.key === 'Escape')?.handler(e);
        return;
      }
      if (isInputFocused()) return;

      const key = e.key.toLowerCase();

      // Chord completion
      if (chordPending.current) {
        if (chordTimeout.current) clearTimeout(chordTimeout.current);
        const chordKey = `${chordPending.current}+${key}`;
        chordPending.current = null;
        const match = shortcuts.find(s => s.key === chordKey);
        if (match) {
          e.preventDefault();
          match.handler(e);
        }
        return; // suppress all other handlers during chord resolution
      }

      // Check if this key starts a chord
      const isChordStart = shortcuts.some(s => s.key.startsWith(`${key}+`));
      if (isChordStart) {
        e.preventDefault();
        chordPending.current = key;
        chordTimeout.current = setTimeout(() => { chordPending.current = null; }, 500);
        return;
      }

      // Regular shortcut
      const match = shortcuts.find(s => s.key === key || s.key === e.key);
      if (match) {
        e.preventDefault();
        match.handler(e);
      }
    };

    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [shortcuts]);

  return (
    <ShortcutContext.Provider value={{ register, shortcuts, cheatSheetOpen, setCheatSheetOpen }}>
      {children}
    </ShortcutContext.Provider>
  );
}
