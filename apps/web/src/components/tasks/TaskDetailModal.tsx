import { useState, useEffect, useCallback, useRef } from 'react';
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
  LayoutGrid,
  Zap,
  Clock,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Separator } from '../../components/ui/separator';
import { useEditTaskForm } from '../../hooks/forms';
import type { UpdateTaskInput } from '@finance-manager/schema';
import { useSubtasks } from '../../hooks/useSubtasks';
import { SubtaskList } from './SubtaskList';
import type { Task, TaskStatus, UrgencyLevel, ImportanceLevel, EnergyLevel } from '../../services/taskService';
import { StatusBadge } from './StatusBadge';
import { StatusSelector } from './StatusSelector';
import { QuadrantBadge } from './QuadrantBadge';
import { ClassificationPicker } from './ClassificationPicker';
import { EnergyBadge } from './EnergyBadge';
import { EnergySelector } from './EnergySelector';
import { DurationInput, formatDuration } from './DurationInput';

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
  onStatusChange?: (id: string, status: TaskStatus, blockedReason?: string) => void;
  onClassificationChange?: (id: string, urgency: UrgencyLevel | null, importance: ImportanceLevel | null) => void;
  onEnergyChange?: (id: string, energy: EnergyLevel | null) => void;
  onEstimateChange?: (id: string, minutes: number | null) => void;
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
): 'destructive' | 'warning' | 'outline' => {
  switch (p) {
    case 'Critical':
    case 'High':
      return 'destructive';
    case 'Medium':
      return 'warning';
    default:
      return 'outline';
  }
};

// =============================================================================
// Tailwind CSS class constants
// =============================================================================

const overlayClasses = 'fixed inset-0 z-[1100] flex items-center justify-center bg-black/50';
const modalClasses = 'flex w-[95%] max-w-[680px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg max-h-[95vh] md:w-[90%] md:max-h-[90vh]';
const headerClasses = 'flex items-center justify-between gap-2 px-4 py-3 md:px-6 md:py-4';
const bodyClasses = 'flex-1 overflow-y-auto px-4 pb-3 pt-0 md:px-6 md:pb-4';
const footerClasses = 'flex justify-end gap-2 border-t border-border bg-secondary px-4 py-3 md:px-6 md:py-4';
const actionButtonClasses = 'flex h-8 w-8 items-center justify-center rounded border-none bg-transparent text-muted-foreground transition-all hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
const metaSelectClasses = 'w-full rounded border border-input bg-background px-2 py-1 text-sm font-normal text-foreground focus:border-ring focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

// =============================================================================
// Component
// =============================================================================

