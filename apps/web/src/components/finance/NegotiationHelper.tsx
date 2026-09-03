import { useEffect, useState } from 'react';
import { Copy, MessageSquareText, Loader2 } from 'lucide-react';
import { insightsService } from '../../services/insights-service';
import { useToast } from '../../contexts/ToastContext';
import type { NegotiationScriptResponse } from '../../types/finance';

const fmtGbp = (v: number) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

export interface NegotiationRequest {
  merchant: string;
  requestId: number;
}

interface NegotiationHelperProps {
  merchants: string[];
  request: NegotiationRequest | null;
}

export function NegotiationHelper({ merchants, request }: NegotiationHelperProps) {
  const { success } = useToast();
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState<NegotiationScriptResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (merchantName: string) => {
    if (!merchantName) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const script = await insightsService.getNegotiationScript(merchantName);
      setResult(script);
    } catch {
      setError('No transaction history found for this merchant.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (request) {
      setSelected(request.merchant);
      void generate(request.merchant);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.requestId]);

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.script);
    success('Copied to clipboard');
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquareText className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Negotiation helper</h3>
      </div>

      <div className="flex gap-2">
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select a provider…</option>
          {merchants.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button
          onClick={() => generate(selected)}
          disabled={!selected || isLoading}
          className="text-sm font-medium px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Script'}
        </button>
      </div>

      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>}

      {result && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>
              {result.tenureMonths} month{result.tenureMonths !== 1 ? 's' : ''} · {fmtGbp(result.totalSpent)} total spent
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Copy size={12} /> Copy
            </button>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg border border-border bg-muted/30 p-3 text-sm text-gray-800 dark:text-gray-200 font-sans">
            {result.script}
          </pre>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
