import { useState, useRef, useCallback } from 'react';
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
import { XCircle, Plus, X } from 'lucide-react';
import { spacing, borderRadius } from '@finance-manager/ui/styles';

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
    subtaskTitles?: string[];
  }) => Promise<void>;
  onCancel: () => void;
  groups?: TaskGroup[];
  selectedGroupId?: string | null;
  onSubtasksCreated?: (taskId: string, titles: string[]) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Subtasks section styled components
// ---------------------------------------------------------------------------

const SubtasksSection = styled.div`
  margin-bottom: 15px;
`;

const SubtasksSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing.sm};
`;

const SubtaskList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing.xs};
  margin-bottom: ${spacing.sm};
`;

const SubtaskRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  padding: ${spacing.xs} ${spacing.sm};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border-radius: ${borderRadius.md};
`;

const SubtaskTitle = styled.span`
  flex: 1;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: ${borderRadius.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: color 150ms ease;
  flex-shrink: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.error};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const InlineSubtaskInput = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
`;

const SubtaskInput = styled(Input)`
  flex: 1;
  font-size: 14px;
`;

const AddSubtaskButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 13px;
  padding: ${spacing.xs} 0;
  transition: color 150ms ease;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

export const CreateTaskForm = ({ onSubmit, onCancel, groups = [], selectedGroupId, onSubtasksCreated }: CreateTaskFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [groupId, setGroupId] = useState<string>(selectedGroupId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [subtaskTitles, setSubtaskTitles] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  const handleAddSubtask = useCallback(() => {
    const trimmed = subtaskInput.trim();
    if (!trimmed) return;
    setSubtaskTitles((prev) => [...prev, trimmed]);
    setSubtaskInput('');
    subtaskInputRef.current?.focus();
  }, [subtaskInput]);

  const handleRemoveSubtask = useCallback((index: number) => {
    setSubtaskTitles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubtaskKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddSubtask();
      }
      if (e.key === 'Escape') {
        setIsAddingSubtask(false);
        setSubtaskInput('');
      }
    },
    [handleAddSubtask],
  );

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
        subtaskTitles: subtaskTitles.length > 0 ? subtaskTitles : undefined,
      });
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setDueDate('');
      setGroupId(selectedGroupId || '');
      setSubtaskTitles([]);
      setSubtaskInput('');
      setIsAddingSubtask(false);
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
    <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }} aria-label="Create new task form">
      <Card style={{ padding: '20px' }}>
        <Subheading id="create-task-heading">Create New Task</Subheading>

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
            aria-required="true"
            aria-invalid={!!error && !title.trim()}
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

        {/* Subtasks section */}
        <SubtasksSection>
          <SubtasksSectionHeader>
            <Label style={{ margin: 0 }}>Subtasks</Label>
          </SubtasksSectionHeader>

          {subtaskTitles.length > 0 && (
            <SubtaskList>
              {subtaskTitles.map((st, index) => (
                <SubtaskRow key={index}>
                  <SubtaskTitle>{st}</SubtaskTitle>
                  <RemoveButton
                    type="button"
                    onClick={() => handleRemoveSubtask(index)}
                    aria-label={`Remove subtask "${st}"`}
                    disabled={isSubmitting}
                  >
                    <X />
                  </RemoveButton>
                </SubtaskRow>
              ))}
            </SubtaskList>
          )}

          {isAddingSubtask ? (
            <InlineSubtaskInput>
              <SubtaskInput
                ref={subtaskInputRef}
                type="text"
                placeholder="Type a subtask and press Enter..."
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                onBlur={() => {
                  if (!subtaskInput.trim()) {
                    setIsAddingSubtask(false);
                  }
                }}
                disabled={isSubmitting}
                aria-label="New subtask title"
                autoFocus
              />
            </InlineSubtaskInput>
          ) : (
            <AddSubtaskButton
              type="button"
              onClick={() => setIsAddingSubtask(true)}
              disabled={isSubmitting}
            >
              <Plus />
              Add subtask
            </AddSubtaskButton>
          )}
        </SubtasksSection>

        <Flex gap={10}>
          <Button type="submit" variant="success" $isLoading={isSubmitting}>
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
