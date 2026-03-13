import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders as render } from '../utils/test-utils';
import { TaskAssignmentBadge } from '../../src/features/tasks/components/TaskAssignmentBadge';

describe('TaskAssignmentBadge', () => {
  it('renders "Assigned to" chip for owner view', () => {
    render(
      <TaskAssignmentBadge
        isOwner={true}
        assignedToUsername="alice"
        assignedByUsername={null}
      />,
    );
    expect(screen.getByText(/Assigned to @alice/)).toBeInTheDocument();
  });

  it('renders "From" chip for assignee view', () => {
    render(
      <TaskAssignmentBadge
        isOwner={false}
        assignedToUsername={null}
        assignedByUsername="bob"
      />,
    );
    expect(screen.getByText(/From @bob/)).toBeInTheDocument();
  });

  it('renders nothing when no assignment', () => {
    const { container } = render(
      <TaskAssignmentBadge
        isOwner={true}
        assignedToUsername={null}
        assignedByUsername={null}
      />,
      { withToast: false },
    );
    expect(container.firstChild).toBeNull();
  });

  it('owner chip has muted styling', () => {
    render(
      <TaskAssignmentBadge
        isOwner={true}
        assignedToUsername="alice"
        assignedByUsername={null}
      />,
    );
    const chip = screen.getByTitle('Assigned to @alice');
    expect(chip).toHaveClass('bg-muted');
  });

  it('assignee chip has accent styling', () => {
    render(
      <TaskAssignmentBadge
        isOwner={false}
        assignedToUsername={null}
        assignedByUsername="bob"
      />,
    );
    const chip = screen.getByTitle('Assigned by @bob');
    expect(chip).toHaveClass('text-primary');
  });
});
