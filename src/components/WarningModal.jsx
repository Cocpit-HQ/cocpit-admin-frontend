import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

export default function WarningModal({ isOpen, onClose, userName, onSend }) {
  const [warningReason, setWarningReason] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [isSevereWarning, setIsSevereWarning] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = () => {
    if (!warningReason) {
      setValidationError('Please select a warning reason.');
      return;
    }
    setValidationError('');
    onSend({
      reason: warningReason,
      message: warningMessage,
      isSevere: isSevereWarning
    });
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <button
        onClick={handleSubmit}
        className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm active:scale-95 cursor-pointer"
      >
        Send Warning
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-orange-500">warning</span>
          <span>Send Warning</span>
        </div>
      }
      footer={footer}
      size="sm"
    >
      <div className="flex flex-col gap-4 text-on-surface">
        <p className="text-sm text-on-surface-variant">
          You are sending an official warning to <strong>{userName}</strong>. This action will be delivered directly to their in-app Settings &gt; Account status &gt; &quot;Account actions&quot; tab.
        </p>

        {validationError && (
          <div className="bg-red-50 text-red-700 text-xs px-3 py-2 rounded-lg border border-red-200">
            {validationError}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-mono-label text-on-surface-variant mb-1.5 ml-1">REASON *</label>
            <select
              value={warningReason}
              onChange={(e) => {
                setWarningReason(e.target.value);
                if (e.target.value) setValidationError('');
              }}
              className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            >
              <option value="">Select a reason...</option>
              <option value="Inappropriate Behavior">Inappropriate Behavior</option>
              <option value="Spam / Self-Promotion">Spam / Self-Promotion</option>
              <option value="Harassment">Harassment</option>
              <option value="Platform Manipulation">Platform Manipulation</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono-label text-on-surface-variant mb-1.5 ml-1">ADDITIONAL MESSAGE (OPTIONAL)</label>
            <textarea
              value={warningMessage}
              onChange={(e) => setWarningMessage(e.target.value)}
              placeholder="Provide any specific context or links to offending content..."
              className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none h-24"
            ></textarea>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <input
              type="checkbox"
              id="severeWarning"
              checked={isSevereWarning}
              onChange={(e) => setIsSevereWarning(e.target.checked)}
              className="rounded border-outline-variant text-orange-500 focus:ring-orange-500 h-4 w-4 cursor-pointer"
            />
            <label htmlFor="severeWarning" className="text-sm font-medium cursor-pointer">
              Severe Warning (Increments Moderation Flags)
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
}
