import React, { useState, useEffect } from 'react';

interface UpdateNotificationProps {
  onUpdate: () => void;
  onDismiss?: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onUpdate, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for updates when component mounts
    if ('serviceWorker' in navigator) {
      const checkForUpdates = async () => {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            // Check if there's an update available
            await registration.update();
            
            // Listen for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New update available
                    setIsVisible(true);
                  }
                });
              }
            });
          }
        } catch (error) {
          console.error('Error checking for updates:', error);
        }
      };

      checkForUpdates();
      
      // Check for updates every 5 minutes
      const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, []);

  const handleUpdate = () => {
    setIsVisible(false);
    onUpdate();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed z-50 w-full max-w-md px-4 transform -translate-x-1/2 top-20 left-1/2 animate-slide-down">
      <div className="p-4 text-white border border-purple-400 shadow-2xl bg-gradient-to-r from-purple-600 to-violet-600 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="mb-1 text-sm font-bold sm:text-base">নতুন আপডেট পাওয়া গেছে! 🎉</h3>
            <p className="mb-3 text-xs text-purple-100 sm:text-sm">
              আপনার ওয়েবসাইটের নতুন ভার্সন পাওয়া গেছে। আপডেট করতে রিফ্রেশ করুন।
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="flex-1 px-4 py-2 text-sm font-semibold text-purple-600 transition-colors bg-white rounded-lg hover:bg-purple-50"
              >
                এখনই আপডেট করুন
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-sm font-medium text-purple-100 transition-colors hover:text-white"
              >
                পরে
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;


