import React from 'react';
import Modal from './Modal';
import Button from './Button';

export default function ReportDetailModal({ isOpen, onClose, report, onDeleteContent, onDismissReport, role }) {
  if (!report) return null;

  const isTier3 = report.severity?.includes('Tier 3');

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button 
        variant="primary" 
        onClick={() => onDismissReport(report.id)}
      >
        Dismiss Report
      </Button>
      {/* Delete Content is the primary moderation action for Day 07 */}
      {(!isTier3 || role === 'admin') && (
        <Button 
          variant="danger" 
          onClick={() => onDeleteContent(report)}
        >
          Delete {report.type}
        </Button>
      )}
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Details" size="lg" footer={footer}>
      <div className="flex flex-col gap-md">
        {/* Report Metadata */}
        <div className="grid grid-cols-2 gap-md bg-surface-container-lowest p-md rounded-xl border border-outline-variant">
          <div>
            <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider mb-xs">Reporter</p>
            <p className="font-body-md text-on-surface">{report.reportedBy}</p>
          </div>
          <div>
            <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider mb-xs">Reason</p>
            <p className="font-body-md text-on-surface">{report.reason}</p>
          </div>
          <div>
            <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider mb-xs">Severity</p>
            <p className="font-body-md text-on-surface">{report.severity}</p>
          </div>
          <div>
            <p className="text-on-surface-variant text-[11px] font-bold uppercase tracking-wider mb-xs">Status</p>
            <p className="font-body-md text-on-surface capitalize">{report.status}</p>
          </div>
        </div>

        {/* Content Preview */}
        <div>
          <h4 className="font-title-md text-on-surface mb-sm">Reported Content ({report.type})</h4>
          <div className="bg-surface-container p-md rounded-xl border border-outline-variant relative">
            {report.image && (
              <img src={report.image} alt="Reported context" className="w-full max-h-64 object-contain rounded-lg mb-sm bg-black/5" />
            )}
            <p className="font-body-md text-on-surface whitespace-pre-wrap">
              {report.contentPreview}
            </p>
          </div>
        </div>
        
        {/* Additional Warnings */}
        {isTier3 && (
          <div className="bg-error-container text-on-error-container p-md rounded-xl border border-error-container">
            <div className="flex items-center gap-sm font-bold mb-xs">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              High Severity Alert
            </div>
            <p className="text-sm">This is a Tier 3 severity report. Please review carefully before taking action.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
