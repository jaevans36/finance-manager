import { useState, useEffect } from 'react';
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
`;

const ModalContent = styled(Card)`
  padding: 20px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;

  @media (max-width: 768px) {
    width: 95%;
    padding: 16px;
    max-height: 95vh;
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
  createdAt: string;
  updatedAt: string;
}

interface EditTaskModalProps {
  task: Task;
  onSubmit: (
    id: string,
    data: {
      title: string;
      description?: string;
      priority?: 'Low' | 'Medium' | 'High' | 'Critical';
      dueDate?: string;
    }
  ) => Promise<void>;
  onCancel: () => void;
}

export const EditTaskModal = ({ task, onSubmit, onCancel }: EditTaskModalProps) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>(task.priority);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent clicks inside modal from closing it
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <ModalOverlay onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="edit-task-heading">
      <ModalContent onClick={handleModalClick}>
        <Subheading id="edit-task-heading">Edit Task</Subheading>

        {error && (
          <Alert variant="error" style={{ marginBottom: '15px' }}>
            <XCircle size={16} />
            <span>{error}</span>
          </Alert>
        )}

        <form onSubmit={handleSubmit} aria-label="Edit task form">
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
              aria-required="true"
              aria-invalid={!title.trim()}
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
            <Button 
              type="submit" 
              variant="primary" 
              $isLoading={isSubmitting}
              aria-label="Save task changes"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onCancel} 
              disabled={isSubmitting}
              aria-label="Cancel editing"
            >
              Cancel
            </Button>
          </Flex>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};
