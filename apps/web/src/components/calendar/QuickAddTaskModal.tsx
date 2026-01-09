import React, { useState } from 'react';
import styled from 'styled-components';
import { X } from 'lucide-react';
import { Button, Input, FormGroup, Label, Alert } from '../ui';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-radius: 12px;
  padding: 24px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
    color: ${({ theme }) => theme.colors.text};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

interface QuickAddTaskModalProps {
  date: Date;
  onSubmit: (data: { title: string; priority: string; dueDate: string; groupId?: string }) => Promise<void>;
  onCancel: () => void;
}

export const QuickAddTaskModal = ({ date, onSubmit, onCancel }: QuickAddTaskModalProps) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [dueDate, setDueDate] = useState(date.toISOString().split('T')[0]);
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
        priority,
        dueDate,
      });
      onCancel();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      setIsSubmitting(false);
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <ModalOverlay onClick={onCancel} role="dialog" aria-modal="true">
      <ModalContent onClick={handleModalClick}>
        <ModalHeader>
          <ModalTitle>Quick Add Task</ModalTitle>
          <CloseButton onClick={onCancel} aria-label="Close modal">
            <X />
          </CloseButton>
        </ModalHeader>

        {error && (
          <Alert variant="error" style={{ marginBottom: '16px' }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="task-title">Task Title *</Label>
            <Input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              maxLength={200}
              disabled={isSubmitting}
              autoFocus
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="task-priority">Priority</Label>
            <Input
              as="select"
              id="task-priority"
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
            <Label htmlFor="task-due-date">Due Date</Label>
            <Input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isSubmitting}
            />
          </FormGroup>

          <ButtonGroup>
            <Button 
              type="submit" 
              variant="primary" 
              $isLoading={isSubmitting}
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              {isSubmitting ? 'Adding...' : 'Add Task'}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </ButtonGroup>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};
