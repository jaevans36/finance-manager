import { render, fireEvent, screen } from '@testing-library/react';
import { KeyboardShortcutProvider } from '../../src/providers/KeyboardShortcutProvider';
import { useKeyboardShortcut } from '../../src/hooks/useKeyboardShortcut';

function TestComponent({ onN }: { onN: () => void }) {
  useKeyboardShortcut({ key: 'n', handler: onN, description: 'New task', group: 'Tasks' });
  return <div>Test</div>;
}

describe('KeyboardShortcutProvider', () => {
  it('fires registered shortcut on keydown', () => {
    const handler = jest.fn();
    render(
      <KeyboardShortcutProvider>
        <TestComponent onN={handler} />
      </KeyboardShortcutProvider>
    );
    fireEvent.keyDown(document, { key: 'n' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not fire when focus is in an input', () => {
    const handler = jest.fn();
    render(
      <KeyboardShortcutProvider>
        <input data-testid="input" />
        <TestComponent onN={handler} />
      </KeyboardShortcutProvider>
    );
    const input = screen.getByTestId('input');
    input.focus();
    fireEvent.keyDown(input, { key: 'n' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('suppresses other handlers while chord is pending', () => {
    const deleteHandler = jest.fn();
    function TestWithChord() {
      useKeyboardShortcut({ key: 'g+d', handler: jest.fn(), description: 'Go Dashboard', group: 'Navigation' });
      useKeyboardShortcut({ key: 'd', handler: deleteHandler, description: 'Delete', group: 'Tasks' });
      return null;
    }
    render(<KeyboardShortcutProvider><TestWithChord /></KeyboardShortcutProvider>);
    fireEvent.keyDown(document, { key: 'g' });
    fireEvent.keyDown(document, { key: 'd' });
    expect(deleteHandler).not.toHaveBeenCalled();
  });
});
