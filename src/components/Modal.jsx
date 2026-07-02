import React, { useEffect } from 'react';
import Button from './Button';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'w-[450px] max-w-[90vw]',
    md: 'w-[600px] max-w-[90vw]',
    lg: 'w-[800px] max-w-[90vw]',
    xl: 'w-[1000px] max-w-[90vw]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full rounded-2xl bg-surface border border-outline/10 text-on-surface shadow-2xl transition-all transform animate-zoom-in ${sizeClasses[size] || sizeClasses.md}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline/10 px-6 py-4">
          <h3 className="text-lg font-bold font-title text-on-surface">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-outline/5 transition cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto font-body-md">
          {children}
        </div>

        {/* Footer */}
        {footer ? (
          <div className="flex items-center justify-end gap-3 border-t border-outline/10 px-6 py-4 bg-surface-variant/30 rounded-b-2xl">
            {footer}
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 border-t border-outline/10 px-6 py-4 bg-surface-variant/30 rounded-b-2xl">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
