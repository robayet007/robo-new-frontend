import React, { useState, useEffect } from 'react';
import { FaRobot, FaShieldAlt, FaBolt, FaTimes } from 'react-icons/fa';
import { noticeApi } from '../services/api';
import type { BackendNotice } from '../types';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FaRobot,
  FaShieldAlt,
  FaBolt,
};

const Notice: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [notice, setNotice] = useState<BackendNotice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNotice = async () => {
      try {
        setLoading(true);
        const response = await noticeApi.getAll();
        if (response.success && response.data && response.data.length > 0) {
          // Get the first active notice
          const activeNotice = response.data.find(n => n.isActive) || response.data[0];
          setNotice(activeNotice);
        }
      } catch (error) {
        console.error('Failed to load notice:', error);
      } finally {
        setLoading(false);
      }
    };
    loadNotice();
  }, []);

  if (!isVisible || loading || !notice) {
    return null;
  }

  const IconComponent = iconMap[notice.icon || 'FaRobot'] || FaRobot;

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
            <IconComponent className="flex-shrink-0 text-lg text-purple-600 sm:text-xl md:text-2xl" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold leading-tight sm:text-sm md:text-base text-slate-800 pr-1">
                {notice.message}
              </p>
              {notice.features && notice.features.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 mt-1 sm:gap-4">
                  {notice.features.map((feature, index) => {
                    const FeatureIcon = feature.icon ? (iconMap[feature.icon] || FaShieldAlt) : FaShieldAlt;
                    return (
                      <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                        <FeatureIcon className="flex-shrink-0 text-xs text-green-600 sm:text-sm" />
                        <span className="text-[10px] sm:text-xs text-slate-700">
                          {feature.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notice;


