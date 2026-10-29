import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    if (!message) return;
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  }, []);

  const toastPortal = mounted && typeof document !== 'undefined' ? createPortal(
    <div
      className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-2.5 pointer-events-none"
      style={{ maxWidth: 'calc(100vw - 32px)', width: '360px' }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => removeToast(toast.id)}
          className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl shadow-2xl border cursor-pointer transition-all duration-300 transform translate-x-0 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-emerald-500/10'
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-rose-500/10'
              : toast.type === 'warning'
              ? 'bg-amber-50 border-amber-300 text-amber-900 shadow-amber-500/10'
              : 'bg-blue-50 border-blue-300 text-blue-900 shadow-blue-500/10'
          }`}
          style={{ animation: 'toastSlideIn 0.25s ease-out forwards' }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {toast.type === 'success' && (
              <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="h-5 w-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {toast.type === 'warning' && (
              <svg className="h-5 w-5 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {toast.type === 'info' && (
              <svg className="h-5 w-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-xs font-semibold break-words leading-snug">{toast.message}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
            className="text-current opacity-50 hover:opacity-100 transition-opacity p-0.5 rounded cursor-pointer shrink-0"
            title="Dismiss notification"
            type="button"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastPortal}
    </ToastContext.Provider>
  );
};
