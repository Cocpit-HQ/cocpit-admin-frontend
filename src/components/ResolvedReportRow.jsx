import React from 'react';
import { Link } from 'react-router-dom';

const getTypeConfig = (type) => {
  switch (type) {
    case 'Content':
    case 'POST': return { icon: 'article', label: 'Post', color: 'text-blue-600', bg: 'bg-blue-100' };
    case 'Comment':
    case 'COMMENT': return { icon: 'chat', label: 'Comment', color: 'text-teal-600', bg: 'bg-teal-100' };
    case 'Account':
    case 'USER': return { icon: 'person', label: 'User', color: 'text-purple-600', bg: 'bg-purple-100' };
    case 'Organization':
    case 'ORGANIZATION': return { icon: 'business', label: 'Org', color: 'text-orange-600', bg: 'bg-orange-100' };
    case 'Job':
    case 'JOB': return { icon: 'work', label: 'Job', color: 'text-indigo-600', bg: 'bg-indigo-100' };
    default: return { icon: 'report', label: type, color: 'text-gray-600', bg: 'bg-gray-100' };
  }
};

const getActionBadge = (report) => {
  const actionType = report.accountAction?.actionType;
  const status = report.status;

  if (actionType === 'warning') {
    return {
      label: 'Warning Issued',
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      border: 'border-orange-200',
      icon: 'warning'
    };
  }
  if (actionType === 'post_removed' || actionType === 'comment_removed') {
    return {
      label: actionType === 'post_removed' ? 'Post Removed' : 'Comment Removed',
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      icon: 'delete'
    };
  }
  if (actionType === 'suspension') {
    return {
      label: 'User Suspended',
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-200',
      icon: 'block'
    };
  }
  if (status === 'dismissed' || status === 'no_action') {
    return {
      label: 'Dismissed',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      icon: 'close'
    };
  }
  return {
    label: 'Action Taken',
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: 'check_circle'
  };
};

export default function ResolvedReportRow({ report, onSelect }) {
  const typeConfig = getTypeConfig(report.type);
  const actionBadge = getActionBadge(report);
  const resolvedDate = report.resolvedAt 
    ? new Date(report.resolvedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : (report.postTime ? new Date(report.postTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently');

  return (
    <tr className="hover:bg-surface-container-low transition-colors group cursor-pointer" onClick={() => onSelect(report)}>
      {/* Col 1: ID & Type */}
      <td className="px-lg py-md align-top">
        <span className="font-mono-label text-on-surface-variant text-xs">#{report.id}</span>
        <div className={`mt-1.5 flex items-center gap-1 w-max px-2 py-0.5 rounded-md ${typeConfig.bg} ${typeConfig.color}`}>
          <span className="material-symbols-outlined text-[13px]">{typeConfig.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">{typeConfig.label}</span>
        </div>
        <div className="mt-1 text-[11px] text-on-surface-variant">
          {resolvedDate}
        </div>
      </td>

      {/* Col 2: Content Preview */}
      <td className="px-lg py-md max-w-[360px] align-top">
        <div className="flex gap-3">
          {report.image ? (
            <div className="w-14 h-14 rounded-lg bg-surface-container-highest overflow-hidden flex-shrink-0 border border-outline-variant">
              {report.postMediaType === 'video' ? (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px]">videocam</span>
                </div>
              ) : (
                <img className="w-full h-full object-cover" src={report.image} alt="Reported content" />
              )}
            </div>
          ) : (
            <div className="w-14 h-14 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant flex-shrink-0 border border-outline-variant">
              <span className="material-symbols-outlined text-[22px]">{typeConfig.icon}</span>
            </div>
          )}
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="font-body-sm text-on-surface line-clamp-2 leading-tight">
              {report.contentPreview || 'Content reported by user'}
            </p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant">
              <span>Target:</span>
              {report.targetUserId ? (
                <Link 
                  to={`/profile/${report.targetUserId}`} 
                  onClick={(e) => e.stopPropagation()} 
                  className="font-medium text-primary hover:underline truncate max-w-[140px]"
                >
                  @{report.targetUserName || 'user'}
                </Link>
              ) : (
                <span className="font-medium text-on-surface">@{report.targetUserName || 'unknown'}</span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Col 3: Report Reason & Reporter */}
      <td className="px-lg py-md align-top">
        <div className="flex flex-col gap-1 items-start">
          <span className="font-body-sm font-medium text-on-surface">
            {report.reason}
          </span>
          <span className="text-[11px] text-on-surface-variant">
            Reported by <span className="font-medium text-on-surface">@{report.reportedBy}</span>
          </span>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
            report.severity?.includes('Tier 3') ? 'bg-red-50 text-red-700' :
            report.severity?.includes('Tier 2') ? 'bg-orange-50 text-orange-700' :
            'bg-blue-50 text-blue-700'
          }`}>
            {report.severity || 'Minor'}
          </span>
        </div>
      </td>

      {/* Col 4: Action Taken (Appears in In-App Account Actions) */}
      <td className="px-lg py-md align-top">
        <div className="flex flex-col gap-1.5 items-start">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${actionBadge.bg} ${actionBadge.text} ${actionBadge.border}`}>
            <span className="material-symbols-outlined text-[14px]">{actionBadge.icon}</span>
            {actionBadge.label}
          </span>
          {report.accountAction?.moderatorNote && (
            <p className="text-[11px] text-on-surface-variant line-clamp-2 max-w-[240px] italic">
              &ldquo;{report.accountAction.moderatorNote}&rdquo;
            </p>
          )}
          <span className="text-[10px] text-primary/80 font-medium">
            Published to user app actions
          </span>
        </div>
      </td>

      {/* Col 5: Actions */}
      <td className="px-lg py-md align-top text-right" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onSelect(report)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container-high hover:bg-surface-variant text-on-surface transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[16px]">visibility</span>
          Details
        </button>
      </td>
    </tr>
  );
}

