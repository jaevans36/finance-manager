import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransactionDetailPanel } from '../../src/components/finance/TransactionDetailPanel';
import { transactionsService } from '../../src/services/transactions-service';
import type { Transaction } from '../../src/types/finance';

jest.mock('../../src/services/transactions-service');

const mockUpdate = transactionsService.updateTransaction as jest.MockedFunction<typeof transactionsService.updateTransaction>;

const mockTx: Transaction = {
  id: 'tx-1',
  accountId: 'acc-1',
  categoryId: null,
  categoryName: null,
  type: 'Debit',
  amount: 45.99,
  currency: 'GBP',
  description: 'TESCO METRO',
  payee: 'Tesco',
  transactionDate: '2025-06-01',
  reference: null,
  isReviewed: false,
  isRecurring: false,
  isDuplicate: false,
  importSource: 'CsvImport',
  createdAt: '2025-06-01T10:00:00Z',
};

const mockCategories = [
  { id: 'cat-1', name: 'Groceries', colour: '#22C55E', icon: null, isSystem: true, parentId: null, children: null },
];

describe('TransactionDetailPanel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders transaction description and amount', () => {
    render(<TransactionDetailPanel transaction={mockTx} categories={mockCategories} onClose={jest.fn()} onUpdated={jest.fn()} />);
    expect(screen.getByText('Tesco')).toBeInTheDocument();
    expect(screen.getByText(/45\.99/)).toBeInTheDocument();
  });

  it('renders category selector', () => {
    render(<TransactionDetailPanel transaction={mockTx} categories={mockCategories} onClose={jest.fn()} onUpdated={jest.fn()} />);
    expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Groceries' })).toBeInTheDocument();
  });

  it('calls updateTransaction when category is changed', async () => {
    mockUpdate.mockResolvedValue({ ...mockTx, categoryId: 'cat-1', categoryName: 'Groceries' });
    render(<TransactionDetailPanel transaction={mockTx} categories={mockCategories} onClose={jest.fn()} onUpdated={jest.fn()} />);

    fireEvent.change(screen.getByRole('combobox', { name: /category/i }), { target: { value: 'cat-1' } });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith('tx-1', expect.objectContaining({ categoryId: 'cat-1' }));
    });
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(<TransactionDetailPanel transaction={mockTx} categories={mockCategories} onClose={onClose} onUpdated={jest.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows original description when payee differs', () => {
    render(<TransactionDetailPanel transaction={mockTx} categories={mockCategories} onClose={jest.fn()} onUpdated={jest.fn()} />);
    expect(screen.getByText('TESCO METRO')).toBeInTheDocument();
  });
});
