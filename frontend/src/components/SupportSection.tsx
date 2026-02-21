import { useTheme } from '../contexts/ThemeContext';
import { FaWhatsapp, FaTelegram } from 'react-icons/fa';
import { SiMessenger } from 'react-icons/si';

function SupportSection() {
  const { supportWhatsAppUrl, supportMessengerUrl, supportTelegramUrl } = useTheme();

  const hasAny = supportWhatsAppUrl?.trim() || supportMessengerUrl?.trim() || supportTelegramUrl?.trim();
  if (!hasAny) return null;

  const cards = [
    { url: supportWhatsAppUrl?.trim(), label: 'WhatsApp', Icon: FaWhatsapp, color: 'text-green-600' },
    { url: supportMessengerUrl?.trim(), label: 'Messenger', Icon: SiMessenger, color: 'text-blue-600' },
    { url: supportTelegramUrl?.trim(), label: 'Telegram', Icon: FaTelegram, color: 'text-sky-500' },
  ].filter((c) => c.url);

  if (cards.length === 0) return null;

  return (
    <section className="w-full max-w-[1380px] mx-auto px-3 sm:px-4 md:px-6 mt-2 sm:mt-3">
      <div className="flex justify-between gap-3 sm:gap-4">
        {cards.map(({ url, label, Icon, color }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 sm:gap-2.5 px-4 py-2 sm:px-5 sm:py-2.5 bg-white border-0 rounded-xl shadow-md hover:shadow-lg transition-all flex-1 min-w-0"
          >
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${color}`} />
            <span className="text-sm font-semibold text-slate-700">{label}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

export default SupportSection;
