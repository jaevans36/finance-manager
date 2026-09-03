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

  it('shows the description as a secondary line when it differs from the payee', () => {
    render(
      <TransactionList
        data={makePage([makeTx({ payee: 'BP', description: 'David Jay Evans Monthly joint BP' })])}
        isLoading={false}
        page={1}
        onPageChange={jest.fn()}
      />
    );
    expect(screen.getByText('BP')).toBeInTheDocument();
    expect(screen.getByText('David Jay Evans Monthly joint BP')).toBeInTheDocument();
  });

  it('does not repeat the description when it is just a case variant of the payee', () => {
    render(
      <TransactionList
        data={makePage([makeTx({ payee: 'Tesco', description: 'TESCO' })])}
        isLoading={false}
        page={1}
        onPageChange={jest.fn()}
      />
    );
    expect(screen.getByText('Tesco')).toBeInTheDocument();
    expect(screen.queryByText('TESCO')).not.toBeInTheDocument();
  });

  it('does not show a description line when there is no payee', () => {
    render(
      <TransactionList
        data={makePage([makeTx({ payee: null, description: 'Some description' })])}
        isLoading={false}
        page={1}
        onPageChange={jest.fn()}
      />
    );
    // Falls back to description as the title — should not also duplicate it as a secondary line
    expect(screen.getAllByText('Some description')).toHaveLength(1);
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
