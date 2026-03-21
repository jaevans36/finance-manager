import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LabelPicker } from '../../src/components/labels/LabelPicker';
import { labelsService } from '../../src/services/labelsService';

jest.mock('../../src/services/labelsService');

const mockLabels = [
  { id: '1', name: 'Work', colourHex: '#21B8A4' },
  { id: '2', name: 'Personal', colourHex: '#f43f5e' },
];

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  (labelsService.getLabels as jest.Mock).mockResolvedValue(mockLabels);
});

describe('LabelPicker', () => {
  it('renders selected labels as badges', async () => {
    render(
      <LabelPicker selectedIds={['1']} onChange={jest.fn()} />,
      { wrapper }
    );
    await waitFor(() => expect(screen.getByText('Work')).toBeInTheDocument());
  });

  it('calls onChange when a label is toggled', async () => {
    const onChange = jest.fn();
    render(<LabelPicker selectedIds={[]} onChange={onChange} />, { wrapper });
    await waitFor(() => screen.getByText('Work'));
    fireEvent.click(screen.getByText('Work'));
    expect(onChange).toHaveBeenCalledWith(['1']);
  });

  it('removes a label when toggled off', async () => {
    const onChange = jest.fn();
    render(<LabelPicker selectedIds={['1']} onChange={onChange} />, { wrapper });
    await waitFor(() => screen.getByText('Work'));
    fireEvent.click(screen.getByText('Work'));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
