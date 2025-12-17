import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  Card, 
  Button, 
  Input, 
  TextArea, 
  FormGroup, 
  Label, 
  ErrorText, 
  Alert,
  Flex
} from '../ui';
import { XCircle } from 'lucide-react';

const Subheading = styled.h2`
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 20px 0;
`;

import { TaskGroup } from '../../types/taskGroup';

interface CreateTaskFormProps {
  onSubmit: (data: {
    title: string;
    description?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    dueDate?: string;
    groupId?: string;
  }) => Promise<void>;
  onCancel: () => void;
  groups?: TaskGroup[];
  selectedGroupId?: string | null;
}

export const CreateTaskForm = ({ onSubmit, onCancel, groups = [], selectedGroupId }: CreateTaskFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [groupId, setGroupId] = useState<string>(selectedGroupId || '');
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
        groupId: groupId || undefined,
      });
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setDueDate('');
      setGroupId(selectedGroupId || '');
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
      <Card style={{ padding: '20px' }}>
        <Subheading>Create New Task</Subheading>

        {error && (
          <Alert variant="error" style={{ marginBottom: '15px' }}>
            <XCircle size={16} />
            <span>{error}</span>
          </Alert>
        )}

        <FormGroup>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            maxLength={200}
            disabled={isSubmitting}
          />
          <ErrorText>{title.length}/200</ErrorText>
        </FormGroup>

        <FormGroup>
          <Label htmlFor="description">Description</Label>
          <TextArea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description"
            maxLength={2000}
            rows={3}
            disabled={isSubmitting}
          />
        <FormGroup>
          <Label htmlFor="group">Group</Label>
          <Input
            as="select"
            id="group"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">Select a group...</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </Input>
        </FormGroup>

        </FormGroup>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <FormGroup>
            <Label htmlFor="priority">Priority</Label>
            <Input
              as="select"
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'Low' | 'Medium' | 'High' | 'Critical')}
              disabled={isSubmitting}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </Input>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              disabled={isSubmitting}
            />
          </FormGroup>
        </div>

        <Flex gap={10}>
          <Button type="submit" variant="success" isLoading={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </Flex>
      </Card>
    </form>
  );
};
