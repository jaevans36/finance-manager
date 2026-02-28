import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Zap, Clock, Play, Coffee, ChevronRight, RefreshCw } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useSuggestions, useUpdateTaskStatus } from '../../hooks/queries/useTasks';
import { useWipSummary } from '../../hooks/queries/useSettings';
import { EnergyBadge } from '../../components/tasks/EnergyBadge';
import { QuadrantBadge } from '../../components/tasks/QuadrantBadge';
import { formatDuration } from '../../components/tasks/DurationInput';
import { TaskDetailModal } from '../../components/tasks/TaskDetailModal';
import { PageLayout } from '../../components/layout/PageLayout';
import { taskService } from '../../services/taskService';
import type { Task, EnergyLevel, TaskStatus, UrgencyLevel, ImportanceLevel } from '../../services/taskService';

const STORAGE_KEY = 'whatCanIDo-preferences';

interface Preferences {
  energy: EnergyLevel | null;
  maxMinutes: number | null;
}

const loadPreferences = (): Preferences => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as Preferences;
  } catch {
    // Ignore parse errors
  }
  return { energy: null, maxMinutes: null };
};

const savePreferences = (prefs: Preferences) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
};

const energyOptions: Array<{ value: EnergyLevel; label: string; colour: string; description: string }> = [
  { value: 'Low', label: 'Low Energy', colour: 'bg-success', description: 'Routine, admin tasks' },
  { value: 'Medium', label: 'Medium Energy', colour: 'bg-warning', description: 'Moderate focus tasks' },
  { value: 'High', label: 'High Energy', colour: 'bg-destructive', description: 'Deep work, complex tasks' },
];

const timeOptions = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '4 hours', minutes: 240 },
];

