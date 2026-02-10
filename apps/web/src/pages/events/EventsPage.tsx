import { useState, useEffect, useCallback } from 'react';
import { eventService } from '../../services/eventService';
import { taskGroupService } from '../../services/taskGroupService';
import { PageLayout } from '../../components/layout/PageLayout';
import { Button } from '@finance-manager/ui';
import { EventList } from '../../components/events/EventList';
import { EventForm } from '../../components/events/EventForm';
import { Plus, Filter, Calendar } from 'lucide-react';
import styled from 'styled-components';
import { borderRadius, mediaQueries } from '@finance-manager/ui/styles';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../../types/event';
import type { TaskGroup } from '../../types/taskGroup';

const Actions = styled.div`
  display: flex;
  gap: 12px;

  ${mediaQueries.tablet} {
    flex-direction: column;
  }
`;

const FilterSection = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.xl};
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
  border-radius: ${borderRadius.lg};
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
  border-radius: ${borderRadius.lg};
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

  > svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  button {
    margin-top: 8px;
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
  const [events, setEvents] = useState<Event[]>([]);
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      
      if (startDateFilter) params.startDate = startDateFilter;
      if (endDateFilter) params.endDate = endDateFilter;
      if (groupFilter) params.groupId = groupFilter;

      const data = await eventService.getEvents(params);
      setEvents(data);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  }, [startDateFilter, endDateFilter, groupFilter]);

  useEffect(() => {
    loadEvents();
    loadGroups();
  }, [loadEvents]);

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
      await eventService.createEvent(data);
      await loadEvents();
      setShowForm(false);
    } catch (err) {
      console.error('Error creating event:', err);
      throw err;
    }
  };

  const handleUpdateEvent = async (id: string, data: UpdateEventRequest) => {
    try {
      await eventService.updateEvent(id, data);
      await loadEvents();
      setEditingEvent(undefined);
    } catch (err) {
      console.error('Error updating event:', err);
      throw err;
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await eventService.deleteEvent(id);
      await loadEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingEvent(undefined);
  };

  const clearFilters = () => {
    setStartDateFilter('');
    setEndDateFilter('');
    setGroupFilter('');
  };

  const hasActiveFilters = startDateFilter || endDateFilter || groupFilter;

  return (
    <PageLayout 
      title="Events"
      subtitle="Manage your scheduled events and appointments"
      loading={loading}
      headerActions={
        <Actions>
          <Button
            size="small"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            size="small"
            onClick={() => {
              setEditingEvent(undefined);
              setShowForm(true);
            }}
          >
            <Plus size={16} />
            New Event
          </Button>
        </Actions>
      }
    >

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
                <Button size="small" variant="outline" onClick={clearFilters}>
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
            size="small"
            onClick={() => {
              setEditingEvent(undefined);
              setShowForm(true);
            }}
          >
            <Plus size={16} />
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
    </PageLayout>
  );
};

export default EventsPage;
