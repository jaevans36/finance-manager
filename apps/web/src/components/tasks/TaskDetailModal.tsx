import { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import {
  Card,
  Button,
  Input,
  TextArea,
  Badge,
  Alert,
  Divider,
  TabBar,
  Tab,
  TabPanel,
} from '@finance-manager/ui';
import {
  X,
  XCircle,
  Pencil,
  Trash2,
  MoreHorizontal,
  Calendar,
  Flag,
  AlignLeft,
  ListChecks,
  CircleDot,
  Paperclip,
  Link2,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import {
  spacing,
  borderRadius,
  focusRing,
  mediaQueries,
} from '@finance-manager/ui/styles';
import { useSubtasks } from '../../hooks/useSubtasks';
import { SubtaskList } from './SubtaskList';
import type { Task } from '../../services/taskService';

// =============================================================================
// Types
// =============================================================================

type TabId = 'subtasks' | 'comments' | 'linked';
type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

interface TaskDetailModalProps {
  task: Task;
  onSubmit: (
    id: string,
    data: {
      title: string;
      description?: string;
      priority?: Priority;
      dueDate?: string;
    },
  ) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  onToggleComplete?: (id: string) => void;
  /** Called whenever subtasks are added, removed, or toggled so the parent can refresh counts */
  onSubtaskChange?: (taskId: string, counts: { subtaskCount: number; completedSubtaskCount: number }) => void;
}

// =============================================================================
// Helpers
// =============================================================================

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getPriorityVariant = (
  p: Priority,
): 'error' | 'warning' | 'outline' => {
  switch (p) {
    case 'Critical':
    case 'High':
      return 'error';
    case 'Medium':
      return 'warning';
    default:
      return 'outline';
  }
};

// =============================================================================
// Styled Components — all values from design-system tokens
// =============================================================================

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalCard = styled(Card)`
  padding: 0;
  max-width: 680px;
  width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  ${mediaQueries.tablet} {
    width: 95%;
    max-height: 95vh;
  }
`;

/* ── Header ────────────────────────────────────────────────────────────────── */

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${spacing.lg} ${spacing['2xl']};
  gap: ${spacing.sm};

  ${mediaQueries.tablet} {
    padding: ${spacing.md} ${spacing.lg};
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  min-width: 0;
  flex: 1;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.xs};
  flex-shrink: 0;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: ${borderRadius.sm};
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
    color: ${({ theme }) => theme.colors.text};
  }

  ${focusRing}
`;

/* Group colour dot */
const GroupDot = styled.span<{ $color?: string }>`
  width: 8px;
  height: 8px;
  border-radius: ${borderRadius.full};
  background: ${({ $color, theme }) => $color || theme.colors.border};
  flex-shrink: 0;
`;

/* ── Overflow menu ─────────────────────────────────────────────────────────── */

const OverflowWrap = styled.div`
  position: relative;
`;

const OverflowMenu = styled.div`
  position: absolute;
  top: calc(100% + ${spacing.xs});
  right: 0;
  min-width: 160px;
  background: ${({ theme }) => theme.colors.cardBackground};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.sm};
  z-index: 10;
  overflow: hidden;
`;

const OverflowItem = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  width: 100%;
  padding: ${spacing.sm} ${spacing.lg};
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: ${({ $danger, theme }) =>
    $danger ? theme.colors.errorText : theme.colors.text};
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
  }

  ${focusRing}
`;

/* ── Scrollable body ───────────────────────────────────────────────────────── */

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 ${spacing['2xl']} ${spacing.lg};

  ${mediaQueries.tablet} {
    padding: 0 ${spacing.lg} ${spacing.md};
  }
`;

/* ── Title ─────────────────────────────────────────────────────────────────── */

const TitleView = styled.h2`
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 ${spacing.sm};
  word-break: break-word;
`;

const TitleInput = styled(Input)`
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
  padding: ${spacing.sm} ${spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: ${borderRadius.sm};
  background: ${({ theme }) => theme.colors.inputBackground};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${spacing.xs};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textDisabled};
  }

  ${focusRing}

  ${mediaQueries.tablet} {
    font-size: 18px;
  }
