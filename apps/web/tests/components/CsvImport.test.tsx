import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CsvImport } from '../../src/components/finance/CsvImport';
import { transactionsService } from '../../src/services/transactions-service';

jest.mock('../../src/services/transactions-service');

const mockImportCsv = transactionsService.importCsv as jest.MockedFunction<typeof transactionsService.importCsv>;

const makeFile = (name = 'statement.csv') =>
  new File(['Date,Description,Amount\n01/01/2025,TESCO,-25.50'], name, { type: 'text/csv' });

describe('CsvImport', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders bank format selector with all 7 formats', () => {
    render(<CsvImport accountId="acc-1" />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Barclays' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Monzo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Starling Bank' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'HSBC' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Lloyds' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'NatWest' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /generic/i })).toBeInTheDocument();
  });

  it('renders the drop zone', () => {
    render(<CsvImport accountId="acc-1" />);
    expect(screen.getByText(/drop a csv file/i)).toBeInTheDocument();
  });

  it('import button is disabled when no file is selected', () => {
    render(<CsvImport accountId="acc-1" />);
    expect(screen.getByRole('button', { name: /import/i })).toBeDisabled();
  });

  it('shows selected filename after file is chosen', () => {
    render(<CsvImport accountId="acc-1" />);
    const input = document.getElementById('csv-file-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('mybank.csv')] } });
    expect(screen.getByText('mybank.csv')).toBeInTheDocument();
  });

  it('shows import summary after successful import', async () => {
    mockImportCsv.mockResolvedValue({ imported: 10, duplicates: 2, errors: 0, errorMessages: [], batchId: 'batch-1' });

    render(<CsvImport accountId="acc-1" />);
    const input = document.getElementById('csv-file-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile()] } });
    fireEvent.click(screen.getByRole('button', { name: /import/i }));

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText(/import complete/i)).toBeInTheDocument();
    });
  });

  it('shows error message when import fails', async () => {
    mockImportCsv.mockRejectedValue(new Error('Server error'));

    render(<CsvImport accountId="acc-1" />);
    const input = document.getElementById('csv-file-input') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile()] } });
    fireEvent.click(screen.getByRole('button', { name: /import/i }));

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
  });
});
