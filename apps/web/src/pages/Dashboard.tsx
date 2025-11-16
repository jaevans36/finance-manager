import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { CreateTaskForm } from '../components/tasks/CreateTaskForm';
import { EditTaskModal } from '../components/tasks/EditTaskModal';
import { TaskList } from '../components/tasks/TaskList';

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getTasks();
      setTasks(response.tasks);
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
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
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
      priority?: 'HIGH' | 'MEDIUM' | 'LOW';
      dueDate?: string;
    }
  ) => {
    const updatedTask = await taskService.updateTask(id, data);
    setTasks((prev) => prev.map((task) => (task.id === id ? updatedTask : task)));
    setEditingTask(null);
  };

  const handleToggleComplete = async (id: string) => {
    try {
      const updatedTask = await taskService.toggleComplete(id);
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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#666', margin: '5px 0 0' }}>Welcome back, {user?.email}</p>
        </div>
        <button
          onClick={logout}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: '15px',
            marginBottom: '20px',
            backgroundColor: '#fee',
            color: '#c00',
            borderRadius: '4px',
          }}
        >
          {error}
        </div>
      )}

      {showCreateForm ? (
        <CreateTaskForm onSubmit={handleCreateTask} onCancel={() => setShowCreateForm(false)} />
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            marginBottom: '20px',
          }}
        >
          + New Task
        </button>
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
    </div>
  );
};
