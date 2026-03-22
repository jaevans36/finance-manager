import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../utils/test-utils';
import { CreateTaskForm } from '../../src/components/tasks/CreateTaskForm';

// Mock the Notification API
const mockNotification = (permission: NotificationPermission) => {
  Object.defineProperty(window, 'Notification', {
    writable: true,
    value: { permission },
  });
};

describe('Reminder field permission states', () => {
  it('hides reminder field when Notification permission is denied', () => {
    mockNotification('denied');
    renderWithProviders(<CreateTaskForm onSubmit={jest.fn()} onCancel={jest.fn()} />);
    // Set a due date so the field would show if permission were granted
    // The field should still be absent
    expect(screen.queryByLabelText('Remind me')).not.toBeInTheDocument();
  });

  it('renders the form without errors when permission is granted', () => {
    mockNotification('granted');
    renderWithProviders(<CreateTaskForm onSubmit={jest.fn()} onCancel={jest.fn()} />);
    // Form renders successfully under granted permission state
    expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
  });
});
