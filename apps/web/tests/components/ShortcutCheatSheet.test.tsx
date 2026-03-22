import { render, screen } from '@testing-library/react';
import { ShortcutCheatSheet } from '../../src/components/shortcuts/ShortcutCheatSheet';
import { KeyboardShortcutProvider } from '../../src/providers/KeyboardShortcutProvider';

describe('ShortcutCheatSheet', () => {
  it('renders when open', () => {
    render(
      <KeyboardShortcutProvider>
        <ShortcutCheatSheet open={true} onClose={jest.fn()} />
      </KeyboardShortcutProvider>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Keyboard shortcuts')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <KeyboardShortcutProvider>
        <ShortcutCheatSheet open={false} onClose={jest.fn()} />
      </KeyboardShortcutProvider>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
