import React from 'react';
import { Link } from 'react-router-dom';

export default function AppealRow({ appeal, onAction }) {
  return (
    <tr className="hover:bg-surface-container-low transition-colors group">
      <td className="px-lg py-md align-top">
        <span className="font-mono-label text-on-surface-variant">#{String(appeal.id).split('-')[0]}</span>
        <div className="text-[11px] text-on-surface mt-xs font-semibold">{new Date(appeal.appealTime).toLocaleDateString()}</div>
      </td>
      <td className="px-lg py-md align-top max-w-[200px]">
        <div className="flex flex-col gap-xs">
          <Link to={appeal.type === 'Account' ? "/profile" : "/org-profile"} state={{ from: '/moderation', label: 'Moderation Queue' }} className="font-body-sm text-primary font-medium hover:underline">
            {appeal.user}
          </Link>
          <p className="text-[11px] text-on-surface-variant mt-1">
            <span className="font-bold">Original Admin:</span> {appeal.suspendingAdmin || 'System'}
          </p>
          <p className="text-[11px] text-on-surface-variant">
            <span className="font-bold">Violation:</span> {appeal.originalViolation || 'Terms of Service'}
          </p>
          <p className="text-[11px] text-on-surface-variant">
            <span className="font-bold">Duration:</span> {appeal.suspensionDuration || 'Temporary'}
          </p>
          {appeal.pastAppeals && (
            <div className={`mt-1 px-1 py-0.5 rounded text-[11px] font-bold w-max ${appeal.pastAppeals.total > 0 ? 'bg-error-container text-error' : 'bg-surface-variant text-on-surface-variant'}`}>
              Past Appeals: {appeal.pastAppeals.total} 
              {appeal.pastAppeals.total > 0 && ` (${appeal.pastAppeals.upheld} Upheld, ${appeal.pastAppeals.reinstated} Reinstated)`}
            </div>
          )}
        </div>
      </td>
      <td className="px-lg py-md max-w-[350px]">
        <div className="bg-surface-container-highest p-sm rounded-lg border border-outline-variant relative">
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant absolute top-sm right-sm">format_quote</span>
          <p className="font-body-sm text-on-surface leading-snug italic pr-lg">
            "{appeal.appealText}"
          </p>
        </div>
      </td>
      <td className="px-lg py-md align-top text-right min-w-[150px]">
        <div className="flex flex-col gap-2 items-end">
          <div className="flex gap-2">
            <button onClick={() => onAction(appeal.id, 'approved')} className="px-sm py-xs text-[11px] font-bold uppercase text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-all border border-green-200 shadow-sm flex items-center justify-center" title="Reinstate">
              Reinstate
            </button>
            <button onClick={() => onAction(appeal.id, 'approved')} className="px-sm py-xs text-[11px] font-bold uppercase text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-all border border-yellow-200 shadow-sm flex items-center justify-center" title="Reinstate with Warning">
              Warning
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onAction(appeal.id, 'rejected')} className="px-sm py-xs text-[11px] font-bold uppercase text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all border border-orange-200 shadow-sm flex items-center justify-center" title="Extend Suspension">
              Extend
            </button>
            <button onClick={() => onAction(appeal.id, 'rejected')} className="px-sm py-xs text-[11px] font-bold uppercase text-error bg-error-container hover:bg-red-100 rounded-lg transition-all border border-red-200 shadow-sm flex items-center justify-center" title="Uphold (Permanent)">
              Uphold
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}
