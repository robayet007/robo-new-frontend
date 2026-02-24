import { useTheme } from '../contexts/ThemeContext';
import { FaWhatsapp, FaTelegram } from 'react-icons/fa';
import { SiMessenger } from 'react-icons/si';

function SupportSection() {
  const { supportWhatsAppUrl, supportMessengerUrl, supportTelegramUrl } = useTheme();

  const hasAny = supportWhatsAppUrl?.trim() || supportMessengerUrl?.trim() || supportTelegramUrl?.trim();
  if (!hasAny) return null;

  const cards = [
    { url: supportWhatsAppUrl?.trim(), label: 'WhatsApp', Icon: FaWhatsapp },
    { url: supportMessengerUrl?.trim(), label: 'Messenger', Icon: SiMessenger },
    { url: supportTelegramUrl?.trim(), label: 'Telegram', Icon: FaTelegram },
  ].filter((c) => c.url);

  if (cards.length === 0) return null;

  return (
    <section className="w-full max-w-[1380px] mx-auto px-3 sm:px-4 md:px-6 mt-2 sm:mt-3">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {cards.map(({ url, label, Icon }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-1.5 sm:gap-2.5 px-2 py-2 sm:px-5 sm:py-2.5 border-0 rounded-xl shadow-md hover:shadow-lg transition-all min-w-0 overflow-hidden text-white"
            style={{
              background: 'linear-gradient(to right, var(--theme-primary), var(--theme-secondary))',
              boxShadow: '0 8px 20px rgba(var(--theme-primary-rgb), 0.22)',
            }}
          >
            <Icon className="w-4 h-4 sm:w-6 sm:h-6 shrink-0 text-white" />
            <span className="text-xs sm:text-sm font-semibold text-white truncate">{label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export default SupportSection;
