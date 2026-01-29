import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { taskService } from '../../services/taskService';
import { eventService } from '../../services/eventService';
import { taskGroupService } from '../../services/taskGroupService';
import { CreateTaskForm } from '../../components/tasks/CreateTaskForm';
import { EventForm } from '../../components/events/EventForm';
import { EditTaskModal } from '../../components/tasks/EditTaskModal';
import { TaskList } from '../../components/tasks/TaskList';
import { TaskGroupList } from '../../components/task-groups/TaskGroupList';
import { TaskStatistics } from '../../components/dashboard/TaskStatistics';
import { TaskSkeleton } from '../../components/dashboard/TaskSkeleton';
import { TaskSearch } from '../../components/dashboard/TaskSearch';
import { Button, Alert, Container } from '@finance-manager/ui';
import { XCircle, ChevronDown } from 'lucide-react';
import { TaskGroup } from '../../types/taskGroup';
import { DashboardLayout } from '../dashboard/components';
import styled from 'styled-components';
import type { CreateEventRequest } from '../../types/event';

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 24px 0;
`;

const AddButtonContainer = styled.div`
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
`;

const AddButton = styled(Button).attrs({ size: 'small' })`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 200px;
  overflow: hidden;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: background 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  userId: string;
  groupId: string | null;
  groupName: string | null;
  groupColour: string | null;
  createdAt: string;
  updatedAt: string;
}

const TasksPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createType, setCreateType] = useState<'task' | 'event'>('task');
  const [showDropdown, setShowDropdown] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts: N = new item, / = search, Esc = close modals/unfocus search
  useKeyboardShortcuts({
    'n': () => {
      if (!showCreateForm && !editingTask) {
        setShowCreateForm(true);
      }
    },
    '/': (event) => {
      event.preventDefault();
      searchInputRef.current?.focus();
    },
    'Escape': () => {
      if (showCreateForm) {
        setShowCreateForm(false);
      } else if (editingTask) {
        setEditingTask(null);
      } else if (document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
      }
    }
  }, [showCreateForm, editingTask]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasks = await taskService.getTasks();
      setTasks(tasks);
      setError('');
    } catch (err) {
      toast.error('Failed to load tasks');
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async () => {
    try {
      setGroupsLoading(true);
      const groups = await taskGroupService.getGroups();
      setGroups(groups);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTasks = tasks
    .filter((task) => {
      // Filter by group
      if (selectedGroupId && task.groupId !== selectedGroupId) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query) ?? false;
        return matchesTitle || matchesDescription;
      }
      
      return true;
    });

  const handleSelectGroup = (groupId: string | null) => {
    // Toggle off if clicking the same group
    setSelectedGroupId(groupId === selectedGroupId ? null : groupId);
  };

  const handleCreateTask = async (data: {
    title: string;
    description?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    dueDate?: string;
    groupId?: string;
  }) => {
    try {
      const task = await taskService.createTask(data);
      setTasks((prev) => [task, ...prev]);
      setShowCreateForm(false);
      toast.success('Task created successfully');
      // Reload groups to update task counts
      loadGroups();
    } catch (err) {
      console.error('Failed to create task:', err);
      toast.error('Failed to create task');
      // Re-throw so the form can display the error
      throw err;
    }
  };

  const handleCreateEvent = async (data: CreateEventRequest) => {
    try {
      await eventService.createEvent(data);
      setShowCreateForm(false);
      toast.success('Event created successfully');
      // Navigate to calendar to see the event
      navigate('/calendar');
    } catch (err) {
      console.error('Failed to create event:', err);
      toast.error('Failed to create event');
      // Re-throw so the form can display the error
      throw err;
    }
  };

  const handleUpdateTask = async (
    id: string,
    data: {
      title: string;
      description?: string;
      priority?: 'Low' | 'Medium' | 'High' | 'Critical';
      dueDate?: string;
    }
  ) => {
    try {
      const updatedTask = await taskService.updateTask(id, data);
      setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)));
      setEditingTask(null);
      toast.success('Task updated successfully');
      // Reload groups to update task counts
      loadGroups();
    } catch (err) {
      console.error('Failed to update task:', err);
      toast.error('Failed to update task');
      throw err;
    }
  };

  const handleToggleComplete = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      
      const updatedTask = await taskService.updateTask(id, { completed: !task.completed });
      setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)));
      toast.success(updatedTask.completed ? 'Task completed!' : 'Task marked as incomplete');
    } catch (err) {
      console.error('Failed to toggle task completion:', err);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(id);
        setTasks((prev) => prev.filter((task) => task.id !== id));
        toast.success('Task deleted successfully');
        // Reload groups to update task counts
        loadGroups();
      } catch (err) {
        console.error('Failed to delete task:', err);
        toast.error('Failed to delete task');
      }
    }
  };

  const handleGroupCreated = () => {
    loadGroups();
  };

  return (
    <Container style={{ padding: '20px', maxWidth: '1200px', width: '80%' }}>
      <PageTitle>Tasks</PageTitle>

      {error && (
        <Alert variant="error" style={{ marginBottom: '20px' }}>
          <XCircle size={16} />
          <span>{error}</span>
        </Alert>
      )}

      <DashboardLayout>
        <TaskGroupList
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelectGroup={handleSelectGroup}
          onGroupCreated={handleGroupCreated}
          loading={groupsLoading}
        />

        <main role="main" aria-label="Task management">
          <TaskStatistics tasks={tasks} totalGroups={groups.length} />

          <TaskSearch ref={searchInputRef} value={searchQuery} onChange={setSearchQuery} />

          {showCreateForm ? (
            createType === 'task' ? (
              <CreateTaskForm 
                onSubmit={handleCreateTask} 
                onCancel={() => setShowCreateForm(false)}
                groups={groups}
                selectedGroupId={selectedGroupId}
              />
            ) : (
              <EventForm
                onSubmit={handleCreateEvent}
                onCancel={() => setShowCreateForm(false)}
                groups={groups}
              />
            )
          ) : (
            <AddButtonContainer>
              <AddButton 
                variant="success" 
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="Create new item"
              >
                + New <ChevronDown size={16} />
              </AddButton>
              {showDropdown && (
                <DropdownMenu>
                  <DropdownItem
                    onClick={() => {
                      setCreateType('task');
                      setShowCreateForm(true);
                      setShowDropdown(false);
                    }}
                  >
                    📋 Task
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      setCreateType('event');
                      setShowCreateForm(true);
                      setShowDropdown(false);
                    }}
                  >
                    📅 Event
                  </DropdownItem>
                </DropdownMenu>
              )}
            </AddButtonContainer>
          )}

          {loading ? (
            <div role="status" aria-label="Loading tasks">
              <TaskSkeleton count={5} />
            </div>
          ) : (
            <TaskList
              tasks={filteredTasks}
              isLoading={false}
              onToggleComplete={handleToggleComplete}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
            />
          )}
        </main>
      </DashboardLayout>

      {editingTask && (
        <EditTaskModal 
          task={editingTask} 
          onSubmit={handleUpdateTask} 
          onCancel={() => setEditingTask(null)}
        />
      )}
    </Container>
  );
};

export default TasksPage;
