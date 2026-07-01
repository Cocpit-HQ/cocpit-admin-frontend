import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import ReportRow from '../components/ReportRow';
import AppealRow from '../components/AppealRow';
import ReportDetailModal from '../components/ReportDetailModal';

export default function ModerationQueue() {
  const { role, accessToken } = useAuth();
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [escalatedReports, setEscalatedReports] = useState([]);
  const [appeals, setAppeals] = useState([]);
  const [activeTab, setActiveTab] = useState(location.state?.fromTab || (role === 'admin' ? 'Escalations' : 'Active Reports'));
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

  const updateReportStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        if (activeTab === 'Escalations') {
          setEscalatedReports(escalatedReports.filter(r => r.id !== id));
        } else {
          setReports(reports.filter(r => r.id !== id));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm("Approve content and dismiss the report?")) {
      await updateReportStatus(id, 'dismissed');
      alert("Report dismissed.");
    }
  };

  const handleDismissFromModal = async (id) => {
    await updateReportStatus(id, 'dismissed');
    setIsModalOpen(false);
    alert("Report dismissed.");
  };

  const handleDeleteContent = async (report) => {
    if (window.confirm("Are you sure you want to delete this content? This action cannot be undone.")) {
      try {
        // Assume Content reports refer to posts for MVP
        const endpoint = report.type === 'Content' ? `/api/admin/posts/${report.postId}` : null;
        
        if (!endpoint) {
          alert(`Deletion not implemented for type: ${report.type}`);
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
          // Remove from local state since backend auto-resolves reports
          if (activeTab === 'Escalations') {
            setEscalatedReports(escalatedReports.filter(r => r.id !== report.id));
          } else {
            setReports(reports.filter(r => r.id !== report.id));
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

  const handleReject = async (report) => {
    // We now have a modal for this, but keeping quick action for escalate
    let penalty = "Review for immediate action.";
    if (role === 'moderator' && report.severity.includes('Tier 3')) {
      penalty = "Tier 3 violation: Escalate to Admin.";
      if (window.confirm(`Action Recommended:\n${penalty}\n\nProceed with escalation?`)) {
        await updateReportStatus(report.id, 'escalated');
        setReports(reports.filter(r => r.id !== report.id));
        setEscalatedReports([...escalatedReports, { ...report, status: 'escalated' }]);
        alert("Escalated to Administrator.");
      }
      return;
    }
    
    // For non-Tier 3, just open the modal to review
    openReportModal(report);
  };

  const handleEscalate = async (report) => {
    if (window.confirm(`Are you sure you want to manually escalate this case to an Administrator?`)) {
      await updateReportStatus(report.id, 'escalated');
      setReports(reports.filter(r => r.id !== report.id));
      setEscalatedReports([...escalatedReports, { ...report, status: 'escalated' }]);
      alert("Escalated to Administrator.");
    }
  };

  const handleSuspend = async (report) => {
    if (report.severity.includes('Tier 3') && role === 'moderator') {
      alert("Moderators cannot directly suspend for Tier 3 violations. Please escalate using the Reject button.");
      return;
    }
    
    if (window.confirm(`Proceed with Suspension for user who posted this?`)) {
      await updateReportStatus(report.id, 'resolved');
      alert("Report resolved and suspension logged.");
    }
  };

  const handleAppealAction = async (id, status) => {
    try {
      const res = await fetch(`/api/admin/appeals/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        alert(`Appeal Processed.`);
        setAppeals(appeals.filter(a => a.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openReportModal = (report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center p-10"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;
  }

  return (
    <div className="flex-1 flex flex-col max-w-max-width mx-auto w-full pb-xl">
      {/* Page Header & Filters */}
      <div className="flex flex-col gap-lg mb-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="font-display-lg text-display-lg text-on-surface">Moderation Queue</h2>
            <p className="font-body-md text-on-surface-variant mt-xs">Process reports to maintain community standards and safety.</p>
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
              <option value="Account">Account</option>
              <option value="Organization">Organization</option>
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
                {filteredReports.map((report) => (
                  <ReportRow 
                    key={report.id} 
                    report={report} 
                    role={role} 
                    activeTab={activeTab}
                    onApprove={handleApprove}
                    onReject={() => openReportModal(report)}
                    onEscalate={handleEscalate}
                    onSuspend={handleSuspend}
                  />
                ))}
                {filteredReports.length === 0 && (
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
      />
    </div>
  );
}
