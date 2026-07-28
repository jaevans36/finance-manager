import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionFilters } from '../../src/components/finance/TransactionFilters';

const mockCategories = [
  { id: 'cat-1', name: 'Groceries', colour: '#22C55E', icon: 'shopping-cart', isSystem: true, parentId: null, children: null },
  { id: 'cat-2', name: 'Transport', colour: '#3B82F6', icon: 'car', isSystem: true, parentId: null, children: null },
];

describe('TransactionFilters', () => {
  it('renders search input', () => {
    render(<TransactionFilters categories={mockCategories} onFilterChange={jest.fn()} />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('renders category selector with All option and categories', () => {
    render(<TransactionFilters categories={mockCategories} onFilterChange={jest.fn()} />);
    expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /all categories/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Groceries' })).toBeInTheDocument();
  });

  it('renders type selector', () => {
    render(<TransactionFilters categories={mockCategories} onFilterChange={jest.fn()} />);
    expect(screen.getByRole('combobox', { name: /type/i })).toBeInTheDocument();
  });

  it('calls onFilterChange when search text changes', () => {
    const onFilterChange = jest.fn();
    render(<TransactionFilters categories={mockCategories} onFilterChange={onFilterChange} />);
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: 'tesco' } });
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'tesco' }));
  });

  it('calls onFilterChange when category is selected', () => {
    const onFilterChange = jest.fn();
    render(<TransactionFilters categories={mockCategories} onFilterChange={onFilterChange} />);
    fireEvent.change(screen.getByRole('combobox', { name: /category/i }), { target: { value: 'cat-1' } });
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ categoryId: 'cat-1' }));
  });

  it('calls onFilterChange when type is changed to Debit', () => {
    const onFilterChange = jest.fn();
    render(<TransactionFilters categories={mockCategories} onFilterChange={onFilterChange} />);
    fireEvent.change(screen.getByRole('combobox', { name: /type/i }), { target: { value: 'Debit' } });
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'Debit' }));
  });
});
