import React, { useState } from 'react';

const mockOrganizations = [
  { id: 1, initials: 'NT', name: 'NexuTech Solutions', website: 'nexus-tech.io', industry: 'Software & IT', founded: 'Jan 12, 2018', location: 'San Francisco, USA', status: 'Active', colorClass: 'bg-primary-fixed text-primary', industryClass: 'bg-secondary-container text-on-secondary-container' },
  { id: 2, initials: 'GH', name: 'GreenHorizon Media', website: 'greenhorizon.com', industry: 'Advertising', founded: 'Mar 22, 2021', location: 'London, UK', status: 'Active', colorClass: 'bg-surface-container-highest text-secondary', industryClass: 'bg-surface-variant text-on-surface-variant' },
  { id: 3, initials: 'VL', name: 'Vanguard Logistics', website: 'v-logistics.net', industry: 'Supply Chain', founded: 'Nov 05, 2015', location: 'Berlin, DE', status: 'Active', colorClass: 'bg-tertiary-fixed text-tertiary', industryClass: 'bg-tertiary-container text-on-tertiary-container' },
  { id: 4, initials: 'BF', name: 'BioFuture Inc.', website: 'biofuture.tech', industry: 'Biotechnology', founded: 'May 30, 2023', location: 'Toronto, CA', status: 'Active', colorClass: 'bg-secondary-fixed text-secondary-container', industryClass: 'bg-secondary-container text-on-secondary-container' },
  { id: 5, initials: 'OR', name: 'OmniRetail Global', website: 'omni-global.com', industry: 'E-commerce', founded: 'Aug 14, 2012', location: 'Tokyo, JP', status: 'Active', colorClass: 'bg-inverse-surface text-inverse-primary', industryClass: 'bg-surface-variant text-on-surface-variant' },
  { id: 6, initials: 'AS', name: 'AeroSpace Dynamics', website: 'aero-dynamics.com', industry: 'Aerospace', founded: 'Feb 10, 2010', location: 'Houston, USA', status: 'Active', colorClass: 'bg-primary-fixed text-primary', industryClass: 'bg-secondary-container text-on-secondary-container' },
  { id: 7, initials: 'QM', name: 'Quantum Manufacturing', website: 'quantum-mfg.com', industry: 'Manufacturing', founded: 'Jul 21, 2019', location: 'Seoul, KR', status: 'Suspended', colorClass: 'bg-error-container text-error', industryClass: 'bg-surface-variant text-on-surface-variant' },
  { id: 8, initials: 'FE', name: 'FinEdge Analytics', website: 'finedge.net', industry: 'Finance', founded: 'Sep 09, 2020', location: 'New York, USA', status: 'Active', colorClass: 'bg-tertiary-fixed text-tertiary', industryClass: 'bg-tertiary-container text-on-tertiary-container' },
  { id: 9, initials: 'EH', name: 'EcoHealth Partners', website: 'ecohealth.org', industry: 'Healthcare', founded: 'Dec 15, 2016', location: 'Geneva, CH', status: 'Active', colorClass: 'bg-secondary-fixed text-secondary-container', industryClass: 'bg-secondary-container text-on-secondary-container' },
  { id: 10, initials: 'CS', name: 'CyberShield Sec', website: 'cybershield.io', industry: 'Cybersecurity', founded: 'Oct 30, 2022', location: 'Tel Aviv, IL', status: 'Active', colorClass: 'bg-surface-container-highest text-secondary', industryClass: 'bg-surface-variant text-on-surface-variant' },
  { id: 11, initials: 'AR', name: 'AutoRobotics', website: 'autorobotics.com', industry: 'Manufacturing', founded: 'Jan 05, 2017', location: 'Munich, DE', status: 'Active', colorClass: 'bg-primary-fixed text-primary', industryClass: 'bg-secondary-container text-on-secondary-container' },
  { id: 12, initials: 'NW', name: 'NextWave Energy', website: 'nextwave.energy', industry: 'Energy', founded: 'Apr 12, 2021', location: 'Oslo, NO', status: 'Active', colorClass: 'bg-tertiary-fixed text-tertiary', industryClass: 'bg-tertiary-container text-on-tertiary-container' },
  { id: 13, initials: 'PL', name: 'Pioneer Logistics', website: 'pioneer-log.com', industry: 'Supply Chain', founded: 'Jun 18, 2014', location: 'Singapore, SG', status: 'Suspended', colorClass: 'bg-error-container text-error', industryClass: 'bg-surface-variant text-on-surface-variant' },
  { id: 14, initials: 'MT', name: 'MedTech Innovations', website: 'medtech-inno.com', industry: 'Healthcare', founded: 'Mar 03, 2019', location: 'Boston, USA', status: 'Active', colorClass: 'bg-secondary-fixed text-secondary-container', industryClass: 'bg-secondary-container text-on-secondary-container' },
  { id: 15, initials: 'CB', name: 'CloudBase Systems', website: 'cloudbase.io', industry: 'Software & IT', founded: 'Aug 22, 2020', location: 'Austin, USA', status: 'Active', colorClass: 'bg-inverse-surface text-inverse-primary', industryClass: 'bg-surface-variant text-on-surface-variant' },
  { id: 16, initials: 'DA', name: 'DataArts', website: 'dataarts.net', industry: 'Advertising', founded: 'May 14, 2023', location: 'Paris, FR', status: 'Active', colorClass: 'bg-primary-fixed text-primary', industryClass: 'bg-secondary-container text-on-secondary-container' }
];

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Organizations() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [selectedOrgs, setSelectedOrgs] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [industryFilter, setIndustryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const orgsPerPage = 8;

  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [restrictConfirmModalOpen, setRestrictConfirmModalOpen] = useState(false);
  const [orgToWarn, setOrgToWarn] = useState(null);

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

  const handleSendWarning = () => {
    alert(`Warning sent!`);
    setWarningModalOpen(false);
    setOrgToWarn(null);
  };

  const handleRestrictSelected = () => {
    alert(`Restricted ${selectedOrgs.size} organizations.`);
    setRestrictConfirmModalOpen(false);
    setSelectedOrgs(new Set());
  };

  const filteredOrgs = mockOrganizations
    .filter(org => industryFilter === 'All' || org.industry === industryFilter)
    .filter(org => statusFilter === 'All' || org.status === statusFilter);

  const indexOfLastOrg = currentPage * orgsPerPage;
  const indexOfFirstOrg = indexOfLastOrg - orgsPerPage;
  const currentOrgs = filteredOrgs.slice(indexOfFirstOrg, indexOfLastOrg);
  const totalPages = Math.ceil(filteredOrgs.length / orgsPerPage) || 1;

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
    <div className="pt-8 pb-12 w-full max-w-max-width mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-xl gap-md">
        <div>
          <h2 className="font-display-lg text-display-lg text-on-background">Organization Directory</h2>
          <p className="text-on-surface-variant font-body-lg text-body-lg">Manage registered entities, verification status, and platform access.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md mb-xl">
        {/* Total Organizations */}
        <div className="bg-surface border-y border-r border-outline-variant border-l-4 border-l-indigo-600 shadow-sm rounded-lg p-md flex justify-between items-start">
          <div className="flex flex-col">
            <h4 className="text-[13px] font-semibold text-on-surface-variant mb-2">Total Organizations</h4>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold text-on-surface">2,842</span>
              <span className="text-[12px] font-bold text-green-600 flex items-center">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>+12%
              </span>
            </div>
            <p className="text-[12px] italic text-on-surface-variant/70">Since last month</p>
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
              <span className="text-3xl font-bold text-on-surface">42</span>
              <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full uppercase">Urgent</span>
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
              <span className="text-3xl font-bold text-on-surface">156</span>
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
              <span className="text-3xl font-bold text-on-surface">1.2</span>
              <span className="text-sm font-medium text-on-surface-variant">days</span>
            </div>
            <p className="text-[12px] italic text-on-surface-variant/70">-0.3 from previous week</p>
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
              <span className="text-3xl font-bold text-on-surface">{mockOrganizations.filter(o => o.status === 'Active').length}</span>
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
              <span className="text-3xl font-bold text-on-surface">{mockOrganizations.filter(o => o.status === 'Suspended').length}</span>
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
        <div className="flex flex-wrap items-center gap-md">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">filter_alt</span>
            <select
              value={industryFilter}
              onChange={(e) => { setIndustryFilter(e.target.value); setCurrentPage(1); }}
              className="appearance-none bg-surface border border-outline-variant rounded-lg pl-10 pr-10 py-2 text-body-md font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
            >
              <option value="All">All Industries</option>
              <option value="Software & IT">Software & IT</option>
              <option value="Advertising">Advertising</option>
              <option value="Supply Chain">Supply Chain</option>
              <option value="Biotechnology">Biotechnology</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Aerospace">Aerospace</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Finance">Finance</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Energy">Energy</option>
            </select>
            <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">expand_more</span>
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="appearance-none bg-surface border border-outline-variant rounded-lg pl-md pr-10 py-2 text-body-md font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
            >
              <option value="All">Any</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
            </select>
            <span className="material-symbols-outlined absolute right-sm top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant pointer-events-none">expand_more</span>
          </div>
        </div>

        <div className="flex items-center gap-md">
          <button
            onClick={() => { setIndustryFilter('All'); setStatusFilter('All'); }}
            className="text-primary font-label-md hover:underline"
          >
            Clear all filters
          </button>
          <div className="h-5 w-px bg-outline-variant mx-xs"></div>
          <span className="text-body-md text-on-surface-variant">
            Showing {filteredOrgs.length > 0 ? indexOfFirstOrg + 1 : 0}-{Math.min(indexOfLastOrg, filteredOrgs.length)} of {filteredOrgs.length}
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
                <tr key={org.id} className="hover:bg-surface-container-low transition-colors group">
                  {role !== 'developer' && (
                    <td className="p-lg">
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
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${org.colorClass}`}>
                        {org.initials}
                      </div>
                      <div>
                        <p className="font-body-md font-bold">{org.name}</p>
                        <p className="text-body-sm text-on-surface-variant">{org.website}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-lg">
                    <span className={`${org.industryClass} px-sm py-xs rounded-full text-body-sm font-medium`}>
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
                            onClick={() => { setOrgToWarn(org); setWarningModalOpen(true); }}
                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-orange-50 text-outline hover:text-orange-500 transition-colors"
                            title="Send Warning"
                          >
                            <span className="material-symbols-outlined">warning</span>
                          </button>
                          <button
                            onClick={() => { setSelectedOrgs(new Set([org.id])); setRestrictConfirmModalOpen(true); }}
                            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-red-50 text-outline hover:text-red-500 transition-colors"
                            title="Suspend Organization"
                          >
                            <span className="material-symbols-outlined">block</span>
                          </button>
                        </>
                      )}
                      <button onClick={() => navigate('/org-profile')} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container text-outline hover:text-primary transition-colors" title="View Profile">
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
            Showing {filteredOrgs.length > 0 ? indexOfFirstOrg + 1 : 0} - {Math.min(indexOfLastOrg, filteredOrgs.length)} of {filteredOrgs.length} organizations
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
                <label className="block text-[11px] font-mono-label text-on-surface-variant mb-xs ml-1">ADDITIONAL MESSAGE</label>
                <textarea
                  placeholder="Provide any specific context or links..."
                  className="w-full bg-surface border border-outline-variant rounded-lg px-md py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none h-24"
                ></textarea>
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

      {/* Restrict Confirmation Modal */}
      {restrictConfirmModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant w-[400px] max-w-[90vw] rounded-xl shadow-xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-error">block</span>
                Confirm Restriction
              </h3>
              <button onClick={() => setRestrictConfirmModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors">close</button>
            </div>

            <p className="text-sm text-on-surface-variant mb-6">
              Are you sure you want to restrict access for <strong>{selectedOrgs.size}</strong> selected organizations? Their public pages will be hidden.
            </p>

            <div className="flex justify-end gap-3">
              <button onClick={() => setRestrictConfirmModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">Cancel</button>
              <button
                onClick={handleRestrictSelected}
                className="bg-error text-on-error px-4 py-2 rounded-lg text-sm font-medium hover:bg-error/90 transition-colors shadow-sm active:scale-95"
              >
                Yes, Restrict
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
