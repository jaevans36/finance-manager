import { useState } from 'react';
import { X, Check, Circle, Calendar as CalendarIcon, MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CalendarTask } from '../../types/calendar';
import type { Event } from '../../types/event';

const INFO_COLOR = '#898989';

const getBarColour = (pct: number): string => {
  if (pct >= 66) return 'bg-success';
  if (pct >= 33) return 'bg-warning';
  return 'bg-destructive';
};

const getPriorityBadgeClasses = (priority: string): string => {
  switch (priority) {
    case 'Critical':
    case 'High':
      return 'bg-destructive/15 text-destructive border-destructive/25';
    case 'Medium':
      return 'bg-muted text-foreground border-border';
    default:
      return 'bg-secondary text-muted-foreground border-border';
  }
};

interface DayTaskListModalProps {
  date: Date;
  tasks: CalendarTask[];
  events: Event[];
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>;
  onTaskClick: (task: CalendarTask) => void;
  onEventClick: (event: Event) => void;
  onCancel: () => void;
}

export const DayTaskListModal = ({ 
  date, 
  tasks,
  events, 
  onToggleTask, 
  onTaskClick,
  onEventClick, 
  onCancel 
}: DayTaskListModalProps) => {
  const [togglingTasks, setTogglingTasks] = useState<Set<string>>(new Set());

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatEventTime = (event: Event): string => {
    if (event.isAllDay) {
      return 'All Day';
    }
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const startTime = start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const endTime = end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    // Same day
    if (start.toDateString() === end.toDateString()) {
      return `${startTime} - ${endTime}`;
    }
    // Multi-day
    return `${start.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} ${startTime} - ${end.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} ${endTime}`;
  };

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    setTogglingTasks((prev) => new Set(prev).add(taskId));
    try {
      await onToggleTask(taskId, !currentCompleted);
    } finally {
      setTogglingTasks((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[90vh] w-full max-w-[600px] overflow-y-auto rounded-lg bg-background p-5 shadow-lg md:max-h-[80vh] md:p-6"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="m-0 text-xl font-bold text-foreground">Tasks for {formatDate(date)}</h2>
          <button
            onClick={onCancel}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded border-none bg-transparent text-muted-foreground transition-all hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:h-5 [&_svg]:w-5"
          >
            <X />
          </button>
        </div>

        {/* Date summary */}
        <div className="mb-5 rounded-lg bg-secondary px-4 py-3 text-center text-sm text-muted-foreground">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} • {events.length} {events.length === 1 ? 'event' : 'events'}
        </div>

        {tasks.length === 0 && events.length === 0 ? (
          <div className="px-5 py-10 text-center text-muted-foreground [&_p]:m-0 [&_p]:text-sm [&_svg]:mx-auto [&_svg]:mb-4 [&_svg]:h-12 [&_svg]:w-12 [&_svg]:opacity-30">
            <Circle />
            <p>No tasks or events scheduled for this date</p>
          </div>
        ) : (
          <>
            {tasks.length > 0 && (
              <>
                <h3 className="mb-3 mt-0 flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground first-of-type:mt-0 [&_svg]:h-4 [&_svg]:w-4">
                  <Check /> Tasks
                </h3>
                <div className="flex flex-col gap-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-lg bg-secondary p-4 transition-all hover:bg-border',
                        task.isCompleted && 'opacity-60',
                      )}
                      onClick={() => onTaskClick(task)}
                    >
                      <button
                        className={cn(
                          'flex h-6 w-6 min-w-[24px] items-center justify-center rounded-full border-2 p-0 transition-all',
                          task.isCompleted
                            ? 'border-success-foreground bg-success-foreground'
                            : 'border-border bg-transparent hover:border-success-foreground hover:bg-success/20',
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTask(task.id, task.isCompleted);
                        }}
                        disabled={togglingTasks.has(task.id)}
                        aria-label={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {task.isCompleted && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                      </button>

                      <div className="flex-1">
                        <h3
                          className={cn(
                            'm-0 mb-1 text-base font-semibold text-foreground',
                            task.isCompleted && 'line-through',
                          )}
                        >
                          {task.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={cn(
                              'inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold',
                              getPriorityBadgeClasses(task.priority),
                            )}
                          >
                            {task.priority}
                          </span>
                          {task.groupName && (
                            <span
                              className="inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium text-foreground"
                              style={{
                                backgroundColor: task.groupColor ? `${task.groupColor}20` : undefined,
                                borderColor: task.groupColor ? `${task.groupColor}40` : undefined,
                              }}
                            >
                              {task.groupName}
                            </span>
                          )}
                        </div>
                        {task.hasSubtasks && task.subtaskCount && task.subtaskCount > 0 && (
                          <div className="mt-1 flex items-center gap-2">
                            <div className="h-1 max-w-[120px] flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-[width] duration-300 ease-out',
                                  getBarColour(task.progressPercentage ?? 0),
                                )}
                                style={{ width: `${task.progressPercentage ?? 0}%` }}
                              />
                            </div>
                            <span className="whitespace-nowrap text-xs text-muted-foreground">
                              {task.completedSubtaskCount}/{task.subtaskCount} subtasks
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {events.length > 0 && (
              <>
                <h3 className="mb-3 mt-6 flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground first-of-type:mt-0 [&_svg]:h-4 [&_svg]:w-4">
                  <CalendarIcon /> Events
                </h3>
                <div className="flex flex-col gap-2">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="cursor-pointer rounded-lg border-l-4 bg-secondary p-4 transition-all hover:translate-x-0.5 hover:bg-muted"
                      style={{ borderLeftColor: INFO_COLOR }}
                      onClick={() => onEventClick(event)}
                    >
                      <h4 className="m-0 mb-2 text-[15px] font-semibold text-foreground">
                        {event.title}
                      </h4>
                      <div className="mb-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                        {formatEventTime(event)}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {event.isAllDay && (
                          <span className="inline-flex items-center rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
                            All Day
                          </span>
                        )}
                        {event.location && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
                            <MapPin size={12} /> {event.location}
                          </span>
                        )}
                        {event.groupName && (
                          <span
                            className="inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium text-foreground"
                            style={{
                              backgroundColor: event.groupColour ? `${event.groupColour}20` : undefined,
                              borderColor: event.groupColour ? `${event.groupColour}40` : undefined,
                            }}
                          >
                            {event.groupName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};
