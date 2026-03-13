import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders as render } from '../utils/test-utils';
import { EventShareBadge } from '../../src/features/events/components/EventShareBadge';

describe('EventShareBadge', () => {
  it('renders "Shared" when shareCount > 0', () => {
    render(<EventShareBadge shareCount={3} />);
    expect(screen.getByText('Shared')).toBeInTheDocument();
  });

  it('renders nothing when shareCount is 0', () => {
    const { container } = render(<EventShareBadge shareCount={0} />, { withToast: false });
    expect(container.firstChild).toBeNull();
  });

  it('shows correct title for single share', () => {
    render(<EventShareBadge shareCount={1} />);
    expect(screen.getByTitle('Shared with 1 person')).toBeInTheDocument();
  });

  it('shows correct title for multiple shares', () => {
    render(<EventShareBadge shareCount={4} />);
    expect(screen.getByTitle('Shared with 4 people')).toBeInTheDocument();
  });
});
