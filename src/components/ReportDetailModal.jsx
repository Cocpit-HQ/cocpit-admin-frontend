import React from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import Button from './Button';

export default function ReportDetailModal({ isOpen, onClose, report, onDeleteContent, onDismissReport, onDismissIndividual, role }) {
  if (!report) return null;

  const isTier3 = report.highestSeverity?.includes('Tier 3');
  const reportIds = report.reports?.map(r => r.id) || [];

  const footer = (
    <div className="w-full flex flex-col gap-3">
      <button 
        onClick={onClose} 
        className="w-full border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-bold py-2.5 rounded-xl transition-colors"
      >
        Close
      </button>
      <div className="flex gap-3 w-full">
        <button 
          onClick={() => onDismissReport(reportIds)} 
          className="flex-1 bg-[#2b07b3] hover:bg-[#1a0470] text-white font-bold py-2.5 rounded-xl transition-colors shadow-md"
        >
          Dismiss All<br/>Reports
        </button>
        {(!isTier3 || role === 'admin') && (
          <button 
            onClick={() => onDeleteContent(report)} 
            className="flex-1 bg-[#c00000] hover:bg-[#8a0000] text-white font-bold py-2.5 rounded-xl transition-colors shadow-md"
          >
            Delete {report.type}
          </button>
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  // Render a custom modal overlay to guarantee width and layout constraints
  // bypasses any external Modal.jsx issues
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: 'rgba(19, 27, 46, 0.6)' }}>
      {/* Backdrop click handler */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal Card */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl flex flex-col w-full overflow-hidden" 
        style={{ maxWidth: '576px', maxHeight: '90vh' }}
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white shrink-0 relative z-10">
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-[#2b07b3] transition-colors flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <span className="text-gray-900 font-bold text-lg">Report Details</span>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-white flex-1 relative z-0">
          <div className="w-full mx-auto">
            {/* Top: Reported Item Type */}
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Reported Item ({report.type})</h4>
            
            {/* Main Card */}
            <div className="bg-[#f4f7fb] rounded-2xl border border-gray-100 overflow-hidden relative shadow-sm mb-6">
              {/* Avatar / Content */}
              <div className="pt-6 pb-2 px-4 text-center">
                <div className="relative inline-block mx-auto">
                  {report.image ? (
                    <img src={report.image} alt="Reported content" className="w-24 h-24 rounded-2xl object-cover border-4 border-[#f4f7fb] shadow-sm bg-white block mx-auto" />
                  ) : (
                    <div className="w-24 h-24 mx-auto rounded-2xl bg-gray-200 flex items-center justify-center border-4 border-[#f4f7fb] shadow-sm text-gray-400">
                      <span className="material-symbols-outlined text-4xl">person</span>
                    </div>
                  )}
                  {/* Verification Badge */}
                  <div className="absolute -bottom-1 -right-1 bg-[#2b07b3] text-white rounded-lg p-1 border-2 border-[#f4f7fb] flex items-center justify-center z-10">
                    <span className="material-symbols-outlined text-[14px]">verified_user</span>
                  </div>
                </div>
                
                <h2 className="text-[#2b07b3] text-2xl font-bold mt-3">
                  {report.type === 'Account' ? (
                    <Link to={`/profile/${report.postId}`} onClick={onClose} className="hover:underline">{report.contentPreview}</Link>
                  ) : report.type === 'Organization' ? (
                    <Link to="/org-profile" onClick={onClose} className="hover:underline">{report.contentPreview}</Link>
                  ) : (
                    report.contentPreview
                  )}
                </h2>
                
                <p className="text-gray-500 text-sm mt-1">
                  {report.type === 'Account' ? 'Account created June 2023 • 12 interactions' : 'Content posted recently'}
                </p>
                
                {/* Pills */}
                <div className="flex justify-center gap-2 mt-4 mb-4 flex-wrap">
                  <span className="flex items-center gap-1.5 bg-[#e5e9f0] text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                    <span className="material-symbols-outlined text-[14px]">fingerprint</span> ID: {report.postId?.split('-')[0] || '88294-M'}
                  </span>
                  <span className="flex items-center gap-1.5 bg-[#e5e9f0] text-gray-600 text-[11px] font-bold px-3 py-1.5 rounded-full">
                    <span className="material-symbols-outlined text-[14px]">alternate_email</span> @{report.contentPreview.replace(/\s+/g, '_').toLowerCase()}
                  </span>
                </div>
              </div>
              
              {/* Metrics */}
              <div className="border-t border-gray-200 bg-[#f4f7fb] pt-4 pb-2 px-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Offenses</p>
                    <p className="text-3xl font-extrabold text-gray-800 leading-none mt-1">{report.offenses}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Highest Severity</p>
                    <p className="text-sm font-bold text-gray-700 mt-1 flex items-center gap-2">
                      <span className={`w-1.5 h-3.5 rounded-full shrink-0 ${isTier3 ? 'bg-red-500' : 'bg-[#c9c6df]'}`}></span>
                      <span className="truncate">{report.highestSeverity || 'Tier 1 (Minor)'}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Trust Score */}
              <div className="px-4 pb-4 bg-[#f4f7fb]">
                <div className="flex items-center gap-3 bg-[#f0efff] text-[#2b07b3] px-4 py-3.5 rounded-xl border border-[#e2dfff] font-bold text-sm shadow-sm">
                  <span className="material-symbols-outlined bg-[#2b07b3] text-white p-0.5 rounded text-[16px] shrink-0">bar_chart</span>
                  Trust Score: 100%
                </div>
              </div>
            </div>

            {isTier3 && (
              <div className="mb-6 bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 flex gap-2 text-sm font-medium">
                <span className="material-symbols-outlined shrink-0">warning</span>
                This group contains Tier 3 severity reports. Review carefully.
              </div>
            )}

            {/* Individual Reports */}
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
              Individual Reports ({report.reportCount})
            </h4>
            
            <div className="bg-[#f9fafc] rounded-2xl border border-gray-200 overflow-x-auto shadow-sm">
              <table className="w-full text-left min-w-[400px]">
                <thead className="bg-[#eff1f7]">
              <tr>
                <th className="px-4 py-3.5 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Reporter</th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Reason</th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Severity</th>
                <th className="px-4 py-3.5 text-[10px] font-bold text-gray-600 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {report.reports?.map((indReport) => (
                <tr key={indReport.id} className="group">
                  <td className="px-4 py-4 align-top w-1/4">
                    <div className="text-[#2b07b3] font-bold text-[13px]">
                      {indReport.reporterId ? (
                        <Link to={`/profile/${indReport.reporterId}`} onClick={onClose} className="hover:underline">
                          {indReport.reportedBy || 'Unknown'}
                        </Link>
                      ) : (
                        indReport.reportedBy || 'Unknown'
                      )}
                    </div>
                    <div className="text-gray-400 text-[11px] font-mono mt-1 leading-tight w-16">
                      Trust<br/>Score:<br/>{indReport.repScore}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-gray-700 text-[13px] font-medium leading-relaxed w-1/3">
                    {indReport.reason}
                  </td>
                  <td className="px-4 py-4 align-top w-1/4">
                    <div className="flex items-start gap-2">
                      <span className="w-0.5 h-3.5 bg-gray-300 mt-1 rounded-full"></span>
                      <span className="text-gray-800 font-bold text-[13px] leading-tight">
                        {indReport.severity?.replace(' ', '\n') || 'Tier 1\n(Minor)'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          if (window.confirm("Dismiss this individual report?")) {
                            onDismissIndividual(indReport.id);
                            onClose(); 
                          }
                        }}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100" 
                        title="Dismiss This Report"
                      >
                        <span className="material-symbols-outlined text-[18px]">check</span>
                      </button>
                      <button 
                        onClick={() => alert("Reporter flagged for abuse (Feature coming soon)")}
                        className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors border border-transparent hover:border-orange-100" 
                        title="Flag Reporter for Abuse"
                      >
                        <span className="material-symbols-outlined text-[18px]">flag</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer inserted here */}
        <div className="mt-6">
          {footer}
        </div>
      </div>
      </div>
    </div>
    </div>
  );
}
