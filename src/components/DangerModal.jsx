import React from 'react';

export default function DangerModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to perform this action?", 
  actionText = "Delete",
  isDestructive = true
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-surface border border-outline-variant w-[450px] max-w-[90vw] rounded-xl shadow-xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDestructive ? 'text-error' : 'text-on-surface'}`}>
            <span className={`material-symbols-outlined ${isDestructive ? 'text-error' : 'text-primary'}`}>
              warning
            </span>
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors"
          >
            close
          </button>
        </div>

        <p className="text-sm text-on-surface-variant mb-6">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`${
              isDestructive 
                ? 'bg-error text-on-error hover:bg-error/90' 
                : 'bg-primary text-white hover:bg-primary/90'
            } px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm active:scale-95`}
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
}
