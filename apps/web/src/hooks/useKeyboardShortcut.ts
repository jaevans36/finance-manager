import { useEffect, useRef } from 'react';
import { useShortcutContext, type ShortcutRegistration } from '../providers/KeyboardShortcutProvider';

export function useKeyboardShortcut(shortcut: ShortcutRegistration) {
  const { register } = useShortcutContext();

  // Store the latest handler in a ref so the registered closure never goes stale,
  // even when the handler captures component state that changes on re-render.
  const handlerRef = useRef(shortcut.handler);
  useEffect(() => { handlerRef.current = shortcut.handler; });

  useEffect(
    () => register({ ...shortcut, handler: (e) => handlerRef.current(e) }),
    [shortcut.key], // eslint-disable-line react-hooks/exhaustive-deps
    // Only re-register when the key changes. The handler stays fresh via handlerRef.
  );
}
