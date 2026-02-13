import { useState, useCallback, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { spacing, borderRadius } from '@finance-manager/ui/styles';
import { Button, Input, TextArea, FormGroup, Label, Select, Flex } from '../ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubtaskFormProps {
  onSubmit: (input: SubtaskFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface SubtaskFormValues {
  title: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: string;
}

// ---------------------------------------------------------------------------
// Styled
// ---------------------------------------------------------------------------

const FormWrapper = styled.div`
  padding: ${spacing.md};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  margin-top: ${spacing.sm};
`;

const TitleInput = styled(Input)`
  font-size: 14px;
`;

const ExpandToggle = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  margin-top: ${spacing.xs};

  &:hover {
    text-decoration: underline;
  }
`;

const OptionalFields = styled.div`
  margin-top: ${spacing.sm};
  display: flex;
  flex-direction: column;
  gap: ${spacing.sm};
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SubtaskForm = ({ onSubmit, onCancel, isLoading = false }: SubtaskFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [showOptional, setShowOptional] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const values: SubtaskFormValues = { title: trimmedTitle };
    if (description.trim()) values.description = description.trim();
    if (priority !== 'Medium') values.priority = priority;
    if (dueDate) values.dueDate = dueDate;

    await onSubmit(values);

    // Reset form for the next subtask
    setTitle('');
    setDescription('');
    setPriority('Medium');
    setDueDate('');
    setShowOptional(false);
    inputRef.current?.focus();
  }, [title, description, priority, dueDate, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [handleSubmit, onCancel],
  );

  return (
    <FormWrapper>
      <TitleInput
        ref={inputRef}
        type="text"
        placeholder="Subtask title…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        aria-label="Subtask title"
      />

      <ExpandToggle
        type="button"
        onClick={() => setShowOptional((prev) => !prev)}
      >
        {showOptional ? 'Hide options' : 'More options…'}
      </ExpandToggle>

      {showOptional && (
        <OptionalFields>
          <FormGroup>
            <Label htmlFor="subtask-desc">Description</Label>
            <TextArea
              id="subtask-desc"
              placeholder="Optional description…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              style={{ minHeight: '60px' }}
            />
          </FormGroup>

          <Flex gap={12}>
            <FormGroup style={{ flex: 1 }}>
              <Label htmlFor="subtask-priority">Priority</Label>
              <Select
                id="subtask-priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as 'Low' | 'Medium' | 'High' | 'Critical')
                }
                disabled={isLoading}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </Select>
            </FormGroup>

            <FormGroup style={{ flex: 1 }}>
              <Label htmlFor="subtask-due">Due date</Label>
              <Input
                id="subtask-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isLoading}
              />
            </FormGroup>
          </Flex>
        </OptionalFields>
      )}

      <Flex gap={8} style={{ marginTop: spacing.sm }}>
        <Button
          variant="primary"
          size="small"
          onClick={handleSubmit}
          disabled={!title.trim() || isLoading}
          $isLoading={isLoading}
        >
          {isLoading ? 'Adding…' : 'Add'}
        </Button>
        <Button variant="secondary" size="small" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </Flex>
    </FormWrapper>
  );
};
