import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import CalendarPage from '../../src/pages/calendar/CalendarPage';
import { ToastProvider } from '../../src/contexts/ToastContext';
import { lightTheme } from '../../src/styles/theme';
import { taskService } from '../../src/services/taskService';
import { eventService } from '../../src/services/eventService';
import type { Task } from '../../src/services/taskService';

// Mock the taskService
jest.mock('../../src/services/taskService', () => ({
  taskService: {
    getTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    toggleTask: jest.fn(),
    deleteTask: jest.fn(),
  },
}));

// Mock the eventService
jest.mock('../../src/services/eventService', () => ({
  eventService: {
    getEvents: jest.fn(),
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn(),
  },
}));

// Mock react-calendar
jest.mock('react-calendar', () => {
  return function MockCalendar({ onChange, tileContent }: { onChange: (date: Date) => void; tileContent?: (props: { date: Date }) => React.ReactNode }) {
    const midMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 15);
    return (
      <div data-testid="mock-calendar">
        <button onClick={() => onChange(midMonth)}>Select Day 15</button>
        <div data-testid="tile-content-mid-month">
          {tileContent && tileContent({ date: midMonth })}
        </div>
      </div>
    );
  };
});

// Helper to get dates in the current month for testing
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();
const midMonthDate = new Date(currentYear, currentMonth, 15).toISOString().slice(0, 10);
const lateMonthDate = new Date(currentYear, currentMonth, 20).toISOString().slice(0, 10);

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'High Priority Task',
    description: 'Important task',
    priority: 'High',
    completed: false,
    dueDate: midMonthDate,
    userId: 'user1',
    groupId: 'group1',
    groupName: 'Work',
    groupColour: '#3b82f6',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    completedAt: null,
  },
  {
    id: '2',
    title: 'Medium Priority Task',
    description: 'Normal task',
    priority: 'Medium',
    completed: false,
    dueDate: midMonthDate,
    userId: 'user1',
    groupId: 'group2',
    groupName: 'Personal',
    groupColour: '#10b981',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    completedAt: null,
  },
  {
    id: '3',
    title: 'Critical Priority Task',
    description: 'Urgent task',
    priority: 'Critical',
    completed: false,
    dueDate: lateMonthDate,
    userId: 'user1',
    groupId: 'group1',
    groupName: 'Work',
    groupColour: '#3b82f6',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    completedAt: null,
  },
];

const renderCalendarPage = () => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={lightTheme}>
        <ToastProvider>
          <CalendarPage />
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('CalendarPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (taskService.getTasks as jest.Mock).mockResolvedValue(mockTasks);
    (eventService.getEvents as jest.Mock).mockResolvedValue([]);
  });

  describe('Rendering', () => {
    it('should render page heading', async () => {
      renderCalendarPage();
      
      await waitFor(() => {
        expect(screen.getByText('Task Calendar')).toBeInTheDocument();
      });
    });

    it('should render calendar component', async () => {
      renderCalendarPage();
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-calendar')).toBeInTheDocument();
      });
    });

    it('should render filter controls', async () => {
      renderCalendarPage();
      
      await waitFor(() => {
        expect(screen.getByLabelText('Group:')).toBeInTheDocument();
        expect(screen.getByText('Priority:')).toBeInTheDocument();
      });
    });

    it('should render priority filter buttons', async () => {
      renderCalendarPage();
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Critical' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'High' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Low' })).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading message initially', () => {
      renderCalendarPage();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should hide loading message after tasks load', async () => {
      renderCalendarPage();
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when task loading fails', async () => {
      (taskService.getTasks as jest.Mock).mockRejectedValue(new Error('Failed to load'));
      
      renderCalendarPage();
      
      await waitFor(() => {
        // Error appears in PageLayout + toast notification
        const errors = screen.getAllByText('Failed to load calendar data');
        expect(errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Task Badge Display', () => {
    it('should display task count badge for days with tasks', async () => {
      renderCalendarPage();
      
      await waitFor(() => {
        const tileContent = screen.getByTestId('tile-content-mid-month');
        expect(tileContent).toHaveTextContent('2'); // 2 tasks on Jan 15
      });
    });
  });

  describe('Filtering', () => {
    it('should filter tasks by group when group is selected', async () => {
      renderCalendarPage();
      
      await waitFor(() => {
        expect(screen.getByLabelText('Group:')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('Group:') as HTMLSelectElement, { target: { value: 'group1' } });

      await waitFor(() => {
        const tileContent = screen.getByTestId('tile-content-mid-month');
        expect(tileContent).toHaveTextContent('1'); // Only 1 Work task on Jan 15
      });
    });

    it('should filter tasks by priority when priority button is clicked', async () => {
      renderCalendarPage();
      
      await waitFor(() => {
        const highButton = screen.getByRole('button', { name: 'High' });
        fireEvent.click(highButton);
      });

      await waitFor(() => {
        const tileContent = screen.getByTestId('tile-content-mid-month');
        expect(tileContent).toHaveTextContent('1'); // Only 1 High priority task
      });
    });

    it('should show clear filters button when filters are active', async () => {
      renderCalendarPage();
      
      await waitFor(() => {
        const highButton = screen.getByRole('button', { name: 'High' });
        fireEvent.click(highButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Clear Filters')).toBeInTheDocument();
      });
    });

    it('should clear all filters when clear button is clicked', async () => {
      renderCalendarPage();
      
      // Apply filters
      await waitFor(() => {
        const highButton = screen.getByRole('button', { name: 'High' });
        fireEvent.click(highButton);
      });

      // Clear filters
      await waitFor(() => {
        const clearButton = screen.getByText('Clear Filters');
        fireEvent.click(clearButton);
      });

      // Check task count is back to all tasks
      await waitFor(() => {
        const tileContent = screen.getByTestId('tile-content-mid-month');
        expect(tileContent).toHaveTextContent('2'); // Back to 2 tasks
      });
    });
  });

  describe('Task Count Summary', () => {
    it('should display correct task count for the month', async () => {
      renderCalendarPage();
      
      await waitFor(() => {
        // CalendarFilters renders: "3 tasks • 0 events"
        expect(screen.getByText(/3 tasks/)).toBeInTheDocument();
      });
    });

    it('should update task count when filters are applied', async () => {
      renderCalendarPage();
      
      await waitFor(() => {
        const highButton = screen.getByRole('button', { name: 'High' });
        fireEvent.click(highButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/1 tasks/)).toBeInTheDocument();
      });
    });
  });

  describe('Group Extraction', () => {
    it('should extract unique groups from tasks', async () => {
      renderCalendarPage();
      
      await waitFor(() => {
        const groupSelect = screen.getByLabelText('Group:') as HTMLSelectElement;
        const options = Array.from(groupSelect.options).map(opt => opt.text);
        
        expect(options).toContain('Work');
        expect(options).toContain('Personal');
      });
    });

    it('should include "All Groups" option', async () => {
      renderCalendarPage();
      
      await waitFor(() => {
        const groupSelect = screen.getByLabelText('Group:') as HTMLSelectElement;
        const options = Array.from(groupSelect.options).map(opt => opt.text);
        
        expect(options).toContain('All Groups');
      });
    });
  });
});
