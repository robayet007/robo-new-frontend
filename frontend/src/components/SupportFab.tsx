import { useState, useRef, useEffect } from 'react';
import { FaComment, FaWhatsapp, FaTelegram } from 'react-icons/fa';
import { SiMessenger } from 'react-icons/si';
import { useTheme } from '../contexts/ThemeContext';

function SupportFab() {
  const { supportWhatsAppUrl, supportMessengerUrl, supportTelegramUrl } = useTheme();
  const [open, setOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  const options = [
    { url: supportWhatsAppUrl?.trim(), label: 'WhatsApp', Icon: FaWhatsapp, color: 'text-green-600' },
    { url: supportMessengerUrl?.trim(), label: 'Messenger', Icon: SiMessenger, color: 'text-blue-600' },
    { url: supportTelegramUrl?.trim(), label: 'Telegram', Icon: FaTelegram, color: 'text-sky-500' },
  ].filter((o) => o.url);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (options.length === 0) return null;

  return (
    <div ref={fabRef} className="fixed bottom-20 sm:bottom-24 right-6 z-50 hidden sm:block">
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-48 py-2 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
          {options.map(({ url, label, Icon, color }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Icon className={`w-5 h-5 shrink-0 ${color}`} />
              <span className="text-sm font-medium">{label}</span>
            </a>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl"
        style={{
          background: 'var(--theme-primary)',
          boxShadow: '0 4px 20px rgba(var(--theme-primary-rgb), 0.4)',
        }}
        aria-label="Support options"
      >
        <FaComment className="text-white text-2xl sm:text-3xl" />
      </button>
    </div>
  );
}

export default SupportFab;
