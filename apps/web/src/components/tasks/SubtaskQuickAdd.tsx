import { useState, useCallback, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { spacing, borderRadius } from '@finance-manager/ui/styles';
import { Button, TextArea, Flex, TextSmall } from '../ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubtaskQuickAddProps {
  onSubmit: (titles: string[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_BULK_ITEMS = 50;

// ---------------------------------------------------------------------------
// Styled
// ---------------------------------------------------------------------------

const Wrapper = styled.div`
  padding: ${spacing.md};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  margin-top: ${spacing.sm};
`;

const Hint = styled(TextSmall)`
  display: block;
  margin-bottom: ${spacing.sm};
`;

const CountLabel = styled.span`
  font-weight: 600;
`;

const ErrorLabel = styled.span`
  color: ${({ theme }) => theme.colors.errorText};
  font-size: 12px;
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SubtaskQuickAdd = ({ onSubmit, onCancel, isLoading = false }: SubtaskQuickAddProps) => {
  const [text, setText] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  /** Parse non-empty, trimmed lines from the text area */
  const parseTitles = useCallback((): string[] => {
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }, [text]);

  const titles = parseTitles();
  const count = titles.length;
  const exceedsMax = count > MAX_BULK_ITEMS;

  const handleSubmit = useCallback(async () => {
    if (count === 0 || exceedsMax) return;
    await onSubmit(titles);
    setText('');
  }, [count, exceedsMax, titles, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel],
  );

  return (
    <Wrapper>
      <Hint>
        Enter one subtask per line. Empty lines will be skipped.
      </Hint>

      <TextArea
        ref={textAreaRef}
        placeholder={'Buy groceries\nWrite report\nReview pull request'}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        style={{ minHeight: '100px' }}
        aria-label="Quick-add subtask titles (one per line)"
      />

      <Flex align="center" justify="space-between" style={{ marginTop: spacing.sm }}>
        <div>
          {count > 0 && !exceedsMax && (
            <TextSmall>
              <CountLabel>{count}</CountLabel> subtask{count !== 1 ? 's' : ''} to create
            </TextSmall>
          )}
          {exceedsMax && (
            <ErrorLabel>
              Maximum {MAX_BULK_ITEMS} subtasks at once ({count} entered)
            </ErrorLabel>
          )}
        </div>

        <Flex gap={8}>
          <Button
            variant="primary"
            size="small"
            onClick={handleSubmit}
            disabled={count === 0 || exceedsMax || isLoading}
            $isLoading={isLoading}
          >
            {isLoading ? 'Creating…' : `Create ${count} Subtask${count !== 1 ? 's' : ''}`}
          </Button>
          <Button variant="secondary" size="small" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        </Flex>
      </Flex>
    </Wrapper>
  );
};
