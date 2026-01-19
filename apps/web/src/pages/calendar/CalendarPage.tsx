import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useToast } from '../../contexts/ToastContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { PageLayout } from '../../components/layout/PageLayout';
import { StyledCalendar, TaskBadge, EventBadge, BadgeContainer } from '../../components/calendar/StyledCalendar';
import { QuickAddTaskModal } from '../../components/calendar/QuickAddTaskModal';
import { DayTaskListModal } from '../../components/calendar/DayTaskListModal';
import { EditTaskModal } from '../../components/tasks/EditTaskModal';
import { EditEventModal } from '../../components/events/EditEventModal';
import { CalendarFilters } from '../../components/calendar/CalendarFilters';
import { CalendarTask } from '../../types/calendar';
import { taskService } from '../../services/taskService';
import { eventService } from '../../services/eventService';
import type { Task } from '../../services/taskService';
import type { Event } from '../../types/event';
import type { TaskGroup } from '../../types/taskGroup';

const CalendarContainer = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textSecondary};

  h3 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
    color: ${({ theme }) => theme.colors.text};
  }

  p {
    font-size: 14px;
    margin-bottom: 16px;
  }
`;

const KeyboardHint = styled.div`
  margin-top: 16px;
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: 6px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};

  kbd {
    display: inline-block;
    padding: 2px 6px;
    margin: 0 2px;
    background: ${({ theme }) => theme.colors.background};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    font-weight: 600;
  }
