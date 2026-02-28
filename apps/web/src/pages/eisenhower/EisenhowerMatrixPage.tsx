import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '../../contexts/ToastContext';
import { useMatrixTasks, useClassifyTask, useBulkClassify, useAutoClassifyPreview } from '../../hooks/queries/useTasks';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Separator } from '../../components/ui/separator';
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal';
import { taskService } from '../../services/taskService';
import type {
  Task,
  TaskStatus,
  UrgencyLevel,
  ImportanceLevel,
  MatrixResponse,
  ClassificationSuggestion,
} from '../../services/taskService';
import {
  LayoutGrid,
  Sparkles,
  AlertTriangle,
  Clock,
  Users,
  Trash2,
  HelpCircle,
  Filter,
} from 'lucide-react';

// =============================================================================
// Quadrant Configuration
// =============================================================================

const quadrantConfig: Record<string, {
  title: string;
  subtitle: string;
  icon: typeof AlertTriangle;
  borderColour: string;
  headerBg: string;
  key: keyof MatrixResponse;
}> = {
  Q1: {
    title: 'Do First',
    subtitle: 'Urgent & Important',
    icon: AlertTriangle,
    borderColour: 'border-destructive/30 dark:border-destructive/40',
    headerBg: 'bg-destructive/5 dark:bg-destructive/10',
    key: 'q1DoFirst',
  },
  Q2: {
    title: 'Schedule',
    subtitle: 'Not Urgent & Important',
    icon: Clock,
    borderColour: 'border-brand/30 dark:border-brand/40',
    headerBg: 'bg-brand/5 dark:bg-brand/10',
    key: 'q2Schedule',
  },
  Q3: {
    title: 'Delegate',
    subtitle: 'Urgent & Not Important',
    icon: Users,
    borderColour: 'border-warning/30 dark:border-warning/40',
    headerBg: 'bg-warning/5 dark:bg-warning/10',
    key: 'q3Delegate',
  },
  Q4: {
    title: 'Eliminate',
    subtitle: 'Not Urgent & Not Important',
    icon: Trash2,
    borderColour: 'border-border',
    headerBg: 'bg-muted',
    key: 'q4Eliminate',
  },
};

// =============================================================================
// MatrixTaskCard
// =============================================================================

interface MatrixTaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

const priorityColour: Record<string, string> = {
  Critical: 'text-destructive',
  High: 'text-warning',
  Medium: 'text-brand',
  Low: 'text-muted-foreground',
};

const MatrixTaskCard = ({ task, onClick }: MatrixTaskCardProps) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;

  return (
    <button
      type="button"
      onClick={() => onClick(task)}
      className={cn(
        'w-full rounded-md border bg-background p-2.5 text-left transition-all',
        'hover:shadow-sm hover:ring-1 hover:ring-ring/20',
        task.completed && 'opacity-50',
      )}
    >
      <p className="line-clamp-2 text-sm font-medium text-foreground">
        {task.title}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className={cn('text-[10px] font-medium', priorityColour[task.priority])}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className={cn('text-[10px]', isOverdue ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
            {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        )}
        {task.groupName && (
          <span
            className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: task.groupColour || undefined }}
            />
            {task.groupName}
          </span>
        )}
      </div>
    </button>
  );
};

// =============================================================================
// MatrixQuadrant
// =============================================================================

interface MatrixQuadrantProps {
  quadrant: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const MatrixQuadrant = ({ quadrant, tasks, onTaskClick }: MatrixQuadrantProps) => {
  const config = quadrantConfig[quadrant];
  const Icon = config.icon;

  return (
    <Card className={cn('flex flex-col border-2', config.borderColour)}>
      <CardHeader className={cn('px-3 py-2', config.headerBg)}>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4" />
          <span className="font-semibold">{quadrant} · {config.title}</span>
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {tasks.length}
          </Badge>
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">{config.subtitle}</p>
      </CardHeader>
      <CardContent className="flex-1 space-y-1.5 overflow-y-auto p-2">
        {tasks.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No tasks in this quadrant
          </p>
        ) : (
          tasks.map((task) => (
            <MatrixTaskCard key={task.id} task={task} onClick={onTaskClick} />
          ))
        )}
      </CardContent>
    </Card>
  );
};

// =============================================================================
// UnclassifiedSection
// =============================================================================

interface UnclassifiedSectionProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAutoClassify: () => void;
  isAutoClassifying: boolean;
  suggestions: ClassificationSuggestion[];
  onAcceptSuggestion: (taskId: string, urgency: UrgencyLevel, importance: ImportanceLevel) => void;
}

