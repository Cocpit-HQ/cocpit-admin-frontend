import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const mockReports = [
  {
    id: '#MOD-9821-A',
    type: 'Content',
    severity: 'Tier 3 (Severe)',
    offenses: 1,
    contentPreview: '"This is absolute garbage and nobody should believe this..."',
    postTime: '2 mins ago',
    postId: '4421-XB',
    reason: 'Hate Speech',
    reportedBy: '@alex_mod_fan',
    repScore: '98%',
    image: 'https://ui-avatars.com/api/?name=Hate+Speech&background=ba1a1a&color=fff',
  },
  {
    id: '#MOD-9820-B',
    type: 'Content',
    severity: 'Tier 2 (Moderate)',
    offenses: 2,
    contentPreview: "Check out my profile for the best deals on crypto! 🚀 Don't miss out on these 100x gains before tonight's moon mission...",
    postTime: '14 mins ago',
    postId: '5519-AC',
    reason: 'Spam',
    reportedBy: '@sally_smith',
    repScore: '92%',
  },
  {
    id: '#MOD-9818-X',
    type: 'Content',
    severity: 'Tier 1 (Minor)',
    offenses: 1,
    contentPreview: 'Shared a promotional image for an external platform.',
    postTime: '42 mins ago',
    postId: '1109-LL',
    reason: 'External Links',
    reportedBy: '@jane_doe_22',
    repScore: '100%',
    image: 'https://ui-avatars.com/api/?name=External+Links&background=505f76&color=fff',
  },
  {
    id: '#MOD-9815-Y',
    type: 'Account',
    severity: 'Tier 2 (Moderate)',
    offenses: 3,
    contentPreview: 'Account profile: @crypto_scammer_99',
    postTime: '1 hour ago',
    postId: 'N/A',
    reason: 'Spam',
    reportedBy: '@crypto_watcher',
    repScore: '85%',
  },
  {
    id: '#MOD-9812-Z',
    type: 'Organization',
    severity: 'Tier 3 (Severe)',
    offenses: 2,
    contentPreview: 'Organization Page: Fake News Network Corp.',
    postTime: '3 hours ago',
    postId: 'N/A',
    reason: 'Misinformation',
    reportedBy: '@truth_seeker',
    repScore: '95%',
  }
];

const mockAppeals = [
  {
    id: '#APP-1021-A',
    user: '@crypto_scammer_99',
    type: 'Account',
    originalViolation: 'Spam (Tier 2)',
    suspendingAdmin: '@jane_doe_22',
    suspensionDuration: 'Short Temporary (3-7 days)',
    appealText: 'My account was hacked. I did not post those crypto links. I have secured my account now with 2FA.',
    appealTime: '2 hours ago',
    pastAppeals: { total: 2, upheld: 1, reinstated: 1 },
  },
  {
    id: '#APP-1019-B',
    user: 'Fake News Network Corp.',
    type: 'Organization',
    originalViolation: 'Misinformation (Tier 3)',
    suspendingAdmin: '@alex_mod_fan',
    suspensionDuration: 'Permanent (Pending Review)',
    appealText: 'We are a satire publication, not news. Our bio clearly states this.',
    appealTime: '1 day ago',
    pastAppeals: { total: 0, upheld: 0, reinstated: 0 },
  }
];

const initialReports = mockReports.filter(r => !r.severity.includes('Tier 3'));
const initialEscalated = mockReports.filter(r => r.severity.includes('Tier 3'));

