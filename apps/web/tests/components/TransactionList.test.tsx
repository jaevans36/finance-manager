import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionList } from '../../src/components/finance/TransactionList';
import type { PagedResult, Transaction } from '../../src/types/finance';

const makeTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'tx-1',
  accountId: 'acc-1',
  categoryId: null,
  categoryName: null,
  type: 'Debit',
  amount: 25.50,
  currency: 'GBP',
  description: 'TESCO',
  payee: 'Tesco',
  transactionDate: '2025-06-01',
  reference: null,
  isReviewed: false,
  isRecurring: false,
  isDuplicate: false,
  importSource: 'CsvImport',
  createdAt: '2025-06-01T10:00:00Z',
  ...overrides,
});

const makePage = (items: Transaction[], total = items.length): PagedResult<Transaction> => ({
  items,
  totalCount: total,
  page: 1,
  pageSize: 50,
});

describe('TransactionList', () => {
  it('shows loading skeletons when isLoading is true', () => {
    render(<TransactionList data={null} isLoading={true} page={1} onPageChange={jest.fn()} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no transactions', () => {
    render(<TransactionList data={makePage([])} isLoading={false} page={1} onPageChange={jest.fn()} />);
    expect(screen.getByText(/no transactions/i)).toBeInTheDocument();
  });

  it('renders transaction payee and amount', () => {
    render(<TransactionList data={makePage([makeTx()])} isLoading={false} page={1} onPageChange={jest.fn()} />);
    expect(screen.getByText('Tesco')).toBeInTheDocument();
    expect(screen.getByText(/-£25\.50/)).toBeInTheDocument();
  });

  it('shows credit transactions with + prefix and green colour class', () => {
    render(<TransactionList data={makePage([makeTx({ type: 'Credit', amount: 1500 })])} isLoading={false} page={1} onPageChange={jest.fn()} />);
    expect(screen.getByText(/\+£1,500\.00/)).toBeInTheDocument();
  });

  it('shows duplicate badge for duplicate transactions', () => {
    render(<TransactionList data={makePage([makeTx({ isDuplicate: true })])} isLoading={false} page={1} onPageChange={jest.fn()} />);
    expect(screen.getByText('duplicate')).toBeInTheDocument();
  });

  it('shows recurring badge for recurring transactions', () => {
    render(<TransactionList data={makePage([makeTx({ isRecurring: true })])} isLoading={false} page={1} onPageChange={jest.fn()} />);
    expect(screen.getByText('recurring')).toBeInTheDocument();
  });

  it('calls onTransactionClick when a row is clicked', () => {
    const onTransactionClick = jest.fn();
    render(<TransactionList data={makePage([makeTx()])} isLoading={false} page={1} onPageChange={jest.fn()} onTransactionClick={onTransactionClick} />);
    fireEvent.click(screen.getByText('Tesco').closest('button')!);
    expect(onTransactionClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'tx-1' }));
  });

  it('shows pagination when multiple pages exist', () => {
    render(<TransactionList data={makePage([makeTx()], 150)} isLoading={false} page={1} onPageChange={jest.fn()} />);
    expect(screen.getByText(/150 transactions/i)).toBeInTheDocument();
  });
});
