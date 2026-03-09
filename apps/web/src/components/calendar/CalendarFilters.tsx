import { X, ListTodo, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TaskGroup {
  id: string;
  name: string;
  colour: string;
}

interface CalendarFiltersProps {
  groups: TaskGroup[];
  selectedGroupId: string;
  selectedPriorities: string[];
  taskCount: number;
  eventCount: number;
  showTasks: boolean;
  showEvents: boolean;
  onGroupChange: (groupId: string) => void;
  onPriorityChange: (priorities: string[]) => void;
  onShowTasksChange: (show: boolean) => void;
  onShowEventsChange: (show: boolean) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export const CalendarFilters = ({
  groups,
  selectedGroupId,
  selectedPriorities,
  taskCount,
  eventCount,
  showTasks,
  showEvents,
  onGroupChange,
  onPriorityChange,
  onShowTasksChange,
  onShowEventsChange,
  onClearFilters,
  hasActiveFilters,
}: CalendarFiltersProps) => {
  const handlePriorityToggle = (priority: string) => {
    if (selectedPriorities.includes(priority)) {
      onPriorityChange(selectedPriorities.filter((p) => p !== priority));
    } else {
      onPriorityChange([...selectedPriorities, priority]);
    }
  };

  return (
    <div className="mb-6 flex flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center md:gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-semibold text-foreground">Show:</label>
        <div className="flex gap-2 rounded bg-secondary p-1">
          <button
            type="button"
            className={cn(
              'rounded px-3 py-1.5 text-sm font-medium transition-all',
              showTasks
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-foreground hover:bg-card',
            )}
            onClick={() => onShowTasksChange(!showTasks)}
          >
            <ListTodo size={16} className="mr-1 inline" /> Tasks
          </button>
          <button
            type="button"
            className={cn(
              'rounded px-3 py-1.5 text-sm font-medium transition-all',
              showEvents
                ? 'bg-primary text-primary-foreground'
                : 'bg-transparent text-foreground hover:bg-card',
            )}
            onClick={() => onShowEventsChange(!showEvents)}
          >
            <Calendar size={16} className="mr-1 inline" /> Events
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="group-filter" className="text-sm font-semibold text-foreground">Group:</label>
        <select
          id="group-filter"
          value={selectedGroupId}
          onChange={(e) => onGroupChange(e.target.value)}
          className="cursor-pointer rounded border border-input bg-secondary px-3 py-2 text-sm text-foreground transition-all hover:border-muted-foreground focus:border-primary focus:outline-none"
        >
          <option value="">All Groups</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-semibold text-foreground">Priority:</label>
        <div className="flex gap-2 rounded bg-secondary p-1">
          {['Critical', 'High', 'Medium', 'Low'].map((priority) => (
            <button
              key={priority}
              type="button"
              className={cn(
                'rounded px-3 py-1.5 text-sm font-medium transition-all',
                selectedPriorities.includes(priority)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-transparent text-foreground hover:bg-card',
              )}
              onClick={() => handlePriorityToggle(priority)}
            >
              {priority}
            </button>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1.5 rounded border border-border px-3 py-2 text-sm text-muted-foreground transition-all hover:border-destructive hover:bg-secondary hover:text-destructive [&_svg]:h-4 [&_svg]:w-4"
        >
          <X />
          Clear Filters
        </button>
      )}

      <div className="rounded bg-secondary p-2 text-center text-sm font-semibold text-primary md:ml-auto md:bg-transparent md:p-0 md:text-left">
        {showTasks && showEvents
          ? `${taskCount} tasks • ${eventCount} events`
          : showTasks
          ? `${taskCount} tasks`
          : showEvents
          ? `${eventCount} events`
          : 'No filters active'}
      </div>
    </div>
  );
};
