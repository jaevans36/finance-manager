import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { StyledCalendar, TaskBadge } from '../../components/calendar/StyledCalendar';
import { QuickAddTaskModal } from '../../components/calendar/QuickAddTaskModal';
import { DayTaskListModal } from '../../components/calendar/DayTaskListModal';
import { EditTaskModal } from '../../components/tasks/EditTaskModal';
import { CalendarFilters } from '../../components/calendar/CalendarFilters';
import { CalendarTask } from '../../types/calendar';
import { taskService } from '../../services/taskService';
import type { Task } from '../../services/taskService';
import type { TaskGroup } from '../../types/taskGroup';

const PageContainer = styled.div`
  max-width: 1200px;
  width: 80%;
  margin: 0 auto;
  padding: 32px 16px;

  @media (max-width: 768px) {
    width: 95%;
    padding: 16px 8px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
    border-color: ${({ theme }) => theme.colors.primary};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const CalendarContainer = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 16px;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: ${({ theme }) => theme.colors.error};
  font-size: 16px;
`;

const CalendarPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [value, setValue] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showDayTasks, setShowDayTasks] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);

  useEffect(() => {
    loadTasks();
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTasks = await taskService.getTasks();
      setTasks(fetchedTasks);
    } catch (err: unknown) {
      const message = 'Failed to load tasks';
      setError(message);
      showToast('error', message);
      console.error('Error loading tasks:', err);
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
  };

  const hasActiveFilters = selectedGroupId !== '' || selectedPriorities.length > 0;

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

  const getTileContent = ({ date }: { date: Date }) => {
    const dayTasks = getTasksForDate(date);
    if (dayTasks.length === 0) return null;

    const highestPriority = dayTasks.reduce((highest, task) => {
      const priorities = ['Low', 'Medium', 'High', 'Critical'];
      const currentIndex = priorities.indexOf(task.priority);
      const highestIndex = priorities.indexOf(highest);
      return currentIndex > highestIndex ? task.priority : highest;
    }, 'Low');

    return (
      <TaskBadge
        priority={highestPriority}
        onClick={(e) => handleBadgeClick(e, date)}
      >
        {dayTasks.length}
      </TaskBadge>
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingMessage>Loading calendar...</LoadingMessage>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <BackButton onClick={() => navigate('/todo')}>
          <ArrowLeft />
          Back to Tasks
        </BackButton>
        <Title>Calendar View</Title>
      </Header>

      <CalendarFilters
        groups={groups}
        selectedGroupId={selectedGroupId}
        selectedPriorities={selectedPriorities}
        taskCount={getMonthTaskCount()}
        onGroupChange={setSelectedGroupId}
        onPriorityChange={setSelectedPriorities}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <CalendarContainer>
        <StyledCalendar
          onChange={(value) => value instanceof Date && setValue(value)}
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
          onSubmit={handleAddTask}
          onCancel={() => {
            setShowQuickAdd(false);
            setSelectedDate(null);
          }}
        />
      )}

      {showDayTasks && selectedDate && (
        <DayTaskListModal
          date={selectedDate}
          tasks={getTasksForDate(selectedDate)}
          onToggleTask={handleToggleTask}
          onTaskClick={handleTaskClick}
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
    </PageContainer>
  );
};

export default CalendarPage;