const SuggestionCard = ({
  task,
  onStart,
  onViewDetail,
  isStarting,
  atWipLimit,
}: {
  task: Task;
  onStart: (task: Task) => void;
  onViewDetail: (task: Task) => void;
  isStarting: boolean;
  atWipLimit: boolean;
}) => {
  const getPriorityColour = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'text-destructive';
      case 'High': return 'text-warning';
      case 'Medium': return 'text-brand';
      case 'Low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const isInProgress = task.status === 'InProgress';

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md',
        isInProgress && 'border-l-4 border-l-blue-500',
      )}
    >
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onViewDetail(task)}>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-medium text-foreground truncate">{task.title}</h3>
          {task.quadrant && <QuadrantBadge quadrant={task.quadrant} size="sm" />}
          {task.energyLevel && <EnergyBadge energy={task.energyLevel} size="sm" />}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className={cn('font-medium', getPriorityColour(task.priority))}>{task.priority}</span>
          {task.estimatedMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(task.estimatedMinutes)}
            </span>
          )}
          {task.dueDate && (
            <span>Due {new Date(task.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          )}
          {task.groupName && (
            <span className="flex items-center gap-1">
              {task.groupColour && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: task.groupColour }} />}
              {task.groupName}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isInProgress ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-muted px-2.5 py-1 text-xs font-medium text-brand-muted-foreground">
            <Play className="h-3 w-3" /> In Progress
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onStart(task)}
            disabled={isStarting || atWipLimit}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
            title={atWipLimit ? 'WIP limit reached — complete a task first' : 'Start this task'}
          >
            <Play className="h-3 w-3" />
            Start
          </button>
        )}
        <button
          type="button"
          onClick={() => onViewDetail(task)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="View details"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const EmptySuggestions = ({ hasFilters }: { hasFilters: boolean }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <Coffee className="h-12 w-12 text-muted-foreground/40 mb-4" />
    <h3 className="text-lg font-semibold text-foreground mb-2">
      {hasFilters ? 'No matching tasks' : 'All caught up!'}
    </h3>
    <p className="text-sm text-muted-foreground max-w-sm">
      {hasFilters
        ? 'Try adjusting your energy level or available time to see more suggestions.'
        : 'You have no pending tasks. Time for a well-deserved break!'}
    </p>
  </div>
);

const WhatCanIDoPage = () => {
  const toast = useToast();
  const [prefs, setPrefs] = useState<Preferences>(loadPreferences);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null);

  const queryParams = {
    ...(prefs.energy ? { energy: prefs.energy } : {}),
    ...(prefs.maxMinutes ? { maxMinutes: prefs.maxMinutes } : {}),
  };
  const hasFilters = prefs.energy !== null || prefs.maxMinutes !== null;

  const { data: suggestions = [], isLoading, refetch } = useSuggestions(
    Object.keys(queryParams).length > 0 ? queryParams : undefined,
    true,
  );

  const { data: wipSummary } = useWipSummary();
  const updateStatus = useUpdateTaskStatus();

  const atWipLimit = wipSummary
    ? wipSummary.inProgressCount >= (wipSummary.globalWipLimit ?? 0) && (wipSummary.globalWipLimit ?? 0) > 0
    : false;

  // Persist preferences on change
  useEffect(() => {
    savePreferences(prefs);
  }, [prefs]);

  const handleEnergyChange = (energy: EnergyLevel | null) => {
    setPrefs((p) => ({ ...p, energy: p.energy === energy ? null : energy }));
  };

  const handleTimeChange = (maxMinutes: number | null) => {
    setPrefs((p) => ({ ...p, maxMinutes: p.maxMinutes === maxMinutes ? null : maxMinutes }));
  };

  const handleStartTask = useCallback(
    async (task: Task) => {
      setStartingTaskId(task.id);
      try {
        await updateStatus.mutateAsync({ id: task.id, status: 'InProgress' as TaskStatus });
        toast.success(`Started: ${task.title}`);
        refetch();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to start task';
        toast.error(message);
      } finally {
        setStartingTaskId(null);
      }
    },
    [updateStatus, toast, refetch],
  );

  const handleStatusChange = useCallback(
    async (taskId: string, status: TaskStatus, blockedReason?: string) => {
      try {
        await taskService.updateTaskStatus(taskId, status, blockedReason);
        toast.success('Status updated');
        refetch();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update status';
        toast.error(message);
      }
    },
    [toast, refetch],
  );

  const handleClassificationChange = useCallback(
    async (taskId: string, urgency: UrgencyLevel | null, importance: ImportanceLevel | null) => {
      try {
        await taskService.classifyTask(
          taskId,
          urgency ?? undefined,
          importance ?? undefined,
        );
        toast.success('Classification updated');
        refetch();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to update classification';
        toast.error(message);
      }
    },
    [toast, refetch],
  );

  // Split suggestions into in-progress (show first) and others
  const inProgressTasks = suggestions.filter((t) => t.status === 'InProgress');
  const availableTasks = suggestions.filter((t) => t.status !== 'InProgress');

  return (
    <PageLayout
      title="Suggestions"
      subtitle="Select your current energy level and available time to get personalised task suggestions."
      headerActions={
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Refresh suggestions"
        >
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
        </button>
      }
    >
      <div className="space-y-6">

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        {/* Energy selector */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            My Energy Right Now
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {energyOptions.map((option) => {
              const isActive = prefs.energy === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleEnergyChange(option.value)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 transition-all',
                    isActive
                      ? option.value === 'Low'
                        ? 'border-success/40 bg-success/5 dark:border-success/40 dark:bg-success/10'
                        : option.value === 'Medium'
                          ? 'border-warning/40 bg-warning/5 dark:border-warning/40 dark:bg-warning/10'
                          : 'border-destructive/40 bg-destructive/5 dark:border-destructive/40 dark:bg-destructive/10'
                      : 'border-border bg-background hover:bg-muted',
                  )}
                >
                  <span className={cn('inline-block h-3 w-3 rounded-full', option.colour)} />
                  <div className="text-left">
                    <div className="text-sm font-medium text-foreground">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time selector */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Available Time
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {timeOptions.map((option) => {
              const isActive = prefs.maxMinutes === option.minutes;
              return (
                <button
                  key={option.minutes}
                  type="button"
                  onClick={() => handleTimeChange(option.minutes)}
                  className={cn(
                    'rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
                    isActive
                      ? 'border-primary bg-primary/10 text-primary dark:bg-primary/20'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active filter summary */}
        {hasFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing tasks
              {prefs.energy && ` needing ${prefs.energy.toLowerCase()} energy or less`}
              {prefs.energy && prefs.maxMinutes && ' and'}
              {prefs.maxMinutes && ` taking ${formatDuration(prefs.maxMinutes)} or less`}
            </p>
            <button
              type="button"
              onClick={() => setPrefs({ energy: null, maxMinutes: null })}
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* WIP Limit Warning */}
      {atWipLimit && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 dark:border-warning/30 dark:bg-warning/10">
          <p className="text-sm text-warning-foreground dark:text-warning">
            <strong>WIP limit reached</strong> — you have {wipSummary?.inProgressCount} tasks in progress.
            Complete one before starting another.
          </p>
        </div>
      )}

      {/* In Progress Tasks (shown first) */}
      {inProgressTasks.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-brand">
            Currently Working On ({inProgressTasks.length})
          </h2>
          <div className="space-y-2">
            {inProgressTasks.map((task) => (
              <SuggestionCard
                key={task.id}
                task={task}
                onStart={handleStartTask}
                onViewDetail={setSelectedTask}
                isStarting={startingTaskId === task.id}
                atWipLimit={atWipLimit}
              />
            ))}
          </div>
        </div>
      )}

      {/* Suggested Tasks */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-muted" />
          ))}
        </div>
      ) : availableTasks.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Suggestions ({availableTasks.length})
          </h2>
          <div className="space-y-2">
            {availableTasks.map((task) => (
              <SuggestionCard
                key={task.id}
                task={task}
                onStart={handleStartTask}
                onViewDetail={setSelectedTask}
                isStarting={startingTaskId === task.id}
                atWipLimit={atWipLimit}
              />
            ))}
          </div>
        </div>
      ) : (
        !isLoading && <EmptySuggestions hasFilters={hasFilters} />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onSubmit={async () => { /* read-only from suggestions */ }}
          onCancel={() => setSelectedTask(null)}
          onStatusChange={handleStatusChange}
          onClassificationChange={handleClassificationChange}
        />
      )}
      </div>
    </PageLayout>
  );
};

export default WhatCanIDoPage;
