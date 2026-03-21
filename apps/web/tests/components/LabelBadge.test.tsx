import { render, screen } from '@testing-library/react';
import { LabelBadge } from '../../src/components/labels/LabelBadge';

describe('LabelBadge', () => {
  it('renders label name', () => {
    render(<LabelBadge label={{ id: '1', name: 'Work', colourHex: '#21B8A4' }} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('applies the label colour as background', () => {
    const { container } = render(<LabelBadge label={{ id: '1', name: 'Work', colourHex: '#21B8A4' }} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.style.backgroundColor).toBe('rgb(33, 184, 164)');
  });
});
