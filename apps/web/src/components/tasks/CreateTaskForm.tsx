import React, { useState } from 'react';
import styled from 'styled-components';

const Subheading = styled.h2`
  color: #222;
  margin-bottom: 20px;
`;

const Label = styled.label`
  color: #333;
  display: block;
  margin-bottom: 5px;
`;

interface CreateTaskFormProps {
  onSubmit: (data: {
    title: string;
    description?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    dueDate?: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export const CreateTaskForm = ({ onSubmit, onCancel }: CreateTaskFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
      });
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setDueDate('');
    } catch (err) {
      console.error('Task creation error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: { error?: { message?: string } } } };
        setError(axiosError.response?.data?.error?.message || 'Failed to create task');
      } else {
        setError('Failed to create task');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
      <div
        style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #ddd',
        }}
      >
        <Subheading style={{ marginTop: 0 }}>Create New Task</Subheading>

        {error && (
          <div
            style={{
              padding: '10px',
              marginBottom: '15px',
              backgroundColor: '#fee',
              color: '#c00',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <Label htmlFor="title" style={{ fontWeight: 'bold' }}>
            Title *
          </Label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            maxLength={200}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
            disabled={isSubmitting}
          />
          <small style={{ color: '#666' }}>{title.length}/200</small>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <Label htmlFor="description" style={{ fontWeight: 'bold' }}>
            Description
          </Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description"
            maxLength={2000}
            rows={3}
            style={{
              width: '100%',
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
            disabled={isSubmitting}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <Label htmlFor="priority" style={{ fontWeight: 'bold' }}>
              Priority
            </Label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'Low' | 'Medium' | 'High' | 'Critical')}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
              disabled={isSubmitting}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <Label htmlFor="dueDate" style={{ fontWeight: 'bold' }}>
              Due Date
            </Label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '10px 20px',
              backgroundColor: isSubmitting ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};