export const TaskDetailModal = ({
  task,
  onSubmit,
  onCancel,
  onDelete,
  onToggleComplete,
  onStatusChange,
  onClassificationChange,
  onEnergyChange,
  onEstimateChange,
  onSubtaskChange,
}: TaskDetailModalProps) => {
  // ── State ──────────────────────────────────────────────────────────────

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('subtasks');
  const [showOverflow, setShowOverflow] = useState(false);

  // Edit-mode form state (React Hook Form)
  const { register, handleSubmit: rhfHandleSubmit, watch, reset: resetForm, formState: { errors: formErrors, isSubmitting } } = useEditTaskForm({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
  });
  const [apiError, setApiError] = useState('');
  const watchedTitle = watch('title');

  // Merge RHF ref with our titleInputRef
  const { ref: titleRegRef, ...titleRegRest } = register('title');

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
    resetForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    });
    setApiError('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setApiError('');
  };

  const onSave = async (data: UpdateTaskInput) => {
    setApiError('');
    try {
      await onSubmit(task.id, {
        title: data.title?.trim() || task.title,
        description: data.description?.trim() || undefined,
        priority: data.priority as Priority || undefined,
        dueDate: data.dueDate || undefined,
      });
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Failed to update task');
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
    <div
      className={overlayClasses}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
    >
      <div className={modalClasses} onClick={stopPropagation}>
        {/* Wrap in form only in edit mode so Enter submits */}
        {isEditing ? (
          <form
            onSubmit={rhfHandleSubmit(onSave)}
            aria-label="Edit task form"
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            {renderHeader()}
            <Separator className="m-0" />
            <div className={bodyClasses}>{renderBody()}</div>
            <div className={footerClasses}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
                aria-label="Cancel editing"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={isSubmitting}
                aria-label="Save task changes"
              >
                {isSubmitting ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          <>
            {renderHeader()}
            <Separator className="m-0" />
            <div className={bodyClasses}>{renderBody()}</div>
          </>
        )}
      </div>
    </div>
  );

  // ── Sub-renders ────────────────────────────────────────────────────────

  function renderHeader() {
    return (
      <div className={headerClasses}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {/* Group badge */}
          {task.groupName && (
            <Badge variant="outline">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: task.groupColour || undefined }}
              />
              <span className="ml-1">{task.groupName}</span>
            </Badge>
          )}

          {/* Status badge */}
          <StatusBadge status={task.status} />

          {/* Quadrant badge */}
          {task.quadrant && <QuadrantBadge quadrant={task.quadrant} showLabel />}

          {/* Energy badge */}
          {task.energyLevel && <EnergyBadge energy={task.energyLevel} showLabel showIcon />}

          {/* Priority badge */}
          <Badge variant={getPriorityVariant(task.priority)}>
            <Flag size={12} className="mr-1" />
            {task.priority}
          </Badge>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {/* Toggle complete */}
          {onToggleComplete && !isEditing && (
            <button
              type="button"
              className={actionButtonClasses}
              onClick={handleToggle}
              aria-label={
                task.completed ? 'Mark as incomplete' : 'Mark as complete'
              }
              title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
            >
              <CheckCircle2 size={16} />
            </button>
          )}

          {/* Edit */}
          {!isEditing && (
            <button
              type="button"
              className={actionButtonClasses}
              onClick={handleStartEdit}
              aria-label="Edit task"
              title="Edit task"
            >
              <Pencil size={16} />
            </button>
          )}

          {/* Overflow */}
          {!isEditing && onDelete !== undefined && (
            <div className="relative" ref={overflowRef}>
              <button
                type="button"
                className={actionButtonClasses}
                onClick={() => setShowOverflow((v) => !v)}
                aria-label="More actions"
                aria-haspopup="true"
                aria-expanded={showOverflow}
              >
                <MoreHorizontal size={16} />
              </button>
              {showOverflow && (
                <div
                  className="absolute right-0 top-full z-10 mt-1 min-w-[160px] overflow-hidden rounded border border-border bg-card"
                  role="menu"
                >
                  <button
                    role="menuitem"
                    className="flex w-full items-center gap-2 border-none bg-transparent px-4 py-2 text-sm text-destructive transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={handleDelete}
                  >
                    <Trash2 size={14} />
                    Delete task
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Close */}
          <button
            type="button"
            className={actionButtonClasses}
            onClick={isEditing ? handleCancelEdit : onCancel}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  function renderBody() {
    return (
      <>
        {/* Error alert (edit mode) */}
        {apiError && (
          <Alert variant="destructive" className="mb-4 mt-4">
            <XCircle size={16} />
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        {/* ── Title ─────────────────────────────────────────────── */}
        <div className="mt-4">
          {isEditing ? (
            <>
              <Input
                ref={(el) => {
                  titleRegRef(el);
                  (titleInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
                }}
                id="task-title"
                type="text"
                {...titleRegRest}
                placeholder="Task title"
                maxLength={200}
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={!!formErrors.title}
                aria-label="Task title"
                className="mb-1 text-lg font-semibold leading-tight"
              />
              {formErrors.title && <span className="mb-2 block text-right text-[11px] font-medium">{formErrors.title.message}</span>}
              <span className="mb-2 block text-right text-[11px] font-medium text-muted-foreground">{(watchedTitle ?? '').length}/200</span>
            </>
          ) : (
            <h2 id="task-detail-title" className="mb-2 break-words text-lg font-semibold leading-tight text-foreground">{task.title}</h2>
          )}
        </div>

        <Separator />

        {/* ── Key Metadata ──────────────────────────────────────── */}
        <div className="grid grid-cols-[20px_auto_1fr] items-center gap-x-3 gap-y-2">
          {/* Status — always visible; editable via StatusSelector */}
          <span className="flex items-center justify-center text-muted-foreground">
            <CircleDot size={16} aria-hidden="true" />
          </span>
          <span className="text-sm font-medium text-muted-foreground" id="meta-status-label">Status</span>
          <div className="min-w-0 text-sm text-foreground" aria-labelledby="meta-status-label">
            {onStatusChange ? (
              <StatusSelector
                value={task.status}
                onChange={(newStatus) => onStatusChange(task.id, newStatus)}
                disabled={isSubmitting}
              />
            ) : (
              <StatusBadge status={task.status} />
            )}
          </div>

          {/* Blocked reason — only shown when status is Blocked */}
          {task.status === 'Blocked' && task.blockedReason && (
            <>
              <span />
              <span className="text-sm font-medium text-muted-foreground">Reason</span>
              <p className="m-0 text-sm text-destructive">{task.blockedReason}</p>
            </>
          )}

          {/* Eisenhower Classification */}
          <span className="flex items-center justify-center text-muted-foreground">
            <LayoutGrid size={16} aria-hidden="true" />
          </span>
          <span className="text-sm font-medium text-muted-foreground" id="meta-quadrant-label">Quadrant</span>
          <div className="min-w-0 text-sm text-foreground" aria-labelledby="meta-quadrant-label">
            {onClassificationChange ? (
              <ClassificationPicker
                urgency={task.urgency}
                importance={task.importance}
                onChange={(urgency, importance) => onClassificationChange(task.id, urgency, importance)}
                disabled={isSubmitting}
              />
            ) : (
              <div className="flex items-center gap-2">
                {task.quadrant ? (
                  <QuadrantBadge quadrant={task.quadrant} showLabel />
                ) : (
                  <span className="text-muted-foreground">Unclassified</span>
                )}
              </div>
            )}
          </div>

          {/* Energy Level */}
          <span className="flex items-center justify-center text-muted-foreground">
            <Zap size={16} aria-hidden="true" />
          </span>
          <span className="text-sm font-medium text-muted-foreground" id="meta-energy-label">Energy</span>
          <div className="min-w-0 text-sm text-foreground" aria-labelledby="meta-energy-label">
            {onEnergyChange ? (
              <EnergySelector
                value={task.energyLevel}
                onChange={(energy) => onEnergyChange(task.id, energy)}
                disabled={isSubmitting}
              />
            ) : (
              <div className="flex items-center gap-2">
                {task.energyLevel ? (
                  <EnergyBadge energy={task.energyLevel} showLabel showIcon />
                ) : (
                  <span className="text-muted-foreground">Unset</span>
                )}
              </div>
            )}
          </div>

          {/* Estimated Duration */}
          <span className="flex items-center justify-center text-muted-foreground">
            <Clock size={16} aria-hidden="true" />
          </span>
          <span className="text-sm font-medium text-muted-foreground" id="meta-estimate-label">Estimate</span>
          <div className="min-w-0 text-sm text-foreground" aria-labelledby="meta-estimate-label">
            {onEstimateChange ? (
              <DurationInput
                value={task.estimatedMinutes}
                onChange={(minutes) => onEstimateChange(task.id, minutes)}
                disabled={isSubmitting}
              />
            ) : (
              <span className={task.estimatedMinutes ? 'text-foreground' : 'text-muted-foreground'}>
                {task.estimatedMinutes ? formatDuration(task.estimatedMinutes) : 'Unset'}
              </span>
            )}
          </div>

          {/* Priority — only in edit mode; header shows badge in view mode */}
          {isEditing && (
            <>
              <span className="flex items-center justify-center text-muted-foreground">
                <Flag size={16} aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-muted-foreground" id="meta-priority-label">Priority</span>
              <div className="min-w-0 text-sm text-foreground" aria-labelledby="meta-priority-label">
                <select
                  id="priority"
                  {...register('priority')}
                  disabled={isSubmitting}
                  aria-label="Task priority"
                  className={metaSelectClasses}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </>
          )}

          {/* Due date — always visible */}
          <span className="flex items-center justify-center text-muted-foreground">
            <Calendar size={16} aria-hidden="true" />
          </span>
          <span className="text-sm font-medium text-muted-foreground" id="meta-due-label">Due date</span>
          <div className="min-w-0 text-sm text-foreground" aria-labelledby="meta-due-label">
            {isEditing ? (
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
                min={new Date().toISOString().split('T')[0]}
                disabled={isSubmitting}
                aria-label="Due date"
                className="h-auto px-2 py-1 text-sm"
              />
            ) : task.dueDate ? (
              formatDate(task.dueDate)
            ) : (
              <span className="text-sm text-muted-foreground">No due date</span>
            )}
          </div>
        </div>

        <Separator />

        {/* ── Description ───────────────────────────────────────── */}
        <div className="mb-2 flex items-center gap-2">
          <AlignLeft size={16} aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">Description</span>
        </div>
        {isEditing ? (
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Add a description…"
            maxLength={2000}
            rows={3}
            disabled={isSubmitting}
            aria-label="Task description"
            className="resize-y text-sm"
          />
        ) : task.description ? (
          <p className="m-0 break-words whitespace-pre-wrap text-sm text-foreground">{task.description}</p>
        ) : (
          <p className="m-0 text-sm text-muted-foreground">No description</p>
        )}

        <Separator />

        {/* ── Attachments ───────────────────────────────────────── */}
        <div className="mb-2 flex items-center gap-2">
          <Paperclip size={16} aria-hidden="true" />
          <span className="text-sm font-medium text-foreground">Attachments</span>
        </div>
        <p className="m-0 text-sm text-muted-foreground">No attachments</p>

        <Separator />

        {/* ── Tabbed Section ────────────────────────────────────── */}
        <div className="mb-2 flex border-b border-border" role="tablist" aria-label="Task details">
          <button
            id="tab-subtasks"
            role="tab"
            aria-selected={activeTab === 'subtasks'}
            aria-controls="tabpanel-subtasks"
            tabIndex={activeTab === 'subtasks' ? 0 : -1}
            onClick={() => setActiveTab('subtasks')}
            onKeyDown={(e) => handleTabKeyDown(e, 'subtasks')}
            className={cn(
              'inline-flex items-center gap-1 border-b-2 bg-transparent px-3 py-2 text-sm font-medium transition-colors',
              activeTab === 'subtasks'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <ListChecks size={14} className="align-middle" />
            Subtasks
            {totalCount > 0 && (
              <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {completedCount}/{totalCount}
              </span>
            )}
          </button>
          <button
            id="tab-comments"
            role="tab"
            aria-selected={activeTab === 'comments'}
            aria-controls="tabpanel-comments"
            tabIndex={activeTab === 'comments' ? 0 : -1}
            onClick={() => setActiveTab('comments')}
            onKeyDown={(e) => handleTabKeyDown(e, 'comments')}
            className={cn(
              'inline-flex items-center gap-1 border-b-2 bg-transparent px-3 py-2 text-sm font-medium transition-colors',
              activeTab === 'comments'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <MessageSquare size={14} className="align-middle" />
            Comments
          </button>
          <button
            id="tab-linked"
            role="tab"
            aria-selected={activeTab === 'linked'}
            aria-controls="tabpanel-linked"
            tabIndex={activeTab === 'linked' ? 0 : -1}
            onClick={() => setActiveTab('linked')}
            onKeyDown={(e) => handleTabKeyDown(e, 'linked')}
            className={cn(
              'inline-flex items-center gap-1 border-b-2 bg-transparent px-3 py-2 text-sm font-medium transition-colors',
              activeTab === 'linked'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Link2 size={14} className="align-middle" />
            Linked Items
          </button>
        </div>

        {/* ── Tab Panels ────────────────────────────────────────── */}
        {activeTab === 'subtasks' && (
          <div
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
          </div>
        )}

        {activeTab === 'comments' && (
          <div
            id="tabpanel-comments"
            role="tabpanel"
            aria-labelledby="tab-comments"
          >
            <p className="m-0 py-4 text-sm text-muted-foreground">Comments coming soon</p>
          </div>
        )}

        {activeTab === 'linked' && (
          <div
            id="tabpanel-linked"
            role="tabpanel"
            aria-labelledby="tab-linked"
          >
            <p className="m-0 py-4 text-sm text-muted-foreground">Linked items coming soon</p>
          </div>
        )}
      </>
    );
  }
};

// Re-export with legacy name for backward compatibility
export { TaskDetailModal as EditTaskModal };
