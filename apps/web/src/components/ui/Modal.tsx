import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal = ({ isOpen, onClose, title, children, className }: ModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-5"
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          'w-full max-w-[500px] max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-secondary p-6 shadow-lg',
          'md:w-full md:max-h-[90vh]',
          className,
        )}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="m-0 text-xl font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="flex items-center justify-center rounded-sm p-1 text-muted-foreground transition-all duration-200 hover:bg-background hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <X size={20} />
          </button>
        </div>
        <div className="text-foreground">{children}</div>
      </div>
    </div>
  );
};
