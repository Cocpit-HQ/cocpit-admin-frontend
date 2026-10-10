import React, { useState, useEffect } from 'react';
import PaginationBar from '../components/PaginationBar';
import SearchInput from '../components/SearchInput';
import FilterDropdown from '../components/FilterDropdown';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import DangerModal from '../components/DangerModal';
import WarningModal from '../components/WarningModal';
import DatePickerDropdown from '../components/DatePickerDropdown';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export default function UserManagement() {
  const { role, accessToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialStatus = searchParams.get('status') || 'All';
  const initialPage = parseInt(searchParams.get('page')) || 1;
  const initialRole = searchParams.get('role') || 'All';
  const initialSearch = searchParams.get('search') || '';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState(null);
  
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, suspendedUsers: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null, rangeLabel: 'All Time' });
  
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set('page', currentPage);
    if (roleFilter !== 'All') params.set('role', roleFilter);
    if (statusFilter !== 'All') params.set('status', statusFilter);
    if (searchQuery) params.set('search', searchQuery);
    
    setSearchParams(params, { replace: true });
  }, [currentPage, roleFilter, statusFilter, searchQuery, setSearchParams]);
  
  const [availableRoles, setAvailableRoles] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      if (!accessToken) return;
      try {
        const response = await fetch('/api/admin/users/roles', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok) {
          const roles = await response.json();
          setAvailableRoles(roles);
        }
      } catch (err) {
        console.error('Failed to fetch roles:', err);
      }
    };
    fetchRoles();
  }, [accessToken]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!accessToken) return;
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: currentPage,
          limit: 8,
          search: searchQuery,
          status: statusFilter,
          role: roleFilter
        });
        
        if (dateRange.startDate) {
          queryParams.append('startDate', dateRange.startDate.toISOString());
        }
        if (dateRange.endDate) {
          queryParams.append('endDate', dateRange.endDate.toISOString());
        }
        
        const response = await fetch(`/api/admin/users?${queryParams}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        if (response.ok) {
          const resData = await response.json();
          setUsers(resData.data || []);
          setTotalPages(resData.totalPages || 1);
          setTotalCount(resData.total || 0);
          if (resData.stats) setStats(resData.stats);
        } else {
          const errText = await response.text();
          setDebugError(`Status: ${response.status}, Error: ${errText}`);
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setDebugError('Network Error: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [accessToken, currentPage, searchQuery, statusFilter, roleFilter, dateRange]);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [userToWarn, setUserToWarn] = useState(null);
  const [isSevereWarning, setIsSevereWarning] = useState(false);

  const [bulkEmailModalOpen, setBulkEmailModalOpen] = useState(false);
  const [bulkWarningReason, setBulkWarningReason] = useState('Inappropriate Behavior');
  const [bulkWarningMessage, setBulkWarningMessage] = useState('');

  const [suspendConfirmModalOpen, setSuspendConfirmModalOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);


  const navigate = useNavigate();

  const handleSuspend = async () => {
    if (userToSuspend) {
      try {
        await fetch(`/api/admin/users/${userToSuspend.id}/suspend`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });
        setUsers(users.map(u => u.id === userToSuspend.id ? { ...u, status: 'Suspended' } : u));
        alert(`Successfully suspended ${userToSuspend.name}.`);
        setUserToSuspend(null);
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        const userIds = Array.from(selectedUsers);
        const response = await fetch('/api/admin/users/bulk-suspend', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds })
        });
        if (response.ok) {
          setUsers(users.map(u => userIds.includes(u.id) ? { ...u, status: 'Suspended' } : u));
          alert(`Successfully suspended ${userIds.length} users.`);
          setSelectedUsers(new Set());
        }
      } catch (e) {
        console.error(e);
      }
    }
    setSuspendConfirmModalOpen(false);
  };

  const handleUnsuspend = async (user) => {
    if (window.confirm(`Are you sure you want to unsuspend ${user.name}? This will restore their access and reset their moderation flags to 0.`)) {
      try {
        await fetch(`/api/admin/users/${user.id}/unsuspend`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });
        setUsers(users.map(u => u.id === user.id ? { ...u, status: 'Active' } : u));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDelete = async () => {
    if (userToDelete) {
      try {
        const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
          setUsers(users.map(u => u.id === userToDelete.id ? { ...u, status: 'Deleted' } : u));
          alert(`Successfully deleted ${userToDelete.name}.`);
          setUserToDelete(null);
          setDeleteModalOpen(false);
        } else {
          alert('Failed to delete user.');
        }
      } catch (e) {
        console.error(e);
        alert('Error deleting user.');
      }
    } else {
      try {
        const userIds = Array.from(selectedUsers);
        const response = await fetch('/api/admin/users/bulk-delete', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds })
        });
        if (response.ok) {
          setUsers(users.map(u => userIds.includes(u.id) ? { ...u, status: 'Deleted' } : u));
          alert(`Successfully deleted ${userIds.length} users.`);
          setSelectedUsers(new Set());
        } else {
          alert('Failed to delete users.');
        }
      } catch (e) {
        console.error(e);
        alert('Error deleting users in bulk.');
      }
      setDeleteModalOpen(false);
    }
  };

  const handleBulkUnsuspend = async () => {
    if (window.confirm(`Are you sure you want to restore ${selectedUsers.size} users?`)) {
      try {
        const userIds = Array.from(selectedUsers);
        const res = await fetch('/api/admin/users/bulk-unsuspend', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds })
        });
        if (res.ok) {
          setUsers(users.map(u => userIds.includes(u.id) ? { ...u, status: 'Active' } : u));
          alert(`Successfully restored ${userIds.length} users.`);
          setSelectedUsers(new Set());
        } else {
          alert('Failed to restore users.');
        }
      } catch (e) {
        console.error(e);
        alert('Error restoring users.');
      }
    }
  };

  const handleExportCSV = () => {
    const userIds = Array.from(selectedUsers);
    const selectedData = users.filter(u => userIds.includes(u.id));
    
    if (selectedData.length === 0) return;

    const headers = ['ID', 'Name', 'Email', 'Role', 'Status', 'Joined Date'];
    const csvRows = [headers.join(',')];
    
    for (const row of selectedData) {
      const values = [
        row.id,
        `"${(row.name || '').replace(/"/g, '""')}"`,
        `"${(row.email || '').replace(/"/g, '""')}"`,
        `"${(row.role || '').replace(/"/g, '""')}"`,
        `"${(row.status || '').replace(/"/g, '""')}"`,
        `"${(row.joined || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(values.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `exported_users_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setSelectedUsers(new Set());
  };

  const handleSendBulkEmail = async () => {
    const userIds = Array.from(selectedUsers);
    try {
      const response = await fetch('/api/admin/users/bulk-warn', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds,
          reason: bulkWarningReason,
          message: bulkWarningMessage,
          isSevere: isSevereWarning
        })
      });
      if (response.ok) {
        const data = await response.json();
        const autoSuspendedCount = data.results.filter(r => r.autoSuspended).length;
        
        let alertMsg = `Bulk warnings sent successfully to ${userIds.length} users.`;
        if (autoSuspendedCount > 0) {
          alertMsg += `\n\n${autoSuspendedCount} user(s) were AUTOMATICALLY SUSPENDED due to exceeding 7 moderation flags.`;
          const autoSuspendedIds = data.results.filter(r => r.autoSuspended).map(r => r.id);
          setUsers(users.map(u => autoSuspendedIds.includes(u.id) ? { ...u, status: 'Suspended' } : u));
        }
        alert(alertMsg);
        setSelectedUsers(new Set());
      }
    } catch (e) {
      console.error(e);
    }
    setBulkEmailModalOpen(false);
    setBulkWarningReason('Inappropriate Behavior');
    setBulkWarningMessage('');
    setIsSevereWarning(false);
  };

  const handleSendWarning = async ({ reason, message, isSevere }) => {
    if (!userToWarn) return;
    try {
      const response = await fetch(`/api/admin/users/${userToWarn.id}/warn`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, message, isSevere })
      });
      const data = await response.json();
      if (data.autoSuspended) {
        alert(`${userToWarn.name} has been warned and AUTOMATICALLY SUSPENDED due to exceeding 7 moderation flags.`);
        setUsers(users.map(u => u.id === userToWarn.id ? { ...u, status: 'Suspended' } : u));
      } else {
        if (isSevere) {
          alert(`Severe warning sent to ${userToWarn.name}. Their moderation flag was incremented (Total: ${data.moderation_flags}).`);
        } else {
          alert(`Warning sent to ${userToWarn.name}. No moderation flags were added.`);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setWarningModalOpen(false);
    setUserToWarn(null);
  };

  const handleExportReport = async () => {
    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams({
        search: searchQuery,
        status: statusFilter,
        role: roleFilter
      });
      
      if (dateRange.startDate) {
        queryParams.append('startDate', dateRange.startDate.toISOString());
      }
      if (dateRange.endDate) {
        queryParams.append('endDate', dateRange.endDate.toISOString());
      }

      // ── Option 3 & 4: Full Profile Marketing Reports (CSV or PDF from Backend) ──
      if (exportFormat === 'marketing_csv' || exportFormat === 'marketing_pdf') {
        const fmt = exportFormat === 'marketing_pdf' ? 'pdf' : 'csv';
        const ext = exportFormat === 'marketing_pdf' ? 'pdf' : 'csv';
        queryParams.append('format', fmt);
        
        const response = await fetch(`/api/admin/users/export-marketing-report?${queryParams}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch full profile report from server');

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `cocpit_full_profile_report_${new Date().getTime()}.${ext}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // ── Option 1 & 2: Basic User Table Reports (Excel or PDF via Client) ──
      const response = await fetch(`/api/admin/users?${queryParams}&page=1&limit=1000000`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch data for export');
      
      const result = await response.json();
      const exportData = result.data.map(u => ({
        ID: u.id,
        Name: u.name,
        Email: u.email,
        Role: u.role || 'N/A',
        Status: u.status,
        Joined: u.joined ? format(new Date(u.joined), 'MMM d, yyyy') : 'Unknown'
      }));

      if (exportData.length === 0) {
        alert('No data to export.');
        setIsExporting(false);
        setIsExportModalOpen(false);
        return;
      }

      if (exportFormat === 'pdf') {
        const doc = new jsPDF();
        doc.text(`User Report - ${dateRange.rangeLabel}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Filters: Role - ${roleFilter}, Status - ${statusFilter}`, 14, 22);
        
        const tableColumn = ["ID", "Name", "Email", "Role", "Status", "Joined Date"];
        const tableRows = exportData.map(row => [
          row.ID, row.Name, row.Email, row.Role, row.Status, row.Joined
        ]);

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 28,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [79, 70, 229] }
        });

        doc.save(`users_basic_report_${new Date().getTime()}.pdf`);
      } else {
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
        XLSX.writeFile(workbook, `users_basic_report_${new Date().getTime()}.xlsx`);
      }
    } catch (error) {
      console.error('Export failed', error);
      alert('Failed to export report.');
    } finally {
      setIsExporting(false);
      setIsExportModalOpen(false);
    }
  };

  const toggleUser = (id) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUsers(newSelected);
  };

  const getRoleClass = (role) => {
    switch (role.toUpperCase()) {
      case 'WORKING PROFESSIONAL': return 'bg-primary-fixed text-on-primary-fixed-variant';
      case 'STUDENT': return 'bg-secondary-fixed text-on-secondary-fixed-variant';
      case 'RECRUITER': return 'bg-primary-fixed text-on-primary-fixed-variant'; // using primary for recruiter as per original
      case 'FREELANCER': return 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
      default: return 'bg-surface-variant text-on-surface-variant';
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'Active': return <><span className="w-2 h-2 rounded-full bg-green-500"></span><span className="text-body-md font-medium text-green-700">Active</span></>;
      case 'Suspended': return <><span className="w-2 h-2 rounded-full bg-orange-500"></span><span className="text-body-md font-medium text-orange-700">Suspended</span></>;
      case 'Deleted': return <><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-body-md font-medium text-red-700">Deleted</span></>;
      default: return null;
    }
  };

  // Server-side paginated data is now directly in 'users'
  const selectedUsersList = users.filter(u => selectedUsers.has(u.id));
  const allSelectedAreSuspended = selectedUsersList.length > 0 && selectedUsersList.every(u => u.status === 'Suspended');

  return (
    <div>
      {/* Page Header & Filters */}
      {debugError && <div className="p-4 bg-red-100 text-red-800 mb-4">{debugError}</div>}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-lg mb-xl">
        <div className="flex gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 shrink-0 rounded-xl bg-surface border border-outline-variant flex items-center justify-center text-on-surface hover:bg-slate-50 transition-colors shadow-sm self-start mt-1"
            title="Go Back"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex flex-col gap-xs">
            <h1 className="font-display-lg text-display-lg text-on-background">User Management</h1>
            <p className="text-body-lg text-on-surface-variant">Review, manage, and moderate your platform's user base.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsExportModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-on-primary px-lg py-md rounded-xl font-label-lg transition-colors shadow-sm flex items-center gap-sm shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">download</span>
          Export Report
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
        <div className="bg-indigo-50 dark:bg-[#111827] border border-indigo-100 dark:border-[#2C364B] p-md rounded-xl flex items-center gap-md transition-colors">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-[rgba(79,140,255,0.12)] flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-indigo-600 dark:text-[#4F8CFF]">groups</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Total Users</p>
            <h3 className="text-xl font-bold text-on-surface">{stats.totalUsers}</h3>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-[#111827] border border-green-100 dark:border-[#2C364B] p-md rounded-xl flex items-center gap-md transition-colors">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-[rgba(34,197,94,0.12)] flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-green-600 dark:text-[#22C55E]">check_circle</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Active Users</p>
            <h3 className="text-xl font-bold text-on-surface">{stats.activeUsers}</h3>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-[#111827] border border-orange-100 dark:border-[#2C364B] p-md rounded-xl flex items-center gap-md transition-colors">
          <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-[rgba(245,158,11,0.12)] flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-orange-600 dark:text-[#F59E0B]">gavel</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Suspended Users</p>
            <h3 className="text-xl font-bold text-on-surface">{stats.suspendedUsers}</h3>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface border border-outline-variant rounded-xl p-md mb-xl flex flex-wrap items-center justify-between gap-md">
        <div className="flex flex-wrap items-center gap-md w-full md:w-auto flex-1">
          <div className="flex-1 min-w-[200px] max-w-[300px]">
            <SearchInput
              value={searchQuery}
              onChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
              placeholder="Search by name or email..."
            />
          </div>

          <DatePickerDropdown 
            initialRangeLabel={dateRange.rangeLabel}
            onRangeChange={(range) => {
              setDateRange(range);
              setCurrentPage(1);
            }} 
          />

          <FilterDropdown
            label="Role"
            value={roleFilter}
            options={[
              { label: 'Any', value: 'All' },
              ...availableRoles.map(r => ({ label: r, value: r }))
            ]}
            onChange={(val) => { setRoleFilter(val); setCurrentPage(1); }}
          />

          <FilterDropdown
            label="Status"
            value={statusFilter}
            options={[
              { label: 'Any', value: 'All' },
              { label: 'Active', value: 'Active' },
              { label: 'Suspended', value: 'Suspended' },
              { label: 'Deleted', value: 'Deleted' },
            ]}
            onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
          />
        </div>

        <div className="flex items-center gap-md">
          <button
            onClick={() => { 
              setStatusFilter('All'); 
              setRoleFilter('All'); 
              setSearchQuery(''); 
              setDateRange({ startDate: null, endDate: null, rangeLabel: 'All Time' });
            }}
            className="text-primary font-label-md hover:underline shrink-0"
          >
            Clear all filters
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && role !== 'developer' && (
        <div className="bg-primary-container text-on-primary-container px-lg py-md rounded-xl flex items-center justify-between mb-lg animate-in fade-in slide-in-from-top-4">
          <span className="font-label-md font-semibold">{selectedUsers.size} users selected</span>
          <div className="flex items-center gap-md">
            <button
              onClick={() => setSelectedUsers(new Set())}
              className="px-md py-sm bg-surface text-on-surface shadow-sm hover:bg-surface-container-low rounded-lg font-label-md transition-colors flex items-center gap-sm"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              Cancel Selection
            </button>
            <div className="h-6 w-px bg-on-primary-container/20 mx-xs"></div>
            <button
              onClick={() => setBulkEmailModalOpen(true)}
              className="px-md py-sm bg-surface text-primary rounded-lg font-label-md hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-sm"
            >
              <span className="material-symbols-outlined text-[18px]">warning</span>
              Send Bulk Warning
            </button>
            {allSelectedAreSuspended ? (
              <button
                onClick={handleBulkUnsuspend}
                className="px-md py-sm bg-surface text-on-surface shadow-sm hover:bg-surface-container-low rounded-lg font-label-md transition-colors flex items-center gap-sm border border-outline-variant"
              >
                <span className="material-symbols-outlined text-[18px]">restore</span>
                Restore
              </button>
            ) : (
              <button
                onClick={() => setSuspendConfirmModalOpen(true)}
                className="px-md py-sm bg-error text-on-error rounded-lg font-label-md hover:bg-error/90 transition-colors shadow-sm flex items-center gap-sm"
              >
                <span className="material-symbols-outlined text-[18px]">gavel</span>
                Suspend
              </button>
            )}
            <button
              onClick={() => { setUserToDelete(null); setDeleteModalOpen(true); }}
              className="px-md py-sm bg-error text-on-error rounded-lg font-label-md hover:bg-error/90 transition-colors shadow-sm flex items-center gap-sm"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Delete
            </button>
            <button
              onClick={handleExportCSV}
              className="px-md py-sm bg-surface text-primary rounded-lg font-label-md hover:bg-surface-container-low transition-colors shadow-sm flex items-center gap-sm"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export
            </button>
          </div>
        </div>
      )}

      {/* User List View */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant">
                {role !== 'developer' && (
                  <th className="px-lg py-md font-label-md text-outline uppercase tracking-wider w-12">
                    <input
                      className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedUsers(new Set(users.map(u => u.id)));
                        else setSelectedUsers(new Set());
                      }}
                      checked={selectedUsers.size === users.length && users.length > 0}
                    />
                  </th>
                )}
                <th className="px-lg py-md font-label-md text-outline uppercase tracking-wider">User</th>
                <th className="px-lg py-md font-label-md text-outline uppercase tracking-wider">Role</th>
                <th className="px-lg py-md font-label-md text-outline uppercase tracking-wider">Status</th>
                <th className="px-lg py-md font-label-md text-outline uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {users.map(user => (
                <tr 
                  key={user.id} 
                  className="data-row hover:bg-surface-container-low transition-colors group cursor-pointer"
                  onClick={() => navigate(`/profile/${user.id}`, { state: { from: location.pathname + location.search, label: 'Users' } })}
                >
                  {role !== 'developer' && (
                    <td className="px-lg py-md" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleUser(user.id)}
                      />
                    </td>
                  )}
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-md">
                      {user.avatar ? (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-surface-variant border border-outline-variant">
                          <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-variant text-on-surface-variant font-semibold text-body-sm flex-shrink-0">
                          {user.initials}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-semibold text-on-surface">{user.name}</span>
                        <span className="text-body-sm text-outline">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-lg py-md">
                    <span className={`px-sm py-1 rounded-full text-[11px] font-bold tracking-wider uppercase ${getRoleClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-xs">
                      {getStatusDisplay(user.status)}
                    </div>
                  </td>
                  <td className="px-lg py-md text-right">
                    <div className="flex items-center justify-end gap-sm">
                      {role !== 'developer' && (
                        <>
                          <button
                            onClick={() => { setUserToWarn(user); setWarningModalOpen(true); }}
                            className="p-xs text-outline hover:text-orange-500 transition-colors hover:bg-orange-50 rounded-lg"
                            title="Send Warning"
                          >
                            <span className="material-symbols-outlined text-[20px]">warning</span>
                          </button>
                          {user.status === 'Suspended' ? (
                            <button
                              onClick={() => handleUnsuspend(user)}
                              className="p-xs text-outline hover:text-green-600 transition-colors hover:bg-green-50 rounded-lg"
                              title="Unsuspend User"
                            >
                              <span className="material-symbols-outlined text-[20px]">undo</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => { setUserToSuspend(user); setSuspendConfirmModalOpen(true); }}
                              className="p-xs text-outline hover:text-error transition-colors hover:bg-error-container/50 rounded-lg"
                              title="Suspend User"
                            >
                              <span className="material-symbols-outlined text-[20px]">gavel</span>
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); setUserToDelete(user); setDeleteModalOpen(true); }}
                            className="p-xs text-outline hover:text-error transition-colors hover:bg-error-container/50 rounded-lg"
                            title="Delete User"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                          </button>
                        </>
                      )}
                      <button 
                        onClick={(e) => { e.stopPropagation(); navigate(`/profile/${user.id}`, { state: { from: location.pathname + location.search, label: 'Users' } }); }} 
                        className="p-xs text-outline hover:text-primary transition-colors hover:bg-surface-container rounded-lg" 
                        title="View Profile"
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <PaginationBar 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Warning Modal */}
      <WarningModal
        isOpen={warningModalOpen}
        onClose={() => setWarningModalOpen(false)}
        userName={userToWarn?.name}
        onSend={handleSendWarning}
      />

      {/* Bulk Email Modal */}
      {bulkEmailModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant w-[450px] max-w-[90vw] rounded-xl shadow-xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">warning</span>
                Send Bulk Warning
              </h3>
              <button onClick={() => setBulkEmailModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors">close</button>
            </div>

            <p className="text-sm text-on-surface-variant mb-6">
              You are sending an official warning to <strong>{selectedUsers.size} selected users</strong>. They will receive this warning on the home page.
            </p>

            <div className="flex flex-col gap-4 mb-6">
              <div>
                <label className="block text-[11px] font-mono-label text-on-surface-variant mb-xs ml-1">REASON</label>
                <select
                  value={bulkWarningReason}
                  onChange={(e) => setBulkWarningReason(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-lg px-md py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                >
                  <option>Inappropriate Behavior</option>
                  <option>Spam / Self-Promotion</option>
                  <option>Harassment</option>
                  <option>Platform Manipulation</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono-label text-on-surface-variant mb-xs ml-1">ADDITIONAL MESSAGE (OPTIONAL)</label>
                <textarea
                  value={bulkWarningMessage}
                  onChange={(e) => setBulkWarningMessage(e.target.value)}
                  placeholder="Provide any specific context or links to offending content..."
                  className="w-full bg-surface border border-outline-variant rounded-lg px-md py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none h-24"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="severeBulkWarning"
                  checked={isSevereWarning}
                  onChange={(e) => setIsSevereWarning(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="severeBulkWarning" className="text-sm font-medium text-on-surface">
                  Severe Warning (Increments Moderation Flags)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setBulkEmailModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">Cancel</button>
              <button
                onClick={handleSendBulkEmail}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm active:scale-95"
              >
                Send Warnings
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Suspend Confirmation Modal */}
      {suspendConfirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant w-[400px] max-w-[90vw] rounded-xl shadow-xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-error">gavel</span>
                Confirm Suspension
              </h3>
              <button onClick={() => setSuspendConfirmModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors">close</button>
            </div>

            <p className="text-sm text-on-surface-variant mb-6">
              {userToSuspend 
                ? <>Are you sure you want to suspend <strong>{userToSuspend.name}</strong>? This will immediately revoke their access to the platform.</>
                : <>Are you sure you want to suspend <strong>{selectedUsers.size}</strong> selected users? This will immediately revoke their access to the platform.</>
              }
            </p>

            <div className="flex justify-end gap-3">
              <button onClick={() => { setSuspendConfirmModalOpen(false); setUserToSuspend(null); }} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">Cancel</button>
              <button
                onClick={handleSuspend}
                className="bg-error text-on-error px-4 py-2 rounded-lg text-sm font-medium hover:bg-error/90 transition-colors shadow-sm active:scale-95"
              >
                Yes, Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      <DangerModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setUserToDelete(null); }}
        onConfirm={handleDelete}
        title="Delete Account"
        message={userToDelete ? `Are you sure you want to permanently delete ${userToDelete.name}'s account? This will softly delete the user from the database. This action cannot be easily undone.` : ''}
        actionText="Permanently Delete"
      />

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant rounded-2xl w-[450px] max-w-[90vw] p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsExportModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <div className="mb-6 pr-6">
              <h3 className="text-xl font-bold text-on-surface mb-2">Export Report</h3>
              <p className="text-sm text-on-surface-variant">
                Choose the format for your user data export. This will include all users matching your current active filters.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Option 1: Basic Excel */}
              <button
                onClick={() => setExportFormat('excel')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center ${
                  exportFormat === 'excel' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400' 
                    : 'border-outline-variant hover:border-green-300 hover:bg-green-50/50 dark:hover:bg-green-500/5'
                }`}
              >
                <span className="material-symbols-outlined text-[26px] mb-1 text-green-600 dark:text-green-500">table</span>
                <span className="font-semibold text-xs">Basic Excel</span>
                <span className="text-[10px] text-on-surface-variant opacity-80">User table (.xlsx)</span>
              </button>
              
              {/* Option 2: Basic PDF */}
              <button
                onClick={() => setExportFormat('pdf')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center ${
                  exportFormat === 'pdf' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' 
                    : 'border-outline-variant hover:border-red-300 hover:bg-red-50/50 dark:hover:bg-red-500/5'
                }`}
              >
                <span className="material-symbols-outlined text-[26px] mb-1 text-red-600 dark:text-red-500">picture_as_pdf</span>
                <span className="font-semibold text-xs">Basic PDF</span>
                <span className="text-[10px] text-on-surface-variant opacity-80">Summary table (.pdf)</span>
              </button>

              {/* Option 3: Full Profile CSV */}
              <button
                onClick={() => setExportFormat('marketing_csv')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center ${
                  exportFormat === 'marketing_csv' 
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' 
                    : 'border-outline-variant hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5'
                }`}
              >
                <span className="material-symbols-outlined text-[26px] mb-1 text-indigo-600 dark:text-indigo-500">campaign</span>
                <span className="font-semibold text-xs">Full Profile CSV</span>
                <span className="text-[10px] text-on-surface-variant opacity-80">Edu, Exp, Skills & Projects</span>
              </button>

              {/* Option 4: Full Profile PDF */}
              <button
                onClick={() => setExportFormat('marketing_pdf')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center ${
                  exportFormat === 'marketing_pdf' 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400' 
                    : 'border-outline-variant hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-500/5'
                }`}
              >
                <span className="material-symbols-outlined text-[26px] mb-1 text-purple-600 dark:text-purple-500">badge</span>
                <span className="font-semibold text-xs">Full Profile PDF</span>
                <span className="text-[10px] text-on-surface-variant opacity-80">Complete visual report</span>
              </button>
            </div>

            {(exportFormat === 'marketing_csv' || exportFormat === 'marketing_pdf') && (
              <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-600 dark:text-indigo-300 flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">info</span>
                <span>Includes complete user profiles: Education, Experience, Skills, Projects, Mobile numbers, and Industry preferences.</span>
              </div>
            )}

            <button
              onClick={handleExportReport}
              disabled={isExporting}
              className="w-full bg-primary hover:bg-primary/90 text-on-primary py-3 rounded-xl font-semibold shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                  Generating Report...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  Download Report
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
