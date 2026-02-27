import { cn } from '../../../lib/utils';

interface GroupFilterProps {
  groups: string[];
  selectedGroup: string | null;
  onGroupChange: (group: string | null) => void;
  label?: string;
}

export const GroupFilter = ({
  groups,
  selectedGroup,
  onGroupChange,
  label = 'Filter by group:',
}: GroupFilterProps) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <button
        className={cn(
          'px-3 py-1.5 border rounded-lg text-[13px] cursor-pointer transition-all duration-200 whitespace-nowrap hover:scale-105 hover:border-primary',
          selectedGroup === null
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-transparent text-foreground',
        )}
        onClick={() => onGroupChange(null)}
      >
        All Groups
      </button>
      {groups.map((group) => (
        <button
          key={group}
          className={cn(
            'px-3 py-1.5 border rounded-lg text-[13px] cursor-pointer transition-all duration-200 whitespace-nowrap hover:scale-105 hover:border-primary',
            selectedGroup === group
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-transparent text-foreground',
          )}
          onClick={() => onGroupChange(group)}
        >
          {group}
        </button>
      ))}
    </div>
  );
};