`;

const CalendarPage = () => {
  const { showToast } = useToast();
  const [value, setValue] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showDayTasks, setShowDayTasks] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [showTasks, setShowTasks] = useState(true);
  const [showEvents, setShowEvents] = useState(true);

  // Keyboard shortcuts: Left/Right arrows for month navigation, Enter to add task, Escape to close modals
  useKeyboardShortcuts({
    'ArrowLeft': () => {
      if (!showQuickAdd && !showDayTasks && !showEditTask && !showEditEvent) {
        const newDate = new Date(value);
        newDate.setMonth(newDate.getMonth() - 1);
        setValue(newDate);
      }
    },
    'ArrowRight': () => {
      if (!showQuickAdd && !showDayTasks && !showEditTask && !showEditEvent) {
        const newDate = new Date(value);
        newDate.setMonth(newDate.getMonth() + 1);
        setValue(newDate);
      }
    },
    'Enter': () => {
      if (!showQuickAdd && !showDayTasks && !showEditTask && !showEditEvent) {
        setSelectedDate(new Date());
        setShowQuickAdd(true);
      }
    },
    'Escape': () => {
      if (showQuickAdd) {
        setShowQuickAdd(false);
        setSelectedDate(null);
      } else if (showDayTasks) {
        setShowDayTasks(false);
        setSelectedDate(null);
      } else if (showEditTask) {
        setShowEditTask(false);
        setSelectedTask(null);
      } else if (showEditEvent) {
        setShowEditEvent(false);
        setSelectedEvent(null);
      }
    }
  }, [showQuickAdd, showDayTasks, showEditTask, showEditEvent, value]);

  // Helper to get month start and end dates
  const getMonthRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Start of month
    const startDate = new Date(year, month, 1);
    
    // End of month (last day)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    return { startDate, endDate };
  };

  useEffect(() => {
    loadTasksAndEventsForMonth(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (tasks.length > 0) {
      loadGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length]);

  const loadTasksAndEventsForMonth = async (monthDate: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      const { startDate, endDate } = getMonthRange(monthDate);
      
      // Fetch tasks and events in parallel
      const [fetchedTasks, fetchedEvents] = await Promise.all([
        taskService.getTasks({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
        eventService.getEvents({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
      ]);
      
      setTasks(fetchedTasks);
      setEvents(fetchedEvents);
    } catch (err: unknown) {
      const message = 'Failed to load calendar data';
      setError(message);
      showToast('error', message);
      console.error('Error loading calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      // Extract unique groups from loaded tasks
      const uniqueGroups = tasks
        .filter((task) => task.groupId && task.groupName)
        .reduce((acc, task) => {
          if (!acc.find((g) => g.id === task.groupId)) {
            acc.push({
              id: task.groupId!,
              name: task.groupName!,
              colour: task.groupColour || '#cccccc',
              isDefault: false,
              taskCount: 0,
              createdAt: '',
              updatedAt: '',
            });
          }
          return acc;
        }, [] as TaskGroup[]);
      setGroups(uniqueGroups);
    } catch (err: unknown) {
      console.error('Error loading groups:', err);
    }
  };

  // Reload groups when tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      loadGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.length]);

  const getFilteredTasks = (): Task[] => {
    return tasks.filter((task) => {
      // Group filter
      if (selectedGroupId && task.groupId !== selectedGroupId) {
        return false;
      }
      // Priority filter
      if (selectedPriorities.length > 0 && !selectedPriorities.includes(task.priority)) {
        return false;
      }
      return true;
    });
  };

  const handleClearFilters = () => {
    setSelectedGroupId('');
    setSelectedPriorities([]);
    setShowTasks(true);
    setShowEvents(true);
  };

  const hasActiveFilters = 
    selectedGroupId !== '' || 
    selectedPriorities.length > 0 || 
    !showTasks || 
    !showEvents;

  const getMonthTaskCount = (): number => {
    const filtered = getFilteredTasks();
    const currentMonth = value.getMonth();
    const currentYear = value.getFullYear();
    return filtered.filter((task) => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
    }).length;
  };

  const getMonthEventCount = (): number => {
    const currentMonth = value.getMonth();
    const currentYear = value.getFullYear();
    return events.filter((event) => {
      const startDate = new Date(event.startDate);
      return startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear;
    }).length;
  };

  const hasMonthContent = (): boolean => {
    return getMonthTaskCount() > 0 || getMonthEventCount() > 0;
  };

  const handleAddTask = async (data: { title: string; priority: string; dueDate: string; groupId?: string }) => {
    try {
      const newTask = await taskService.createTask({
        ...data,
        priority: data.priority as 'Low' | 'Medium' | 'High' | 'Critical'
      });
      setTasks((prev) => [...prev, newTask]);
      showToast('success', 'Task added successfully');
      setShowQuickAdd(false);
      setSelectedDate(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create task';
      showToast('error', message);
      throw err;
    }
  };

  const handleAddEvent = async (data: { title: string; startDate: string; endDate: string; isAllDay?: boolean }) => {
    try {
      const newEvent = await eventService.createEvent(data);
      setEvents((prev) => [...prev, newEvent]);
      showToast('success', 'Event added successfully');
      setShowQuickAdd(false);
      setSelectedDate(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create event';
      showToast('error', message);
      throw err;
    }
  };

  const handleUpdateTask = async (
    id: string,
    data: {
      title?: string;
      description?: string;
      priority?: 'Low' | 'Medium' | 'High' | 'Critical';
      dueDate?: string;
    }
  ) => {
    try {
      const updatedTask = await taskService.updateTask(id, data);
      setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)));
      showToast('success', 'Task updated successfully');
      setShowEditTask(false);
      setSelectedTask(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update task';
      showToast('error', message);
      throw err;
    }
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, completed, isCompleted: completed } : task))
    );

    try {
      await taskService.toggleTask(taskId, completed);
      showToast('success', completed ? 'Task completed' : 'Task reopened');
    } catch (err: unknown) {
      // Revert on error
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, completed: !completed, isCompleted: !completed } : task))
      );
      const message = err instanceof Error ? err.message : 'Failed to update task';
      showToast('error', message);
      throw err;
    }
  };

  const handleDayClick = (date: Date) => {
    const dayTasks = getTasksForDate(date);
    setSelectedDate(date);

    if (dayTasks.length > 0) {
      setShowDayTasks(true);
    } else {
      setShowQuickAdd(true);
    }
  };

  const handleBadgeClick = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation();
    setSelectedDate(date);
    setShowDayTasks(true);
  };

  const handleTaskClick = (calendarTask: CalendarTask) => {
    const fullTask = tasks.find((t) => t.id === calendarTask.id);
    if (fullTask) {
      setSelectedTask(fullTask);
      setShowDayTasks(false);
      setShowEditTask(true);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowDayTasks(false);
    setShowEditEvent(true);
  };

  const handleUpdateEvent = (updatedEvent: Event) => {
    setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
    showToast('success', 'Event updated successfully');
    setShowEditEvent(false);
    setSelectedEvent(null);
  };

  const getTasksForDate = (date: Date): CalendarTask[] => {
    const filteredTasks = getFilteredTasks();
    return filteredTasks
      .filter((task) => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return (
          taskDate.getDate() === date.getDate() &&
          taskDate.getMonth() === date.getMonth() &&
          taskDate.getFullYear() === date.getFullYear()
        );
      })
      .map((task) => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate || '',
        isCompleted: task.completed,
        priority: task.priority,
        groupId: task.groupId || undefined,
        groupName: task.groupName || undefined,
        groupColor: task.groupColour || undefined,
      }));
  };

  const getEventsForDate = (date: Date): Event[] => {
    return events.filter((event) => {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      
      // Check if the date falls within the event's date range
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      
      return startDate <= dateEnd && endDate >= dateStart;
    });
  };

  const getTileContent = ({ date }: { date: Date }) => {
    const dayTasks = showTasks ? getTasksForDate(date) : [];
    const dayEvents = showEvents ? getEventsForDate(date) : [];
    
    if (dayTasks.length === 0 && dayEvents.length === 0) return null;

    const highestPriority = dayTasks.reduce((highest, task) => {
      const priorities = ['Low', 'Medium', 'High', 'Critical'];
      const currentIndex = priorities.indexOf(task.priority);
      const highestIndex = priorities.indexOf(highest);
      return currentIndex > highestIndex ? task.priority : highest;
    }, 'Low');

    // Create tooltip with task and event titles
    const taskTitles = dayTasks.length > 0 ? dayTasks.map((task) => `📋 ${task.title}`).join('\n') : '';
    const eventTitles = dayEvents.length > 0 ? dayEvents.map((event) => `📅 ${event.title}`).join('\n') : '';
    const tooltipText = [taskTitles, eventTitles].filter(Boolean).join('\n');

    return (
      <BadgeContainer>
        {showTasks && dayTasks.length > 0 && (
          <TaskBadge
            priority={highestPriority}
            onClick={(e) => handleBadgeClick(e, date)}
            title={tooltipText}
          >
            {dayTasks.length}
          </TaskBadge>
        )}
        {showEvents && dayEvents.length > 0 && (
          <EventBadge
            color="#3B82F6"
            onClick={(e) => handleBadgeClick(e, date)}
            title={tooltipText}
          >
            {dayEvents.length}
          </EventBadge>
        )}
      </BadgeContainer>
    );
  };

  return (
    <PageLayout
      title="Task Calendar"
      loading={loading}
      error={error}
      headerActions={
        <CalendarFilters
          groups={groups}
          selectedGroupId={selectedGroupId}
          selectedPriorities={selectedPriorities}
          taskCount={getMonthTaskCount()}
          eventCount={getMonthEventCount()}
          showTasks={showTasks}
          showEvents={showEvents}
          onGroupChange={setSelectedGroupId}
          onPriorityChange={setSelectedPriorities}
          onShowTasksChange={setShowTasks}
          onShowEventsChange={setShowEvents}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      }
    >
      <CalendarContainer>
        {!hasMonthContent() && !loading && (
          <EmptyState>
            <h3>No Tasks or Events This Month</h3>
            <p>Click on any date to create a task or event</p>
            <KeyboardHint>
              <kbd>←</kbd> <kbd>→</kbd> Navigate months • <kbd>Enter</kbd> Quick add task • <kbd>Esc</kbd> Close modal
            </KeyboardHint>
          </EmptyState>
        )}
        <StyledCalendar
          onChange={(newValue) => {
            if (newValue instanceof Date) {
              setValue(newValue);
            }
          }}
          onActiveStartDateChange={({ activeStartDate }) => {
            // This fires when navigating months using arrows
            if (activeStartDate instanceof Date) {
              setValue(activeStartDate);
            }
          }}
          value={value}
          tileContent={getTileContent}
          onClickDay={handleDayClick}
          locale="en-GB"
          showNeighboringMonth={true}
        />
      </CalendarContainer>

      {showQuickAdd && selectedDate && (
        <QuickAddTaskModal
          date={selectedDate}
          onSubmitTask={handleAddTask}
          onSubmitEvent={handleAddEvent}
          onCancel={() => {
            setShowQuickAdd(false);
            setSelectedDate(null);
          }}
        />
      )}

      {showDayTasks && selectedDate && (
        <DayTaskListModal
          date={selectedDate}
          tasks={showTasks ? getTasksForDate(selectedDate) : []}
          events={showEvents ? getEventsForDate(selectedDate) : []}
          onToggleTask={handleToggleTask}
          onTaskClick={handleTaskClick}
          onEventClick={handleEventClick}
          onCancel={() => {
            setShowDayTasks(false);
            setSelectedDate(null);
          }}
        />
      )}

      {showEditTask && selectedTask && (
        <EditTaskModal
          task={selectedTask}
          onSubmit={handleUpdateTask}
          onCancel={() => {
            setShowEditTask(false);
            setSelectedTask(null);
          }}
        />
      )}

      {showEditEvent && selectedEvent && (
        <EditEventModal
          event={selectedEvent}
          onSubmit={handleUpdateEvent}
          onCancel={() => {
            setShowEditEvent(false);
            setSelectedEvent(null);
          }}
          groups={groups}
        />
      )}
    </PageLayout>
  );
};

export default CalendarPage;