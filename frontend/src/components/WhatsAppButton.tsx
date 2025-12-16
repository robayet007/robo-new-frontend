import { FaWhatsapp } from 'react-icons/fa';

function WhatsAppButton() {
  const phoneNumber = '8801766325020'; // WhatsApp number without + sign
  const whatsappUrl = `https://wa.me/${phoneNumber}`;

  const handleClick = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 sm:bottom-24 right-6 z-50 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-2xl hover:shadow-green-500/50 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group"
      aria-label="WhatsApp Message"
      style={{
        boxShadow: '0 8px 25px rgba(37, 211, 102, 0.4)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 12px 35px rgba(37, 211, 102, 0.6)';
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 211, 102, 0.4)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <FaWhatsapp 
        className="text-white text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-300" 
      />
    </button>
  );
}

export default WhatsAppButton;