export default function ModerationQueue() {
  const { role } = useAuth();
  const location = useLocation();
  const [reports, setReports] = useState(initialReports);
  const [escalatedReports, setEscalatedReports] = useState(initialEscalated);
  const [appeals, setAppeals] = useState(mockAppeals);
  const [activeTab, setActiveTab] = useState(location.state?.fromTab || (role === 'admin' ? 'Escalations' : 'Active Reports'));
  const [filterType, setFilterType] = useState('All');
  const [filterReason, setFilterReason] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');

  const currentReports = activeTab === 'Escalations' ? escalatedReports : reports;
  const filteredReports = currentReports.filter(report => {
    const typeMatch = filterType === 'All' || report.type === filterType;
    const reasonMatch = filterReason === 'All' || report.reason === filterReason;
    const severityMatch = filterSeverity === 'All' || report.severity === filterSeverity;
    return typeMatch && reasonMatch && severityMatch;
  });

  const handleApprove = (id) => {
    alert("Approved: Item is valid and will stay on the platform.");
    if (activeTab === 'Escalations') {
      setEscalatedReports(escalatedReports.filter(r => r.id !== id));
    } else {
      setReports(reports.filter(r => r.id !== id));
    }
  };

  const handleReject = (report) => {
    let penalty = "";
    if (report.severity.includes('Tier 1')) {
      if (report.offenses === 1) penalty = "Warning sent and content removed.";
      else if (report.offenses === 2) penalty = "Formal warning sent and content removed.";
      else penalty = "Short suspension recommended.";
    } else if (report.severity.includes('Tier 2')) {
      if (report.offenses === 1) penalty = "Warning sent, moderation flag updated.";
      else if (report.offenses === 2) penalty = "Short suspension recommended.";
      else penalty = "Longer suspension recommended.";
    } else {
      if (role === 'moderator') {
        penalty = "Tier 3 violation: Escalate to Admin.";
        if (window.confirm(`Action Recommended by Framework:\n${penalty}\n\nProceed with escalation?`)) {
          setReports(reports.filter(r => r.id !== report.id));
          setEscalatedReports([...escalatedReports, report]);
          alert("Escalated to Administrator.");
        }
        return;
      }
      penalty = "Tier 3 violation: Review for immediate suspension.";
    }
    
    if (window.confirm(`Action Recommended by Framework:\n${penalty}\n\nDo you want to proceed?`)) {
      if (activeTab === 'Escalations') {
        setEscalatedReports(escalatedReports.filter(r => r.id !== report.id));
      } else {
        setReports(reports.filter(r => r.id !== report.id));
      }
    }
  };

  const handleEscalate = (report) => {
    if (window.confirm(`Are you sure you want to manually escalate this case to an Administrator?`)) {
      setReports(reports.filter(r => r.id !== report.id));
      setEscalatedReports([...escalatedReports, report]);
      alert("Escalated to Administrator.");
    }
  };

  const handleSuspend = (report) => {
    if (report.severity.includes('Tier 3') && role === 'moderator') {
      alert("Moderators cannot directly suspend for Tier 3 violations. Please escalate using the Reject button.");
      return;
    }
    
    let penalty = "";
    if (report.severity.includes('Tier 3')) {
      if (report.offenses === 1) penalty = "Immediate Suspension.";
      else penalty = "Permanent Suspension Review.";
    } else {
      penalty = `Framework suggests progressive discipline for ${report.severity}.\nAre you sure you want to escalate to suspension?`;
    }
    
    if (window.confirm(`Framework Analysis:\n${penalty}\n\nProceed with Suspension?`)) {
      if (activeTab === 'Escalations') {
        setEscalatedReports(escalatedReports.filter(r => r.id !== report.id));
      } else {
        setReports(reports.filter(r => r.id !== report.id));
      }
    }
  };

  const handleAppealAction = (id, action) => {
    let message = "";
    if (action === 'Reinstate') message = "Account reinstated. Suspension lifted.";
    else if (action === 'Reinstate with Warning') message = "Account reinstated with a formal warning.";
    else if (action === 'Extend') message = "Suspension extended due to new info.";
    else if (action === 'Uphold') message = "Appeal rejected. Original suspension stands.";

    alert(`Appeal Processed: ${message}`);
    setAppeals(appeals.filter(a => a.id !== id));
  };

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

  return (
    <div className="flex-1 flex flex-col max-w-max-width mx-auto w-full pb-xl">
      {/* Page Header & Filters */}
      <div className="flex flex-col gap-lg mb-xl">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-display-lg text-display-lg text-on-surface">Moderation Queue</h2>
            <p className="font-body-md text-on-surface-variant mt-xs">Process reports to maintain community standards and safety.</p>
          </div>
          <div className="flex items-center gap-md">
            <Link 
              to="/review-history" 
              state={{ 
                filter: activeTab === 'Appeals' ? 'Appeals' : 'All Cases',
                fromTab: activeTab
              }}
              className="flex items-center gap-xs font-label-md text-primary bg-primary/10 hover:bg-primary/20 px-md py-sm rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              Review History
            </Link>
            <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant">
            <button 
              onClick={() => setActiveTab('Active Reports')}
              className={`px-lg py-sm rounded-lg font-label-md transition-colors ${activeTab === 'Active Reports' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Active Reports
            </button>
            {role === 'admin' && (
              <>
                <button 
                  onClick={() => setActiveTab('Escalations')}
                  className={`px-lg py-sm rounded-lg font-label-md transition-colors ${activeTab === 'Escalations' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  Escalations
                </button>
                <button 
                  onClick={() => setActiveTab('Appeals')}
                  className={`px-lg py-sm rounded-lg font-label-md transition-colors ${activeTab === 'Appeals' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  Appeals
                </button>
              </>
            )}
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'Active Reports' || activeTab === 'Escalations' ? (
        <>
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-md bg-surface-container-low p-md border border-outline-variant rounded-xl mb-xl">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">filter_list</span>
              <span className="font-label-md text-on-surface">Filter By:</span>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg font-body-sm text-on-surface px-md py-sm focus:ring-primary focus:outline-none"
            >
              <option value="All">Type: All</option>
              <option value="Content">Content</option>
              <option value="Account">Account</option>
              <option value="Organization">Organization</option>
            </select>
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg font-body-sm text-on-surface px-md py-sm focus:ring-primary focus:outline-none"
            >
              <option value="All">Reason: All</option>
              <option value="Spam">Spam</option>
              <option value="Harassment">Harassment</option>
              <option value="Hate Speech">Hate Speech</option>
              <option value="Misinformation">Misinformation</option>
              <option value="External Links">External Links</option>
            </select>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg font-body-sm text-on-surface px-md py-sm focus:ring-primary focus:outline-none"
            >
              <option value="All">Tier: All</option>
              <option value="Tier 3 (Severe)">Tier 3 (Severe)</option>
              <option value="Tier 2 (Moderate)">Tier 2 (Moderate)</option>
              <option value="Tier 1 (Minor)">Tier 1 (Minor)</option>
            </select>
            {(filterType !== 'All' || filterReason !== 'All' || filterSeverity !== 'All') && (
              <button
                onClick={() => { setFilterType('All'); setFilterReason('All'); setFilterSeverity('All'); }}
                className="text-primary font-label-md hover:underline bg-transparent border-none cursor-pointer px-sm py-xs"
              >
                Clear Filters
              </button>
            )}
          </div>

        {/* Moderation Data Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant">
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider">Report ID</th>
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider">Reported Item</th>
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider">Reason</th>
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider">Reported By</th>
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-lg py-md align-top">
                      <span className="font-mono-label text-on-surface-variant">{report.id}</span>
                      <div className="text-[11px] text-on-surface mt-xs font-semibold">{report.type}</div>
                      <div className={`mt-xs flex items-center gap-xs text-[10px] font-bold uppercase ${getSeverityStyle(report.severity)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${report.severity.includes('Tier 3') ? 'animate-pulse' : ''} ${getSeverityBg(report.severity)}`}></span>
                        {report.severity}
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
                          <p className={`font-body-sm text-on-surface line-clamp-3 leading-tight ${report.severity.includes('Tier 3') ? 'italic' : ''}`}>
                            {report.type === 'Account' ? (
                              <Link to="/profile" state={{ from: '/moderation', label: 'Moderation Queue' }} className="hover:underline text-primary">{report.contentPreview}</Link>
                            ) : report.type === 'Organization' ? (
                              <Link to="/org-profile" state={{ from: '/moderation', label: 'Moderation Queue' }} className="hover:underline text-primary">{report.contentPreview}</Link>
                            ) : (
                              report.contentPreview
                            )}
                          </p>
                          <span className="text-[11px] text-on-surface-variant">Post ID: {report.postId} • {report.postTime} • <span className="font-bold text-error">Offenses: {report.offenses}</span></span>
                        </div>
                      </div>
                    </td>
                    <td className="px-lg py-md align-top">
                      <span className={`inline-flex items-center px-sm py-0.5 rounded-full text-[12px] font-medium ${
                        report.reason === 'Hate Speech' ? 'bg-red-100 text-red-700' :
                        report.reason === 'Spam' ? 'bg-secondary-container text-on-secondary-container' :
                        'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                      }`}>
                        {report.reason}
                      </span>
                    </td>
                    <td className="px-lg py-md align-top">
                      <div className="flex items-center gap-sm">
                        <div className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-[10px] font-bold overflow-hidden border border-outline-variant">
                          {report.reportedBy === '@system_monitor' ? 'SM' : <img src={`https://ui-avatars.com/api/?name=${report.reportedBy}&background=e2e7ff`} alt="User" />}
                        </div>
                        <div>
                          <Link to="/profile" state={{ from: '/moderation', label: 'Moderation Queue' }} className="font-body-sm text-primary font-medium hover:underline">{report.reportedBy}</Link>
                          <p className="text-[11px] text-on-surface-variant" title="Trust score of the user who reported this">Reporter Trust: {report.repScore}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-lg py-md align-top text-right">
                      <div className="flex justify-end gap-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleApprove(report.id)} className="p-sm text-green-600 hover:bg-green-50 rounded-lg transition-all active:scale-90" title="Approve Content">
                          <span className="material-symbols-outlined">check_circle</span>
                        </button>
                        <button onClick={() => handleReject(report)} className="p-sm text-orange-500 hover:bg-orange-50 rounded-lg transition-all active:scale-90" title="Reject Content">
                          <span className="material-symbols-outlined">do_not_disturb_on</span>
                        </button>
                        {role === 'moderator' && activeTab === 'Active Reports' && (
                          <button onClick={() => handleEscalate(report)} className="p-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-90" title="Escalate to Admin">
                            <span className="material-symbols-outlined">publish</span>
                          </button>
                        )}
                        {(!report.severity.includes('Tier 3') || role === 'admin') && (
                          <button onClick={() => handleSuspend(report)} className="p-sm text-error hover:bg-error-container rounded-lg transition-all active:scale-90" title="Suspend User">
                            <span className="material-symbols-outlined">person_off</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination / Table Footer */}
          <div className="p-lg bg-surface-container border-t border-outline-variant flex flex-wrap items-center justify-between gap-4">
            <p className="font-body-sm text-on-surface-variant">Showing <span className="font-bold text-on-surface">1 - 3</span> of 142 reports</p>
            <div className="flex items-center gap-sm">
              <button className="p-sm border border-outline-variant rounded-lg hover:bg-surface-container-high text-on-surface-variant disabled:opacity-50" disabled>
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button className="w-8 h-8 rounded-lg bg-primary text-on-primary font-label-md">1</button>
              <button className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-on-surface-variant font-label-md">2</button>
              <button className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-on-surface-variant font-label-md">3</button>
              <span className="text-on-surface-variant">...</span>
              <button className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-on-surface-variant font-label-md">6</button>
              <button className="p-sm border border-outline-variant rounded-lg hover:bg-surface-container-high text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
        </>
      ) : (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant">
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider">Appeal ID</th>
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider">Suspended Account</th>
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider">Appeal Context</th>
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {appeals.map((appeal) => (
                  <tr key={appeal.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-lg py-md align-top">
                      <span className="font-mono-label text-on-surface-variant">{appeal.id}</span>
                      <div className="text-[11px] text-on-surface mt-xs font-semibold">{appeal.appealTime}</div>
                    </td>
                    <td className="px-lg py-md align-top max-w-[200px]">
                      <div className="flex flex-col gap-xs">
                        <Link to={appeal.type === 'Account' ? "/profile" : "/org-profile"} state={{ from: '/moderation', label: 'Moderation Queue' }} className="font-body-sm text-primary font-medium hover:underline">
                          {appeal.user}
                        </Link>
                        <p className="text-[11px] text-on-surface-variant mt-1">
                          <span className="font-bold">Original Admin:</span> {appeal.suspendingAdmin}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          <span className="font-bold">Violation:</span> {appeal.originalViolation}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          <span className="font-bold">Duration:</span> {appeal.suspensionDuration}
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
                          <button onClick={() => handleAppealAction(appeal.id, 'Reinstate')} className="px-sm py-xs text-[11px] font-bold uppercase text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-all border border-green-200 shadow-sm flex items-center justify-center" title="Reinstate">
                            Reinstate
                          </button>
                          <button onClick={() => handleAppealAction(appeal.id, 'Reinstate with Warning')} className="px-sm py-xs text-[11px] font-bold uppercase text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-all border border-yellow-200 shadow-sm flex items-center justify-center" title="Reinstate with Warning">
                            Warning
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAppealAction(appeal.id, 'Extend')} className="px-sm py-xs text-[11px] font-bold uppercase text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all border border-orange-200 shadow-sm flex items-center justify-center" title="Extend Suspension">
                            Extend
                          </button>
                          <button onClick={() => handleAppealAction(appeal.id, 'Uphold')} className="px-sm py-xs text-[11px] font-bold uppercase text-error bg-error-container hover:bg-red-100 rounded-lg transition-all border border-red-200 shadow-sm flex items-center justify-center" title="Uphold (Permanent)">
                            Uphold
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


          </div>
  );
}
