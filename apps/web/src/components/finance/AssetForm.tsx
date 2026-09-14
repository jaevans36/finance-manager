import { useState } from 'react';
import { assetsService } from '../../services/assets-service';
import type { Asset, AssetType } from '../../types/finance';
import { getErrorMessage } from '../../utils/errorHelpers';

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'Property', label: 'Property' },
  { value: 'Vehicle', label: 'Vehicle' },
  { value: 'Other', label: 'Other' },
];

interface AssetFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  assetId?: string;
  initialData?: Asset;
}

export function AssetForm({ onSuccess, onCancel, assetId, initialData }: AssetFormProps) {
  const isEdit = !!assetId;

  const [name, setName] = useState(initialData?.name ?? '');
  const [type, setType] = useState<AssetType>(initialData?.type ?? 'Property');
  const [value, setValue] = useState(String(initialData?.value ?? ''));
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fieldClass = 'w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary';
  const labelClass = 'block text-sm font-medium text-foreground mb-1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedValue = parseFloat(value);

    if (!name.trim()) { setError('Name is required.'); return; }
    if (isNaN(parsedValue) || parsedValue < 0) { setError('Value must be zero or greater.'); return; }

    setError(null);
    setIsSubmitting(true);
    try {
      if (isEdit) {
        await assetsService.updateAsset(assetId, {
          name: name.trim(),
          type,
          value: parsedValue,
          notes: notes.trim() || undefined,
        });
      } else {
        await assetsService.createAsset({
          name: name.trim(),
          type,
          value: parsedValue,
          notes: notes.trim() || undefined,
        });
      }
      onSuccess();
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to save asset.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="asset-name" className={labelClass}>Name</label>
        <input
          id="asset-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Our house, The car"
          className={fieldClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="asset-type" className={labelClass}>Type</label>
          <select
            id="asset-type"
            value={type}
            onChange={e => setType(e.target.value as AssetType)}
            className={fieldClass}
          >
            {ASSET_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="asset-value" className={labelClass}>Estimated value (£)</label>
          <input
            id="asset-value"
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="0.00"
            className={fieldClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="asset-notes" className={labelClass}>Notes (optional)</label>
        <textarea
          id="asset-notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Estimated value, source, anything worth remembering"
          className={fieldClass}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add asset'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
