import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { taskService } from '../services/taskService';
import { taskGroupService } from '../services/taskGroupService';
import { CreateTaskForm } from '../components/tasks/CreateTaskForm';
import { EditTaskModal } from '../components/tasks/EditTaskModal';
import { TaskList } from '../components/tasks/TaskList';
import { TaskGroupList } from '../components/task-groups/TaskGroupList';
import { TaskStatistics } from '../components/dashboard/TaskStatistics';
import { TaskSkeleton } from '../components/dashboard/TaskSkeleton';
import { TaskSearch } from '../components/dashboard/TaskSearch';
import { Button, Alert, Heading1, TextSecondary, Container, Flex } from '../components/ui';
import { XCircle } from 'lucide-react';
import { TaskGroup } from '../types/taskGroup';

const DashboardHeader = styled(Flex)`
  margin-bottom: 30px;
`;

const DashboardLayout = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
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

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts: N = new task, / = search, Esc = close modals/unfocus search
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
      <DashboardHeader justify="space-between" align="center">
        <div>
          <Heading1 style={{ margin: 0 }}>Dashboard</Heading1>
          <TextSecondary style={{ margin: '5px 0 0' }}>Welcome back, {user?.email}</TextSecondary>
        </div>
        <Button variant="danger" onClick={logout}>
          Logout
        </Button>
      </DashboardHeader>

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

        <div>
          <TaskStatistics tasks={tasks} totalGroups={groups.length} />

          <TaskSearch ref={searchInputRef} value={searchQuery} onChange={setSearchQuery} />

          {showCreateForm ? (
            <CreateTaskForm 
              onSubmit={handleCreateTask} 
              onCancel={() => setShowCreateForm(false)}
              groups={groups}
              selectedGroupId={selectedGroupId}
            />
          ) : (
            <Button 
              variant="success" 
              onClick={() => setShowCreateForm(true)}
              style={{ marginBottom: '20px', fontSize: '16px' }}
            >
              + New Task
            </Button>
          )}

          {loading ? (
            <TaskSkeleton count={5} />
          ) : (
            <TaskList
              tasks={filteredTasks}
              isLoading={false}
              onToggleComplete={handleToggleComplete}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
            />
          )}
        </div>
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
