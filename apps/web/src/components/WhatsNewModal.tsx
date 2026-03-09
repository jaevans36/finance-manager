import { X, Sparkles, CheckCircle2, Calendar } from 'lucide-react';
import versionData from '../../../../VERSION.json';

interface ChangelogEntry {
  type: string;
  category: string;
  description: string;
  impact: string;
}

interface WhatsNewModalProps {
  onClose: () => void;
}

export const WhatsNewModal = ({ onClose }: WhatsNewModalProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      <div
        role="dialog"
        aria-labelledby="whats-new-title"
        aria-describedby="whats-new-description"
        className="w-[90%] max-w-[600px] max-h-[80vh] overflow-hidden rounded-lg bg-background shadow-lg animate-in slide-in-from-bottom-5 duration-300"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground">
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-primary-foreground transition-all duration-200 hover:bg-white/30 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <X size={20} />
          </button>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-white/20">
            <Sparkles size={32} />
          </div>
          <h2 id="whats-new-title" className="m-0 mb-2 text-[28px] font-bold">
            What&apos;s New in v{versionData.version}
          </h2>
          <p id="whats-new-description" className="m-0 flex items-center gap-2 text-sm opacity-90">
            <Calendar size={14} />
            Released {formatDate(versionData.releaseDate)}
            {versionData.codename && ` • "${versionData.codename}"`}
          </p>
        </div>

        {/* Content */}
        <div className="max-h-[calc(80vh-200px)] overflow-y-auto p-8">
          {versionData.description && (
            <p className="mb-6 text-base leading-relaxed text-muted-foreground">
              {versionData.description}
            </p>
          )}

          {versionData.changelog && versionData.changelog.length > 0 && (
            <>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                <CheckCircle2 size={20} />
                New Features &amp; Improvements
              </h3>
              <ul className="m-0 mb-6 list-none p-0">
                {versionData.changelog.map((change: ChangelogEntry, index: number) => (
                  <li
                    key={index}
                    className="mb-3 flex items-start gap-3 rounded-lg border border-border bg-secondary p-3 last:mb-0"
                  >
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-sm bg-green-500/10 text-green-500">
                      <CheckCircle2 size={14} />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {change.category}
                      </span>
                      <p className="m-0 mt-1 text-sm leading-relaxed text-foreground">
                        {change.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-8 py-5">
          <a
            href="/version-history"
            onClick={(e) => { e.preventDefault(); onClose(); window.location.href = '/version-history'; }}
            className="flex items-center gap-1.5 text-sm text-primary no-underline hover:underline"
          >
            View full version history →
          </a>
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:-translate-y-px hover:shadow-md"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
