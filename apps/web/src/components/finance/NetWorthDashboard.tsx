import { useEffect, useState } from 'react';
import { Home, Car, Package, Plus, Pencil, Trash2 } from 'lucide-react';
import { accountsService } from '../../services/accounts-service';
import { assetsService } from '../../services/assets-service';
import { AssetForm } from './AssetForm';
import { LineChartWrapper } from '../charts/LineChartWrapper';
import type { Asset, AssetType, NetWorthHistoryPoint } from '../../types/finance';
import { getErrorMessage } from '../../utils/errorHelpers';

const ASSET_TYPE_ICONS: Record<AssetType, React.ElementType> = {
  Property: Home,
  Vehicle: Car,
  Other: Package,
};

function formatBalance(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function NetWorthDashboard() {
  const [netWorth, setNetWorth] = useState<number | null>(null);
  const [history, setHistory] = useState<NetWorthHistoryPoint[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = async () => {
    try {
      const [nw, hist, assetList] = await Promise.all([
        accountsService.getNetWorth(),
        accountsService.getNetWorthHistory(12),
        assetsService.getAssets(),
      ]);
      setNetWorth(nw.netWorth);
      setHistory(hist);
      setAssets(assetList);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load net worth'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAsset(null);
    load();
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await assetsService.deleteAsset(id);
      setConfirmDeleteId(null);
      await load();
    } catch {
      setDeleteError('Failed to delete asset. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalAssetValue = assets.reduce((sum, a) => sum + a.value, 0);
  const chartData = history.map(p => ({ month: p.monthLabel, netWorth: p.netWorth }));

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Net worth summary card */}
      {netWorth !== null && (
        <div className="rounded-lg border border-brand/30 bg-brand-muted p-5 text-brand-muted-foreground">
          <p className="text-sm opacity-80">Net worth today</p>
          <p className="mt-1 font-display text-display-lg whitespace-nowrap">{formatBalance(netWorth)}</p>
          {assets.length > 0 && (
            <p className="mt-1 text-xs opacity-70">
              Includes {formatBalance(totalAssetValue)} across {assets.length} tracked asset{assets.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
      )}

      {/* History chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">Last 12 months</h3>
        <LineChartWrapper
          data={chartData}
          xAxisKey="month"
          lines={[{ dataKey: 'netWorth', stroke: '#3B82F6', name: 'Net worth' }]}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Account balances only, reconstructed from transaction history — tracked assets
          (below) are included in today&rsquo;s figure above but aren&rsquo;t backdated, since
          there&rsquo;s no historical value on record for them.
        </p>
      </div>

      {/* Assets section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">Tracked assets</h3>
          {!showForm && (
            <button
              onClick={() => { setEditingAsset(null); setShowForm(true); }}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <Plus size={16} /> Add asset
            </button>
          )}
        </div>

        {showForm && (
          <div className="rounded-xl border border-border bg-card p-6 max-w-md mb-3">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              {editingAsset ? 'Edit asset' : 'New asset'}
            </h4>
            <AssetForm
              assetId={editingAsset?.id}
              initialData={editingAsset ?? undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => { setShowForm(false); setEditingAsset(null); }}
            />
          </div>
        )}

        {assets.length === 0 && !showForm ? (
          <p className="text-sm text-muted-foreground">
            Nothing tracked yet — add a house or car to net it against any linked mortgage or loan.
          </p>
        ) : (
          <div className="space-y-2">
            {assets.map((asset) => {
              const Icon = ASSET_TYPE_ICONS[asset.type];
              const isConfirmingDelete = confirmDeleteId === asset.id;

              return (
                <div
                  key={asset.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 bg-blue-500/20">
                      <Icon className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{asset.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{asset.type}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100 flex-shrink-0 mr-2">
                      {formatBalance(asset.value)}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setConfirmDeleteId(null); setEditingAsset(asset); setShowForm(true); }}
                        title="Edit asset"
                        className="p-1.5 rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => { setDeleteError(null); setConfirmDeleteId(isConfirmingDelete ? null : asset.id); }}
                        title="Delete asset"
                        className="p-1.5 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {isConfirmingDelete && (
                    <div className="border-t border-gray-200 dark:border-gray-700 bg-red-50 dark:bg-red-950/20 px-4 py-3">
                      <p className="text-sm text-red-700 dark:text-red-400 mb-2">
                        Delete <strong>{asset.name}</strong>? This cannot be undone.
                      </p>
                      {deleteError && (
                        <p className="text-xs text-red-600 dark:text-red-400 mb-2">{deleteError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(asset.id)}
                          disabled={isDeleting}
                          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {isDeleting ? 'Deleting…' : 'Yes, delete'}
                        </button>
                        <button
                          onClick={() => { setConfirmDeleteId(null); setDeleteError(null); }}
                          className="rounded-md border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
