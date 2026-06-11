import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { transactionsService } from '../../services/transactions-service';
import type { CsvImportResult, BankFormat } from '../../types/finance';
import { cn } from '../../lib/utils';

const BANK_FORMAT_LABELS: Record<BankFormat, string> = {
  barclays: 'Barclays',
  hsbc: 'HSBC',
  lloyds: 'Lloyds',
  monzo: 'Monzo',
  starling: 'Starling Bank',
  natwest: 'NatWest',
  generic: 'Generic (Date, Description, Amount)',
};

interface CsvImportProps {
  accountId: string;
  onImportComplete?: (result: CsvImportResult) => void;
}

export function CsvImport({ accountId, onImportComplete }: CsvImportProps) {
  const [selectedFormat, setSelectedFormat] = useState<BankFormat>('monzo');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      setError('Please select a CSV file');
      return;
    }
    setSelectedFile(file);
    setResult(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const importResult = await transactionsService.importCsv(accountId, selectedFormat, selectedFile);
      setResult(importResult);
      onImportComplete?.(importResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed — please check the file format');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Bank format selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Bank format
        </label>
        <select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value as BankFormat)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {(Object.entries(BANK_FORMAT_LABELS) as [BankFormat, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        )}
        onClick={() => document.getElementById('csv-file-input')?.click()}
      >
        <input
          id="csv-file-input"
          type="file"
          accept=".csv,.txt"
          className="sr-only"
          onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
        />
        <Upload className="h-8 w-8 text-gray-400 mb-2" />
        {selectedFile ? (
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedFile.name}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Drop a CSV file here, or click to browse
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Supports .csv files up to 10 MB</p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Import complete
          </div>
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{result.imported}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Imported</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{result.duplicates}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Duplicates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{result.skipped ?? 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Skipped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{result.errors}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Errors</div>
            </div>
          </div>

          {(result.skipMessages?.length ?? 0) > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-orange-700 dark:text-orange-400">Skipped rows:</p>
              {result.skipMessages.map((msg, i) => (
                <div key={i} className="flex items-start gap-1 text-xs text-orange-600 dark:text-orange-400">
                  <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          )}

          {result.errorMessages.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-red-700 dark:text-red-400">Errors:</p>
              {result.errorMessages.map((msg, i) => (
                <div key={i} className="flex items-start gap-1 text-xs text-red-600 dark:text-red-400">
                  <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Import button */}
      <button
        onClick={handleImport}
        disabled={!selectedFile || isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Importing…' : 'Import transactions'}
      </button>
    </div>
  );
}
