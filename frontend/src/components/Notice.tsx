import React, { useState } from 'react';
import { FaRobot, FaShieldAlt, FaBolt, FaTimes } from 'react-icons/fa';

const Notice: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="mb-4 sm:mb-6">
      <div className="relative px-3 py-3 rounded-lg shadow-sm bg-gradient-to-r from-purple-50 via-violet-50 to-fuchsia-50 sm:rounded-xl sm:px-4 md:px-6 sm:py-4">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1 sm:p-1.5 rounded-full border-2 border-purple-500 hover:bg-purple-100 transition-colors text-purple-600 hover:text-purple-700 z-10 bg-white/80 backdrop-blur-sm"
          aria-label="Close notice"
        >
          <FaTimes className="text-xs sm:text-sm md:text-base" />
        </button>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pr-8 sm:pr-10">
          <div className="flex items-center flex-1 min-w-0 gap-2 sm:gap-3">
            <FaRobot className="flex-shrink-0 text-lg text-purple-600 sm:text-xl md:text-2xl" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold leading-tight sm:text-sm md:text-base text-slate-800 pr-1">
                🚀 আমাদের সিস্টেম AI দ্বারা নিয়ন্ত্রিত, যার ফলে আপনি পাচ্ছেন ⚡ তাৎক্ষণিক প্রসেসিং এবং 📦 দ্রুত ও নির্ভুল ডেলিভারি।
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1 sm:gap-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <FaShieldAlt className="flex-shrink-0 text-xs text-green-600 sm:text-sm" />
                  <span className="text-[10px] sm:text-xs text-slate-700">
                    সিকিউর পেমেন্ট
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <FaBolt className="flex-shrink-0 text-xs text-yellow-600 sm:text-sm" />
                  <span className="text-[10px] sm:text-xs text-slate-700">
                    অটো টপআপ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notice;


