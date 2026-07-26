import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import ReportRow from '../components/ReportRow';
import AppealRow from '../components/AppealRow';
import ReportDetailModal from '../components/ReportDetailModal';
import WarningModal from '../components/WarningModal';

export default function ModerationQueue() {
  const { role, accessToken } = useAuth();
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [escalatedReports, setEscalatedReports] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [activeTab, setActiveTab] = useState(location.state?.fromTab || 'Active Reports');
  const [filterType, setFilterType] = useState('All');
  const [filterReason, setFilterReason] = useState('All');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [loading, setLoading] = useState(true);
  
  const [reportReasons, setReportReasons] = useState([]);

  // Pagination State
  const [activePage, setActivePage] = useState(1);
  const [activeTotalPages, setActiveTotalPages] = useState(1);
  const [escalatedPage, setEscalatedPage] = useState(1);
  const [escalatedTotalPages, setEscalatedTotalPages] = useState(1);

  // Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [userToWarn, setUserToWarn] = useState(null);
  const [warningReportGroup, setWarningReportGroup] = useState(null);

  const fetchReports = async (status, setter, setTotalPages, page, type = 'All', reason = 'All', severity = 'All') => {
    try {
      const queryParams = new URLSearchParams({
        status,
        page,
        limit: 10,
        type,
        reason,
        severity
      });
      const res = await fetch(`/api/admin/reports?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`Fetched ${status} reports:`, data);
        setter(data.reports || []);
        if (setTotalPages) setTotalPages(data.totalPages || 1);
      } else {
        console.error(`Failed to fetch ${status} reports:`, res.status, await res.text());
        if (res.status === 401 || res.status === 403) {
           alert("Your session has expired or you do not have permission. Please log out and log back in.");
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAppeals = async () => {
    try {
      const res = await fetch('/api/admin/appeals?status=pending', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAppeals(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (accessToken) {
      setLoading(true);
      
      const fetchReasons = async () => {
        try {
          const res = await fetch('/api/admin/reports/reasons', { headers: { 'Authorization': `Bearer ${accessToken}` } });
          if (res.ok) {
            const data = await res.json();
            setReportReasons(data); // store the full array of {code, label}
          }
        } catch (e) {
          console.error(e);
        }
      };

      Promise.all([
        fetchReports('active', setReports, setActiveTotalPages, activePage, filterType, filterReason, filterSeverity),
        fetchReports('escalated', setEscalatedReports, setEscalatedTotalPages, escalatedPage, filterType, filterReason, filterSeverity),
        fetchAppeals(),
        fetchReasons()
      ]).finally(() => setLoading(false));
    }
  }, [accessToken, activePage, escalatedPage, filterType, filterReason, filterSeverity]);

  const filteredReports = activeTab === 'Escalations' ? escalatedReports : reports;

  const groupedReports = React.useMemo(() => {
    const groups = {};
    filteredReports.forEach(report => {
      // Group by postId, fallback to contentPreview if missing
      const groupId = report.postId || report.contentPreview;
      
      if (!groups[groupId]) {
        groups[groupId] = {
          id: groupId, // The grouped ID
          type: report.type,
          contentPreview: report.contentPreview,
          postId: report.postId,
          postTime: report.postTime,
          image: report.image,
          offenses: report.offenses,
          targetUserId: report.targetUserId,
          targetUserName: report.targetUserName,
          reports: [],
        };
      }
      groups[groupId].reports.push(report);
    });

    // Post-process the groups
    return Object.values(groups).map(group => {
      // Determine highest severity
      const hasTier3 = group.reports.some(r => (r.severity || '').includes('Tier 3'));
      const hasTier2 = group.reports.some(r => (r.severity || '').includes('Tier 2'));
      const highestSeverity = hasTier3 ? 'Tier 3 (Severe)' : (hasTier2 ? 'Tier 2 (Moderate)' : 'Tier 1 (Minor)');
      
      // Get unique reasons
      const uniqueReasons = [...new Set(group.reports.map(r => r.reason))];
      
      // Get unique reporters count
      const uniqueReporters = new Set(group.reports.map(r => r.reportedBy)).size;

      return {
        ...group,
        highestSeverity,
        uniqueReasons,
        uniqueReporters,
        reportCount: group.reports.length
      };
    }).sort((a, b) => {
      // Sort by severity first, then by number of reports
      if (a.highestSeverity !== b.highestSeverity) {
        if (a.highestSeverity.includes('Tier 3')) return -1;
        if (b.highestSeverity.includes('Tier 3')) return 1;
        if (a.highestSeverity.includes('Tier 2')) return -1;
        if (b.highestSeverity.includes('Tier 2')) return 1;
      }
      return b.reportCount - a.reportCount;
    });
  }, [filteredReports]);

  const updateReportStatusBulk = async (reportIds, status) => {
    try {
      const promises = reportIds.map(id => 
        fetch(`/api/admin/reports/${id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status })
        })
      );
      await Promise.all(promises);
      
      // Update local state by filtering out all affected report IDs
      if (activeTab === 'Escalations') {
        setEscalatedReports(prev => prev.filter(r => !reportIds.includes(r.id)));
      } else {
        setReports(prev => prev.filter(r => !reportIds.includes(r.id)));
      }
    } catch (e) {
      console.error("Bulk update error:", e);
    }
  };

  const handleApproveGroup = async (groupedReport) => {
    if (window.confirm(`Approve content and dismiss all ${groupedReport.reportCount} reports?`)) {
      const reportIds = groupedReport.reports.map(r => r.id);
      await updateReportStatusBulk(reportIds, 'dismissed');
      alert("All reports dismissed.");
    }
  };

  const handleDismissFromModal = async (reportIds) => {
    await updateReportStatusBulk(reportIds, 'dismissed');
    setIsModalOpen(false);
    alert("Reports dismissed.");
  };

  const handleDismissIndividual = async (id) => {
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' })
      });
      if (res.ok) {
        if (activeTab === 'Escalations') {
          setEscalatedReports(prev => prev.filter(r => r.id !== id));
        } else {
          setReports(prev => prev.filter(r => r.id !== id));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteContent = async (groupedReport) => {
    if (window.confirm("Are you sure you want to delete this content? This action cannot be undone.")) {
      try {
        const endpoint = groupedReport.type === 'Content' ? `/api/admin/posts/${groupedReport.postId}` : null;
        
        if (!endpoint) {
          alert(`Deletion not implemented for type: ${groupedReport.type}`);
          return;
        }

        const res = await fetch(endpoint, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (res.ok) {
          const reportIds = groupedReport.reports.map(r => r.id);
          if (activeTab === 'Escalations') {
            setEscalatedReports(prev => prev.filter(r => !reportIds.includes(r.id)));
          } else {
            setReports(prev => prev.filter(r => !reportIds.includes(r.id)));
          }
          setIsModalOpen(false);
          alert("Content deleted and associated reports resolved.");
        } else {
          const data = await res.json();
          alert(`Error deleting content: ${data.error}`);
        }
      } catch (e) {
        console.error(e);
        alert("Failed to delete content.");
      }
    }
  };

  const handleEscalateGroup = async (groupedReport) => {
    if (window.confirm(`Are you sure you want to manually escalate all ${groupedReport.reportCount} reports to an Administrator?`)) {
      const reportIds = groupedReport.reports.map(r => r.id);
      await updateReportStatusBulk(reportIds, 'escalated');
      
      // Add them locally to the escalated tab if we are in active reports
      if (activeTab !== 'Escalations') {
        const newEscalated = groupedReport.reports.map(r => ({ ...r, status: 'escalated' }));
        setEscalatedReports(prev => [...prev, ...newEscalated]);
      }
      alert("Reports escalated to Administrator.");
    }
  };

  const handleSuspendGroup = async (groupedReport) => {
    if (groupedReport.highestSeverity.includes('Tier 3') && role === 'moderator') {
      alert("Moderators cannot directly suspend for Tier 3 violations. Please escalate using the Reject button.");
      return;
    }
    
    if (window.confirm(`Proceed with Suspension for user who posted this?`)) {
      const reportIds = groupedReport.reports.map(r => r.id);
      await updateReportStatusBulk(reportIds, 'resolved');
      alert("Reports resolved and suspension logged.");
    }
  };

  const handleAppealAction = async (id, action) => {
    try {
      const res = await fetch(`/api/admin/appeals/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        alert(`Appeal processed successfully.`);
        setAppeals(appeals.filter(a => a.id !== id));
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) {
          alert('Permission denied: Only Admins can process appeals.');
        } else {
          alert(`Error processing appeal: ${data.error || res.statusText}`);
        }
        console.error('Appeal action failed:', res.status, data);
      }
    } catch (e) {
      console.error('Appeal action error:', e);
      alert('Network error: Could not process appeal. Please try again.');
    }
  };

  const openReportModal = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleOpenWarnModal = (groupedReport) => {
    const authorId = groupedReport.reports?.[0]?.targetUserId || groupedReport.targetUserId;
    const authorName = groupedReport.reports?.[0]?.targetUserName || groupedReport.targetUserName;
    if (!authorId) {
      alert("Unable to identify the author of this content.");
      return;
    }
    setUserToWarn({ id: authorId, name: authorName });
    setWarningReportGroup(groupedReport);
    setWarningModalOpen(true);
  };

  const handleSendWarning = async ({ reason, message, isSevere }) => {
    if (!userToWarn || !warningReportGroup) return;
    try {
      const response = await fetch(`/api/admin/users/${userToWarn.id}/warn`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ reason, message, isSevere })
      });
      const data = await response.json();
      
      let autoSuspended = data.autoSuspended;
      let alertMsg = "";
      if (autoSuspended) {
        alertMsg = `${userToWarn.name} has been warned and AUTOMATICALLY SUSPENDED due to exceeding 7 moderation flags.`;
      } else {
        if (isSevere) {
          alertMsg = `Severe warning sent to ${userToWarn.name}. Their moderation flag was incremented (Total: ${data.moderation_flags}).`;
        } else {
          alertMsg = `Warning sent to ${userToWarn.name}. No moderation flags were added.`;
        }
      }
      
      // Auto-resolve all reports in this group
      const reportIds = warningReportGroup.reports.map(r => r.id);
      await updateReportStatusBulk(reportIds, 'resolved');
      
      alert(alertMsg + "\n\nAssociated reports have been resolved.");
      
      setIsModalOpen(false); // Close the detail modal
    } catch (e) {
      console.error(e);
      alert("Failed to send warning.");
    } finally {
      setWarningModalOpen(false);
      setUserToWarn(null);
      setWarningReportGroup(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-10"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;
  }

  return (
    <div className="flex-1 flex flex-col max-w-max-width mx-auto w-full pb-xl">
      {/* Page Header & Filters */}
      <div className="flex flex-col gap-lg mb-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="flex gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 shrink-0 rounded-xl bg-surface border border-outline-variant flex items-center justify-center text-on-surface hover:bg-slate-50 transition-colors shadow-sm self-start mt-1"
              title="Go Back"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div>
              <h2 className="font-display-lg text-display-lg text-on-surface">Moderation Queue</h2>
              <p className="font-body-md text-on-surface-variant mt-xs">Process reports to maintain community standards and safety.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-sm md:gap-md w-full md:w-auto">
            <Link 
              to="/review-history" 
              state={{ 
                filter: activeTab === 'Appeals' ? 'Appeals' : 'All Cases',
                fromTab: activeTab
              }}
              className="flex items-center gap-xs font-label-md text-primary bg-primary/10 hover:bg-primary/20 px-md py-sm rounded-lg transition-colors whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">history</span>
              Review History
            </Link>
            <button 
              onClick={() => {
                setLoading(true);
                Promise.all([
                  fetchReports('active', setReports, setActiveTotalPages, activePage, filterType, filterReason, filterSeverity),
                  fetchReports('escalated', setEscalatedReports, setEscalatedTotalPages, escalatedPage, filterType, filterReason, filterSeverity),
                  fetchAppeals()
                ]).finally(() => setLoading(false));
              }}
              className="flex items-center gap-xs font-label-md text-on-surface bg-surface-container-high hover:bg-surface-variant px-md py-sm rounded-lg transition-colors whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Refresh
            </button>
            <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant overflow-x-auto max-w-full w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('Active Reports')}
              className={`px-sm md:px-lg py-sm rounded-lg font-label-md transition-colors whitespace-nowrap ${activeTab === 'Active Reports' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              Active Reports
            </button>
            {role === 'admin' && (
              <>
                <button 
                  onClick={() => setActiveTab('Escalations')}
                  className={`px-sm md:px-lg py-sm rounded-lg font-label-md transition-colors whitespace-nowrap ${activeTab === 'Escalations' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  Escalations
                </button>
                <button 
                  onClick={() => setActiveTab('Appeals')}
                  className={`px-sm md:px-lg py-sm rounded-lg font-label-md transition-colors whitespace-nowrap ${activeTab === 'Appeals' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}
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
              onChange={(e) => { setActivePage(1); setEscalatedPage(1); setFilterType(e.target.value); }}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg font-body-sm text-on-surface px-md py-sm focus:ring-primary focus:outline-none"
            >
              <option value="All">Type: All</option>
              <option value="Content">Content</option>
              <option value="Comment">Thought / Comment</option>
              <option value="Account">Account</option>
              <option value="Organization">Organization</option>
              <option value="Job">Job</option>
            </select>
            <select
              value={filterReason}
              onChange={(e) => { setActivePage(1); setEscalatedPage(1); setFilterReason(e.target.value); }}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg font-body-sm text-on-surface px-md py-sm focus:ring-primary focus:outline-none"
            >
              <option value="All">Reason: All</option>
              {reportReasons.map((r) => (
                <option key={r.code} value={r.label}>{r.code}</option>
              ))}
            </select>
            <select
              value={filterSeverity}
              onChange={(e) => { setActivePage(1); setEscalatedPage(1); setFilterSeverity(e.target.value); }}
              className="bg-surface-container-lowest border border-outline-variant rounded-lg font-body-sm text-on-surface px-md py-sm focus:ring-primary focus:outline-none"
            >
              <option value="All">Tier: All</option>
              <option value="Tier 3 (Severe)">Tier 3 (Severe)</option>
              <option value="Tier 2 (Moderate)">Tier 2 (Moderate)</option>
              <option value="Tier 1 (Minor)">Tier 1 (Minor)</option>
            </select>
            {(filterType !== 'All' || filterReason !== 'All' || filterSeverity !== 'All') && (
              <button
                onClick={() => { setActivePage(1); setEscalatedPage(1); setFilterType('All'); setFilterReason('All'); setFilterSeverity('All'); }}
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
                {groupedReports.map((report) => (
                  <ReportRow 
                    key={report.id} 
                    report={report} 
                    role={role} 
                    activeTab={activeTab}
                    onApprove={() => handleApproveGroup(report)}
                    onReject={() => openReportModal(report)}
                    onEscalate={() => handleEscalateGroup(report)}
                    onSuspend={() => handleSuspendGroup(report)}
                  />
                ))}
                {groupedReports.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-lg py-xl text-center text-on-surface-variant">
                      No reports found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-lg py-md border-t border-outline-variant bg-surface-container">
            <span className="font-body-sm text-on-surface-variant">
              Page {activeTab === 'Escalations' ? escalatedPage : activePage} of {activeTab === 'Escalations' ? escalatedTotalPages : activeTotalPages}
            </span>
            <div className="flex gap-sm">
              <button 
                disabled={activeTab === 'Escalations' ? escalatedPage === 1 : activePage === 1}
                onClick={() => activeTab === 'Escalations' ? setEscalatedPage(p => Math.max(1, p - 1)) : setActivePage(p => Math.max(1, p - 1))}
                className="px-md py-xs font-label-md bg-surface border border-outline-variant rounded hover:bg-surface-variant disabled:opacity-50 transition-opacity"
              >
                Previous
              </button>
              <button 
                disabled={activeTab === 'Escalations' ? escalatedPage >= escalatedTotalPages : activePage >= activeTotalPages}
                onClick={() => activeTab === 'Escalations' ? setEscalatedPage(p => Math.min(escalatedTotalPages, p + 1)) : setActivePage(p => Math.min(activeTotalPages, p + 1))}
                className="px-md py-xs font-label-md bg-surface border border-outline-variant rounded hover:bg-surface-variant disabled:opacity-50 transition-opacity"
              >
                Next
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
                  <AppealRow 
                    key={appeal.id} 
                    appeal={appeal} 
                    onAction={handleAppealAction}
                  />
                ))}
                {appeals.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-lg py-xl text-center text-on-surface-variant">
                      No appeals found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      <ReportDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        report={selectedReport}
        role={role}
        onDeleteContent={handleDeleteContent}
        onDismissReport={handleDismissFromModal}
        onDismissIndividual={handleDismissIndividual}
        onWarnUser={handleOpenWarnModal}
      />

      {/* Warning Modal */}
      <WarningModal
        isOpen={warningModalOpen}
        onClose={() => setWarningModalOpen(false)}
        userName={userToWarn?.name}
        onSend={handleSendWarning}
      />
    </div>
  );
}