`;

const CharCount = styled.span`
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  color: ${({ theme }) => theme.colors.textSecondary};
  display: block;
  text-align: right;
  margin-bottom: ${spacing.sm};
`;

/* ── Metadata ──────────────────────────────────────────────────────────────── */

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: 20px auto 1fr;
  gap: ${spacing.sm} ${spacing.md};
  align-items: center;
`;

const MetaIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const MetaLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const MetaValue = styled.div`
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text};
  min-width: 0;
`;

const MetaSelect = styled.select`
  width: 100%;
  padding: ${spacing.xs} ${spacing.sm};
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: ${borderRadius.sm};
  background: ${({ theme }) => theme.colors.inputBackground};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.inputBorderFocus};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${focusRing}
`;

const MetaDateInput = styled(Input)`
  padding: ${spacing.xs} ${spacing.sm};
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  height: auto;
  border-radius: ${borderRadius.sm};

  ${focusRing}
`;

const EmptyMeta = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

/* ── Sections ──────────────────────────────────────────────────────────────── */

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing.sm};
  margin-bottom: ${spacing.sm};
`;

const SectionLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.text};
`;

const DescriptionView = styled.p`
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

const DescriptionEmpty = styled.p`
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

const DescriptionTextArea = styled(TextArea)`
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  border: 1px solid ${({ theme }) => theme.colors.inputBorder};
  border-radius: ${borderRadius.sm};
  background: ${({ theme }) => theme.colors.inputBackground};
  resize: vertical;

  ${focusRing}
`;

/* ── Attachments stub ──────────────────────────────────────────────────────── */

const AttachmentEmpty = styled.p`
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`;

/* ── Tab content stubs ─────────────────────────────────────────────────────── */

const StubText = styled.p`
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  padding: ${spacing.lg} 0;
`;

/* ── Footer ────────────────────────────────────────────────────────────────── */

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${spacing.sm};
  padding: ${spacing.lg} ${spacing['2xl']};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.backgroundSecondary};

  ${mediaQueries.tablet} {
    padding: ${spacing.md} ${spacing.lg};
  }
`;

/* ── SubtaskCount ──────────────────────────────────────────────────────────── */

const SubtaskCountBadge = styled.span`
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  padding: 2px ${spacing.sm};
  border-radius: ${borderRadius.full};
  margin-left: ${spacing.xs};
