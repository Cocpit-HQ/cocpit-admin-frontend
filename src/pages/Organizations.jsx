import React, { useState } from 'react';
import VerificationQueue from '../components/VerificationQueue';

// Removed mockOrganizations
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useEffect } from 'react';

export default function Organizations() {
  const { role, accessToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialStatus = searchParams.get('status') || 'All';
  const initialPage = parseInt(searchParams.get('page')) || 1;
  const initialIndustry = searchParams.get('industry') || 'All';
  const initialSearch = searchParams.get('search') || '';

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'Directory');
  const [selectedOrgs, setSelectedOrgs] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [industryFilter, setIndustryFilter] = useState(initialIndustry);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeTab !== 'Directory') params.set('tab', activeTab);
    if (currentPage > 1) params.set('page', currentPage);
    if (industryFilter !== 'All') params.set('industry', industryFilter);
    if (statusFilter !== 'All') params.set('status', statusFilter);
    if (searchQuery) params.set('search', searchQuery);
    
    setSearchParams(params, { replace: true });
  }, [activeTab, currentPage, industryFilter, statusFilter, searchQuery, setSearchParams]);
  const orgsPerPage = 8;

  const [organizations, setOrganizations] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrgs, setTotalOrgs] = useState(0);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [restrictConfirmModalOpen, setRestrictConfirmModalOpen] = useState(false);
  const [orgToWarn, setOrgToWarn] = useState(null);
  const [availableIndustries, setAvailableIndustries] = useState([
    'Information Technology',
    'Software & SaaS',
    'Healthcare',
    'Finance & Banking'
  ]);

  // Warning State
  const [warningReason, setWarningReason] = useState('Inappropriate Content');
  const [warningMessage, setWarningMessage] = useState('');
  const [warningIsSevere, setWarningIsSevere] = useState(false);

  const fetchOrganizations = async () => {
    try {
      if (!accessToken) return;
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: orgsPerPage,
        search: searchQuery,
        status: statusFilter,
        industry: industryFilter
      });
      const response = await fetch(`/api/admin/organisations?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations);
        setTotalPages(data.totalPages);
        setTotalOrgs(data.totalCount);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [accessToken, currentPage, searchQuery, statusFilter, industryFilter]);

  const [stats, setStats] = useState({
    totalOrganizations: 0,
    organizationGrowth: 0,
    pendingVerification: 0,
    incompleteOnboarding: 0,
    avgVerificationTime: 0,
    avgVerificationTimeChange: 0,
    activeOrganizations: 0,
    suspended: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!accessToken) return;
        const response = await fetch('/api/admin/dashboard/organization-stats', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch organization stats:', error);
      }
    };
    fetchStats();
  }, [accessToken]);

  const toggleOrg = (id) => {
    const newSelected = new Set(selectedOrgs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedOrgs(newSelected);
  };

  const toggleAll = (e) => {
    if (e.target.checked) {
      setSelectedOrgs(new Set(currentOrgs.map(o => o.id)));
    } else {
      setSelectedOrgs(new Set());
    }
  };

  const handleSendWarning = async () => {
    if (!orgToWarn && selectedOrgs.size === 0) return;
    try {
      if (orgToWarn) {
        const res = await fetch(`/api/admin/organisations/${orgToWarn.id}/warn`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: warningReason,
            message: warningMessage,
            isSevere: warningIsSevere
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.autoSuspended) {
            alert(`${orgToWarn.name} has been warned and AUTOMATICALLY SUSPENDED due to exceeding 7 moderation flags.`);
          } else {
            alert(`Warning sent to ${orgToWarn.name}!`);
          }
          fetchOrganizations(); // Refresh the list
          setWarningModalOpen(false);
          setOrgToWarn(null);
          setWarningMessage('');
          setWarningIsSevere(false);
        } else {
          const data = await res.json();
          alert(`Failed to send warning: ${data.error}`);
        }
      } else {
        // Bulk warning logic (Optional for later, just alert for now if selectedOrgs is used)
        alert('Bulk warning for organizations is not fully implemented yet in the backend.');
      }
    } catch (error) {
      console.error('Failed to warn organization:', error);
    }
  };

  const handleRestrictOrg = async (id) => {
    try {
      const res = await fetch(`/api/admin/organisations/${id}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        fetchOrganizations(); // refresh the list
      }
    } catch (error) {
      console.error('Failed to suspend organization:', error);
    }
  };

  const handleRestrictSelected = async () => {
    for (let id of selectedOrgs) {
      await handleRestrictOrg(id);
    }
    alert(`Restricted ${selectedOrgs.size} organizations.`);
    setRestrictConfirmModalOpen(false);
    setSelectedOrgs(new Set());
  };

  const handleUnrestrictOrg = async (id) => {
    try {
      const res = await fetch(`/api/admin/organisations/${id}/unsuspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        alert(`Organization unsuspended.`);
        fetchOrganizations(); // refresh the list
      }
    } catch (error) {
      console.error('Failed to unsuspend organization:', error);
    }
  };

  const currentOrgs = organizations;

  const getIndustryClass = (industry) => {
    const classes = [
      'bg-secondary-container text-on-secondary-container',
      'bg-tertiary-container text-on-tertiary-container',
      'bg-primary-fixed text-on-primary-fixed',
      'bg-surface-container-highest text-on-surface-variant',
      'bg-secondary-fixed text-on-secondary-fixed',
      'bg-tertiary-fixed text-on-tertiary-fixed',
      'bg-primary-container text-on-primary-container'
    ];
    let hash = 0;
    if (industry) {
      for (let i = 0; i < industry.length; i++) {
        hash = industry.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    return classes[Math.abs(hash) % classes.length];
  };

  const getColorClass = (name) => {
    const colors = [
      'bg-primary-fixed text-on-primary-fixed',
      'bg-surface-container-highest text-on-surface-variant',
      'bg-tertiary-fixed text-on-tertiary-fixed',
      'bg-secondary-fixed text-on-secondary-fixed',
      'bg-inverse-surface text-inverse-primary'
    ];
    let hash = 0;
    if (name) {
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'Active':
        return (
          <div className="flex items-center gap-xs text-green-600">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span className="text-body-sm font-semibold">Active</span>
          </div>
        );
      case 'Suspended':
        return (
          <div className="flex items-center gap-xs text-orange-600">
            <span className="material-symbols-outlined text-lg">gavel</span>
            <span className="text-body-sm font-semibold">Suspended</span>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="pt-8 pb-12 w-full max-w-[1400px] mx-auto px-4">
      {/* Page Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-xl gap-md">
        <div className="flex gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 shrink-0 rounded-xl bg-surface border border-outline-variant flex items-center justify-center text-on-surface hover:bg-slate-50 transition-colors shadow-sm self-start mt-1"
            title="Go Back"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50 border border-indigo-100 shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-indigo-600 text-[24px]">
                {activeTab === 'Directory' ? 'domain' : 'verified_user'}
              </span>
            </div>
          <div className="flex flex-col justify-center min-h-[48px]">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-display-lg text-display-lg text-on-background font-bold m-0 leading-none">
                {activeTab === 'Directory' ? 'Organization Directory' : 'Verification Queue'}
              </h2>
            </div>
            <p className="text-on-surface-variant font-body-lg text-body-lg m-0 leading-tight">
              {activeTab === 'Directory'
                ? 'Manage registered entities, verification status, and platform access.'
                : 'Review, approve, or reject job postings submitted to the platform.'}
            </p>
          </div>
        </div>
        </div>

        <div className="flex flex-wrap items-center gap-md w-full xl:w-auto">
          {/* Tab Control */}
          <div className="flex bg-indigo-50/50 p-1 rounded-xl w-full sm:w-auto shadow-inner">
            <button
              onClick={() => setActiveTab('Directory')}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'Directory' ? 'bg-surface-container-lowest shadow-sm text-indigo-700' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'}`}
            >
              Organization
            </button>
            {role !== 'developer' && (
              <button
                onClick={() => setActiveTab('VerificationQueue')}
                className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${activeTab === 'VerificationQueue' ? 'bg-surface-container-lowest shadow-sm text-indigo-700' : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'}`}
              >
                Verification Queue
              </button>
            )}
          </div>

        </div>
      </div>

      {activeTab === 'VerificationQueue' ? (
        <VerificationQueue />
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md mb-xl">
            {/* Total Organizations */}
            <div className="bg-surface border-y border-r border-outline-variant border-l-4 border-l-indigo-600 shadow-sm rounded-lg p-md flex justify-between items-start">
              <div className="flex flex-col">
                <h4 className="text-[13px] font-semibold text-on-surface-variant mb-2">Total Organizations</h4>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-on-surface">{stats.totalOrganizations.toLocaleString()}</span>
                  <span className={`text-[12px] font-bold flex items-center ${parseFloat(stats.organizationGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="material-symbols-outlined text-[14px]">
                      {parseFloat(stats.organizationGrowth) >= 0 ? 'trending_up' : 'trending_down'}
                    </span>
                    {parseFloat(stats.organizationGrowth) > 0 ? '+' : ''}{stats.organizationGrowth}%
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-indigo-600">domain</span>
              </div>
            </div>

            {/* Pending Verification */}
            <div className="bg-surface border-y border-r border-outline-variant border-l-4 border-l-indigo-600 shadow-sm rounded-lg p-md flex justify-between items-start">
              <div className="flex flex-col">
                <h4 className="text-[13px] font-semibold text-on-surface-variant mb-2">Pending Verification</h4>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-on-surface">{stats.pendingVerification.toLocaleString()}</span>
                  {stats.pendingVerification > 0 && (
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full uppercase">Urgent</span>
                  )}
                </div>
                <p className="text-[12px] italic text-on-surface-variant/70">Requires manual review</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-orange-600">assignment_late</span>
              </div>
            </div>

            {/* Incomplete Onboarding */}
            <div className="bg-surface border-y border-r border-outline-variant border-l-4 border-l-indigo-600 shadow-sm rounded-lg p-md flex justify-between items-start">
              <div className="flex flex-col">
                <h4 className="text-[13px] font-semibold text-on-surface-variant mb-2">Incomplete Onboarding</h4>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-on-surface">{stats.incompleteOnboarding.toLocaleString()}</span>
                </div>
                <p className="text-[12px] italic text-on-surface-variant/70">Dropped off in Stage 2</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-indigo-600">app_registration</span>
              </div>
            </div>

            {/* Avg. Verification Time */}
            <div className="bg-surface border-y border-r border-outline-variant border-l-4 border-l-indigo-600 shadow-sm rounded-lg p-md flex justify-between items-start">
              <div className="flex flex-col">
                <h4 className="text-[13px] font-semibold text-on-surface-variant mb-2">Avg. Verification Time</h4>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-on-surface">{stats.avgVerificationTime}</span>
                  <span className="text-sm font-medium text-on-surface-variant">days</span>
                </div>
                <p className="text-[12px] italic text-on-surface-variant/70">
                  {parseFloat(stats.avgVerificationTimeChange) > 0 ? '+' : ''}{stats.avgVerificationTimeChange} from previous week
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-indigo-600">timer</span>
              </div>
            </div>

            {/* Active Organizations */}
            <div className="bg-surface border-y border-r border-outline-variant border-l-4 border-l-indigo-600 shadow-sm rounded-lg p-md flex justify-between items-start">
              <div className="flex flex-col">
                <h4 className="text-[13px] font-semibold text-on-surface-variant mb-2">Active Organizations</h4>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-on-surface">{stats.activeOrganizations.toLocaleString()}</span>
                </div>
                <p className="text-[12px] italic text-on-surface-variant/70">Currently registered & active</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-green-600">check_circle</span>
              </div>
            </div>

            {/* Suspended Organizations */}
            <div className="bg-surface border-y border-r border-outline-variant border-l-4 border-l-indigo-600 shadow-sm rounded-lg p-md flex justify-between items-start">
              <div className="flex flex-col">
                <h4 className="text-[13px] font-semibold text-on-surface-variant mb-2">Suspended</h4>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-on-surface">{stats.suspended.toLocaleString()}</span>
                </div>
                <p className="text-[12px] italic text-on-surface-variant/70">Action required</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-red-600">gavel</span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-surface border border-outline-variant rounded-xl p-md mb-xl flex flex-wrap items-center justify-between gap-md">
            <div className="flex flex-wrap items-center gap-md w-full lg:w-auto">
              <div className="relative w-full lg:w-auto">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">search</span>
                <input
                  type="text"
                  placeholder="Filter by Name, Email, or Website..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="bg-surface border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-body-md font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none w-full lg:w-[280px]"
                />
              </div>

              <div className="flex items-center gap-sm">
                <span className="text-body-sm text-on-surface-variant font-medium hidden lg:inline">Status:</span>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                    className="appearance-none bg-surface border border-outline-variant rounded-lg pl-md pr-10 py-2 text-body-md font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="flex items-center gap-sm">
                <span className="text-body-sm text-on-surface-variant font-medium hidden lg:inline">Industry:</span>
                <div className="relative">
                  <select
                    value={industryFilter}
                    onChange={(e) => { setIndustryFilter(e.target.value); setCurrentPage(1); }}
                    className="appearance-none bg-surface border border-outline-variant rounded-lg pl-md pr-10 py-2 text-body-md font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
                  >
                    <option value="All">All Industries</option>
                    {availableIndustries.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-md">
              <button
                onClick={() => { setIndustryFilter('All'); setStatusFilter('All'); setSearchQuery(''); }}
                className="text-primary font-label-md hover:underline"
              >
                Clear all filters
              </button>
              <div className="h-5 w-px bg-outline-variant mx-xs"></div>
              <span className="text-body-md text-on-surface-variant">
                Showing {totalOrgs > 0 ? ((currentPage - 1) * orgsPerPage) + 1 : 0}-{Math.min(currentPage * orgsPerPage, totalOrgs)} of {totalOrgs}
              </span>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedOrgs.size > 0 && role !== 'developer' && (
            <div className="bg-primary-container text-on-primary-container px-lg py-md rounded-xl flex items-center justify-between mb-lg animate-in fade-in slide-in-from-top-4">
              <span className="font-label-md font-semibold">{selectedOrgs.size} organizations selected</span>
              <div className="flex items-center gap-md">
                <button
                  onClick={() => setSelectedOrgs(new Set())}
                  className="px-md py-sm bg-surface text-on-surface shadow-sm hover:bg-surface-container-low rounded-lg font-label-md transition-colors flex items-center gap-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                  Cancel Selection
                </button>
                <button
                  onClick={() => setWarningModalOpen(true)}
                  className="px-md py-sm bg-orange-500 text-white rounded-lg font-label-md hover:bg-orange-600 transition-colors shadow-sm flex items-center gap-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  Send Bulk Warning
                </button>
                <button
                  onClick={() => setRestrictConfirmModalOpen(true)}
                  className="px-md py-sm bg-error text-on-error rounded-lg font-label-md hover:bg-error/90 transition-colors shadow-sm flex items-center gap-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">block</span>
                  Restrict Selected
                </button>
              </div>
            </div>
          )}

          {/* Organizations Table */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low border-b border-outline-variant">
                  <tr>
                    {role !== 'developer' && (
                      <th className="p-lg w-12">
                        <input
                          type="checkbox"
                          className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                          checked={currentOrgs.length > 0 && selectedOrgs.size === currentOrgs.length}
                          onChange={toggleAll}
                        />
                      </th>
                    )}
                    <th className="p-lg font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Organization</th>
                    <th className="p-lg font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Industry</th>
                    <th className="p-lg font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Founded</th>
                    <th className="p-lg font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Location</th>
                    <th className="p-lg font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                    <th className="p-lg font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {currentOrgs.map(org => (
                    <tr 
                      key={org.id} 
                      className="hover:bg-surface-container-low transition-colors group cursor-pointer"
                      onClick={() => navigate(`/org-profile/${org.id}`, { state: { from: location.pathname + location.search, label: 'Organizations' } })}
                    >
                      {role !== 'developer' && (
                        <td className="p-lg" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                            checked={selectedOrgs.has(org.id)}
                            onChange={() => toggleOrg(org.id)}
                          />
                        </td>
                      )}
                      <td className="p-lg">
                        <div className="flex items-center gap-md">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${getColorClass(org.name)}`}>
                            {org.initials}
                          </div>
                          <div>
                            <p className="font-body-md font-bold">{org.name}</p>
                            <p className="text-body-sm text-on-surface-variant">{org.website}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-lg">
                        <span className={`${getIndustryClass(org.industry)} px-sm py-xs rounded-full text-body-sm font-medium`}>
                          {org.industry}
                        </span>
                      </td>
                      <td className="p-lg text-body-md text-on-surface">{org.founded}</td>
                      <td className="p-lg text-body-md text-on-surface">{org.location}</td>
                      <td className="p-lg">
                        {getStatusDisplay(org.status)}
                      </td>
                      <td className="p-lg text-right">
                        <div className="flex justify-end gap-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          {role !== 'developer' && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); setOrgToWarn(org); setWarningModalOpen(true); }}
                                className="p-xs text-outline hover:text-orange-500 transition-colors hover:bg-orange-50 rounded-lg"
                                title="Send Warning"
                              >
                                <span className="material-symbols-outlined text-[20px]">warning</span>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedOrgs(new Set([org.id])); setRestrictConfirmModalOpen(true); }}
                                className="p-xs text-outline hover:text-error transition-colors hover:bg-error-container/50 rounded-lg"
                                title="Suspend Organization"
                              >
                                <span className="material-symbols-outlined text-[20px]">gavel</span>
                              </button>
                            </>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/org-profile/${org.id}`, { state: { from: location.pathname + location.search, label: 'Organizations' } }); }} 
                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container text-outline hover:text-primary transition-colors" 
                            title="View Profile"
                          >
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="bg-surface-container-low px-lg py-md flex flex-col md:flex-row items-center justify-between border-t border-outline-variant gap-4">
              <p className="text-body-sm text-on-surface-variant">
                Showing {totalOrgs > 0 ? ((currentPage - 1) * orgsPerPage) + 1 : 0} - {Math.min(currentPage * orgsPerPage, totalOrgs)} of {totalOrgs} organizations
              </p>
              <div className="flex items-center gap-xs mt-sm">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-low disabled:opacity-50 transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>

                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg font-label-md transition-colors ${currentPage === index + 1
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'hover:bg-surface-container-low text-on-surface-variant'
                      }`}
                  >
                    {index + 1}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-low disabled:opacity-50 transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          {/* Warning Modal */}
          {warningModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
              <div className="bg-surface border border-outline-variant w-[450px] max-w-[90vw] rounded-xl shadow-xl p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-500">warning</span>
                    Send Warning
                  </h3>
                  <button onClick={() => setWarningModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors">close</button>
                </div>

                <p className="text-sm text-on-surface-variant mb-6">
                  You are sending an official warning to {orgToWarn ? <strong>{orgToWarn.name}</strong> : <strong>{selectedOrgs.size} selected organizations</strong>}.
                </p>

                <div className="flex flex-col gap-4 mb-6">
                  <div>
                    <label className="block text-[11px] font-mono-label text-on-surface-variant mb-xs ml-1">REASON</label>
                    <select
                      value={warningReason}
                      onChange={(e) => setWarningReason(e.target.value)}
                      className="w-full bg-surface border border-outline-variant rounded-lg px-md py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                    >
                      <option value="content">Inappropriate Content</option>
                      <option value="spam">Spam / Self-Promotion</option>
                      <option value="harassment">Harassment</option>
                      <option value="manipulation">Platform Manipulation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono-label text-on-surface-variant mb-xs ml-1">ADDITIONAL MESSAGE (OPTIONAL)</label>
                    <textarea
                      value={warningMessage}
                      onChange={(e) => setWarningMessage(e.target.value)}
                      placeholder="Provide any specific context or links to offending content..."
                      className="w-full bg-surface border border-outline-variant rounded-lg px-md py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none h-24"
                    ></textarea>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="severeOrgWarning"
                      checked={warningIsSevere}
                      onChange={(e) => setWarningIsSevere(e.target.checked)}
                      className="rounded border-outline-variant text-primary focus:ring-primary h-4 w-4"
                    />
                    <label htmlFor="severeOrgWarning" className="text-sm font-medium text-on-surface">
                      Severe Warning (Auto-suspends after 3 violations)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button onClick={() => setWarningModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">Cancel</button>
                  <button
                    onClick={handleSendWarning}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm active:scale-95"
                  >
                    Send Warning
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Suspend Confirmation Modal */}
          {restrictConfirmModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
              <div className="bg-surface border border-outline-variant w-[400px] max-w-[90vw] rounded-xl shadow-xl p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-error">gavel</span>
                    Confirm Suspension
                  </h3>
                  <button onClick={() => setRestrictConfirmModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors">close</button>
                </div>

                <p className="text-sm text-on-surface-variant mb-6">
                  Are you sure you want to suspend <strong>{selectedOrgs.size}</strong> selected organizations? Their public pages will be hidden and access revoked.
                </p>

                <div className="flex justify-end gap-3">
                  <button onClick={() => { setRestrictConfirmModalOpen(false); setSelectedOrgs(new Set()); }} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">Cancel</button>
                  <button
                    onClick={() => {
                      const id = Array.from(selectedOrgs)[0];
                      if (id) handleRestrictOrg(id);
                    }}
                    className="bg-error text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-error/90 transition-colors shadow-sm active:scale-95"
                  >
                    Yes, Suspend
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
