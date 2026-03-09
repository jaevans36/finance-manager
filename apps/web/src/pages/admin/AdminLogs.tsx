import { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal, RefreshCw, AlertCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { cn } from '../../lib/utils';
import { adminLogsService, type LogEntry } from '../../services/adminLogsService';

const LEVEL_FILTERS = ['all', 'INF', 'WRN', 'ERR'] as const;
const LINE_OPTIONS = [100, 200, 500, 1000] as const;

function LevelBadge({ level }: { level: string }) {
  const config = {
    INF: { label: 'INFO', className: 'bg-info/15 text-info', icon: <Info size={12} /> },
    WRN: { label: 'WARN', className: 'bg-warning/15 text-warning', icon: <AlertTriangle size={12} /> },
    ERR: { label: 'ERROR', className: 'bg-destructive/15 text-destructive', icon: <AlertCircle size={12} /> },
    FTL: { label: 'FATAL', className: 'bg-destructive/25 text-destructive font-bold', icon: <XCircle size={12} /> },
  }[level] ?? { label: level, className: 'bg-muted text-muted-foreground', icon: null };

  return (
    <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-mono font-medium', config.className)}>
      {config.icon}
      {config.label}
    </span>
  );
}

function rowClass(level: string) {
  if (level === 'ERR' || level === 'FTL') return 'border-l-2 border-destructive/50 bg-destructive/5';
  if (level === 'WRN') return 'border-l-2 border-warning/50 bg-warning/5';
  return '';
}

const AdminLogs = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [lines, setLines] = useState<number>(200);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setError(null);
      const data = await adminLogsService.getLogs(lines, levelFilter);
      setEntries(data);
    } catch {
      setError('Failed to load logs. Check that the API is running and log files exist.');
    } finally {
      setIsLoading(false);
    }
  }, [lines, levelFilter]);

  useEffect(() => {
    setIsLoading(true);
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchLogs, 10_000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, fetchLogs]);

  // Scroll to bottom when new entries arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  if (!user?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <PageLayout
      title="Application Logs"
      subtitle="Recent log entries from today's API log file"
      loading={false}
    >
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Level filter */}
        <div className="flex rounded-lg border border-border overflow-hidden">
          {LEVEL_FILTERS.map(lvl => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors',
                levelFilter === lvl
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted'
              )}
            >
              {lvl === 'all' ? 'All' : lvl === 'INF' ? 'Info' : lvl === 'WRN' ? 'Warn' : 'Error'}
            </button>
          ))}
        </div>

        {/* Line count */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Show</span>
          <select
            value={lines}
            onChange={e => setLines(Number(e.target.value))}
            className="rounded border border-border bg-card px-2 py-1 text-xs text-foreground"
          >
            {LINE_OPTIONS.map(n => (
              <option key={n} value={n}>{n} lines</option>
            ))}
          </select>
        </div>

        {/* Auto-refresh toggle */}
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <div
            onClick={() => setAutoRefresh(v => !v)}
            className={cn(
              'relative h-5 w-9 rounded-full transition-colors',
              autoRefresh ? 'bg-primary' : 'bg-muted'
            )}
          >
            <div className={cn(
              'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
              autoRefresh ? 'translate-x-4' : 'translate-x-0.5'
            )} />
          </div>
          Auto-refresh (10s)
        </label>

        {/* Manual refresh */}
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Log output */}
      <div className="rounded-lg border border-border bg-[hsl(var(--background))] overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2">
          <Terminal size={14} className="text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">
            finance-api-{new Date().toISOString().slice(0, 10).replace(/-/g, '')}.log
          </span>
          {autoRefresh && (
            <span className="ml-auto flex items-center gap-1 text-[11px] text-success">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              Live
            </span>
          )}
        </div>

        {/* Entries */}
        <div className="max-h-[60vh] overflow-y-auto">
          {error ? (
            <div className="flex items-center gap-2 p-6 text-sm text-destructive">
              <AlertCircle size={16} />
              {error}
            </div>
          ) : isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading logs…</div>
          ) : entries.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No log entries found for today. Logs are generated as the API receives requests.
            </div>
          ) : (
            <table className="w-full text-xs font-mono">
              <tbody>
                {entries.map((entry, i) => (
                  <tr key={i} className={cn('border-b border-border/50 last:border-0', rowClass(entry.level))}>
                    <td className="whitespace-nowrap px-3 py-1.5 text-muted-foreground">{entry.timestamp}</td>
                    <td className="whitespace-nowrap px-2 py-1.5">
                      <LevelBadge level={entry.level} />
                    </td>
                    <td className="px-3 py-1.5 text-foreground break-all">{entry.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Footer */}
        {entries.length > 0 && (
          <div className="border-t border-border bg-card px-4 py-1.5 text-[11px] text-muted-foreground">
            {entries.length} entries displayed
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default AdminLogs;
