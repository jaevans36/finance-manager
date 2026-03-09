import { forwardRef } from 'react';
import { Search, X } from 'lucide-react';

interface TaskSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TaskSearch = forwardRef<HTMLInputElement, TaskSearchProps>((
  {
    value,
    onChange,
    placeholder = 'Search by title or description...'
  },
  ref
) => {
  return (
    <div className="relative mb-5">
      <Search
        size={18}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-card px-10 py-3 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/20"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center border-none bg-transparent p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
});

TaskSearch.displayName = 'TaskSearch';
