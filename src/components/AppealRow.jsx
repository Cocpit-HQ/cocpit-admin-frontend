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
        <div className="grid grid-cols-2 gap-2 min-w-[160px]">
          <button onClick={() => onAction(appeal.id, 'approved')} className="flex flex-col items-center justify-center gap-1 p-2 bg-surface hover:bg-green-50 border border-outline-variant hover:border-green-300 text-on-surface-variant hover:text-green-700 rounded-xl transition-all shadow-sm hover:shadow-md" title="Reinstate">
            <span className="material-symbols-outlined text-[18px]">undo</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Reinstate</span>
          </button>
          <button onClick={() => onAction(appeal.id, 'approved')} className="flex flex-col items-center justify-center gap-1 p-2 bg-surface hover:bg-yellow-50 border border-outline-variant hover:border-yellow-300 text-on-surface-variant hover:text-yellow-700 rounded-xl transition-all shadow-sm hover:shadow-md" title="Reinstate with Warning">
            <span className="material-symbols-outlined text-[18px]">warning</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Warning</span>
          </button>
          <button onClick={() => onAction(appeal.id, 'rejected')} className="flex flex-col items-center justify-center gap-1 p-2 bg-surface hover:bg-orange-50 border border-outline-variant hover:border-orange-300 text-on-surface-variant hover:text-orange-700 rounded-xl transition-all shadow-sm hover:shadow-md" title="Extend Suspension">
            <span className="material-symbols-outlined text-[18px]">update</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Extend</span>
          </button>
          <button onClick={() => onAction(appeal.id, 'rejected')} className="flex flex-col items-center justify-center gap-1 p-2 bg-surface hover:bg-red-50 border border-outline-variant hover:border-red-300 text-on-surface-variant hover:text-red-700 rounded-xl transition-all shadow-sm hover:shadow-md" title="Uphold (Permanent)">
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Uphold</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
