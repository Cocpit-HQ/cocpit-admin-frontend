import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function ReviewHistory() {
  const location = useLocation();
  const { accessToken } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState(location.state?.filter || 'All Cases');
  const [visibleCount, setVisibleCount] = useState(4);
  
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!accessToken) return;
      try {
        setLoading(true);
        const headers = { 'Authorization': `Bearer ${accessToken}` };
        
        // Fetch all history data concurrently
        const [resolvedRes, dismissedRes, approvedAppealsRes, rejectedAppealsRes] = await Promise.all([
          fetch('/api/admin/reports?status=resolved', { headers }),
          fetch('/api/admin/reports?status=dismissed', { headers }),
          fetch('/api/admin/appeals?status=approved', { headers }),
          fetch('/api/admin/appeals?status=rejected', { headers })
        ]);

        const resolvedData = resolvedRes.ok ? await resolvedRes.json() : { reports: [] };
        const dismissedData = dismissedRes.ok ? await dismissedRes.json() : { reports: [] };
        const approvedAppealsData = approvedAppealsRes.ok ? await approvedAppealsRes.json() : [];
        const rejectedAppealsData = rejectedAppealsRes.ok ? await rejectedAppealsRes.json() : [];

        // Format reports
        const formatReport = (r, status) => ({
          id: `#RPT-${r.id}`,
          type: r.type,
          name: r.targetUserName || r.rawType || 'Unknown',
          status: status,
          reason: r.reason || 'Violation',
          contentPreview: r.contentPreview || 'No content preview available.',
          flaggedBy: r.reportedBy || 'System',
          time: new Date(r.postTime).toLocaleDateString(),
          image: r.image,
          icon: r.type === 'User' ? 'person' : 'article',
          rawTime: new Date(r.postTime).getTime()
        });

        const formattedResolved = (resolvedData.reports || []).map(r => formatReport(r, r.type === 'User' ? 'Suspended' : 'Rejected'));
        const formattedDismissed = (dismissedData.reports || []).map(r => formatReport(r, 'Approved'));

        // Format appeals
        const formatAppeal = (a, status) => ({
          id: `#APP-${a.id}`,
          type: 'Appeal',
          name: a.user || 'Unknown User',
          status: status,
          reason: 'Appeal for Suspended Account',
          contentPreview: a.appealText || 'No appeal text provided.',
          flaggedBy: 'User Submission',
          time: new Date(a.appealTime).toLocaleDateString(),
          icon: 'gavel',
          rawTime: new Date(a.appealTime).getTime()
        });

        const formattedApprovedAppeals = approvedAppealsData.map(a => formatAppeal(a, 'Reinstated'));
        const formattedRejectedAppeals = rejectedAppealsData.map(a => formatAppeal(a, 'Upheld'));

        // Combine and sort by time descending
        const combined = [
          ...formattedResolved,
          ...formattedDismissed,
          ...formattedApprovedAppeals,
          ...formattedRejectedAppeals
        ].sort((a, b) => b.rawTime - a.rawTime);

        setHistoryData(combined);
      } catch (err) {
        console.error('Failed to fetch history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [accessToken]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Suspended': return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
      case 'Rejected': return 'bg-error-container text-on-error-container';
      case 'Approved': return 'bg-secondary-container text-on-secondary-container';
      case 'Reinstated': return 'bg-green-100 text-green-700';
      case 'Upheld': return 'bg-error text-white';
      default: return 'bg-surface-container-high text-on-surface';
    }
  };

  const getIconColor = (status) => {
    switch (status) {
      case 'Suspended': return 'text-tertiary';
      case 'Rejected': return 'text-error';
      case 'Approved': return 'text-secondary';
      case 'Reinstated': return 'text-green-600';
      case 'Upheld': return 'text-error';
      default: return 'text-primary';
    }
  };

  const filteredHistory = historyData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.contentPreview.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'All Cases' || 
                          item.status === activeFilter || 
                          (activeFilter === 'Appeals' && item.type === 'Appeal');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-1 flex flex-col max-w-max-width mx-auto w-full pb-xl">
      <div className="flex flex-col gap-lg mb-xl">
        <Link 
          to="/moderation" 
          state={{ fromTab: location.state?.fromTab }}
          className="flex items-center gap-xs text-on-surface-variant hover:text-primary transition-colors font-label-md w-max"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Moderation
        </Link>
        <div>
          <h2 className="font-display-lg text-display-lg text-on-surface">Review History</h2>
          <p className="font-body-md text-on-surface-variant mt-xs">Audit past moderation decisions and platform safety actions.</p>
        </div>

        {/* Search Bar Section */}
        <div className="relative group w-full lg:w-1/2">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">search</span>
          <input 
            className="w-full pl-10 pr-md py-sm bg-surface-container-low border border-outline-variant rounded-full font-body-md text-on-surface placeholder-on-surface-variant/60 focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
            placeholder="Search moderation cases..." 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-sm overflow-x-auto no-scrollbar pb-md mb-md">
        {['All Cases', 'Approved', 'Rejected', 'Suspended', 'Appeals'].map(filter => (
          <button 
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`flex-shrink-0 px-md py-xs rounded-full font-label-md text-label-md transition-all active:scale-95 ${
              activeFilter === filter 
                ? 'bg-primary text-on-primary' 
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* History List */}
      <div className="space-y-md">
        {loading ? (
          <div className="flex justify-center p-12">
            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-xl text-center text-on-surface-variant font-body-md bg-surface-container-low rounded-xl border border-outline-variant">
            No moderation cases found matching your search.
          </div>
        ) : (
          filteredHistory.slice(0, visibleCount).map((item, index) => (
            <div key={index} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-col gap-sm shadow-sm transition-all hover:border-primary/50">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-sm">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden border border-outline-variant/20">
                    {item.image ? (
                      <img alt="User" className="w-full h-full object-cover" src={item.image} />
                    ) : (
                      <span className="material-symbols-outlined text-primary">{item.icon}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-on-surface leading-tight">{item.name}</h3>
                    <p className="text-[11px] text-on-surface-variant font-mono-label">ID: {item.id}</p>
                  </div>
                </div>
                <span className={`px-sm py-xs rounded text-[11px] font-bold uppercase tracking-wider ${getStatusStyle(item.status)}`}>
                  {item.status}
                </span>
              </div>
              
              <div className={`bg-surface-container-low p-sm rounded-lg ${item.status === 'Suspended' ? 'border-l-4 border-tertiary-container' : ''}`}>
                <p className={`text-body-sm text-on-surface ${item.status !== 'Rejected' ? 'italic line-clamp-2' : ''}`}>
                  {item.contentPreview}
                </p>
              </div>
              
              <div className="flex flex-col gap-xs pt-xs border-t border-outline-variant/10 mt-2">
                <div className="flex items-center gap-xs">
                  <span className={`material-symbols-outlined text-[14px] ${getIconColor(item.status)}`}>
                    {item.status === 'Rejected' ? 'spam' : item.status === 'Approved' ? 'lock' : 'report'}
                  </span>
                  <span className={`text-body-sm font-semibold ${getIconColor(item.status)}`}>
                    {item.reason}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-on-surface-variant">
                  <span>Flagged by: <span className="text-on-surface font-medium">{item.flaggedBy}</span></span>
                  <span>{item.time}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Load More */}
      {!loading && visibleCount < filteredHistory.length && (
        <div className="mt-xl flex flex-col items-center">
          <button 
            onClick={() => setVisibleCount(prev => prev + 4)}
            className="w-full lg:w-1/3 py-md rounded-xl border border-outline-variant text-primary font-label-md text-label-md flex items-center justify-center gap-sm transition-all hover:bg-surface-container-low active:scale-[0.98]"
          >
            <span>LOAD MORE RECORDS</span>
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
          <p className="mt-md text-body-sm text-outline font-medium">Showing {visibleCount} of {filteredHistory.length} resolved cases</p>
        </div>
      )}
    </div>
  );
}
