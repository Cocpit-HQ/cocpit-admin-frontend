import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useEnvironment } from '../EnvironmentContext';
import ReportRow from '../components/ReportRow';
import AppealRow from '../components/AppealRow';
import ReportDetailModal from '../components/ReportDetailModal';
import WarningModal from '../components/WarningModal';
import ResolvedReportRow from '../components/ResolvedReportRow';
import ResolvedReportDetailModal from '../components/ResolvedReportDetailModal';
import JobVerificationQueue from '../components/analytics-breakdowns/JobVerificationQueue';

export default function ModerationQueue() {
  const { role, accessToken } = useAuth();
  const { environment } = useEnvironment();
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [escalatedReports, setEscalatedReports] = useState([]);
  const [resolvedReports, setResolvedReports] = useState([]);
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
  const [resolvedPage, setResolvedPage] = useState(1);
  const [resolvedTotalPages, setResolvedTotalPages] = useState(1);

  // Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [userToWarn, setUserToWarn] = useState(null);
  const [warningReportGroup, setWarningReportGroup] = useState(null);

  // Resolved Report Modal State
  const [selectedResolvedReport, setSelectedResolvedReport] = useState(null);
  const [isResolvedModalOpen, setIsResolvedModalOpen] = useState(false);

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
        headers: { 'Authorization': `Bearer ${accessToken}`,
            'x-environment': environment }
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
        headers: { 'Authorization': `Bearer ${accessToken}`, 'x-environment': environment }
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
          const res = await fetch('/api/admin/reports/reasons', { headers: { 'Authorization': `Bearer ${accessToken}`, 'x-environment': environment } });
          if (res.ok) {
            const data = await res.json();
            setReportReasons(data);
          }
        } catch (e) {
          console.error(e);
        }
      };

      Promise.all([
        fetchReports('active', setReports, setActiveTotalPages, activePage, filterType, filterReason, filterSeverity),
        fetchReports('escalated', setEscalatedReports, setEscalatedTotalPages, escalatedPage, filterType, filterReason, filterSeverity),
        fetchReports('all_resolved', setResolvedReports, setResolvedTotalPages, resolvedPage, filterType, filterReason, filterSeverity),
        fetchAppeals(),
        fetchReasons()
      ]).finally(() => setLoading(false));
    }
  }, [accessToken, environment, activePage, escalatedPage, resolvedPage, filterType, filterReason, filterSeverity]);

  const filteredReports = activeTab === 'Escalations' ? escalatedReports : reports;

  const groupedReports = React.useMemo(() => {
    const groups = {};
    filteredReports.forEach(report => {
      // Group by postId, fallback to contentPreview if missing
      const groupId = report.postId || report.contentPreview;
      
      if (!groups[groupId]) {
        groups[groupId] = {
          id: groupId,
          type: report.type,
          contentPreview: report.contentPreview,
          postId: report.postId,
          postTime: report.postTime,
          image: report.image,
          offenses: report.offenses,
          targetUserId: report.targetUserId,
          targetUserName: report.targetUserName,
          postImageUrl: report.postImageUrl,
          postMediaType: report.postMediaType,
          pollOptions: report.pollOptions,
          reports: [],
        };
      }
      groups[groupId].reports.push(report);
    });

    return Object.values(groups).map(group => {
      const hasTier3 = group.reports.some(r => (r.severity || '').includes('Tier 3'));
      const hasTier2 = group.reports.some(r => (r.severity || '').includes('Tier 2'));
      const highestSeverity = hasTier3 ? 'Tier 3 (Severe)' : (hasTier2 ? 'Tier 2 (Moderate)' : 'Tier 1 (Minor)');
      const uniqueReasons = [...new Set(group.reports.map(r => r.reason))];
      const uniqueReporters = new Set(group.reports.map(r => r.reportedBy)).size;

      const latestReportTime = group.reports.reduce((latest, r) => {
        const t = new Date(r.postTime).getTime();
        return t > latest ? t : latest;
      }, 0);

      const maxReportId = group.reports.reduce((max, r) => {
        const idNum = parseInt(r.id, 10) || 0;
        return idNum > max ? idNum : max;
      }, 0);

      return {
        ...group,
        highestSeverity,
        uniqueReasons,
        uniqueReporters,
        reportCount: group.reports.length,
        latestReportTime,
        maxReportId
      };
    }).sort((a, b) => {
      // Chronological Order: Newest submitted reports first!
      if (b.latestReportTime !== a.latestReportTime) {
        return b.latestReportTime - a.latestReportTime;
      }
      return b.maxReportId - a.maxReportId;
    });
  }, [filteredReports]);

  const updateReportStatusBulk = async (reportIds, status, note = null) => {
    try {
      const promises = reportIds.map(id => 
        fetch(`/api/admin/reports/${id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status, note })
        })
      );
      await Promise.all(promises);
      
      if (activeTab === 'Escalations') {
        setEscalatedReports(prev => prev.filter(r => !reportIds.includes(r.id)));
      } else {
        setReports(prev => prev.filter(r => !reportIds.includes(r.id)));
      }
      // Refresh resolved reports tab
      fetchReports('all_resolved', setResolvedReports, setResolvedTotalPages, resolvedPage, filterType, filterReason, filterSeverity);
    } catch (e) {
      console.error("Bulk update error:", e);
    }
  };

  const handleApproveGroup = async (groupedReport) => {
    if (window.confirm(`Approve content and dismiss all ${groupedReport.reportCount} reports?`)) {
      const reportIds = groupedReport.reports.map(r => r.id);
      await updateReportStatusBulk(reportIds, 'dismissed');
      alert("All reports dismissed and logged as resolved.");
    }
  };

  const handleDismissFromModal = async (reportIds, note = null) => {
    await updateReportStatusBulk(reportIds, 'dismissed', note);
    setIsModalOpen(false);
    alert("Reports dismissed and moved to Resolved Reports.");
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
        fetchReports('all_resolved', setResolvedReports, setResolvedTotalPages, resolvedPage, filterType, filterReason, filterSeverity);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteContent = async (groupedReport) => {
    if (window.confirm("Are you sure you want to delete this content? This action cannot be undone.")) {
      try {
        const endpoint = (groupedReport.type === 'Content' || groupedReport.type === 'POST') 
          ? `/api/admin/posts/${groupedReport.postId}` 
          : groupedReport.type === 'Comment' || groupedReport.type === 'COMMENT'
          ? `/api/admin/comments/${groupedReport.postId}`
          : null;
        
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
          fetchReports('all_resolved', setResolvedReports, setResolvedTotalPages, resolvedPage, filterType, filterReason, filterSeverity);
          setIsModalOpen(false);
          alert("Content deleted, author notified in Account Actions, and associated reports resolved.");
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

    const targetUserId = groupedReport.reports?.[0]?.targetUserId || groupedReport.targetUserId;
    if (!targetUserId) {
      alert("Unable to identify target user for suspension.");
      return;
    }
    
    if (window.confirm(`Proceed with Suspension for user who posted this?`)) {
      const reportIds = groupedReport.reports.map(r => r.id);
      try {
        const res = await fetch(`/api/admin/users/${targetUserId}/suspend`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            duration: 'Short Temporary (3-7 days)',
            reportIds
          })
        });
        if (res.ok) {
          if (activeTab === 'Escalations') {
            setEscalatedReports(prev => prev.filter(r => !reportIds.includes(r.id)));
          } else {
            setReports(prev => prev.filter(r => !reportIds.includes(r.id)));
          }
          fetchReports('all_resolved', setResolvedReports, setResolvedTotalPages, resolvedPage, filterType, filterReason, filterSeverity);
          alert("User suspended, Account Action delivered to user app, and reports resolved.");
        } else {
          alert("Failed to suspend user.");
        }
      } catch (e) {
        console.error(e);
        alert("Error suspending user.");
      }
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
      const reportIds = warningReportGroup.reports.map(r => r.id);
      const response = await fetch(`/api/admin/users/${userToWarn.id}/warn`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          reason, 
          message, 
          isSevere,
          reportIds,
          postId: warningReportGroup.postId,
          postTitle: warningReportGroup.contentPreview
        })
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
      
      // Remove from active/escalated
      if (activeTab === 'Escalations') {
        setEscalatedReports(prev => prev.filter(r => !reportIds.includes(r.id)));
      } else {
        setReports(prev => prev.filter(r => !reportIds.includes(r.id)));
      }

      // Re-fetch resolved reports so it appears immediately in the Resolved Reports tab
      fetchReports('all_resolved', setResolvedReports, setResolvedTotalPages, resolvedPage, filterType, filterReason, filterSeverity);
      
      alert(alertMsg + "\n\nWarning was delivered to user's in-app 'Account Actions' tab and reports resolved.");
      
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to send warning.");
    } finally {
      setWarningModalOpen(false);
      setUserToWarn(null);
      setWarningReportGroup(null);
    }
  };

  const handleSelectResolved = (report) => {
    setSelectedResolvedReport(report);
    setIsResolvedModalOpen(true);
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
                  fetchReports('all_resolved', setResolvedReports, setResolvedTotalPages, resolvedPage, filterType, filterReason, filterSeverity),
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
                className={`px-sm md:px-lg py-sm rounded-lg font-label-md transition-colors whitespace-nowrap ${activeTab === 'Active Reports' ? 'bg-surface shadow-sm text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                Active Reports
              </button>
              {role === 'admin' && (
                <>
                  <button 
                    onClick={() => setActiveTab('Escalations')}
                    className={`px-sm md:px-lg py-sm rounded-lg font-label-md transition-colors whitespace-nowrap ${activeTab === 'Escalations' ? 'bg-surface shadow-sm text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
                  >
                    Escalations
                  </button>
                  <button 
                    onClick={() => setActiveTab('Appeals')}
                    className={`px-sm md:px-lg py-sm rounded-lg font-label-md transition-colors whitespace-nowrap ${activeTab === 'Appeals' ? 'bg-surface shadow-sm text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
                  >
                    Appeals
                  </button>
                </>
              )}
              <button 
                onClick={() => setActiveTab('Resolved Reports')}
                className={`px-sm md:px-lg py-sm rounded-lg font-label-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'Resolved Reports' ? 'bg-surface shadow-sm text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                <span>Resolved Reports</span>
                {resolvedReports.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-green-100 text-green-800 font-bold">
                    {resolvedReports.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('Job Verification')}
                className={`px-sm md:px-lg py-sm rounded-lg font-label-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === 'Job Verification' ? 'bg-surface shadow-sm text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Job Verification</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR (Shown for Active, Escalations, and Resolved tabs) */}
      {activeTab !== 'Appeals' && activeTab !== 'Job Verification' && (
        <div className="flex flex-wrap items-center gap-md bg-surface-container-low p-md border border-outline-variant rounded-xl mb-xl">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">filter_list</span>
            <span className="font-label-md text-on-surface">Filter By:</span>
          </div>
          <select
            value={filterType}
            onChange={(e) => { setActivePage(1); setEscalatedPage(1); setResolvedPage(1); setFilterType(e.target.value); }}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg font-body-sm text-on-surface px-md py-sm focus:ring-primary focus:outline-none"
          >
            <option value="All">Type: All</option>
            <option value="Content">Content / Post</option>
            <option value="Comment">Thought / Comment</option>
            <option value="Account">Account</option>
            <option value="Organization">Organization</option>
            <option value="Job">Job</option>
          </select>
          <select
            value={filterReason}
            onChange={(e) => { setActivePage(1); setEscalatedPage(1); setResolvedPage(1); setFilterReason(e.target.value); }}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg font-body-sm text-on-surface px-md py-sm focus:ring-primary focus:outline-none"
          >
            <option value="All">Reason: All</option>
            {reportReasons.map((r) => (
              <option key={r.code} value={r.label}>{r.code}</option>
            ))}
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => { setActivePage(1); setEscalatedPage(1); setResolvedPage(1); setFilterSeverity(e.target.value); }}
            className="bg-surface-container-lowest border border-outline-variant rounded-lg font-body-sm text-on-surface px-md py-sm focus:ring-primary focus:outline-none"
          >
            <option value="All">Tier: All</option>
            <option value="Tier 3 (Severe)">Tier 3 (Severe)</option>
            <option value="Tier 2 (Moderate)">Tier 2 (Moderate)</option>
            <option value="Tier 1 (Minor)">Tier 1 (Minor)</option>
          </select>
          {(filterType !== 'All' || filterReason !== 'All' || filterSeverity !== 'All') && (
            <button
              onClick={() => { setActivePage(1); setEscalatedPage(1); setResolvedPage(1); setFilterType('All'); setFilterReason('All'); setFilterSeverity('All'); }}
              className="text-primary font-label-md hover:underline bg-transparent border-none cursor-pointer px-sm py-xs"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* ACTIVE REPORTS & ESCALATIONS TABLE */}
      {(activeTab === 'Active Reports' || activeTab === 'Escalations') && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant">
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider">Report ID</th>
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider">Content Preview</th>
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider">Violations</th>
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider">Reporters</th>
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {groupedReports.map((groupedReport) => (
                  <ReportRow 
                    key={groupedReport.id} 
                    report={groupedReport} 
                    role={role}
                    activeTab={activeTab}
                    onApprove={() => handleApproveGroup(groupedReport)}
                    onReject={() => openReportModal(groupedReport)}
                    onEscalate={() => handleEscalateGroup(groupedReport)}
                    onSuspend={() => handleSuspendGroup(groupedReport)}
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

          {/* Pagination */}
          <div className="p-md border-t border-outline-variant flex items-center justify-between">
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
      )}

      {/* RESOLVED REPORTS TAB */}
      {activeTab === 'Resolved Reports' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-surface-container border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-semibold text-on-surface text-base">Resolved Reports &amp; Actions Log</h3>
              <p className="text-xs text-on-surface-variant">Reports resolved with warnings, content removals, suspensions, or dismissals delivered to in-app accounts.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              {resolvedReports.length} Cases Resolved
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container/60 border-b border-outline-variant">
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider">Report / Date</th>
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider">Reported Item &amp; Target</th>
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider">Reason &amp; Reporter</th>
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider">Published Action</th>
                  <th className="px-lg py-md font-label-md text-on-surface-variant uppercase tracking-wider text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {resolvedReports.map((report) => (
                  <ResolvedReportRow
                    key={report.id}
                    report={report}
                    onSelect={handleSelectResolved}
                  />
                ))}
                {resolvedReports.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-lg py-xl text-center text-on-surface-variant">
                      <div className="flex flex-col items-center justify-center py-6">
                        <span className="material-symbols-outlined text-4xl text-on-surface-variant/50 mb-2">task_alt</span>
                        <p className="font-medium text-sm">No resolved reports found.</p>
                        <p className="text-xs text-on-surface-variant mt-1">When reports are dismissed or resolved with warnings/removals, they will appear here.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-md border-t border-outline-variant flex items-center justify-between">
            <span className="font-body-sm text-on-surface-variant">
              Page {resolvedPage} of {resolvedTotalPages}
            </span>
            <div className="flex gap-sm">
              <button 
                disabled={resolvedPage === 1}
                onClick={() => setResolvedPage(p => Math.max(1, p - 1))}
                className="px-md py-xs font-label-md bg-surface border border-outline-variant rounded hover:bg-surface-variant disabled:opacity-50 transition-opacity"
              >
                Previous
              </button>
              <button 
                disabled={resolvedPage >= resolvedTotalPages}
                onClick={() => setResolvedPage(p => Math.min(resolvedTotalPages, p + 1))}
                className="px-md py-xs font-label-md bg-surface border border-outline-variant rounded hover:bg-surface-variant disabled:opacity-50 transition-opacity"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPEALS TAB */}
      {activeTab === 'Appeals' && (
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

      {/* JOB VERIFICATION TAB */}
      {activeTab === 'Job Verification' && (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md sm:p-lg shadow-sm">
          <JobVerificationQueue />
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

      {/* Resolved Report Detail Modal */}
      <ResolvedReportDetailModal
        isOpen={isResolvedModalOpen}
        onClose={() => setIsResolvedModalOpen(false)}
        report={selectedResolvedReport}
      />
    </div>
  );
}
