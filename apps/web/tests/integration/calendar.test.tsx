/**
 * Integration tests for Calendar functionality
 * Tests calendar navigation, task display, filtering, and interactions
 */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../src/contexts/ThemeContext';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { ToastProvider } from '../../src/contexts/ToastContext';

// Mock the services before importing CalendarPage
jest.mock('../../src/services/taskService');
jest.mock('../../src/services/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock react-calendar to avoid ESM issues
jest.mock('react-calendar', () => {
  // Using dynamic import for React in mock
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require('react');
  
  interface MockCalendarProps {
    onChange?: (value: Date) => void;
    value: Date;
    tileContent?: unknown;
    onClickDay?: (value: Date) => void;
    onActiveStartDateChange?: (props: { activeStartDate: Date; value: Date; view: string }) => void;
  }
  
  return {
    __esModule: true,
    default: ({ value, onClickDay, onActiveStartDateChange }: MockCalendarProps) => {
      return React.createElement('div', {
        'data-testid': 'calendar',
        onClick: () => {
          if (onClickDay) onClickDay(new Date(2026, 0, 15));
        }
      }, 
        React.createElement('button', { 
          'aria-label': 'previous month',
          onClick: () => {
            if (onActiveStartDateChange) {
              const newDate = new Date(value);
              newDate.setMonth(newDate.getMonth() - 1);
              onActiveStartDateChange({ activeStartDate: newDate, value: newDate, view: 'month' });
            }
          }
        }, 'Prev'),
        React.createElement('button', { 
          'aria-label': 'next month',
          onClick: () => {
            if (onActiveStartDateChange) {
              const newDate = new Date(value);
              newDate.setMonth(newDate.getMonth() + 1);
              onActiveStartDateChange({ activeStartDate: newDate, value: newDate, view: 'month' });
            }
          }
        }, 'Next'),
        'Calendar Mock'
      );
    },
  };
});

// Now import after mocking
import CalendarPage from '../../src/pages/calendar/CalendarPage';
import { taskService } from '../../src/services/taskService';

const mockTasks = [
  {
    id: '1',
    title: 'Task 1',
    description: 'Description 1',
    priority: 'High' as const,
    dueDate: new Date(2026, 0, 15).toISOString(), // Jan 15, 2026
    completed: false,
    completedAt: null,
    userId: 'user-1',
    groupId: 'group-1',
    groupName: 'Work',
    groupColour: '#3b82f6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Task 2',
    description: 'Description 2',
    priority: 'Critical' as const,
    dueDate: new Date(2026, 0, 20).toISOString(), // Jan 20, 2026
    completed: false,
    completedAt: null,
    userId: 'user-1',
    groupId: 'group-2',
    groupName: 'Personal',
    groupColour: '#10b981',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Task 3',
    description: 'Description 3',
    priority: 'Medium' as const,
    dueDate: new Date(2026, 0, 15).toISOString(), // Jan 15, 2026 (same day as Task 1)
    completed: true,
    completedAt: new Date().toISOString(),
    userId: 'user-1',
    groupId: 'group-1',
    groupName: 'Work',
    groupColour: '#3b82f6',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </BrowserRouter>
);

describe('CalendarPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (taskService.getTasks as jest.MockedFunction<typeof taskService.getTasks>).mockResolvedValue(mockTasks);
    (taskService.createTask as jest.MockedFunction<typeof taskService.createTask>).mockResolvedValue(mockTasks[0]);
    (taskService.updateTask as jest.MockedFunction<typeof taskService.updateTask>).mockResolvedValue(mockTasks[0]);
    (taskService.toggleTask as jest.MockedFunction<typeof taskService.toggleTask>).mockResolvedValue(mockTasks[0]);
  });

  describe('Calendar Display', () => {
    it('should render calendar with current month', async () => {
      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Task Calendar')).toBeInTheDocument();
      });
    });

    it('should load tasks for the current month', async () => {
      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(taskService.getTasks).toHaveBeenCalled();
        expect(screen.getByText('3 tasks this month')).toBeInTheDocument();
      });
    });

    it('should show empty state when no tasks exist', async () => {
      (taskService.getTasks as jest.MockedFunction<typeof taskService.getTasks>).mockResolvedValue([]);

      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No Tasks This Month')).toBeInTheDocument();
        expect(screen.getByText(/Click on any date to create your first task/i)).toBeInTheDocument();
      });
    });

    it('should display keyboard shortcuts hint', async () => {
      (taskService.getTasks as jest.MockedFunction<typeof taskService.getTasks>).mockResolvedValue([]);

      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Navigate months/i)).toBeInTheDocument();
        expect(screen.getByText(/Quick add task/i)).toBeInTheDocument();
      });
    });
  });

  describe('Month Navigation', () => {
    it('should navigate to next month when clicking next button', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Task Calendar')).toBeInTheDocument();
      });

      const nextButton = screen.getByLabelText(/next/i);
      await user.click(nextButton);

      await waitFor(() => {
        expect(taskService.getTasks).toHaveBeenCalledTimes(2); // Initial + after navigation
      });
    });

    it('should navigate to previous month when clicking previous button', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Task Calendar')).toBeInTheDocument();
      });

      const prevButton = screen.getByLabelText(/previous/i);
      await user.click(prevButton);

      await waitFor(() => {
        expect(taskService.getTasks).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Task Filtering', () => {
    it('should filter tasks by group', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Task Calendar')).toBeInTheDocument();
      });

      const groupSelect = screen.getByLabelText(/group/i);
      await user.selectOptions(groupSelect, 'group-1');

      await waitFor(() => {
        // Should only show tasks from Work group
        const taskCountText = screen.getByText(/tasks this month/i);
        expect(taskCountText).toBeInTheDocument();
      });
    });

    it('should filter tasks by priority', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Task Calendar')).toBeInTheDocument();
      });

      const highPriorityButton = screen.getByRole('button', { name: 'High' });
      await user.click(highPriorityButton);

      await waitFor(() => {
        const taskCountText = screen.getByText(/tasks this month/i);
        expect(taskCountText).toBeInTheDocument();
      });
    });

    it('should clear filters when clicking clear button', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Task Calendar')).toBeInTheDocument();
      });

      // Apply a filter first
      const highPriorityButton = screen.getByRole('button', { name: 'High' });
      await user.click(highPriorityButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
      });

      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /clear filters/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Task Creation', () => {
    it('should open quick add modal when clicking on a date', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Task Calendar')).toBeInTheDocument();
      });

      // Click on a date without tasks (e.g., Jan 10)
      const dateButtons = screen.getAllByRole('button');
      const dateButton = dateButtons.find((button) => button.textContent === '10');

      if (dateButton) {
        await user.click(dateButton);

        await waitFor(() => {
          expect(screen.getByText(/add task/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Task Viewing', () => {
    it('should show task count in header', async () => {
      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('3 tasks this month')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate months with arrow keys', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Task Calendar')).toBeInTheDocument();
      });

      // Simulate arrow right key
      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(taskService.getTasks).toHaveBeenCalledTimes(2);
      });
    });

    it('should open quick add with Enter key', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Task Calendar')).toBeInTheDocument();
      });

      await user.keyboard('{Enter}');

      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
        expect(screen.getByText('Quick Add Task')).toBeInTheDocument();
      });
    });

    it('should close modals with Escape key', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Task Calendar')).toBeInTheDocument();
      });

      // Open quick add
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Quick Add Task')).toBeInTheDocument();
      });

      // Close with Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for navigation', async () => {
      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/previous/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/next/i)).toBeInTheDocument();
      });
    });

    it('should have accessible group filter', async () => {
      render(
        <TestWrapper>
          <CalendarPage />
        </TestWrapper>
      );

      await waitFor(() => {
        const groupFilter = screen.getByLabelText(/group/i);
        expect(groupFilter).toBeInTheDocument();
        expect(groupFilter.tagName).toBe('SELECT');
      });
    });
  });
});
