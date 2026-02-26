import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { EventList } from '../../src/components/events/EventList';
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

describe('EventList', () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: 'Today Event',
      description: 'Happening now',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 36000_00).toISOString(), // +1 hour
      isAllDay: false,
      location: null,
      reminderMinutes: null,
      userId: 'user1',
      groupId: null,
      groupName: null,
      groupColour: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Tomorrow Event',
      description: 'Coming soon',
      startDate: new Date(Date.now() + 86400000).toISOString(), // +1 day
      endDate: new Date(Date.now() + 86400000 + 3600000).toISOString(),
      isAllDay: false,
      location: 'Office',
      reminderMinutes: 30,
      userId: 'user1',
      groupId: null,
      groupName: null,
      groupColour: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      title: 'Past Event',
      description: 'Already happened',
      startDate: new Date(Date.now() - 86400000).toISOString(), // -1 day
      endDate: new Date(Date.now() - 86400000 + 3600000).toISOString(),
      isAllDay: false,
      location: null,
      reminderMinutes: null,
      userId: 'user1',
      groupId: null,
      groupName: null,
      groupColour: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockHandlers = {
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all events', () => {
      renderWithProviders(<EventList events={mockEvents} {...mockHandlers} />);

      expect(screen.getByText('Today Event')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow Event')).toBeInTheDocument();
      expect(screen.getByText('Past Event')).toBeInTheDocument();
    });

    it('should show empty state when no events', () => {
      renderWithProviders(<EventList events={[]} {...mockHandlers} />);

      expect(screen.getByText(/no events/i)).toBeInTheDocument();
    });

    it('should group events by time period', () => {
      renderWithProviders(<EventList events={mockEvents} {...mockHandlers} />);

      // Check for section headers
      expect(screen.getByText(/today/i)).toBeInTheDocument();
      expect(screen.getByText(/tomorrow|upcoming/i)).toBeInTheDocument();
      expect(screen.getByText(/past/i)).toBeInTheDocument();
    });
  });

  describe('Event Grouping', () => {
    it('should group today events correctly', () => {
      const todayEvents: Event[] = [
        { ...mockEvents[0], id: '1', title: 'Event 1' },
        { ...mockEvents[0], id: '2', title: 'Event 2' },
      ];

      renderWithProviders(<EventList events={todayEvents} {...mockHandlers} />);

      expect(screen.getByText('Event 1')).toBeInTheDocument();
      expect(screen.getByText('Event 2')).toBeInTheDocument();
      expect(screen.getByText(/today/i)).toBeInTheDocument();
    });

    it('should group this week events correctly', () => {
      const thisWeekEvent: Event = {
        ...mockEvents[0],
        id: '4',
        title: 'This Week Event',
        startDate: new Date(Date.now() + 172800000).toISOString(), // +2 days
        endDate: new Date(Date.now() + 172800000 + 3600000).toISOString(),
      };

      renderWithProviders(<EventList events={[thisWeekEvent]} {...mockHandlers} />);

      expect(screen.getByText('This Week Event')).toBeInTheDocument();
    });

    it('should separate past events', () => {
      renderWithProviders(<EventList events={[mockEvents[2]]} {...mockHandlers} />);

      expect(screen.getByText('Past Event')).toBeInTheDocument();
      expect(screen.getByText(/past/i)).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort upcoming events by start date ascending', () => {
      const unsortedEvents: Event[] = [
        {
          ...mockEvents[0],
          id: '1',
          title: 'Later Event',
          startDate: new Date(Date.now() + 7200000).toISOString(), // +2 hours
          endDate: new Date(Date.now() + 10800000).toISOString(),
        },
        {
          ...mockEvents[0],
          id: '2',
          title: 'Earlier Event',
          startDate: new Date(Date.now() + 3600000).toISOString(), // +1 hour
          endDate: new Date(Date.now() + 7200000).toISOString(),
        },
      ];

      renderWithProviders(<EventList events={unsortedEvents} {...mockHandlers} />);

      const eventElements = screen.getAllByRole('article');
      expect(eventElements[0]).toHaveTextContent('Earlier Event');
      expect(eventElements[1]).toHaveTextContent('Later Event');
    });

    it('should sort past events by start date descending', () => {
      const pastEvents: Event[] = [
        {
          ...mockEvents[2],
          id: '1',
          title: 'Older Event',
          startDate: new Date(Date.now() - 172800000).toISOString(), // -2 days
          endDate: new Date(Date.now() - 172800000 + 3600000).toISOString(),
        },
        {
          ...mockEvents[2],
          id: '2',
          title: 'Recent Event',
          startDate: new Date(Date.now() - 86400000).toISOString(), // -1 day
          endDate: new Date(Date.now() - 86400000 + 3600000).toISOString(),
        },
      ];

      renderWithProviders(<EventList events={pastEvents} {...mockHandlers} />);

      const eventElements = screen.getAllByRole('article');
      expect(eventElements[0]).toHaveTextContent('Recent Event');
      expect(eventElements[1]).toHaveTextContent('Older Event');
    });
  });

  describe('All-Day Events', () => {
    it('should handle all-day events correctly', () => {
      const allDayEvent: Event = {
        ...mockEvents[0],
        id: '1',
        title: 'All Day Event',
        isAllDay: true,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
      };

      renderWithProviders(<EventList events={[allDayEvent]} {...mockHandlers} />);

      expect(screen.getByText('All Day Event')).toBeInTheDocument();
      expect(screen.getByText('All Day')).toBeInTheDocument();
    });

    it('should mix all-day and timed events correctly', () => {
      const mixedEvents: Event[] = [
        { ...mockEvents[0], id: '1', title: 'Timed Event' },
        { ...mockEvents[0], id: '2', title: 'All Day Event', isAllDay: true },
      ];

      renderWithProviders(<EventList events={mixedEvents} {...mockHandlers} />);

      expect(screen.getByText('Timed Event')).toBeInTheDocument();
      expect(screen.getByText('All Day Event')).toBeInTheDocument();
    });
  });
});
