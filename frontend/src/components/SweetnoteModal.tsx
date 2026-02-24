import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getImageUrl } from '../utils/imageUrl';

const SWEETNOTE_SEEN_KEY = 'robo_sweetnote_seen';

function SweetnoteModal() {
  const { sweetnoteEnabled, sweetnoteImageUrl, sweetnoteHeading, sweetnoteText, sweetnoteButtonText, sweetnoteButtonUrl, isLoaded } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isLoaded || !sweetnoteEnabled) return;
    if (!sweetnoteHeading?.trim() && !sweetnoteText?.trim()) return;

    const seen = sessionStorage.getItem(SWEETNOTE_SEEN_KEY);
    if (seen) return;

    setIsVisible(true);
  }, [isLoaded, sweetnoteEnabled, sweetnoteHeading, sweetnoteText]);

  const handleClose = () => {
    sessionStorage.setItem(SWEETNOTE_SEEN_KEY, '1');
    setIsVisible(false);
  };

  const handleCtaClick = () => {
    if (sweetnoteButtonUrl?.trim()) {
      window.open(sweetnoteButtonUrl.trim(), '_blank', 'noopener,noreferrer');
    }
    handleClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      {/* Modal */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sweetnote-heading"
      >
        <button
          onClick={handleClose}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
          aria-label="Close"
        >
          <span className="text-lg leading-none">×</span>
        </button>

        {sweetnoteImageUrl?.trim() && (
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-800">
            <img
              src={getImageUrl(sweetnoteImageUrl)}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="p-5">
          {sweetnoteHeading?.trim() && (
            <h2 id="sweetnote-heading" className="mb-3 text-lg font-bold leading-tight text-white">
              {sweetnoteHeading}
            </h2>
          )}
          {sweetnoteText?.trim() && (
            <p className="mb-5 whitespace-pre-line text-sm leading-relaxed text-slate-300">
              {sweetnoteText}
            </p>
          )}
          {sweetnoteButtonText?.trim() && (
            <button
              type="button"
              onClick={handleCtaClick}
              className="w-full rounded-xl px-5 py-3.5 font-bold text-white transition hover:opacity-95"
              style={{
                background: 'linear-gradient(135deg, var(--theme-primary), var(--theme-secondary))',
              }}
            >
              {sweetnoteButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SweetnoteModal;
