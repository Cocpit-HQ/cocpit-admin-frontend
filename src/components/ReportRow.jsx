import React from 'react';
import { Link } from 'react-router-dom';

const getSeverityStyle = (severity) => {
  if (severity.includes('Tier 3')) return 'text-error';
  if (severity.includes('Tier 2')) return 'text-orange-500';
  if (severity.includes('Tier 1')) return 'text-blue-500';
  return 'text-outline';
};

const getSeverityBg = (severity) => {
  if (severity.includes('Tier 3')) return 'bg-error';
  if (severity.includes('Tier 2')) return 'bg-orange-500';
  if (severity.includes('Tier 1')) return 'bg-blue-500';
  return 'bg-outline';
};

export default function ReportRow({ report, role, activeTab, onApprove, onReject, onEscalate, onSuspend }) {
  const { highestSeverity, reportCount, uniqueReporters, uniqueReasons } = report;

  return (
    <tr className="hover:bg-surface-container-low transition-colors group">
      <td className="px-lg py-md align-top">
        <span className="font-mono-label text-on-surface-variant">#{String(report.id).split('-')[0]}</span>
        <div className="text-[11px] text-on-surface mt-xs font-semibold">{report.type}</div>
        <div className={`mt-xs flex items-center gap-xs text-[10px] font-bold uppercase ${getSeverityStyle(highestSeverity)}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${highestSeverity.includes('Tier 3') ? 'animate-pulse' : ''} ${getSeverityBg(highestSeverity)}`}></span>
          {highestSeverity}
        </div>
      </td>
      <td className="px-lg py-md max-w-[448px]">
        <div className="flex gap-md">
          {report.image && (
            <div className="w-16 h-16 rounded-lg bg-surface-container-highest overflow-hidden flex-shrink-0 border border-outline-variant">
              <img className="w-full h-full object-cover" src={report.image} alt="Reported content" />
            </div>
          )}
          <div className="flex flex-col gap-xs">
            <p className={`font-body-sm text-on-surface line-clamp-3 leading-tight ${highestSeverity.includes('Tier 3') ? 'italic' : ''}`}>
              {report.type === 'Account' ? (
                <Link to={`/profile/${report.postId}`} state={{ from: '/moderation', label: 'Moderation Queue' }} className="hover:underline text-primary">{report.contentPreview}</Link>
              ) : report.type === 'Organization' ? (
                <Link to="/org-profile" state={{ from: '/moderation', label: 'Moderation Queue' }} className="hover:underline text-primary">{report.contentPreview}</Link>
              ) : (
                report.contentPreview
              )}
            </p>
            <span className="text-[11px] text-on-surface-variant">
              Post ID: {report.postId} • {new Date(report.postTime).toLocaleDateString()} • <span className="font-bold text-error">Offenses: {report.offenses}</span>
            </span>
          </div>
        </div>
      </td>
      <td className="px-lg py-md align-top">
        <div className="flex flex-col gap-1 items-start">
          <span className="inline-flex items-center px-sm py-0.5 rounded-full text-[12px] font-medium bg-error-container text-error">
            {reportCount} {reportCount === 1 ? 'Report' : 'Reports'}
          </span>
          <span className="text-[11px] text-on-surface-variant line-clamp-2">
            {uniqueReasons.join(', ')}
          </span>
        </div>
      </td>
      <td className="px-lg py-md align-top">
        <div className="flex items-center gap-sm">
          <div className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-[10px] font-bold overflow-hidden border border-outline-variant">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">group</span>
          </div>
          <div>
            <span className="font-body-sm text-on-surface font-medium">{uniqueReporters} {uniqueReporters === 1 ? 'User' : 'Users'}</span>
            <p className="text-[11px] text-on-surface-variant">Grouped by Content</p>
          </div>
        </div>
      </td>
      <td className="px-lg py-md align-top text-right">
        <div className="flex justify-end gap-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onApprove(report.id)} className="p-sm text-green-600 hover:bg-green-50 rounded-lg transition-all active:scale-90" title="Resolve Group (Dismiss All)">
            <span className="material-symbols-outlined">check_circle</span>
          </button>
          <button onClick={() => onReject(report)} className="p-sm text-orange-500 hover:bg-orange-50 rounded-lg transition-all active:scale-90" title="Review Report Details">
            <span className="material-symbols-outlined">visibility</span>
          </button>
          {role === 'moderator' && activeTab === 'Active Reports' && (
            <button onClick={() => onEscalate(report)} className="p-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-90" title="Escalate to Admin">
              <span className="material-symbols-outlined">publish</span>
            </button>
          )}
          {(!highestSeverity.includes('Tier 3') || role === 'admin') && (
            <button onClick={() => onSuspend(report)} className="p-sm text-error hover:bg-error-container rounded-lg transition-all active:scale-90" title="Suspend User">
              <span className="material-symbols-outlined">person_off</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
