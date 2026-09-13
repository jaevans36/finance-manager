import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders as render } from '../utils/test-utils';
import { SubtaskItem } from '../../src/components/tasks/SubtaskItem';
import { Task } from '../../src/services/taskService';

describe('SubtaskItem', () => {
  const mockSubtask: Task = {
    id: 'sub-1',
    title: 'Buy 4 x E27 candle bulbs',
    description: null,
    priority: 'Medium',
    completed: false,
    dueDate: null,
    userId: 'user1',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
    completedAt: null,
  } as Task;

  const mockHandlers = {
    onToggleComplete: jest.fn(),
    onRename: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render a completion checkbox reflecting the subtask state', () => {
    render(<SubtaskItem subtask={mockSubtask} {...mockHandlers} />);

    const checkbox = screen.getByRole('checkbox', { name: /mark .* as complete/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('should call onToggleComplete with the toggled value when the checkbox is clicked', () => {
    render(<SubtaskItem subtask={mockSubtask} {...mockHandlers} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /mark .* as complete/i }));

    expect(mockHandlers.onToggleComplete).toHaveBeenCalledWith('sub-1', true);
  });

  it('should not call onToggleComplete when clicking the title text', () => {
    render(<SubtaskItem subtask={mockSubtask} {...mockHandlers} />);

    fireEvent.click(screen.getByText('Buy 4 x E27 candle bulbs'));

    expect(mockHandlers.onToggleComplete).not.toHaveBeenCalled();
  });

  it('should not render a bulk-select control when onSelect is not provided', () => {
    render(<SubtaskItem subtask={mockSubtask} {...mockHandlers} />);

    expect(screen.queryByTitle('Select for bulk actions')).not.toBeInTheDocument();
  });

  it('should call onSelect (not onToggleComplete) when the select-for-bulk-actions control is clicked', () => {
    const onSelect = jest.fn();
    render(<SubtaskItem subtask={mockSubtask} {...mockHandlers} onSelect={onSelect} />);

    fireEvent.click(screen.getByTitle('Select for bulk actions'));

    expect(onSelect).toHaveBeenCalledWith('sub-1');
    expect(mockHandlers.onToggleComplete).not.toHaveBeenCalled();
  });
});
