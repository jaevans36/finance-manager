import { memo } from 'react';
import styled from 'styled-components';
import { CheckSquare, Trash2, SquareCheck, Square } from 'lucide-react';
import { spacing, borderRadius } from '@finance-manager/ui/styles';
import { Button, Flex, TextSmall } from '@finance-manager/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubtaskBulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onCompleteSelected: () => void;
  onDeleteSelected: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Styled
// ---------------------------------------------------------------------------

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.md};
  padding: ${spacing.sm} ${spacing.md};
  background-color: ${({ theme }) => theme.colors.primaryLight};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${borderRadius.sm};
  margin-bottom: ${spacing.sm};
  flex-wrap: wrap;
`;

const SelectedLabel = styled(TextSmall)`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SubtaskBulkActions = memo(({
  selectedCount,
  totalCount,
  onCompleteSelected,
  onDeleteSelected,
  onSelectAll,
  onDeselectAll,
  isLoading = false,
}: SubtaskBulkActionsProps) => {
  if (selectedCount === 0) return null;

  const allSelected = selectedCount === totalCount;

  return (
    <Toolbar role="toolbar" aria-label="Bulk actions for selected subtasks">
      <SelectedLabel>
        {selectedCount} selected
      </SelectedLabel>

      <Flex gap={8} align="center">
        <Button
          variant="primary"
          size="small"
          onClick={onCompleteSelected}
          disabled={isLoading}
          aria-label="Complete selected subtasks"
        >
          <CheckSquare size={14} />
          Complete selected
        </Button>

        <Button
          variant="danger"
          size="small"
          onClick={onDeleteSelected}
          disabled={isLoading}
          aria-label="Delete selected subtasks"
        >
          <Trash2 size={14} />
          Delete selected
        </Button>

        <Button
          variant="secondary"
          size="small"
          onClick={allSelected ? onDeselectAll : onSelectAll}
          disabled={isLoading}
          aria-label={allSelected ? 'Deselect all subtasks' : 'Select all subtasks'}
        >
          {allSelected ? <Square size={14} /> : <SquareCheck size={14} />}
          {allSelected ? 'Deselect all' : 'Select all'}
        </Button>
      </Flex>
    </Toolbar>
  );
});

SubtaskBulkActions.displayName = 'SubtaskBulkActions';
