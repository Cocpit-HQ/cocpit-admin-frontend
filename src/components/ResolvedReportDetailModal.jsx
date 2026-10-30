import React from 'react';
import { Link } from 'react-router-dom';

export default function ResolvedReportDetailModal({ isOpen, onClose, report }) {
  if (!isOpen || !report) return null;

  const action = report.accountAction;
  const isWarning = action?.actionType === 'warning';
  const isPostRemoved = action?.actionType === 'post_removed' || action?.actionType === 'comment_removed';
  const isSuspension = action?.actionType === 'suspension';
  const isDismissed = report.status === 'dismissed' || report.status === 'no_action';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: 'rgba(19, 27, 46, 0.6)' }}>
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div 
        className="relative bg-white rounded-2xl shadow-2xl flex flex-col w-full overflow-hidden" 
        style={{ maxWidth: '620px', maxHeight: '90vh' }}
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-700 transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h3 className="text-gray-900 font-bold text-lg">Resolved Report #{report.id}</h3>
              <p className="text-xs text-gray-500">View resolution trail and published account action</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
            isWarning ? 'bg-orange-100 text-orange-800' :
            isPostRemoved ? 'bg-red-100 text-red-800' :
            isSuspension ? 'bg-purple-100 text-purple-800' :
            isDismissed ? 'bg-slate-100 text-slate-800' :
            'bg-green-100 text-green-800'
          }`}>
            <span className="material-symbols-outlined text-[14px]">
              {isWarning ? 'warning' : isPostRemoved ? 'delete' : isSuspension ? 'block' : isDismissed ? 'close' : 'check_circle'}
            </span>
            {isWarning ? 'Warning Issued' : isPostRemoved ? 'Content Removed' : isSuspension ? 'Suspended' : isDismissed ? 'Dismissed' : 'Action Taken'}
          </span>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Card: Reported Item Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reported Item ({report.type})</h4>
            <div className="flex gap-4 items-start">
              {report.image && (
                <div className="w-20 h-20 rounded-xl bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-300">
                  {report.postMediaType === 'video' ? (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-2xl">videocam</span>
                    </div>
                  ) : (
                    <img src={report.image} alt="Reported Media" className="w-full h-full object-cover" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium whitespace-pre-wrap leading-relaxed">
                  {report.contentPreview || 'No content preview available.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
                  <div>
                    <span className="text-gray-400">Target Author: </span>
                    {report.targetUserId ? (
                      <Link to={`/profile/${report.targetUserId}`} className="text-primary font-semibold hover:underline">
                        @{report.targetUserName || 'unknown'}
                      </Link>
                    ) : (
                      <span className="font-semibold text-gray-800">@{report.targetUserName || 'unknown'}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-400">Reported By: </span>
                    <span className="font-semibold text-gray-800">@{report.reportedBy || 'Anonymous'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Published to In-App Account Actions */}
          <div className="border border-orange-200 bg-orange-50/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-orange-800 font-semibold text-sm">
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Published to User In-App &quot;Account Actions&quot;</span>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              This action was delivered to the violator&apos;s Settings &gt; Account status &gt; &quot;Account actions&quot; tab.
            </p>

            <div className="bg-white rounded-lg border border-orange-200 p-3 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Action Category:</span>
                <span className="font-bold text-gray-900 uppercase">{action?.actionType || (isDismissed ? 'No Action' : 'Action Taken')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Policy Reason:</span>
                <span className="font-semibold text-gray-800">{action?.customReason || report.reason}</span>
              </div>
              {action?.moderatorNote && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-500 text-xs font-medium block mb-1">Moderator Message to User:</span>
                  <div className="p-2.5 bg-red-50 text-red-900 text-xs rounded-lg border border-red-100 italic">
                    &ldquo;{action.moderatorNote}&rdquo;
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Reporter Review Update */}
          <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-blue-900 font-semibold text-sm">
              <span className="material-symbols-outlined text-[18px]">notifications_active</span>
              <span>Reporter In-App Update (&quot;Your Reports&quot;)</span>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Timeline updates shown to the reporter in Settings &gt; Account status &gt; &quot;Your reports&quot;.
            </p>

            {report.reviewNotes && report.reviewNotes.length > 0 ? (
              <div className="space-y-2">
                {report.reviewNotes.map((n, idx) => (
                  <div key={n.id || idx} className="bg-white p-3 rounded-lg border border-blue-100 text-xs">
                    <p className="text-gray-800">{n.message}</p>
                    {n.createdAt && (
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">Report marked as resolved with action taken.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

