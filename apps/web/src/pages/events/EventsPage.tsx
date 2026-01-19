import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { eventService } from '../../services/eventService';
import { taskGroupService } from '../../services/taskGroupService';
import { Container, Button, Alert } from '../../components/ui';
import { EventList } from '../../components/events/EventList';
import { EventForm } from '../../components/events/EventForm';
import { Plus, XCircle, Filter, Calendar } from 'lucide-react';
import styled from 'styled-components';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../../types/event';
import type { TaskGroup } from '../../types/taskGroup';

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 24px 0;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FilterSection = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
`;

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  align-items: end;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${({ theme }) => theme.colors.textSecondary};

  svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: ${({ theme }) => theme.colors.text};
  }

  p {
    font-size: 14px;
    margin: 0 0 24px 0;
  }
`;

export const EventsPage = () => {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  useEffect(() => {
    loadEvents();
    loadGroups();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [startDateFilter, endDateFilter, groupFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      
      if (startDateFilter) params.startDate = startDateFilter;
      if (endDateFilter) params.endDate = endDateFilter;
      if (groupFilter) params.groupId = groupFilter;

      const data = await eventService.getEvents(params);
      setEvents(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load events';
      setError(message);
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      const data = await taskGroupService.getGroups();
      setGroups(data);
    } catch (err) {
      console.error('Error loading groups:', err);
    }
  };

  const handleCreateEvent = async (data: CreateEventRequest) => {
    try {
      setError(null);
      await eventService.createEvent(data);
      await loadEvents();
      setShowForm(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create event';
      setError(message);
      throw err;
    }
  };

  const handleUpdateEvent = async (id: string, data: UpdateEventRequest) => {
    try {
      setError(null);
      await eventService.updateEvent(id, data);
      await loadEvents();
      setEditingEvent(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update event';
      setError(message);
      throw err;
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      setError(null);
      await eventService.deleteEvent(id);
      await loadEvents();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete event';
      setError(message);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  const clearFilters = () => {
    setStartDateFilter('');
    setEndDateFilter('');
    setGroupFilter('');
  };

  const hasActiveFilters = startDateFilter || endDateFilter || groupFilter;

  return (
    <Container style={{ padding: '20px', maxWidth: '1200px', width: '80%' }}>
      <PageTitle>Events</PageTitle>

      {error && (
        <Alert variant="error" style={{ marginBottom: '20px' }}>
          <XCircle size={16} />
          <span>{error}</span>
        </Alert>
      )}

      <Header>
        <div>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
            Manage your scheduled events and appointments
          </p>
        </div>
        <Actions>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Filter size={18} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            onClick={() => {
              setEditingEvent(null);
              setShowForm(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            New Event
          </Button>
        </Actions>
      </Header>

      {showFilters && (
        <FilterSection>
          <FilterRow>
            <FilterGroup>
              <FilterLabel htmlFor="start-date">Start Date</FilterLabel>
              <FilterInput
                id="start-date"
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel htmlFor="end-date">End Date</FilterLabel>
              <FilterInput
                id="end-date"
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
              />
            </FilterGroup>
            <FilterGroup>
              <FilterLabel htmlFor="group">Group</FilterLabel>
              <FilterSelect
                id="group"
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
              >
                <option value="">All Groups</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </FilterSelect>
            </FilterGroup>
            {hasActiveFilters && (
              <div style={{ display: 'flex', alignItems: 'end' }}>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </FilterRow>
        </FilterSection>
      )}

      {showForm && (
        <EventForm
          event={editingEvent}
          groups={groups}
          onSubmit={editingEvent 
            ? (data) => handleUpdateEvent(editingEvent.id, data)
            : handleCreateEvent
          }
          onCancel={handleCancelForm}
        />
      )}

      {!loading && events.length === 0 && !showForm && (
        <EmptyState>
          <Calendar size={64} strokeWidth={1.5} />
          <h3>No events yet</h3>
          <p>
            {hasActiveFilters 
              ? 'No events match your current filters. Try adjusting your filter criteria.'
              : 'Get started by creating your first event to keep track of meetings and appointments.'
            }
          </p>
          <Button
            onClick={() => {
              setEditingEvent(null);
              setShowForm(true);
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            Create Your First Event
          </Button>
        </EmptyState>
      )}

      {!showForm && events.length > 0 && (
        <EventList
          events={events}
          isLoading={loading}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </Container>
  );
};

export default EventsPage;
