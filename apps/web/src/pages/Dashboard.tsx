import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { CreateTaskForm } from '../components/tasks/CreateTaskForm';
import { EditTaskModal } from '../components/tasks/EditTaskModal';
import { TaskList } from '../components/tasks/TaskList';
import { Button, Alert, Heading1, TextSecondary, Container, Flex } from '../components/ui';
import { XCircle } from 'lucide-react';

const DashboardHeader = styled(Flex)`
  margin-bottom: 30px;
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
  createdAt: string;
  updatedAt: string;
}

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const tasks = await taskService.getTasks();
      setTasks(tasks);
      setError('');
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleCreateTask = async (data: {
    title: string;
    description?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    dueDate?: string;
  }) => {
    try {
      const task = await taskService.createTask(data);
      setTasks((prev) => [task, ...prev]);
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create task:', err);
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
    const updatedTask = await taskService.updateTask(id, data);
    setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)));
    setEditingTask(null);
  };

  const handleToggleComplete = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      
      const updatedTask = await taskService.updateTask(id, { completed: !task.completed });
      setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)));
    } catch (err) {
      console.error('Failed to toggle task completion:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(id);
        setTasks((prev) => prev.filter((task) => task.id !== id));
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
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

      {showCreateForm ? (
        <CreateTaskForm onSubmit={handleCreateTask} onCancel={() => setShowCreateForm(false)} />
      ) : (
        <Button 
          variant="success" 
          onClick={() => setShowCreateForm(true)}
          style={{ marginBottom: '20px', fontSize: '16px' }}
        >
          + New Task
        </Button>
      )}

      <TaskList
        tasks={tasks}
        isLoading={loading}
        onToggleComplete={handleToggleComplete}
        onEdit={setEditingTask}
        onDelete={handleDeleteTask}
      />

      {editingTask && (
        <EditTaskModal task={editingTask} onSubmit={handleUpdateTask} onCancel={() => setEditingTask(null)} />
      )}
    </Container>
  );
};
