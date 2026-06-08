import type { Category, TransactionType } from '../../types/finance';
import type { TransactionFilters as Filters } from '../../services/transactions-service';

interface TransactionFiltersProps {
  categories: Category[];
  onFilterChange: (filters: Partial<Filters>) => void;
  currentFilters?: Partial<Filters>;
}

export function TransactionFilters({ categories, onFilterChange, currentFilters = {} }: TransactionFiltersProps) {
  const fieldClass = 'rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input
        type="search"
        placeholder="Search transactions…"
        defaultValue={currentFilters.search ?? ''}
        onChange={e => onFilterChange({ search: e.target.value })}
        className={`${fieldClass} min-w-[180px]`}
        aria-label="Search transactions"
      />

      <div>
        <label htmlFor="filter-category" className="sr-only">Category</label>
        <select
          id="filter-category"
          aria-label="Category"
          defaultValue={currentFilters.categoryId ?? ''}
          onChange={e => onFilterChange({ categoryId: e.target.value || undefined })}
          className={fieldClass}
        >
          <option value="">All categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-type" className="sr-only">Type</label>
        <select
          id="filter-type"
          aria-label="Type"
          defaultValue={currentFilters.type ?? ''}
          onChange={e => onFilterChange({ type: (e.target.value as TransactionType) || undefined })}
          className={fieldClass}
        >
          <option value="">All types</option>
          <option value="Debit">Money out</option>
          <option value="Credit">Money in</option>
          <option value="Transfer">Transfers</option>
        </select>
      </div>

      <input
        type="date"
        aria-label="From date"
        defaultValue={currentFilters.from ?? ''}
        onChange={e => onFilterChange({ from: e.target.value || undefined })}
        className={fieldClass}
      />

      <input
        type="date"
        aria-label="To date"
        defaultValue={currentFilters.to ?? ''}
        onChange={e => onFilterChange({ to: e.target.value || undefined })}
        className={fieldClass}
      />
    </div>
  );
}