`;

// =============================================================================
// Component
// =============================================================================

export const TaskDetailModal = ({
  task,
  onSubmit,
  onCancel,
  onDelete,
  onToggleComplete,
  onSubtaskChange,
}: TaskDetailModalProps) => {
  // ── State ──────────────────────────────────────────────────────────────

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('subtasks');
  const [showOverflow, setShowOverflow] = useState(false);

  // Edit-mode form state
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const overflowRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // ── Subtask management ─────────────────────────────────────────────────

  const {
    subtasks,
    isLoading: subtasksLoading,
    error: subtasksError,
    createSubtask,
    bulkCreateSubtasks,
    toggleSubtask,
    renameSubtask,
    deleteSubtask,
    reorderSubtasks,
    bulkComplete,
    selectedIds,
    toggleSelected,
    selectAll,
    deselectAll,
  } = useSubtasks(task.id);

  // ── Keyboard & click-outside handlers ──────────────────────────────────

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showOverflow) {
          setShowOverflow(false);
        } else if (isEditing) {
          handleCancelEdit();
        } else {
          onCancel();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onCancel, isEditing, showOverflow]);

  // Close overflow on outside click
  useEffect(() => {
    if (!showOverflow) return;
    const handleClick = (e: MouseEvent) => {
      if (
        overflowRef.current &&
        !overflowRef.current.contains(e.target as Node)
      ) {
        setShowOverflow(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showOverflow]);

  // Focus title input when entering edit mode
  useEffect(() => {
    if (isEditing) {
      titleInputRef.current?.focus();
    }
  }, [isEditing]);

  // ── Tab keyboard navigation (arrow keys) ───────────────────────────────

  const tabs: TabId[] = ['subtasks', 'comments', 'linked'];

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, currentTab: TabId) => {
      const idx = tabs.indexOf(currentTab);
      let next: TabId | undefined;
      if (e.key === 'ArrowRight') {
        next = tabs[(idx + 1) % tabs.length];
      } else if (e.key === 'ArrowLeft') {
        next = tabs[(idx - 1 + tabs.length) % tabs.length];
      }
      if (next) {
        e.preventDefault();
        setActiveTab(next);
        // Focus the target tab button
        const btn = document.getElementById(`tab-${next}`);
        btn?.focus();
      }
    },
    [],
  );

  // ── Actions ────────────────────────────────────────────────────────────

  const handleStartEdit = () => {
    // Reset form state to current task values
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setDueDate(
      task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    );
    setError('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError('');
  };

  const handleSave = async (e: React.FormEvent) => {
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    setShowOverflow(false);
    onDelete?.(task.id);
  };

  const handleToggle = () => {
    onToggleComplete?.(task.id);
  };

  // Prevent overlay click from closing when clicking inside modal
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  // ── Derived ────────────────────────────────────────────────────────────

  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;

  // Notify parent whenever subtask counts change
  useEffect(() => {
    onSubtaskChange?.(task.id, {
      subtaskCount: totalCount,
      completedSubtaskCount: completedCount,
    });
  }, [totalCount, completedCount, task.id, onSubtaskChange]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <Overlay
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
    >
      <ModalCard onClick={stopPropagation}>
        {/* Wrap in form only in edit mode so Enter submits */}
        {isEditing ? (
          <form
            onSubmit={handleSave}
            aria-label="Edit task form"
            style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0 }}
          >
            {renderHeader()}
            <Divider style={{ margin: 0 }} />
            <Body>{renderBody()}</Body>
            <Footer>
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
                aria-label="Cancel editing"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="small"
                $isLoading={isSubmitting}
                aria-label="Save task changes"
              >
                {isSubmitting ? 'Saving…' : 'Save Changes'}
              </Button>
            </Footer>
          </form>
        ) : (
          <>
            {renderHeader()}
            <Divider style={{ margin: 0 }} />
            <Body>{renderBody()}</Body>
          </>
        )}
      </ModalCard>
    </Overlay>
  );

  // ── Sub-renders ────────────────────────────────────────────────────────

  function renderHeader() {
    return (
      <Header>
        <HeaderLeft>
          {/* Group badge */}
          {task.groupName && (
            <Badge variant="outline">
              <GroupDot $color={task.groupColour ?? undefined} />
              <span style={{ marginLeft: spacing.xs }}>{task.groupName}</span>
            </Badge>
          )}

          {/* Status badge */}
          <Badge variant={task.completed ? 'success' : 'info'}>
            {task.completed ? (
              <>
                <CheckCircle2 size={12} style={{ marginRight: spacing.xs }} />
                Completed
              </>
            ) : (
              <>
                <CircleDot size={12} style={{ marginRight: spacing.xs }} />
                Open
              </>
            )}
          </Badge>

          {/* Priority badge */}
          <Badge variant={getPriorityVariant(task.priority)}>
            <Flag size={12} style={{ marginRight: spacing.xs }} />
            {task.priority}
          </Badge>
        </HeaderLeft>

        <HeaderActions>
          {/* Toggle complete */}
          {onToggleComplete && !isEditing && (
            <ActionButton
              type="button"
              onClick={handleToggle}
              aria-label={
                task.completed ? 'Mark as incomplete' : 'Mark as complete'
              }
              title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
            >
              <CheckCircle2 size={16} />
            </ActionButton>
          )}

          {/* Edit */}
          {!isEditing && (
            <ActionButton
              type="button"
              onClick={handleStartEdit}
              aria-label="Edit task"
              title="Edit task"
            >
              <Pencil size={16} />
            </ActionButton>
          )}

          {/* Overflow */}
          {!isEditing && onDelete !== undefined && (
            <OverflowWrap ref={overflowRef}>
              <ActionButton
                type="button"
                onClick={() => setShowOverflow((v) => !v)}
                aria-label="More actions"
                aria-haspopup="true"
                aria-expanded={showOverflow}
              >
                <MoreHorizontal size={16} />
              </ActionButton>
              {showOverflow && (
                <OverflowMenu role="menu">
                  <OverflowItem
                    role="menuitem"
                    $danger
                    onClick={handleDelete}
                  >
                    <Trash2 size={14} />
                    Delete task
                  </OverflowItem>
                </OverflowMenu>
              )}
            </OverflowWrap>
          )}

          {/* Close */}
          <ActionButton
            type="button"
            onClick={isEditing ? handleCancelEdit : onCancel}
            aria-label="Close"
          >
            <X size={16} />
          </ActionButton>
        </HeaderActions>
      </Header>
    );
  }

  function renderBody() {
    return (
      <>
        {/* Error alert (edit mode) */}
        {error && (
          <Alert
            variant="error"
            style={{ marginBottom: spacing.lg, marginTop: spacing.lg }}
          >
            <XCircle size={16} />
            <span>{error}</span>
          </Alert>
        )}

        {/* ── Title ─────────────────────────────────────────────── */}
        <div style={{ marginTop: spacing.lg }}>
          {isEditing ? (
            <>
              <TitleInput
                ref={titleInputRef}
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                maxLength={200}
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={!title.trim()}
                aria-label="Task title"
              />
              <CharCount>{title.length}/200</CharCount>
            </>
          ) : (
            <TitleView id="task-detail-title">{task.title}</TitleView>
          )}
        </div>

        <Divider />

        {/* ── Key Metadata ──────────────────────────────────────── */}
        <MetaGrid>
          {/* Status — only in edit mode; header badges cover view mode */}
          {isEditing && onToggleComplete && (
            <>
              <MetaIcon>
                <CircleDot size={16} aria-hidden="true" />
              </MetaIcon>
              <MetaLabel id="meta-status-label">Status</MetaLabel>
              <MetaValue aria-labelledby="meta-status-label">
                <MetaSelect
                  value={task.completed ? 'completed' : 'open'}
                  onChange={() => handleToggle()}
                  disabled={isSubmitting}
                  aria-label="Task status"
                >
                  <option value="open">Open</option>
                  <option value="completed">Completed</option>
                </MetaSelect>
              </MetaValue>
            </>
          )}

          {/* Priority — only in edit mode; header shows badge in view mode */}
          {isEditing && (
            <>
              <MetaIcon>
                <Flag size={16} aria-hidden="true" />
              </MetaIcon>
              <MetaLabel id="meta-priority-label">Priority</MetaLabel>
              <MetaValue aria-labelledby="meta-priority-label">
                <MetaSelect
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  disabled={isSubmitting}
                  aria-label="Task priority"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </MetaSelect>
              </MetaValue>
            </>
          )}

          {/* Due date — always visible */}
          <MetaIcon>
            <Calendar size={16} aria-hidden="true" />
          </MetaIcon>
          <MetaLabel id="meta-due-label">Due date</MetaLabel>
          <MetaValue aria-labelledby="meta-due-label">
            {isEditing ? (
              <MetaDateInput
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={isSubmitting}
                aria-label="Due date"
              />
            ) : task.dueDate ? (
              formatDate(task.dueDate)
            ) : (
              <EmptyMeta>No due date</EmptyMeta>
            )}
          </MetaValue>
        </MetaGrid>

        <Divider />

        {/* ── Description ───────────────────────────────────────── */}
        <SectionHeader>
          <AlignLeft size={16} aria-hidden="true" />
          <SectionLabel>Description</SectionLabel>
        </SectionHeader>
        {isEditing ? (
          <DescriptionTextArea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description…"
            maxLength={2000}
            rows={3}
            disabled={isSubmitting}
            aria-label="Task description"
          />
        ) : task.description ? (
          <DescriptionView>{task.description}</DescriptionView>
        ) : (
          <DescriptionEmpty>No description</DescriptionEmpty>
        )}

        <Divider />

        {/* ── Attachments ───────────────────────────────────────── */}
        <SectionHeader>
          <Paperclip size={16} aria-hidden="true" />
          <SectionLabel>Attachments</SectionLabel>
        </SectionHeader>
        <AttachmentEmpty>No attachments</AttachmentEmpty>

        <Divider />

        {/* ── Tabbed Section ────────────────────────────────────── */}
        <TabBar role="tablist" aria-label="Task details">
          <Tab
            id="tab-subtasks"
            role="tab"
            $active={activeTab === 'subtasks'}
            aria-selected={activeTab === 'subtasks'}
            aria-controls="tabpanel-subtasks"
            tabIndex={activeTab === 'subtasks' ? 0 : -1}
            onClick={() => setActiveTab('subtasks')}
            onKeyDown={(e) => handleTabKeyDown(e, 'subtasks')}
          >
            <ListChecks
              size={14}
              style={{ marginRight: spacing.xs, verticalAlign: 'middle' }}
            />
            Subtasks
            {totalCount > 0 && (
              <SubtaskCountBadge>
                {completedCount}/{totalCount}
              </SubtaskCountBadge>
            )}
          </Tab>
          <Tab
            id="tab-comments"
            role="tab"
            $active={activeTab === 'comments'}
            aria-selected={activeTab === 'comments'}
            aria-controls="tabpanel-comments"
            tabIndex={activeTab === 'comments' ? 0 : -1}
            onClick={() => setActiveTab('comments')}
            onKeyDown={(e) => handleTabKeyDown(e, 'comments')}
          >
            <MessageSquare
              size={14}
              style={{ marginRight: spacing.xs, verticalAlign: 'middle' }}
            />
            Comments
          </Tab>
          <Tab
            id="tab-linked"
            role="tab"
            $active={activeTab === 'linked'}
            aria-selected={activeTab === 'linked'}
            aria-controls="tabpanel-linked"
            tabIndex={activeTab === 'linked' ? 0 : -1}
            onClick={() => setActiveTab('linked')}
            onKeyDown={(e) => handleTabKeyDown(e, 'linked')}
          >
            <Link2
              size={14}
              style={{ marginRight: spacing.xs, verticalAlign: 'middle' }}
            />
            Linked Items
          </Tab>
        </TabBar>

        {/* ── Tab Panels ────────────────────────────────────────── */}
        {activeTab === 'subtasks' && (
          <TabPanel
            id="tabpanel-subtasks"
            role="tabpanel"
            aria-labelledby="tab-subtasks"
          >
            <SubtaskList
              parentTask={task}
              subtasks={subtasks}
              isLoading={subtasksLoading}
              error={subtasksError}
              onCreateSubtask={createSubtask}
              onBulkCreate={bulkCreateSubtasks}
              onToggleComplete={toggleSubtask}
              onRename={renameSubtask}
              onDelete={deleteSubtask}
              onReorder={reorderSubtasks}
              onBulkComplete={bulkComplete}
              selectedIds={selectedIds}
              onToggleSelected={toggleSelected}
              onSelectAll={selectAll}
              onDeselectAll={deselectAll}
            />
          </TabPanel>
        )}

        {activeTab === 'comments' && (
          <TabPanel
            id="tabpanel-comments"
            role="tabpanel"
            aria-labelledby="tab-comments"
          >
            <StubText>Comments coming soon</StubText>
          </TabPanel>
        )}

        {activeTab === 'linked' && (
          <TabPanel
            id="tabpanel-linked"
            role="tabpanel"
            aria-labelledby="tab-linked"
          >
            <StubText>Linked items coming soon</StubText>
          </TabPanel>
        )}
      </>
    );
  }
};

// Re-export with legacy name for backward compatibility
export { TaskDetailModal as EditTaskModal };
