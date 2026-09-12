import { memo } from 'react';
import { ChevronDown, Pencil, UserPlus, Trash2, AlertTriangle, Flag } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Task } from '../../services/taskService';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { SubtaskProgress } from './SubtaskProgress';
import { StatusBadge } from './StatusBadge';
import { QuadrantBadge } from './QuadrantBadge';
import { EnergyBadge } from './EnergyBadge';
import { TaskAssignmentBadge } from '../../features/tasks/components/TaskAssignmentBadge';
import { LabelBadge } from '../labels/LabelBadge';
import { getPriorityStyle } from '../../lib/taskPriority';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  /** Whether the subtask list below this item is expanded */
  isSubtaskExpanded?: boolean;
  /** Toggle the subtask expansion for this task */
  onToggleSubtaskExpand?: (taskId: string) => void;
  onAssign?: (task: Task) => void;
}

export const TaskItem = memo(({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  isSubtaskExpanded = false,
  onToggleSubtaskExpand,
  onAssign,
}: TaskItemProps) => {
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const wasModified = new Date(task.updatedAt).getTime() > new Date(task.createdAt).getTime() + 1000;
  const priority = getPriorityStyle(task.priority);

  return (
    <div
      className={cn(
        'group flex items-stretch gap-3 p-[15px] md:flex-col md:items-start md:gap-3 md:p-3',
        task.completed && 'opacity-60',
        isSubtaskExpanded ? 'border-none rounded-none' : 'mb-2.5 rounded-lg border border-border bg-card',
      )}
      role="article"
      aria-label={`Task: ${task.title}`}
    >
      {/* Priority stripe — a quieter, scannable severity signal than a filled badge */}
      <div className={cn('w-1 flex-shrink-0 rounded-sm md:h-1 md:w-full', priority.stripe)} aria-hidden="true" />

      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggleComplete(task.id)}
        className="mt-1 h-[18px] w-[18px] self-start md:h-5 md:w-5 flex-shrink-0"
        aria-label={`Mark task "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />

      <div className="flex-1 min-w-0">
        {/* Title on its own line — badges below don't compete with long titles for space */}
        <h3 className={cn('m-0 text-base text-foreground', task.completed && 'line-through')}>
          {task.title}
        </h3>

        {/* Meta row — priority (flag icon) and energy (zap icon) get distinct icons so
            two badges that can both read "MEDIUM" are still unambiguous at a glance */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className={cn('inline-flex items-center gap-1 text-badge font-medium uppercase tracking-wide', priority.text)}>
            <Flag className="h-2.5 w-2.5" />
            {task.priority}
          </span>
          {task.groupName && (
            <Badge
              variant="outline"
              className="rounded-sm"
              style={{
                borderColor: task.groupColour || 'hsl(var(--muted-foreground))',
                color: task.groupColour || 'hsl(var(--muted-foreground))',
              }}
            >
              {task.groupName}
            </Badge>
          )}
          <StatusBadge status={task.status} size="sm" />
          {task.quadrant && <QuadrantBadge quadrant={task.quadrant} size="sm" />}
          {task.energyLevel && <EnergyBadge energy={task.energyLevel} size="sm" showLabel showIcon />}
          {/* Assignment badge — shown to both owner and assignee */}
          {(task.assignedToUsername || task.assignedByUsername) && (
            <TaskAssignmentBadge
              isOwner={task.isOwner}
              assignedToUsername={task.assignedToUsername ?? null}
              assignedByUsername={task.assignedByUsername ?? null}
            />
          )}
          {(task.labels ?? []).slice(0, 3).map(l => <LabelBadge key={l.id} label={l} />)}
          {(task.labels ?? []).length > 3 && (
            <span className="text-xs text-muted-foreground">+{(task.labels ?? []).length - 3}</span>
          )}
        </div>

        {task.description && (
          <p className="my-[5px] text-sm text-foreground">{task.description}</p>
        )}

        {/* Inline subtask progress bar — the bar already communicates completion, so a duplicate count badge was noise */}
        {task.hasSubtasks && (
          <div className="mt-1 flex max-w-[240px] items-center gap-2">
            <SubtaskProgress
              completed={task.completedSubtaskCount}
              total={task.subtaskCount}
              percentage={task.progressPercentage}
              compact
            />
            <span className="whitespace-nowrap text-[10px] text-muted-foreground">
              {task.completedSubtaskCount}/{task.subtaskCount}
            </span>
          </div>
        )}

        <p className="mt-[5px] text-xs text-muted-foreground">
          {task.dueDate && (
            <span className={cn('inline-flex items-center gap-1', isOverdue && 'font-semibold text-destructive')}>
              {isOverdue && <AlertTriangle className="h-3 w-3" />}
              Due: {new Date(task.dueDate).toLocaleDateString()}
              {isOverdue && ' (overdue)'}
            </span>
          )}
          {task.completedAt && (
            <span className="ml-[15px]">
              Completed: {new Date(task.completedAt).toLocaleDateString()}
            </span>
          )}
          <span className={task.dueDate || task.completedAt ? 'ml-[15px]' : ''}>
            Created: {formatDateTime(task.createdAt)}
          </span>
          {wasModified && (
            <span className="ml-[15px]">
              Modified: {formatDateTime(task.updatedAt)}
            </span>
          )}
        </p>
      </div>

      {/* Row actions — recede until hovered/focused so 15 rows of buttons don't outweigh the tasks themselves */}
      <div className="flex items-center gap-[5px] opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 md:opacity-100">
        {onToggleSubtaskExpand && (
          <button
            className="flex items-center justify-center rounded-sm border-none bg-transparent p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => onToggleSubtaskExpand(task.id)}
            aria-label={isSubtaskExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
            aria-expanded={isSubtaskExpanded}
            title={task.hasSubtasks ? `${task.subtaskCount} subtask${task.subtaskCount !== 1 ? 's' : ''}` : 'Add subtasks'}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isSubtaskExpanded ? 'rotate-0' : '-rotate-90')} />
          </button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(task)}
          aria-label={`Edit task "${task.title}"`}
          title="Edit"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        {/* Only show Assign button to task owner */}
        {task.isOwner !== false && onAssign && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onAssign(task)}
            aria-label={`Assign task '${task.title}'`}
            title="Assign"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete task "${task.title}"`}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

TaskItem.displayName = 'TaskItem';