const UnclassifiedSection = ({
  tasks,
  onTaskClick,
  onAutoClassify,
  isAutoClassifying,
  suggestions,
  onAcceptSuggestion,
}: UnclassifiedSectionProps) => {
  if (tasks.length === 0) return null;

  const suggestionMap = new Map(suggestions.map((s) => [s.taskId, s]));

  return (
    <Card className="border-dashed">
      <CardHeader className="px-3 py-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">Unclassified</span>
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {tasks.length}
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-2">
          <p className="flex-1 text-[11px] text-muted-foreground">
            These tasks need urgency and importance to appear on the matrix
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onAutoClassify}
            disabled={isAutoClassifying}
            className="shrink-0 text-xs"
          >
            <Sparkles className="mr-1 h-3 w-3" />
            {isAutoClassifying ? 'Analysing...' : 'Auto-classify'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-1.5 p-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tasks.map((task) => {
          const suggestion = suggestionMap.get(task.id);
          return (
            <div key={task.id} className="space-y-1">
              <MatrixTaskCard task={task} onClick={onTaskClick} />
              {suggestion && suggestion.suggestedUrgency && suggestion.suggestedImportance && (
                <button
                  type="button"
                  onClick={() =>
                    onAcceptSuggestion(
                      task.id,
                      suggestion.suggestedUrgency as UrgencyLevel,
                      suggestion.suggestedImportance as ImportanceLevel,
                    )
                  }
                  className={cn(
                    'flex w-full items-center gap-1 rounded-md px-2 py-1',
                    'border border-warning/20 bg-warning/5 text-[10px] text-warning-foreground',
                    'transition-colors hover:bg-warning/10',
                    'dark:border-warning/20 dark:bg-warning/10 dark:text-warning dark:hover:bg-warning/15',
                  )}
                >
                  <Sparkles className="h-3 w-3" />
                  Apply: {suggestion.suggestedQuadrant}
                </button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

// =============================================================================
// EisenhowerMatrixPage
// =============================================================================

const EisenhowerMatrixPage = () => {
  const toast = useToast();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [suggestions, setSuggestions] = useState<ClassificationSuggestion[]>([]);

  const { data: matrix, isLoading, error } = useMatrixTasks({ includeCompleted: showCompleted });
  const classifyMutation = useClassifyTask();
  const bulkClassifyMutation = useBulkClassify();
  const autoClassifyPreview = useAutoClassifyPreview();

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  const handleAutoClassify = useCallback(async () => {
    try {
      const result = await autoClassifyPreview.mutateAsync();
      setSuggestions(result);
      toast.info(`Found suggestions for ${result.length} task${result.length !== 1 ? 's' : ''}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to auto-classify';
      toast.error(message);
    }
  }, [autoClassifyPreview, toast]);

  const handleAcceptSuggestion = useCallback(async (taskId: string, urgency: UrgencyLevel, importance: ImportanceLevel) => {
    try {
      await classifyMutation.mutateAsync({ id: taskId, urgency, importance });
      setSuggestions((prev) => prev.filter((s) => s.taskId !== taskId));
      toast.success('Classification applied');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to classify';
      toast.error(message);
    }
  }, [classifyMutation, toast]);

  const handleAcceptAllSuggestions = useCallback(async () => {
    const validSuggestions = suggestions.filter(
      (s) => s.suggestedUrgency && s.suggestedImportance,
    );
    if (validSuggestions.length === 0) return;

    try {
      await bulkClassifyMutation.mutateAsync(
        validSuggestions.map((s) => ({
          taskId: s.taskId,
          urgency: s.suggestedUrgency as UrgencyLevel,
          importance: s.suggestedImportance as ImportanceLevel,
        })),
      );
      setSuggestions([]);
      toast.success(`Classified ${validSuggestions.length} tasks`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to bulk classify';
      toast.error(message);
    }
  }, [suggestions, bulkClassifyMutation, toast]);

  const handleStatusChange = useCallback(async (id: string, status: TaskStatus, blockedReason?: string) => {
    try {
      const updated = await taskService.updateTaskStatus(id, status, blockedReason);
      setSelectedTask(updated);
      toast.success(`Status changed to ${status.replace(/([A-Z])/g, ' $1').trim()}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update status';
      toast.error(message);
    }
  }, [toast]);

  const handleClassificationChange = useCallback(async (id: string, urgency: UrgencyLevel | null, importance: ImportanceLevel | null) => {
    try {
      const updated = await taskService.classifyTask(id, urgency ?? undefined, importance ?? undefined);
      setSelectedTask(updated);
      toast.success('Classification updated');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to classify';
      toast.error(message);
    }
  }, [toast]);

  const handleTaskSubmit = useCallback(async (
    id: string,
    data: { title: string; description?: string; priority?: 'Low' | 'Medium' | 'High' | 'Critical'; dueDate?: string },
  ) => {
    try {
      const updated = await taskService.updateTask(id, data);
      setSelectedTask(updated);
      toast.success('Task updated');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update task';
      toast.error(message);
    }
  }, [toast]);

  // Total counts
  const totalClassified = matrix
    ? matrix.q1DoFirst.length + matrix.q2Schedule.length + matrix.q3Delegate.length + matrix.q4Eliminate.length
    : 0;
  const totalUnclassified = matrix?.unclassified.length ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <LayoutGrid className="h-5 w-5" />
            Eisenhower Matrix
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Prioritise tasks by urgency and importance
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalUnclassified > 0 && suggestions.length > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleAcceptAllSuggestions}
              disabled={bulkClassifyMutation.isPending}
            >
              <Sparkles className="mr-1 h-3 w-3" />
              Apply all ({suggestions.length})
            </Button>
          )}
          <Button
            variant={showCompleted ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            <Filter className="mr-1 h-3 w-3" />
            {showCompleted ? 'Hide completed' : 'Show completed'}
          </Button>
        </div>
      </div>

      {/* Summary Badges */}
      {matrix && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{totalClassified} classified</Badge>
          {totalUnclassified > 0 && (
            <Badge variant="outline" className="text-warning">
              {totalUnclassified} unclassified
            </Badge>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive dark:border-destructive/20 dark:bg-destructive/10">
          Failed to load matrix: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {/* Matrix Grid */}
      {matrix && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
              <MatrixQuadrant
                key={q}
                quadrant={q}
                tasks={matrix[quadrantConfig[q].key]}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>

          <Separator />

          {/* Unclassified section */}
          <UnclassifiedSection
            tasks={matrix.unclassified}
            onTaskClick={handleTaskClick}
            onAutoClassify={handleAutoClassify}
            isAutoClassifying={autoClassifyPreview.isPending}
            suggestions={suggestions}
            onAcceptSuggestion={handleAcceptSuggestion}
          />
        </>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onSubmit={handleTaskSubmit}
          onCancel={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
          onClassificationChange={handleClassificationChange}
        />
      )}
    </div>
  );
};

export default EisenhowerMatrixPage;
