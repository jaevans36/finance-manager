import { useState, useEffect, useCallback } from 'react';
import { eventService } from '../../services/eventService';
import { taskGroupService } from '../../services/taskGroupService';
import { PageLayout } from '../../components/layout/PageLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { EventList } from '../../components/events/EventList';
import { EventForm } from '../../components/events/EventForm';
import { Plus, Filter, Calendar } from 'lucide-react';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../../types/event';
import type { TaskGroup } from '../../types/taskGroup';

const EventsPage = () => {
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
        <div className="flex gap-3 md:flex-col">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="size-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingEvent(undefined);
              setShowForm(true);
            }}
          >
            <Plus className="size-4" />
            New Event
          </Button>
        </div>
      }
    >

      {showFilters && (
        <div className="mb-6 rounded-lg border border-border bg-secondary p-5">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] items-end gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="start-date" className="text-sm font-semibold">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="end-date" className="text-sm font-semibold">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="group" className="text-sm font-semibold">Group</Label>
              <select
                id="group"
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none"
              >
                <option value="">All Groups</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button size="sm" variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
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
        <div className="px-5 py-[60px] text-center text-muted-foreground">
          <Calendar size={64} strokeWidth={1.5} className="mx-auto mb-4 opacity-50" />
          <h3 className="m-0 mb-2 text-lg font-semibold text-foreground">No events yet</h3>
          <p className="m-0 mb-6 text-sm">
            {hasActiveFilters 
              ? 'No events match your current filters. Try adjusting your filter criteria.'
              : 'Get started by creating your first event to keep track of meetings and appointments.'
            }
          </p>
          <Button
            size="sm"
            onClick={() => {
              setEditingEvent(undefined);
              setShowForm(true);
            }}
          >
            <Plus className="size-4" />
            Create Your First Event
          </Button>
        </div>
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
