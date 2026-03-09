import { useState, useEffect } from 'react';
import { Package, Calendar, Info, ChevronDown, ChevronUp, CheckCircle2, AlertCircle, Zap, Bug, FileText, Loader2, RefreshCcw, Shield } from 'lucide-react';
import versionData from '@workspace/VERSION.json';
import { versionService, type VersionHistory } from '../../services/versionService';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

const getChangeIcon = (type: string) => {
  switch (type) {
    case 'feat': return <CheckCircle2 size={16} />;
    case 'fix': return <Bug size={16} />;
    case 'perf': return <Zap size={16} />;
    case 'security': return <Shield size={16} />;
    default: return <FileText size={16} />;
  }
};

const changeIconColor = (type: string) => {
  switch (type) {
    case 'feat': return 'text-success';
    case 'fix': return 'text-destructive';
    case 'perf': return 'text-destructive';
    case 'security': return 'text-muted-foreground';
    default: return 'text-muted-foreground';
  }
};

const VersionHistoryPage = () => {
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set([versionData.version]));
  const [historyData, setHistoryData] = useState<VersionHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVersionHistory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await versionService.getVersionHistory();
      setHistoryData(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load version history';
      setError(message);
      console.error('Error fetching version history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersionHistory();
  }, []);

  const toggleVersion = (version: string) => {
    setExpandedVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(version)) {
        newSet.delete(version);
      } else {
        newSet.add(version);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="mx-auto max-w-[1000px] w-4/5 px-5 py-5 md:px-[10px] md:w-[95%]">
      <h1 className="text-2xl font-semibold text-foreground">Version History</h1>
      <p className="mt-1.5 mb-6 text-sm text-muted-foreground">
        Explore the evolution of To Do Manager and see what&apos;s been added in each release
      </p>

      {/* Current Version Card */}
      <div className="mb-6 rounded-lg border border-primary/30 bg-primary/5 p-8 text-center md:p-5">
        <div className="flex items-center justify-center gap-3 text-4xl font-bold text-foreground">
          <Package size={48} className="text-primary" />
          v{versionData.version}
          <Badge variant="default" className="ml-2 text-xs">CURRENT</Badge>
        </div>
        {versionData.codename && (
          <p className="mt-2 text-lg italic text-muted-foreground">&quot;{versionData.codename}&quot;</p>
        )}
        <div className="mt-3 flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar size={16} />
            Released {formatDate(versionData.releaseDate)}
          </span>
          {versionData.breaking && (
            <span className="flex items-center gap-1.5 text-destructive">
              <AlertCircle size={16} />
              Breaking Changes
            </span>
          )}
        </div>
        <p className="mt-4 text-base text-foreground/90">
          {versionData.description}
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 size={40} className="animate-spin" />
          <p className="mt-4">Loading version history...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center">
          <h3 className="text-lg font-semibold text-destructive">Failed to Load Version History</h3>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button variant="destructive" size="sm" className="mt-4" onClick={fetchVersionHistory}>
            <RefreshCcw size={16} />
            Retry
          </Button>
        </div>
      )}

      {/* Version History */}
      {!isLoading && !error && historyData && (
        <>
          {historyData.versions.map(version => (
            <div key={version.version} className="mb-4 overflow-hidden rounded-lg border border-border bg-card">
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent/50',
                  expandedVersions.has(version.version) && 'border-b border-border'
                )}
                onClick={() => toggleVersion(version.version)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-foreground">v{version.version}</span>
                  {version.codename && (
                    <span className="text-sm text-muted-foreground">&quot;{version.codename}&quot;</span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar size={14} />
                    {formatDate(version.releaseDate)}
                  </span>
                  <span className="text-muted-foreground">
                    {expandedVersions.has(version.version) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </span>
                </div>
              </button>

              {expandedVersions.has(version.version) && (
                <div className="p-4">
                  {version.changelog.map((section, sectionIdx) => (
                    <div key={sectionIdx} className="mb-4 last:mb-0">
                      {section.section && section.section.trim() !== 'General' && (
                        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Info size={16} />
                          {section.section}
                        </h4>
                      )}
                      <ul className="m-0 list-none space-y-2 pl-0">
                        {section.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-2 text-sm text-foreground">
                            <span className={cn('mt-0.5 shrink-0', changeIconColor(item.type))}>
                              {getChangeIcon(item.type)}
                            </span>
                            <span>
                              <strong>{item.category}:</strong> {item.description}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        For complete version history, see{' '}
        <a
          href="https://github.com/jaevans36/finance-manager/blob/main/CHANGELOG.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-success hover:underline"
        >
          CHANGELOG.md
        </a>
      </p>
    </div>
  );
};

export default VersionHistoryPage;
