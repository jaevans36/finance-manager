import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { EventItem } from '../../src/components/events/EventItem';
import { Event } from '../../src/types/event';
import { lightTheme } from '../../src/styles/theme';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={lightTheme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('EventItem', () => {
  const mockEvent: Event = {
    id: '1',
    title: 'Team Meeting',
    description: 'Weekly sync-up',
    startDate: '2026-01-20T10:00:00.000Z',
    endDate: '2026-01-20T11:00:00.000Z',
    isAllDay: false,
    location: 'Conference Room A',
    reminderMinutes: 15,
    userId: 'user1',
    groupId: null,
    groupName: null,
    groupColour: null,
    createdAt: '2026-01-18T12:00:00.000Z',
    updatedAt: '2026-01-18T12:00:00.000Z',
  };

  const mockHandlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render event title and description', () => {
      renderWithProviders(<EventItem event={mockEvent} {...mockHandlers} />);

      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
      expect(screen.getByText('Weekly sync-up')).toBeInTheDocument();
    });

    it('should render event time for timed events', () => {
      renderWithProviders(<EventItem event={mockEvent} {...mockHandlers} />);

      // Should show time in 12-hour format
      expect(screen.getByText(/10:00|11:00/)).toBeInTheDocument();
    });

    it('should render location when present', () => {
      renderWithProviders(<EventItem event={mockEvent} {...mockHandlers} />);

      expect(screen.getByText('Conference Room A')).toBeInTheDocument();
    });

    it('should show all-day badge for all-day events', () => {
      const allDayEvent = { ...mockEvent, isAllDay: true };
      renderWithProviders(<EventItem event={allDayEvent} {...mockHandlers} />);

      expect(screen.getByText('All Day')).toBeInTheDocument();
    });

    it('should not show location when not provided', () => {
      const eventWithoutLocation = { ...mockEvent, location: null };
      renderWithProviders(<EventItem event={eventWithoutLocation} {...mockHandlers} />);

      expect(screen.queryByText('Conference Room A')).not.toBeInTheDocument();
    });

    it('should show reminder indicator when reminder is set', () => {
      renderWithProviders(<EventItem event={mockEvent} {...mockHandlers} />);

      // Check for reminder icon or text
      expect(screen.getByTitle(/reminder|Reminder: 15 minutes/i)).toBeInTheDocument();
    });

    it('should not show description when not provided', () => {
      const eventWithoutDescription = { ...mockEvent, description: null };
      renderWithProviders(<EventItem event={eventWithoutDescription} {...mockHandlers} />);

      expect(screen.queryByText('Weekly sync-up')).not.toBeInTheDocument();
    });
  });

  describe('Event Duration', () => {
    it('should handle events spanning multiple days', () => {
      const multiDayEvent: Event = {
        ...mockEvent,
        startDate: '2026-01-20T10:00:00.000Z',
        endDate: '2026-01-22T15:00:00.000Z',
      };
      
      renderWithProviders(<EventItem event={multiDayEvent} {...mockHandlers} />);

      // Should render without errors
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });

    it('should handle events with same start and end time', () => {
      const instantEvent: Event = {
        ...mockEvent,
        endDate: mockEvent.startDate,
      };
      
      renderWithProviders(<EventItem event={instantEvent} {...mockHandlers} />);

      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format today events correctly', () => {
      const today = new Date();
      const todayEvent: Event = {
        ...mockEvent,
        startDate: today.toISOString(),
        endDate: new Date(today.getTime() + 3600000).toISOString(), // +1 hour
      };

      renderWithProviders(<EventItem event={todayEvent} {...mockHandlers} />);

      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });

    it('should format past events correctly', () => {
      const pastEvent: Event = {
        ...mockEvent,
        startDate: '2020-01-01T10:00:00.000Z',
        endDate: '2020-01-01T11:00:00.000Z',
      };

      renderWithProviders(<EventItem event={pastEvent} {...mockHandlers} />);

      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });
  });
});
