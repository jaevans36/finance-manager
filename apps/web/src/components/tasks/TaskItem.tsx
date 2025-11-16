import React from 'react';
import { Task } from '../../services/taskService';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return '#dc3545';
      case 'MEDIUM':
        return '#ffc107';
      case 'LOW':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();

  return (
    <div
      style={{
        padding: '15px',
        marginBottom: '10px',
        backgroundColor: 'white',
        borderRadius: '4px',
        border: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        opacity: task.completed ? 0.6 : 1,
      }}
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggleComplete(task.id)}
        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
      />

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
          <h3
            style={{
              margin: 0,
              textDecoration: task.completed ? 'line-through' : 'none',
              fontSize: '16px',
            }}
          >
            {task.title}
          </h3>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              backgroundColor: getPriorityColor(task.priority),
              color: 'white',
            }}
          >
            {task.priority}
          </span>
          {isOverdue && (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                backgroundColor: '#dc3545',
                color: 'white',
              }}
            >
              OVERDUE
            </span>
          )}
        </div>

        {task.description && (
          <p
            style={{
              margin: '5px 0',
              color: '#666',
              fontSize: '14px',
            }}
          >
            {task.description}
          </p>
        )}

        <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
          {task.dueDate && (
            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
          )}
          {task.completedAt && (
            <span style={{ marginLeft: '15px' }}>
              Completed: {new Date(task.completedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '5px' }}>
        <button
          onClick={() => onEdit(task)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(task.id)}
          style={{
            padding: '6px 12px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
};
