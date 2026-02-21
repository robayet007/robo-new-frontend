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
    <div className="mb-1.5 sm:mb-2">
      <div className="relative px-2.5 py-2 rounded-lg shadow-sm bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 sm:rounded-xl sm:px-3 md:px-5 sm:py-2.5">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 p-0.5 sm:p-1 rounded-full border-2 border-red-400 hover:bg-red-100 transition-colors text-red-500 hover:text-red-600 z-10 bg-white/80 backdrop-blur-sm"
          aria-label="Close notice"
        >
          <FaTimes className="text-[10px] sm:text-xs" />
        </button>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pr-6 sm:pr-8">
          <div className="flex items-center flex-1 min-w-0 gap-1.5 sm:gap-2">
            <IconComponent className="flex-shrink-0 text-base text-red-500 sm:text-lg" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold leading-tight sm:text-xs md:text-sm text-red-600 pr-1">
                {notice.message}
              </p>
              {notice.features && notice.features.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-0.5 sm:gap-3">
                  {notice.features.map((feature, index) => {
                    const FeatureIcon = feature.icon ? (iconMap[feature.icon] || FaShieldAlt) : FaShieldAlt;
                    return (
                      <div key={index} className="flex items-center gap-1 sm:gap-1.5">
                        <FeatureIcon className="flex-shrink-0 text-[10px] text-red-400 sm:text-xs" />
                        <span className="text-[9px] sm:text-[10px] text-red-500">
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
