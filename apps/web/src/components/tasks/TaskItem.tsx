import { memo } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Task } from '../../services/taskService';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { SubtaskProgress } from './SubtaskProgress';
import { StatusBadge } from './StatusBadge';
import { QuadrantBadge } from './QuadrantBadge';
import { EnergyBadge } from './EnergyBadge';
import { TaskAssignmentBadge } from '../../features/tasks/components/TaskAssignmentBadge';
import { LabelBadge } from '../labels/LabelBadge';

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

const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case 'Critical':
    case 'High':
      return 'destructive' as const;
    case 'Medium':
      return 'warning' as const;
    case 'Low':
      return 'success' as const;
    default:
      return 'secondary' as const;
  }
};

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

  return (
    <div
      className={cn(
        'flex items-center gap-[15px] p-[15px] md:flex-col md:items-start md:gap-3 md:p-3',
        task.completed && 'opacity-60',
        isSubtaskExpanded ? 'border-none rounded-none' : 'mb-2.5 rounded-lg border border-border bg-card',
      )}
      role="article"
      aria-label={`Task: ${task.title}`}
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggleComplete(task.id)}
        className="h-[18px] w-[18px] cursor-pointer md:h-6 md:w-6 flex-shrink-0"
        aria-label={`Mark task "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
      />

      <div className="flex-1 min-w-0">
        <div className="mb-[5px] flex flex-wrap items-center gap-2.5">
          <h3 className={cn('m-0 text-base text-foreground', task.completed && 'line-through')}>
            {task.title}
          </h3>
          {task.groupName && (
            <Badge
              variant="outline"
              style={{
                borderColor: task.groupColour || 'hsl(var(--muted-foreground))',
                color: task.groupColour || 'hsl(var(--muted-foreground))',
              }}
            >
              {task.groupName}
            </Badge>
          )}
          <Badge variant={getPriorityVariant(task.priority)}>{task.priority}</Badge>
          <StatusBadge status={task.status} size="sm" />
          {task.quadrant && <QuadrantBadge quadrant={task.quadrant} size="sm" />}
          {task.energyLevel && <EnergyBadge energy={task.energyLevel} size="sm" showLabel />}
          {/* Assignment badge — shown to both owner and assignee */}
          {(task.assignedToUsername || task.assignedByUsername) && (
            <TaskAssignmentBadge
              isOwner={task.isOwner}
              assignedToUsername={task.assignedToUsername ?? null}
              assignedByUsername={task.assignedByUsername ?? null}
            />
          )}
          {task.labels.slice(0, 3).map(l => <LabelBadge key={l.id} label={l} />)}
          {task.labels.length > 3 && (
            <span className="text-xs text-muted-foreground">+{task.labels.length - 3}</span>
          )}
          {isOverdue && <Badge variant="destructive">OVERDUE</Badge>}
          {task.hasSubtasks && (
            <Badge
              variant={task.completedSubtaskCount === task.subtaskCount ? 'success' : 'secondary'}
              className="px-1.5 py-0.5 text-[10px]"
            >
              {task.completedSubtaskCount}/{task.subtaskCount} ✓
            </Badge>
          )}
        </div>

        {task.description && (
          <p className="my-[5px] text-sm text-foreground">{task.description}</p>
        )}

        {/* Inline subtask progress bar */}
        {task.hasSubtasks && (
          <div className="mt-1 max-w-[240px]">
            <SubtaskProgress
              completed={task.completedSubtaskCount}
              total={task.subtaskCount}
              percentage={task.progressPercentage}
              compact
            />
          </div>
        )}

        <p className="mt-[5px] text-xs text-muted-foreground">
          {task.dueDate && (
            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
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

      <div className="flex items-center gap-[5px]">
        {onToggleSubtaskExpand && (
          <button
            className="flex items-center justify-center rounded border-none bg-transparent p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => onToggleSubtaskExpand(task.id)}
            aria-label={isSubtaskExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
            aria-expanded={isSubtaskExpanded}
            title={task.hasSubtasks ? `${task.subtaskCount} subtask${task.subtaskCount !== 1 ? 's' : ''}` : 'Add subtasks'}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isSubtaskExpanded ? 'rotate-0' : '-rotate-90')} />
          </button>
        )}
        <Button
          variant="default"
          size="sm"
          onClick={() => onEdit(task)}
          aria-label={`Edit task "${task.title}"`}
        >
          Edit
        </Button>
        {/* Only show Assign button to task owner */}
        {task.isOwner !== false && onAssign && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAssign(task)}
            aria-label={`Assign task '${task.title}'`}
          >
            Assign
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete task "${task.title}"`}
        >
          Delete
        </Button>
      </div>
    </div>
  );
});

TaskItem.displayName = 'TaskItem';
