import React from 'react';
import { FaRobot, FaShieldAlt, FaBolt } from 'react-icons/fa';

const Notice: React.FC = () => {
  return (
    <div className="mb-4 sm:mb-6">
      <div className="bg-gradient-to-r from-purple-50 via-violet-50 to-fuchsia-50 border border-purple-200/60 rounded-lg sm:rounded-xl px-3 sm:px-4 md:px-6 py-3 sm:py-4 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <FaRobot className="text-purple-600 text-lg sm:text-xl md:text-2xl flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm md:text-base font-semibold text-slate-800 leading-tight">
                আমাদের ওয়েবসাইটটি AI দ্বারা পরিচালিত
              </p>
              <div className="flex items-center gap-3 sm:gap-4 mt-1 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <FaShieldAlt className="text-green-600 text-xs sm:text-sm flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs text-slate-700">
                    সিকিউর পেমেন্ট
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <FaBolt className="text-yellow-600 text-xs sm:text-sm flex-shrink-0" />
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

