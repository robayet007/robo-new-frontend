import React from 'react';
import { FaRobot, FaShieldAlt, FaBolt } from 'react-icons/fa';

const Notice: React.FC = () => {
  return (
    <div className="mb-4 sm:mb-6">
      <div className="px-3 py-3 border rounded-lg shadow-sm bg-gradient-to-r from-purple-50 via-violet-50 to-fuchsia-50 border-purple-200/60 sm:rounded-xl sm:px-4 md:px-6 sm:py-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center flex-1 min-w-0 gap-2 sm:gap-3">
            <FaRobot className="flex-shrink-0 text-lg text-purple-600 sm:text-xl md:text-2xl" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold leading-tight sm:text-sm md:text-base text-slate-800">
                আমাদের ওয়েবসাইটটি AI দ্বারা পরিচালিত
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


