import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  
  const [filterType, setFilterType] = useState('all');
  const [filterUser, setFilterUser] = useState('any');
  const [filterDate, setFilterDate] = useState('7 days');
  
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!accessToken) return;
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: 10,
          type: filterType,
          userId: filterUser,
          dateRange: filterDate
        });
        
        const response = await fetch(`/api/admin/audit-logs?${queryParams}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
          setTotalPages(data.totalPages || 1);
          setTotalLogs(data.totalLogs || 0);
        }
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [accessToken, currentPage, filterType, filterUser, filterDate]);

  // Click outside listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setIsTypeDropdownOpen(false);
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStyleForAction = (actionType) => {
    switch (actionType) {
      case 'LOGIN':
      case 'LOGOUT':
        return { icon: 'manage_accounts', color: 'text-tertiary', bgColor: 'bg-tertiary/10' };
      case 'UPDATE_RULES':
        return { icon: 'security', color: 'text-primary', bgColor: 'bg-primary/10' };
      case 'SUSPEND_USER':
      case 'UNSUSPEND_USER':
        return { icon: 'gavel', color: 'text-error', bgColor: 'bg-error/10' };
      case 'DATA_EXPORT':
        return { icon: 'cloud_download', color: 'text-secondary', bgColor: 'bg-secondary/10' };
      case 'RESOLVE_TICKET':
        return { icon: 'check_circle', color: 'text-success', bgColor: 'bg-success/10' };
      default:
        return { icon: 'history', color: 'text-outline', bgColor: 'bg-surface-container' };
    }
  };

  const formatActionTitle = (log) => {
    const name = log.adminRole === 'System' ? 'System' : log.adminName;
    switch (log.actionType) {
      case 'LOGIN': return `${name} logged in`;
      case 'LOGOUT': return `${name} logged out`;
      case 'UPDATE_RULES': return `${name} updated moderation rules`;
      case 'SUSPEND_USER': return `${name} suspended a user`;
      case 'UNSUSPEND_USER': return `${name} unsuspended a user`;
      case 'DATA_EXPORT': return `${name} exported data`;
      case 'RESOLVE_TICKET': return `${name} resolved a ticket`;
      default: return `${name} ${log.actionType.toLowerCase().replace(/_/g, ' ')}`;
    }
  };

  const renderPaginationButtons = () => {
    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return pages.map((page, index) => {
      if (page === '...') {
        return <span key={`ellipsis-${index}`} className="px-xs">...</span>;
      }
      return (
        <button 
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`w-8 h-8 flex items-center justify-center rounded ${page === currentPage ? 'bg-primary text-on-primary font-medium' : 'hover:bg-surface-container'}`}
        >
          {page}
        </button>
      );
    });
  };

  return (
    <div className="max-w-7xl mx-auto pb-xl">
      {/* Header Section */}
      <div className="mb-lg flex items-center gap-md">
        <button 
          onClick={() => navigate(-1)} 
          className="p-sm hover:bg-surface-container rounded-full transition-colors flex items-center justify-center" 
          aria-label="Go back"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div>
          <h3 className="font-display-lg text-display-lg text-on-background">All Notifications</h3>
          <p className="text-body-lg text-on-surface-variant">Comprehensive log of system activities, moderation events, and alerts.</p>
        </div>
      </div>

      {/* Toolbar Section */}
      <div className="flex flex-col md:flex-row gap-md mb-lg justify-between items-center bg-surface p-md rounded-xl border border-outline-variant shadow-sm">
        <div className="relative w-full md:w-[350px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Search notifications... (Coming soon)" 
            disabled
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-2 pl-10 pr-4 text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all opacity-60 cursor-not-allowed"
          />
        </div>
        
        <div className="flex gap-sm w-full md:w-auto flex-wrap pb-xs md:pb-0 items-center">
          <span className="text-body-sm text-on-surface-variant font-medium mr-2 hidden md:block">Filter by:</span>
          
          {/* Custom Type Filter Dropdown */}
          <div className="relative dropdown-container">
            <button 
              onClick={() => {
                setIsTypeDropdownOpen(!isTypeDropdownOpen);
                setIsDateDropdownOpen(false);
              }}
              className="flex items-center justify-between pl-4 pr-3 py-2 bg-surface border border-outline-variant rounded-lg text-body-sm font-medium hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-on-surface min-w-[150px]"
            >
              <span>{filterType === 'all' ? 'Type: All' : filterType === 'LOGIN' ? 'Logins' : filterType === 'SUSPEND_USER' ? 'Suspensions' : 'Data Exports'}</span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant ml-2">expand_more</span>
            </button>
            {isTypeDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-surface border border-outline-variant rounded-lg shadow-lg py-1 z-50">
                <button onClick={() => { setFilterType('all'); setCurrentPage(1); setIsTypeDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container transition-colors">Type: All</button>
                <button onClick={() => { setFilterType('LOGIN'); setCurrentPage(1); setIsTypeDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container transition-colors">Logins</button>
                <button onClick={() => { setFilterType('SUSPEND_USER'); setCurrentPage(1); setIsTypeDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container transition-colors">Suspensions</button>
                <button onClick={() => { setFilterType('DATA_EXPORT'); setCurrentPage(1); setIsTypeDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container transition-colors">Data Exports</button>
              </div>
            )}
          </div>
          
          {/* Custom Date Filter Dropdown */}
          <div className="relative dropdown-container">
            <button 
              onClick={() => {
                setIsDateDropdownOpen(!isDateDropdownOpen);
                setIsTypeDropdownOpen(false);
              }}
              className="flex items-center justify-between pl-4 pr-3 py-2 bg-surface border border-outline-variant rounded-lg text-body-sm font-medium hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-on-surface min-w-[160px]"
            >
              <span>{filterDate === 'all' ? 'Date: All Time' : filterDate === '24 hours' ? 'Last 24 Hours' : filterDate === '7 days' ? 'Last 7 Days' : 'Last 30 Days'}</span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant ml-2">expand_more</span>
            </button>
            {isDateDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 w-full bg-surface border border-outline-variant rounded-lg shadow-lg py-1 z-50">
                <button onClick={() => { setFilterDate('all'); setCurrentPage(1); setIsDateDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container transition-colors">Date: All Time</button>
                <button onClick={() => { setFilterDate('24 hours'); setCurrentPage(1); setIsDateDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container transition-colors">Last 24 Hours</button>
                <button onClick={() => { setFilterDate('7 days'); setCurrentPage(1); setIsDateDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container transition-colors">Last 7 Days</button>
                <button onClick={() => { setFilterDate('30 days'); setCurrentPage(1); setIsDateDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container transition-colors">Last 30 Days</button>
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          {(filterType !== 'all' || filterDate !== 'all') && (
            <button 
              onClick={() => {
                setFilterType('all');
                setFilterDate('all');
                setCurrentPage(1);
              }}
              className="flex items-center gap-1 pl-3 pr-4 py-2 text-primary hover:bg-primary/10 rounded-lg text-body-sm font-medium transition-colors"
              title="Clear filters"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden mb-lg min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center opacity-50">
            <span className="material-symbols-outlined text-4xl mb-2">history</span>
            <p className="text-body-md font-medium">No notifications found matching your filters.</p>
          </div>
        ) : (
          logs.map((log, index) => {
            const { icon, color, bgColor } = getStyleForAction(log.actionType);
            return (
              <div key={log.id} className={`p-lg flex gap-md items-center hover:bg-surface-container transition-colors ${index !== logs.length - 1 ? 'border-b border-outline-variant' : ''}`}>
                <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center shrink-0 ${color}`}>
                  <span className="material-symbols-outlined text-[24px]">{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-headline-sm text-headline-sm text-on-surface mb-xs truncate">
                    {formatActionTitle(log)}
                  </p>
                  <p className="font-body-md text-body-md text-on-surface-variant truncate">
                    {log.description}
                  </p>
                </div>
                <div className="shrink-0 text-right ml-md">
                  <p className="font-mono-label text-xs text-outline whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!loading && totalLogs > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-md text-body-sm text-on-surface-variant px-sm">
          <div>Showing {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, totalLogs)} of {totalLogs} logs</div>
          <div className="flex items-center gap-xs">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-surface-container disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {renderPaginationButtons()}
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-surface-container disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
