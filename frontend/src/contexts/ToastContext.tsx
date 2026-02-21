import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaTimes } from 'react-icons/fa';

export type ToastPayload = { type: 'success' | 'error'; text: string };

interface ToastContextType {
  showToast: (payload: ToastPayload) => void;
  clearToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const AUTO_DISMISS_MS = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  const showToast = useCallback((payload: ToastPayload) => {
    setToast(payload);
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast, clearToast }}>
      {children}
      {toast && (
        <div
          className="toast-enter fixed top-5 right-5 z-[100] w-full max-w-[360px] overflow-hidden rounded-2xl border-0 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05)] backdrop-blur-sm"
          role="alert"
          style={
            toast.type === 'success'
              ? {
                  background: 'linear-gradient(135deg, rgba(var(--theme-primary-rgb), 0.12) 0%, rgba(var(--theme-primary-rgb), 0.06) 100%)',
                  color: 'var(--theme-primary)',
                  boxShadow: '0 20px 50px -12px rgba(var(--theme-primary-rgb), 0.35), 0 0 0 1px rgba(var(--theme-primary-rgb), 0.15)'
                }
              : {
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.06) 100%)',
                  color: '#b91c1c',
                  boxShadow: '0 20px 50px -12px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(239, 68, 68, 0.15)'
                }
          }
        >
          <div className="flex items-start gap-4 p-4">
            <span className="mt-0.5 shrink-0 text-xl" aria-hidden>
              {toast.type === 'success' ? (
                <FaCheckCircle className="opacity-90" style={toast.type === 'success' ? { color: 'var(--theme-primary)' } : undefined} />
              ) : (
                <FaExclamationCircle className="text-red-600 opacity-90" />
              )}
            </span>
            <p className="flex-1 pt-0.5 text-sm font-medium leading-snug" style={toast.type === 'success' ? { color: 'var(--theme-primary)' } : { color: '#991b1b' }}>
              {toast.text}
            </p>
            <button
              type="button"
              onClick={clearToast}
              className="shrink-0 rounded-lg p-1.5 opacity-60 transition hover:opacity-100 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-1"
              style={toast.type === 'success' ? { color: 'var(--theme-primary)' } : { color: '#b91c1c' }}
              aria-label="Close"
            >
              <FaTimes className="text-base" />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (ctx === undefined) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
