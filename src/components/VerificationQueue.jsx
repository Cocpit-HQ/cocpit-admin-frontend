const resolveDocUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  return url.startsWith('/') ? url : '/' + url;
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

export default function VerificationQueue() {
  const { accessToken } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Under Review');
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [activeDocument, setActiveDocument] = useState(null);
  const [activeDocumentStatus, setActiveDocumentStatus] = useState('PENDING');
  const [documentNotes, setDocumentNotes] = useState('');
  const [zoom, setZoom] = useState(100);

  // Final decision form states
  const [rejectionReason, setRejectionReason] = useState('No rejection reason selected');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [activeOrg, setActiveOrg] = useState(null);

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
          let displayStatus = 'Under Review';
          let badgeColor = 'bg-[#4f46e5]';
          const rawStatus = (item.verification_status || item.status || '').toUpperCase();
          if (rawStatus === 'VERIFIED' || rawStatus === 'APPROVED') {
            displayStatus = 'Approved';
            badgeColor = 'bg-emerald-600';
          } else if (rawStatus === 'REJECTED') {
            displayStatus = 'Rejected';
            badgeColor = 'bg-rose-600';
          } else {
            displayStatus = 'Under Review';
            badgeColor = 'bg-[#4f46e5]';
          }
          return {
            ...item,
            title: item.title || item.name || 'Unnamed Organization',
            name: item.name || item.title || 'Unnamed Organization',
            author: item.author || item.owner_name || item.owner_email || 'Unknown',
            date: item.date || (item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'),
            status: displayStatus,
            statusBadgeColor: badgeColor,
            fullLocation: item.fullLocation || item.location_formatted || item.location || 'N/A',
            salary: item.salary || item.size || 'N/A',
            type: item.type || item.industry || 'General',
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
  const filteredOrgs = safeOrgs.filter(org => 
    filter === 'Under Review' ? (org.status === 'Under Review' || org.status === 'Pending') : org.status === filter
  );

  // Update active org when filter changes or when orgs list updates
  useEffect(() => {
    if (filteredOrgs.length > 0) {
      setActiveOrg(filteredOrgs[0]);
    } else {
      setActiveOrg(null);
    }
  }, [filter, orgs]);

  // Sync rejection reason / reviewer notes when activeOrg changes
  useEffect(() => {
    if (activeOrg) {
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
    underReview: safeOrgs.filter(j => j.status === 'Under Review' || j.status === 'Pending').length,
    approved: safeOrgs.filter(j => j.status === 'Approved').length,
    rejected: safeOrgs.filter(j => j.status === 'Rejected').length
  };

  const handleFinalReview = async (status) => {
    if (!activeOrg) return;
    try {
      const res = await fetch(`/api/admin/organisations/verifications/${activeOrg.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          status,
          notes: reviewerNotes,
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
    <div className="flex w-full h-[800px] border border-outline-variant bg-surface mt-4 rounded-xl overflow-hidden shadow-sm">
      {/* Left Sidebar */}
      <div className="w-[300px] sm:w-[400px] border-r border-outline-variant flex flex-col bg-surface-container-lowest shrink-0">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface">
          <span className="font-label-md font-bold text-on-surface uppercase text-sm">Organizations ({filteredOrgs.length})</span>
          <button className="material-symbols-outlined text-on-surface-variant">filter_list</button>
        </div>
        
        <div className="p-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-outline-variant bg-surface items-center whitespace-nowrap">
          <button 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold transition-all shrink-0 ${filter === 'Under Review' ? 'bg-[#5a4fcf] text-white border-transparent shadow-sm' : 'bg-surface border border-outline-variant text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setFilter('Under Review')}
          >
            <span className="material-symbols-outlined text-[18px]">hourglass_empty</span>
            Under Review <span className={`ml-1 flex items-center justify-center min-w-[20px] h-[20px] rounded-full text-[11px] ${filter === 'Under Review' ? 'bg-white/20' : 'bg-slate-100'}`}>{stats.underReview}</span>
          </button>
          
          <button 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold transition-all shrink-0 ${filter === 'Approved' ? 'bg-white border border-slate-300 text-slate-800 shadow-sm' : 'bg-surface border border-outline-variant text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setFilter('Approved')}
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Approved <span className="ml-1 text-[11px] text-slate-600">{stats.approved}</span>
          </button>
          
          <button 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold transition-all shrink-0 ${filter === 'Rejected' ? 'bg-white border border-slate-300 text-slate-800 shadow-sm' : 'bg-surface border border-outline-variant text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setFilter('Rejected')}
          >
            <span className="material-symbols-outlined text-[18px]">cancel</span>
            Rejected <span className="ml-1 text-[11px] text-slate-600">{stats.rejected}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-on-surface-variant text-sm">Loading queue...</div>
          ) : filteredOrgs.length === 0 ? (
            <div className="p-6 text-center text-on-surface-variant text-sm">No organizations found.</div>
          ) : (
            filteredOrgs.map(org => (
              <div 
                key={org.id} 
                onClick={() => setActiveOrg(org)}
                className={`p-4 cursor-pointer border-b border-outline-variant transition-colors ${activeOrg?.id === org.id ? 'bg-[#4f46e5]/5 border-l-4 border-l-[#4f46e5]' : 'hover:bg-surface-container-low border-l-4 border-l-transparent'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-on-surface text-sm">{org.title}</h4>
                  <span className="text-xs text-on-surface-variant">{org.date}</span>
                </div>
                <div className="flex items-center gap-1 text-on-surface-variant text-xs mb-3">
                  <span className="material-symbols-outlined text-[14px]">person</span>
                  {org.author}
                </div>
              <div className="flex flex-wrap gap-2">
  {org.location && org.location !== 'N/A' && (
    <span className="bg-surface-container-low border border-outline-variant px-2 py-0.5 rounded text-[10px] text-on-surface-variant flex items-center gap-1 font-semibold uppercase">
      <span className="material-symbols-outlined text-[12px]">location_on</span>
      {org.location}
    </span>
  )}
  {org.type && org.type !== 'Other' && (
    <span className="bg-surface-container-low border border-outline-variant px-2 py-0.5 rounded text-[10px] text-on-surface-variant flex items-center gap-1 font-semibold uppercase">
      <span className="material-symbols-outlined text-[12px]">domain</span>
      {org.type}
    </span>
  )}
  {/* Document previews for pending/under review */}
  {org.documents && org.documents.length > 0 && (org.status === 'Under Review' || org.status === 'Pending') && (
    <div className="flex flex-wrap gap-1 mt-1">
      {org.documents.slice(0, 2).map(doc => (
        <span key={doc.id} className="bg-indigo-50 text-indigo-700 text-[9px] px-1 py-0.5 rounded">
          {doc.document_name}
        </span>
      ))}
    </div>
  )}
</div>
</div>
            ))
          )}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto bg-surface-container-lowest p-6">
        {activeOrg ? (
        <>
        {/* Banner */}
        <div className={`text-white rounded-2xl p-6 md:p-8 mb-6 relative overflow-hidden shadow-md ${activeOrg.statusBadgeColor || 'bg-[#4f46e5]'}`}>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase backdrop-blur-sm border border-white/10">
              {(activeOrg.status || 'UNDER REVIEW').toUpperCase().replace(' ', '_')}
            </span>
            <div className="flex gap-2 items-center">
              <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors border border-white/10">
                <span className="material-symbols-outlined text-white">share</span>
              </button>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 relative z-10">{activeOrg.title}</h1>
          <div className="flex items-center gap-2 text-white/90 relative z-10">
            <span className="material-symbols-outlined text-lg">person</span>
            <span className="font-medium text-base">Submitted by: {activeOrg.author}</span>
          </div>
        </div>

        {/* Main Content & Decision Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm flex flex-col">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Legal Full Name</span>
                </div>
                <span className="text-sm font-bold text-on-surface leading-tight truncate" title={activeOrg.legal_name || activeOrg.title}>
                  {activeOrg.legal_name || activeOrg.title}
                </span>
              </div>
              <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm flex flex-col">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Inc. Date</span>
                </div>
                <span className="text-sm font-bold text-on-surface leading-tight">
                  {activeOrg.incorporation_date || 'Not specified'}
                </span>
              </div>
              <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm flex flex-col">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">HQ Location</span>
                </div>
                <span className="text-sm font-bold text-on-surface leading-tight">{activeOrg.fullLocation}</span>
              </div>
              <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm flex flex-col">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <span className="material-symbols-outlined text-[18px]">groups</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Company Size</span>
                </div>
                <span className="text-sm font-bold text-on-surface leading-tight">{activeOrg.salary}</span>
              </div>
            </div>

            {/* Verification Documents */}
            <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
              <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600">verified_user</span>
                  <h3 className="font-bold text-on-surface">Verification Documents</h3>
                </div>
                {activeOrg.status === 'Under Review' && (
                  <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                    Pending Review
                  </span>
                )}
              </div>
              <div className="p-6 space-y-4">
                {(!activeOrg.documents || activeOrg.documents.length === 0) ? (
                  <div className="text-center p-6 text-sm text-on-surface-variant">
                    No documents uploaded.
                  </div>
                ) : (
                  activeOrg.documents.map(doc => (
                    <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface border border-outline-variant rounded-xl shadow-sm hover:shadow-md transition-shadow gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-2xl">
                            {doc.document_type === 'TAX_ID' ? 'request_quote' : 'description'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface text-sm mb-1">{doc.document_name}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant font-medium">
                            <span>Uploaded {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'recently'} &bull; PDF</span>
                            <span className={`${doc.status === 'APPROVED' ? 'text-green-600' : doc.status === 'REJECTED' ? 'text-red-600' : 'text-orange-600'} font-bold flex items-center gap-1`}>
                              <span className="material-symbols-outlined text-[14px]">
                                {doc.status === 'APPROVED' ? 'check_circle' : doc.status === 'REJECTED' ? 'cancel' : 'more_horiz'}
                              </span>
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
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors shrink-0"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                        View Document
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Organization Overview */}
            <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="border-b border-outline-variant p-4 flex items-center gap-2 bg-surface-container-lowest">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">info</span>
                <h3 className="text-xs font-bold text-on-surface-variant tracking-wider uppercase">Organization Overview</h3>
              </div>
              <div className="p-6">
                <div className="prose prose-sm max-w-none text-on-surface whitespace-pre-wrap leading-relaxed text-sm">
                  {activeOrg.description || 'No overview provided.'}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Decision Panel */}
          <div className="space-y-6">
            <div className="bg-slate-800 text-white rounded-xl p-6 shadow-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-indigo-400">gavel</span>
                <h3 className="text-lg font-bold text-white">Decision Panel</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Current Verification Status</label>
                  <div className="bg-slate-700 border border-slate-600 rounded-lg p-3 flex justify-between items-center">
                    <span className={`flex items-center gap-2 font-bold text-sm ${activeOrg.status === 'Approved' ? 'text-green-400' : activeOrg.status === 'Rejected' ? 'text-red-400' : 'text-yellow-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${activeOrg.status === 'Approved' ? 'bg-green-400' : activeOrg.status === 'Rejected' ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
                      {activeOrg.status}
                    </span>
                    <span className="material-symbols-outlined text-slate-400 text-[18px]">info</span>
                  </div>
                </div>

                {activeOrg.status === 'Under Review' || activeOrg.status === 'Pending' ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Rejection Reason</label>
                      <select 
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 text-sm text-slate-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none"
                      >
                        <option>No rejection reason selected</option>
                        <option>Legal Name Mismatch</option>
                        <option>Incorporation Date Does Not Match Document</option>
                        <option>Blurry or Unreadable Document</option>
                        <option>Expired or Invalid Certificate</option>
                        <option>Missing Document</option>
                        <option>Invalid License</option>
                        <option>Fraud Suspected</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Internal Reviewer Notes</label>
                      <textarea 
                        value={reviewerNotes}
                        onChange={e => setReviewerNotes(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 text-sm text-slate-200 rounded-lg p-3 h-24 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 resize-none"
                        placeholder="Type private observations here..."
                      ></textarea>
                    </div>

                    <div className="pt-2 space-y-3">
                      <button 
                        type="button"
                        onClick={() => handleFinalReview('VERIFIED')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">verified</span>
                        Approve Organization
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleFinalReview('REJECTED')}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[20px]">block</span>
                        Deny Application
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="text-slate-300 text-sm bg-slate-700/60 p-3 rounded-lg border border-slate-600 flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-400">info</span>
                      <span>This organization is currently <strong>{activeOrg.status}</strong>.</span>
                    </div>

                    {activeOrg.status === 'Approved' && (
                      <div className="pt-2">
                        <p className="text-xs text-amber-300 mb-3">Accidentally approved? You can revoke verification below:</p>
                        <button 
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to revoke verification for ${activeOrg.name}? This will return them to Unverified status.`)) {
                              handleFinalReview('REJECTED');
                            }
                          }}
                          className="w-full bg-rose-600/80 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">cancel</span>
                          Revoke & Reject Verification
                        </button>
                      </div>
                    )}

                    {activeOrg.status === 'Rejected' && (
                      <div className="pt-2">
                        <button 
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Do you want to re-approve ${activeOrg.name}?`)) {
                              handleFinalReview('VERIFIED');
                            }
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                          Re-Approve Organization
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </>
        ) : (
          <div className="flex items-center justify-center h-full text-on-surface-variant">
             Select an organization to view details.
          </div>
        )}
      </div>

      {documentModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`flex h-full p-4 sm:p-8 gap-0 ${activeOrg.status !== 'Approved' ? 'w-full' : 'w-full max-w-4xl'}`}>
            {/* Left side: Document Viewer */}
            <div className={`flex-1 bg-slate-700 ${activeOrg.status !== 'Approved' ? 'rounded-l-2xl border-r' : 'rounded-2xl'} flex flex-col overflow-hidden relative shadow-2xl border-slate-600`}>
              
              {/* Top toolbar */}
              <div className="h-14 bg-white/95 shrink-0 px-6 flex justify-between items-center border-b border-slate-200 z-10 relative">
                <div className="flex items-center gap-6">
                  <span className="text-xs font-bold text-slate-800 tracking-wider truncate max-w-xs">{activeDocument?.document_name || "DOCUMENT PREVIEW"}</span>
                  <div className="h-4 w-px bg-slate-300"></div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setZoom(z => Math.max(z - 10, 50))}
                      className="material-symbols-outlined text-slate-500 hover:text-slate-800 text-[20px]"
                    >
                      zoom_out
                    </button>
                    <span className="text-sm font-medium text-slate-700 w-12 text-center">{zoom}%</span>
                    <button 
                      onClick={() => setZoom(z => Math.min(z + 10, 200))}
                      className="material-symbols-outlined text-slate-500 hover:text-slate-800 text-[20px]"
                    >
                      zoom_in
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => { if (activeDocument?.document_url) { window.open(resolveDocUrl(activeDocument.document_url), '_blank'); } else { window.print(); } }}
                    className="material-symbols-outlined text-slate-500 hover:text-slate-800 text-[20px]"
                    title="Print Document"
                  >
                    print
                  </button>
                  <button 
                    onClick={() => { if (activeDocument?.document_url) { const link = document.createElement('a'); link.href = resolveDocUrl(activeDocument.document_url); link.download = activeDocument.document_name || 'document'; link.target = '_blank'; document.body.appendChild(link); link.click(); document.body.removeChild(link); } else { alert('No document file attached.'); } }}
                    className="material-symbols-outlined text-slate-500 hover:text-slate-800 text-[20px]"
                    title="Download Document"
                  >
                    download
                  </button>
                  <button 
                    onClick={() => { 
                      if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); }
                      else if (document.exitFullscreen) { document.exitFullscreen(); }
                    }}
                    className="material-symbols-outlined text-slate-500 hover:text-slate-800 text-[20px]"
                    title="Toggle Fullscreen"
                  >
                    fullscreen
                  </button>
                  {activeOrg.status === 'Approved' && (
                    <>
                      <div className="w-px h-5 bg-slate-300 mx-2"></div>
                      <button 
                        onClick={() => setDocumentModalOpen(false)}
                        className="material-symbols-outlined text-slate-500 hover:text-error text-[24px] ml-1 transition-colors"
                        title="Close Document"
                      >
                        close
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Document Scroll Area */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-start bg-slate-900/40">
                <div 
                  className="w-full flex-1 flex flex-col items-center justify-center transition-transform duration-200"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                >
                  {(() => {
                    const docUrl = resolveDocUrl(activeDocument?.document_url);
                    const docName = activeDocument?.document_name || '';
                    const isPdf = docUrl?.toLowerCase().includes('.pdf') || 
                                  docUrl?.startsWith('data:application/pdf') || 
                                  docName?.toLowerCase().endsWith('.pdf') ||
                                  activeDocument?.document_type?.toLowerCase().includes('pdf');
                    const isImg = docUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) || 
                                  docUrl?.startsWith('data:image/');

                    if (!docUrl) {
                      return (
                        <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-10 text-center my-auto">
                          <span className="material-symbols-outlined text-slate-400 text-6xl mb-4">description</span>
                          <h3 className="text-xl font-bold text-slate-800 mb-2">{docName || 'No Document File'}</h3>
                          <p className="text-sm text-slate-500 mb-6">No preview URL found for this submission.</p>
                          <div className="bg-slate-50 p-4 rounded-xl text-left text-xs space-y-2 border border-slate-200">
                            <div><strong className="text-slate-700">Legal Full Name:</strong> {activeOrg?.legal_name || activeOrg?.name}</div>
                            <div><strong className="text-slate-700">Incorporation Date:</strong> {activeOrg?.incorporation_date || 'N/A'}</div>
                          </div>
                        </div>
                      );
                    }

                    if (isImg) {
                      return (
                        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-4 flex flex-col items-center">
                          <img 
                            src={docUrl} 
                            alt={docName || 'Verification Document'} 
                            className="max-w-full max-h-[80vh] object-contain rounded-lg"
                          />
                        </div>
                      );
                    }

                    return (
                      <div className="w-full h-[80vh] max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-700">
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

            {/* Right side: Verification Panel */}
            {activeOrg.status !== 'Approved' && (
              <div className="w-[420px] bg-white rounded-r-2xl flex flex-col shadow-2xl relative shrink-0">
                <button 
                  onClick={() => setDocumentModalOpen(false)}
                  className="absolute right-4 top-4 material-symbols-outlined text-slate-400 hover:text-slate-700 bg-white rounded-full transition-colors z-10"
                >
                  close
                </button>

                <div className="p-6 border-b border-slate-100 shrink-0 mt-2">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-indigo-600 bg-indigo-50 rounded-full text-[20px] p-1 font-bold">verified</span>
                    <h2 className="text-lg font-bold text-[#0f2546]">Verification Panel</h2>
                  </div>

                  <div className="bg-[#f0f4f8] rounded-xl p-4 border border-indigo-100 mb-4 border-l-4 border-l-indigo-600">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">FILE NAME</p>
                    <p className="text-sm font-bold text-[#0f2546] truncate">{activeDocument?.document_name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm flex flex-col">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Legal Full Name</span>
                </div>
                <span className="text-sm font-bold text-on-surface leading-tight truncate" title={activeOrg.legal_name || activeOrg.title}>
                  {activeOrg.legal_name || activeOrg.title}
                </span>
              </div>
              <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm flex flex-col">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">Inc. Date</span>
                </div>
                <span className="text-sm font-bold text-on-surface leading-tight">
                  {activeOrg.incorporation_date || 'Not specified'}
                </span>
              </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">TYPE</p>
                      <p className="text-sm font-bold text-[#0f2546]">{activeDocument?.document_type}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">UPLOADED</p>
                      <p className="text-sm font-bold text-[#0f2546]">
                        {activeDocument?.uploaded_at ? new Date(activeDocument.uploaded_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">DOCUMENT LINK</p>
                    <a 
                      href={resolveDocUrl(activeDocument?.document_url)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-sm font-bold text-indigo-600 hover:underline block truncate"
                    >
                      Open/Download File
                    </a>
                  </div>
                </div>

                <div className="p-6 border-b border-slate-100 flex-1 overflow-y-auto">
                  <div className="mb-8">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">DOCUMENT STATUS</p>
                    <div className="flex bg-slate-50 p-1 rounded-xl">
                      <button 
                        onClick={() => setActiveDocumentStatus('PENDING')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeDocumentStatus === 'PENDING' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Pending
                      </button>
                      <button 
                        onClick={() => setActiveDocumentStatus('APPROVED')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeDocumentStatus === 'APPROVED' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Approved
                      </button>
                      <button 
                        onClick={() => setActiveDocumentStatus('REJECTED')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeDocumentStatus === 'REJECTED' ? 'bg-white text-error shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        Rejected
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">INTERNAL ADMIN NOTES</p>
                    <textarea 
                      placeholder="Add private notes for other auditors..."
                      value={documentNotes}
                      onChange={e => setDocumentNotes(e.target.value)}
                      className="w-full h-32 resize-none border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400"
                    ></textarea>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-br-2xl shrink-0">
                  <button 
                    onClick={handleDocumentReview}
                    className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white py-3.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 mb-4"
                  >
                    Submit Decision
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                  <p className="text-center text-[11px] text-slate-500 italic">Action will be logged in the Audit History</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
