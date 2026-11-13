import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

const resolveDocUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  return url.startsWith('/') ? url : '/' + url;
};

// Generates consistent company initials avatar
const getAvatarInitials = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase() || 'OR';
};

const getAvatarColor = (name = '') => {
  const colors = [
    'bg-teal-600',
    'bg-indigo-600',
    'bg-sky-500',
    'bg-pink-600',
    'bg-amber-600',
    'bg-sky-600',
    'bg-emerald-600',
    'bg-purple-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export default function VerificationQueue() {
  const { accessToken } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Under Review');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Document Viewer Modal States
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [activeDocument, setActiveDocument] = useState(null);
  const [activeDocumentStatus, setActiveDocumentStatus] = useState('PENDING');
  const [documentNotes, setDocumentNotes] = useState('');
  const [zoom, setZoom] = useState(100);

  // Decision form states
  const [rejectionReason, setRejectionReason] = useState('No rejection reason selected');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [activeOrg, setActiveOrg] = useState(null);

  // Reviewer checklist
  const [checklist, setChecklist] = useState({
    legalName: false,
    incorporationDate: false,
    addressProof: false
  });

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/organisations/verifications/queue', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        const rawList = Array.isArray(data) ? data : (data?.verifications || []);
        const normalized = rawList.map(item => {
          let displayStatus = 'Unverified';
          let badgeColor = 'bg-slate-400';
          const rawStatus = (item.verification_status || item.status || '').toUpperCase();
          const hasDocs = Array.isArray(item.documents) && item.documents.length > 0;
          const isExplicitReview = rawStatus === 'UNDER_REVIEW' || rawStatus === 'PENDING' || rawStatus === 'DOCUMENT_PENDING';

          if (rawStatus === 'VERIFIED' || rawStatus === 'APPROVED') {
            displayStatus = 'Approved';
            badgeColor = 'bg-emerald-600';
          } else if (rawStatus === 'REJECTED') {
            displayStatus = 'Rejected';
            badgeColor = 'bg-rose-600';
          } else if (isExplicitReview || hasDocs) {
            displayStatus = 'Under Review';
            badgeColor = 'bg-amber-500';
          } else {
            displayStatus = 'Unverified';
            badgeColor = 'bg-slate-400';
          }

          return {
            ...item,
            title: item.title || item.name || 'Unnamed Organization',
            name: item.name || item.title || 'Unnamed Organization',
            author: item.owner_name || item.owner_email || item.author || 'Not specified',
            date: item.date || (item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'),
            status: displayStatus,
            statusBadgeColor: badgeColor,
            fullLocation: item.fullLocation || item.location_formatted || item.location || '',
            size: item.size || item.salary || '',
            type: item.industry || item.type || '',
            documents: Array.isArray(item.documents) ? item.documents : []
          };
        });
        setOrgs(normalized);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchQueue();
    }
  }, [accessToken]);

  const safeOrgs = Array.isArray(orgs) ? orgs : [];
  
  // Filter by tab and search query
  const filteredOrgs = safeOrgs.filter(org => {
    const matchesFilter = filter === 'All' 
      ? true 
      : filter === 'Under Review' 
        ? org.status === 'Under Review' 
        : filter === 'Unverified'
          ? org.status === 'Unverified'
          : org.status === filter;
    
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      org.title.toLowerCase().includes(q) ||
      org.author.toLowerCase().includes(q) ||
      (org.fullLocation && org.fullLocation.toLowerCase().includes(q)) ||
      (org.legal_name && org.legal_name.toLowerCase().includes(q))
    );

    return matchesFilter && matchesSearch;
  });

  // Update active org when filter changes or when orgs list updates
  useEffect(() => {
    if (filteredOrgs.length > 0) {
      const stillSelected = filteredOrgs.find(o => o.id === activeOrg?.id);
      setActiveOrg(stillSelected || filteredOrgs[0]);
    } else {
      setActiveOrg(null);
    }
  }, [filter, orgs, searchQuery]);

  // Sync rejection reason / reviewer notes when activeOrg changes
  useEffect(() => {
    if (activeOrg) {
      setChecklist({
        legalName: false,
        incorporationDate: false,
        addressProof: false
      });
      setReviewerNotes(activeOrg.review_notes || '');
      if (activeOrg.review_notes && activeOrg.review_notes.startsWith('[Reason:')) {
        const match = activeOrg.review_notes.match(/^\[Reason:\s*([^\]]+)\]/);
        if (match) {
          setRejectionReason(match[1]);
          setReviewerNotes(activeOrg.review_notes.replace(/^\[Reason:\s*([^\]]+)\]\s*/, ''));
        }
      } else {
        setRejectionReason('No rejection reason selected');
      }
    }
  }, [activeOrg]);

  const stats = {
    all: safeOrgs.length,
    underReview: safeOrgs.filter(j => j.status === 'Under Review').length,
    unverified: safeOrgs.filter(j => j.status === 'Unverified').length,
    approved: safeOrgs.filter(j => j.status === 'Approved').length,
    rejected: safeOrgs.filter(j => j.status === 'Rejected').length
  };

  const handleFinalReview = async (status) => {
    if (!activeOrg) return;
    try {
      const checks = [];
      if (checklist.legalName) checks.push('Legal Name Matched');
      if (checklist.incorporationDate) checks.push('Inc Date Verified');
      if (checklist.addressProof) checks.push('Address Verified');
      const checksNote = checks.length > 0 ? `[Checklist: ${checks.join(', ')}]` : '';
      const consolidatedNotes = [reviewerNotes, checksNote].filter(Boolean).join(' ');

      const res = await fetch(`/api/admin/organisations/verifications/${activeOrg.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          status,
          notes: consolidatedNotes,
          rejectionReason: status === 'REJECTED' ? rejectionReason : undefined
        })
      });
      if (!res.ok) {
        const errorText = await res.text();
        alert(`Error: ${errorText}`);
        return;
      }
      const data = await res.json();
      if (res.ok && !data.error) {
        alert(`Organization verification ${status === 'VERIFIED' ? 'approved' : 'rejected'} successfully.`);
        if (status === 'VERIFIED') setFilter('Approved');
        else if (status === 'REJECTED') setFilter('Rejected');
        fetchQueue();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit final review.');
    }
  };

  const handleDocumentReview = async () => {
    if (!activeDocument) return;
    try {
      const res = await fetch(`/api/admin/organisations/verifications/documents/${activeDocument.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          status: activeDocumentStatus,
          notes: documentNotes
        })
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        alert('Document status updated.');
        setDocumentModalOpen(false);
        fetchQueue();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update document status.');
    }
  };

  return (
    <div className="flex w-full h-[calc(100vh-140px)] min-h-[750px] bg-[#f8fafc] text-slate-800 antialiased overflow-hidden rounded-2xl border border-slate-200/80 shadow-xs mt-3">
      
      {/* Left Sidebar Queue */}
      <aside className="w-80 md:w-96 bg-white border-r border-slate-200/80 flex flex-col shrink-0">
        
        {/* Queue Header with Count & Refresh */}
        <div className="p-4 border-b border-slate-100 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Organizations</span>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                {filter === 'All' ? stats.all : filter === 'Under Review' ? stats.underReview : filter === 'Unverified' ? stats.unverified : filter === 'Approved' ? stats.approved : stats.rejected}
              </span>
            </div>
            <button 
              onClick={fetchQueue}
              aria-label="Refresh queue" 
              className="text-slate-400 hover:text-slate-600 transition p-1 hover:bg-slate-100 rounded-md" 
              type="button"
              title="Refresh Queue"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </div>
            <input 
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition" 
              placeholder="Search company, submitter, location..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 text-xs font-semibold overflow-x-auto pb-1">
            <button 
              onClick={() => setFilter('All')}
              className={`py-1.5 px-2.5 rounded-lg text-center flex items-center justify-center gap-1 transition shrink-0 ${filter === 'All' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100 border border-slate-200/70'}`}
              type="button"
            >
              <span>All</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${filter === 'All' ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {stats.all}
              </span>
            </button>

            <button 
              onClick={() => setFilter('Under Review')}
              className={`py-1.5 px-2.5 rounded-lg text-center flex items-center justify-center gap-1.5 transition shrink-0 ${filter === 'Under Review' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100 border border-slate-200/70'}`}
              type="button"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Under Review</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${filter === 'Under Review' ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {stats.underReview}
              </span>
            </button>

            <button 
              onClick={() => setFilter('Unverified')}
              className={`py-1.5 px-2.5 rounded-lg text-center flex items-center justify-center gap-1.5 transition shrink-0 ${filter === 'Unverified' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100 border border-slate-200/70'}`}
              type="button"
            >
              <svg className={`w-3.5 h-3.5 ${filter === 'Unverified' ? 'text-white' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Unverified</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${filter === 'Unverified' ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {stats.unverified}
              </span>
            </button>

            <button 
              onClick={() => setFilter('Approved')}
              className={`py-1.5 px-2 rounded-lg text-center flex items-center gap-1 transition shrink-0 ${filter === 'Approved' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100 border border-slate-200/70'}`}
              type="button"
            >
              <svg className={`w-3.5 h-3.5 ${filter === 'Approved' ? 'text-white' : 'text-emerald-600'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Approved</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${filter === 'Approved' ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {stats.approved}
              </span>
            </button>

            <button 
              onClick={() => setFilter('Rejected')}
              className={`py-1.5 px-2 rounded-lg text-center flex items-center gap-1 transition shrink-0 ${filter === 'Rejected' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:bg-slate-100 border border-slate-200/70'}`}
              type="button"
            >
              <svg className={`w-3.5 h-3.5 ${filter === 'Rejected' ? 'text-white' : 'text-rose-500'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
              <span>Rejected</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${filter === 'Rejected' ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {stats.rejected}
              </span>
            </button>
          </div>
        </div>

        {/* Queue Organization List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100" data-purpose="organization-list">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <p>Loading queue...</p>
            </div>
          ) : filteredOrgs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs space-y-2">
              <p className="font-semibold text-slate-700">
                {filter === 'Under Review' 
                  ? 'No applications under review' 
                  : filter === 'Unverified'
                    ? 'No unverified organizations'
                    : 'No organizations found'}
              </p>
              <p className="text-[11px] text-slate-400">
                {filter === 'Under Review' 
                  ? 'No registered organizations have submitted verification documents yet.' 
                  : filter === 'Unverified'
                    ? 'All registered organizations have submitted verification or are approved.'
                    : 'Try switching tabs or adjusting your search query.'}
              </p>
              {filter !== 'All' && (
                <button
                  type="button"
                  onClick={() => setFilter('All')}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold transition border border-indigo-200 cursor-pointer"
                >
                  View All Organizations ({stats.all})
                </button>
              )}
            </div>
          ) : (
            filteredOrgs.map(org => {
              const isSelected = activeOrg?.id === org.id;
              const colorBg = getAvatarColor(org.title);
              const initials = getAvatarInitials(org.title);
              const locationFirst = (org.fullLocation && org.fullLocation !== 'N/A' && org.fullLocation.trim()) ? org.fullLocation.split(',')[0].trim().toUpperCase() : null;

              return (
                <article 
                  key={org.id}
                  onClick={() => setActiveOrg(org)}
                  className={`p-3.5 relative cursor-pointer transition ${isSelected ? 'bg-indigo-50/40 border-l-4 border-indigo-600 hover:bg-indigo-50/60' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${colorBg} text-white font-bold text-xs flex items-center justify-center shadow-xs`}>
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 leading-tight truncate max-w-[170px]" title={org.title}>
                          {org.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" strokeLinecap="round" strokeLinejoin="round"></path>
                          </svg>
                          <span className="truncate max-w-[150px]">{org.author}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">{org.date}</span>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 mt-2.5 pl-12 flex-wrap">
                    {(filter === 'All' || filter === 'Unverified') && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        org.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : org.status === 'Under Review'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : org.status === 'Rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          org.status === 'Approved' ? 'bg-emerald-500' : org.status === 'Under Review' ? 'bg-amber-500' : org.status === 'Rejected' ? 'bg-rose-500' : 'bg-slate-400'
                        }`}></span>
                        {org.status}
                      </span>
                    )}
                    {locationFirst && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white text-slate-600 border border-slate-200">
                        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                          <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                        {locationFirst}
                      </span>
                    )}
                    {org.type && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white text-slate-600 border border-slate-200 uppercase">
                        <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                        {org.type}
                      </span>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </aside>

      {/* Central Inspection View */}
      <main className="flex-1 overflow-y-auto p-5 space-y-4">
        {activeOrg ? (
          <>
            {/* Organization Hero Banner */}
            <section className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs relative overflow-hidden" data-purpose="organization-banner">
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl font-bold tracking-tight text-indigo-600 shrink-0 shadow-xs">
                    {getAvatarInitials(activeOrg.title)}
                  </div>
                  <div>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold mb-2 ${
                      activeOrg.status === 'Approved' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' 
                        : activeOrg.status === 'Rejected' 
                          ? 'bg-rose-50 text-rose-700 border border-rose-200/70' 
                          : activeOrg.status === 'Under Review'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        activeOrg.status === 'Approved' 
                          ? 'bg-emerald-500' 
                          : activeOrg.status === 'Rejected' 
                            ? 'bg-rose-500' 
                            : activeOrg.status === 'Under Review'
                              ? 'bg-amber-500 animate-pulse'
                              : 'bg-slate-400'
                      }`}></span>
                      <span>{(activeOrg.status || 'UNVERIFIED').toUpperCase().replace(' ', '_')}</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                      {activeOrg.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500 font-medium">
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                        <span>Submitted by: <strong className="text-slate-700">{activeOrg.author}</strong></span>
                      </div>
                      <span>•</span>
                      <span>{activeOrg.date}</span>
                      {activeOrg.type && (
                        <>
                          <span>•</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] tracking-wide font-semibold text-slate-600 uppercase border border-slate-200">
                            {activeOrg.type}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Organization verification link copied to clipboard!');
                  }}
                  aria-label="Share organization profile" 
                  className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition border border-slate-200" 
                  type="button"
                  title="Share / Copy Link"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </button>
              </div>
            </section>

            {/* KPI / Essential Info 4-Card Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-purpose="kpi-grid">
              
              {/* Legal Name */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2 text-indigo-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">LEGAL FULL NAME</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 truncate" title={activeOrg.legal_name || activeOrg.title}>
                    {activeOrg.legal_name || activeOrg.title}
                  </div>
                  {activeOrg.documents && activeOrg.documents.length > 0 ? (
                    <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium mt-1">
                      <span>{activeOrg.documents.length} document{activeOrg.documents.length > 1 ? 's' : ''} uploaded</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-600 font-medium mt-1">
                      No documents uploaded
                    </div>
                  )}
                </div>
              </div>

              {/* Inc. Date */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2 text-indigo-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">INC. DATE</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-700">
                    {activeOrg.incorporation_date ? new Date(activeOrg.incorporation_date).toLocaleDateString() : 'Not specified'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1">
                    {activeOrg.incorporation_date ? 'Incorporation Date' : 'Awaiting Details'}
                  </div>
                </div>
              </div>

              {/* HQ Location */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2 text-indigo-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">HQ LOCATION</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 truncate" title={activeOrg.fullLocation}>
                    {activeOrg.fullLocation && activeOrg.fullLocation !== 'N/A' && activeOrg.fullLocation.trim() ? activeOrg.fullLocation : 'Not specified'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1">
                    {activeOrg.fullLocation && activeOrg.fullLocation !== 'N/A' && activeOrg.fullLocation.trim() ? 'Registered Address' : 'Address Pending'}
                  </div>
                </div>
              </div>

              {/* Company Size */}
              <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2 text-indigo-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">COMPANY SIZE</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{activeOrg.size ? activeOrg.size : 'Not specified'}</div>
                  <div className="text-[11px] text-slate-400 font-medium mt-1">
                    {activeOrg.size ? 'Team Size' : 'Size Unspecified'}
                  </div>
                </div>
              </div>
            </section>

            {/* Verification Documents Card */}
            <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs" data-purpose="verification-documents-section">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">Verification Documents</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Review official certificates submitted by the organization.</p>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  activeOrg.status === 'Approved' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70' 
                    : activeOrg.status === 'Rejected' 
                      ? 'bg-rose-50 text-rose-700 border border-rose-200/70' 
                      : activeOrg.status === 'Under Review'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    activeOrg.status === 'Approved' 
                      ? 'bg-emerald-500' 
                      : activeOrg.status === 'Rejected' 
                        ? 'bg-rose-500' 
                        : activeOrg.status === 'Under Review'
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-slate-400'
                  }`}></span>
                  <span>{activeOrg.status}</span>
                </span>
              </div>

              {/* Uploaded Documents List or Empty State */}
              {(!activeOrg.documents || activeOrg.documents.length === 0) ? (
                <div className="mt-3 py-3 px-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 text-slate-500">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <span className="font-medium text-slate-600">No documents uploaded for this organization.</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                    Pending Submission
                  </span>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {activeOrg.documents.map(doc => (
                    <div 
                      key={doc.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl shadow-xs hover:shadow-sm transition gap-3"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" strokeLinecap="round" strokeLinejoin="round"></path>
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs mb-0.5">{doc.document_name}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 font-medium">
                            <span>Uploaded {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'recently'} &bull; PDF</span>
                            <span className={`font-bold flex items-center gap-1 ${doc.status === 'APPROVED' ? 'text-emerald-600' : doc.status === 'REJECTED' ? 'text-rose-600' : 'text-amber-600'}`}>
                              {doc.status || 'PENDING REVIEW'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setActiveDocument(doc);
                          setActiveDocumentStatus(doc.status || 'PENDING');
                          setDocumentNotes(doc.review_notes || '');
                          setDocumentModalOpen(true);
                        }} 
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 rounded-xl text-xs font-bold transition shrink-0 shadow-xs"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" strokeLinecap="round" strokeLinejoin="round"></path>
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                        </svg>
                        <span>Preview Document</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Organization Overview Card */}
            <section className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs" data-purpose="organization-overview">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">ORGANIZATION OVERVIEW</h3>
                </div>
              </div>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-normal">
                {activeOrg.description ? (
                  activeOrg.description
                ) : (
                  <span className="italic text-slate-400">No overview or description provided by organization.</span>
                )}
              </p>
            </section>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-12">
            <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"></path>
            </svg>
            <p className="text-sm font-semibold">Select an organization to view details.</p>
          </div>
        )}
      </main>

      {/* Right Decision Panel */}
      {activeOrg && (
        <aside className="w-80 md:w-96 bg-white text-slate-800 flex flex-col justify-between shrink-0 border-l border-slate-200/80" data-purpose="decision-panel">
          
          {/* Panel Scrollable Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <h2 className="text-sm font-bold tracking-tight text-slate-900">Decision Panel</h2>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded border border-slate-200">
                {activeOrg.status === 'Approved' ? 'Verified' : activeOrg.status === 'Under Review' ? 'In Review' : 'Pending Action'}
              </span>
            </div>

            {/* Current Verification Status */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                CURRENT VERIFICATION STATUS
              </label>
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-xs">
                <div className={`flex items-center gap-2 text-xs font-semibold ${
                  activeOrg.status === 'Approved' 
                    ? 'text-emerald-700' 
                    : activeOrg.status === 'Rejected' 
                      ? 'text-rose-700' 
                      : activeOrg.status === 'Under Review'
                        ? 'text-amber-700'
                        : 'text-slate-600'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    activeOrg.status === 'Approved' 
                      ? 'bg-emerald-500' 
                      : activeOrg.status === 'Rejected' 
                        ? 'bg-rose-500' 
                        : activeOrg.status === 'Under Review'
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-slate-400'
                  }`}></span>
                  <span>{activeOrg.status === 'Unverified' ? 'Unverified (Not Applied)' : activeOrg.status}</span>
                </div>
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </div>
            </div>

            {/* Compliance Checklist */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                COMPLIANCE CHECKLIST
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 select-none">
                  <input 
                    type="checkbox" 
                    checked={checklist.legalName}
                    onChange={(e) => setChecklist({ ...checklist, legalName: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="font-medium">Legal name matches certificate</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-700 select-none">
                  <input 
                    type="checkbox" 
                    checked={checklist.incorporationDate}
                    onChange={(e) => setChecklist({ ...checklist, incorporationDate: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className="font-medium">Inc. date verified with registry</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-600 select-none">
                  <input 
                    type="checkbox" 
                    checked={checklist.addressProof}
                    onChange={(e) => setChecklist({ ...checklist, addressProof: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>Address proof verified & legible</span>
                </label>
              </div>
            </div>

            {/* Rejection Reason Dropdown */}
            {(activeOrg.status === 'Under Review' || activeOrg.status === 'Pending') && (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500" htmlFor="rejection-reason-select">
                  REJECTION REASON (IF DENYING)
                </label>
                <select 
                  id="rejection-reason-select"
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option>No rejection reason selected</option>
                  <option>Incomplete documentation</option>
                  <option>Name mismatch with registry</option>
                  <option>Address unverified or fraudulent</option>
                  <option>Expired certification</option>
                  <option>Blurry or illegible document scan</option>
                </select>
              </div>
            )}

            {/* Internal Reviewer Notes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500" htmlFor="reviewer-notes-input">
                  INTERNAL REVIEWER NOTES
                </label>
                <span className="text-[10px] text-slate-400">Audit Trail</span>
              </div>
              <textarea 
                id="reviewer-notes-input"
                value={reviewerNotes}
                onChange={e => setReviewerNotes(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none" 
                placeholder="Type private compliance observations here..." 
                rows="3"
              ></textarea>
              
              {/* Helper Quick-Pills */}
              <div className="flex items-center gap-2 pt-1">
                <button 
                  type="button"
                  onClick={() => setReviewerNotes(prev => (prev ? prev + ' ' : '') + '✓ Verified against MCA registry')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-indigo-600 text-[11px] rounded-lg transition border border-slate-200 font-medium"
                >
                  + Add Verified Note
                </button>
                <button 
                  type="button"
                  onClick={() => setReviewerNotes(prev => (prev ? prev + ' ' : '') + '⚠️ Request clearer scan of document')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-indigo-600 text-[11px] rounded-lg transition border border-slate-200 font-medium"
                >
                  + Request Scan Note
                </button>
              </div>
            </div>

          </div>

          {/* Action Footer (Anchored CTA) */}
          <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
            {(activeOrg.status === 'Under Review' || activeOrg.status === 'Pending') ? (
              <>
                <button 
                  type="button"
                  onClick={() => handleFinalReview('VERIFIED')}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  <span>Approve Organization</span>
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    if (rejectionReason === 'No rejection reason selected') {
                      alert('Please select a Rejection Reason first.');
                      return;
                    }
                    handleFinalReview('REJECTED');
                  }}
                  className="w-full py-2 px-4 bg-white hover:bg-rose-600/10 text-rose-500 border border-rose-500/30 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  <span>Deny Application</span>
                </button>
              </>
            ) : (
              <div className="space-y-2">
                <div className="text-slate-600 text-xs bg-slate-100 p-3 rounded-xl border border-slate-200 flex items-center gap-2">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                  <span>Organization is currently <strong>{activeOrg.status}</strong>.</span>
                </div>

                {activeOrg.status === 'Approved' && (
                  <button 
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Revoke verification for ${activeOrg.title}?`)) {
                        handleFinalReview('REJECTED');
                      }
                    }}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    Revoke Verification
                  </button>
                )}

                {activeOrg.status === 'Rejected' && (
                  <button 
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Re-approve ${activeOrg.title}?`)) {
                        handleFinalReview('VERIFIED');
                      }
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    Re-Approve Organization
                  </button>
                )}

                {activeOrg.status === 'Unverified' && (
                  <button 
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Manually verify and approve ${activeOrg.title}?`)) {
                        handleFinalReview('VERIFIED');
                      }
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M4.5 12.75l6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <span>Manually Verify Organization</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </aside>
      )}

      {/* Document Viewer Modal */}
      {documentModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="flex h-[90vh] w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl bg-white border border-slate-200">
            
            {/* Left side: Document Viewer Canvas */}
            <div className="flex-1 bg-slate-800 flex flex-col overflow-hidden relative">
              <div className="h-14 bg-white px-6 flex justify-between items-center border-b border-slate-200 z-10">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-800 tracking-wider truncate max-w-xs">
                    {activeDocument?.document_name || "DOCUMENT PREVIEW"}
                  </span>
                  <div className="h-4 w-px bg-slate-300"></div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setZoom(z => Math.max(z - 10, 50))}
                      className="p-1 rounded hover:bg-slate-100 text-slate-600 font-bold"
                    >
                      -
                    </button>
                    <span className="text-xs font-mono font-semibold text-slate-700 w-12 text-center">{zoom}%</span>
                    <button 
                      onClick={() => setZoom(z => Math.min(z + 10, 200))}
                      className="p-1 rounded hover:bg-slate-100 text-slate-600 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (activeDocument?.document_url) window.open(resolveDocUrl(activeDocument.document_url), '_blank');
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    title="Open in new window"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </button>
                  <button 
                    onClick={() => setDocumentModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Document Canvas Area */}
              <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-900/60">
                <div 
                  className="transition-transform duration-150 origin-top flex flex-col items-center justify-center max-w-3xl w-full"
                  style={{ transform: `scale(${zoom / 100})` }}
                >
                  {(() => {
                    const docUrl = resolveDocUrl(activeDocument?.document_url);
                    const docName = activeDocument?.document_name || '';
                    const isImg = docUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) || docUrl?.startsWith('data:image/');

                    if (!docUrl) {
                      return (
                        <div className="w-full bg-white rounded-xl shadow-xl p-8 text-center my-auto max-w-md">
                          <h3 className="text-base font-bold text-slate-800 mb-1">{docName || 'Certificate Document'}</h3>
                          <p className="text-xs text-slate-500 mb-4">No uploaded attachment file was found on disk.</p>
                          <div className="bg-slate-50 p-3 rounded-lg text-left text-xs space-y-1.5 border border-slate-200">
                            <div><strong className="text-slate-700">Legal Name:</strong> {activeOrg?.legal_name || activeOrg?.title}</div>
                            <div><strong className="text-slate-700">Incorporation:</strong> {activeOrg?.incorporation_date || 'N/A'}</div>
                          </div>
                        </div>
                      );
                    }

                    if (isImg) {
                      return (
                        <img 
                          src={docUrl} 
                          alt={docName || 'Verification Document'} 
                          className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl bg-white p-2"
                        />
                      );
                    }

                    return (
                      <div className="w-full h-[75vh] bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-700">
                        <iframe
                          src={docUrl}
                          title={docName || 'Verification Document'}
                          className="w-full h-full border-none"
                        />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Right side: Verification Inspector */}
            <div className="w-[360px] bg-white flex flex-col justify-between border-l border-slate-200 shrink-0">
              <div className="p-5 border-b border-slate-100 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Document Inspector</h3>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Document Name</span>
                    <span className="font-bold text-slate-800 break-words">{activeDocument?.document_name}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Type</span>
                      <span className="font-semibold text-slate-700">{activeDocument?.document_type || 'Document'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Uploaded</span>
                      <span className="font-semibold text-slate-700">
                        {activeDocument?.uploaded_at ? new Date(activeDocument.uploaded_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
                    Set Document Status
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                    <button 
                      type="button"
                      onClick={() => setActiveDocumentStatus('PENDING')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${activeDocumentStatus === 'PENDING' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Pending
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveDocumentStatus('APPROVED')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${activeDocumentStatus === 'APPROVED' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Approved
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveDocumentStatus('REJECTED')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${activeDocumentStatus === 'REJECTED' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Rejected
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Internal Auditor Notes
                  </label>
                  <textarea 
                    value={documentNotes}
                    onChange={e => setDocumentNotes(e.target.value)}
                    placeholder="Enter observations on stamps, dates, legibility..."
                    rows="3"
                    className="w-full text-xs rounded-xl border border-slate-200 p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                <button 
                  type="button"
                  onClick={handleDocumentReview}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm cursor-pointer"
                >
                  Save Document Status
                </button>
                <button 
                  type="button"
                  onClick={() => setDocumentModalOpen(false)}
                  className="w-full border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}