import { useState } from 'react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import type { AnomalyAlert as AnomalyAlertType, InsightSeverity } from '../../types/finance';
import { cn } from '../../lib/utils';

function SeverityBadge({ severity }: { severity: InsightSeverity }) {
  const variants: Record<InsightSeverity, string> = {
    Info: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
    Warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    Critical: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  };
  return (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', variants[severity])}>
      {severity}
    </span>
  );
}

function SeverityIcon({ severity }: { severity: InsightSeverity }) {
  if (severity === 'Critical') {
    return <ShieldAlert className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />;
  }
  if (severity === 'Warning') {
    return <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />;
  }
  return <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />;
}

interface AnomalyAlertsProps {
  alerts: AnomalyAlertType[];
}

export function AnomalyAlerts({ alerts }: AnomalyAlertsProps) {
  const [resolved, setResolved] = useState<Record<string, 'ok' | 'flagged'>>({});

  const resolve = (id: string, outcome: 'ok' | 'flagged') =>
    setResolved(prev => ({ ...prev, [id]: outcome }));

  const visible = alerts.filter(a => !resolved[a.id]);

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Anomalies</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">No unusual activity detected.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-5 border-b border-border flex items-center gap-2">
        <ShieldAlert className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Anomalies</h3>
      </div>

      {visible.length === 0 ? (
        <p className="p-5 text-sm text-gray-500 dark:text-gray-400">All anomalies reviewed.</p>
      ) : (
        <ul className="divide-y divide-border">
          {visible.map(alert => (
            <li key={alert.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <SeverityIcon severity={alert.severity} />
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                      {alert.merchantName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{alert.description}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <SeverityBadge severity={alert.severity} />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => resolve(alert.id, 'ok')}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Looks fine
                </button>
                <button
                  onClick={() => resolve(alert.id, 'flagged')}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Flag for review
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
