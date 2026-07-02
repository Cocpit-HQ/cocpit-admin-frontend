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
      if (!data.error) {
        setOrgs(data);
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

  const filteredOrgs = orgs.filter(org => 
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
    underReview: orgs.filter(j => j.status === 'Under Review' || j.status === 'Pending').length,
    approved: orgs.filter(j => j.status === 'Approved').length,
    rejected: orgs.filter(j => j.status === 'Rejected').length
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
      const data = await res.json();
      if (!data.error) {
        alert(`Organization verification ${status === 'VERIFIED' ? 'approved' : 'rejected'} successfully.`);
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
      if (!data.error) {
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
              {activeOrg.status.toUpperCase().replace(' ', '_')}
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
            <div className="grid grid-cols-2 gap-4">
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
                        onClick={() => handleFinalReview('VERIFIED')}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">verified</span>
                        Approve Organization
                      </button>
                      <button 
                        onClick={() => handleFinalReview('REJECTED')}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-600"
                      >
                        <span className="material-symbols-outlined text-[20px]">block</span>
                        Deny Application
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 text-sm">
                    This organization has already been {activeOrg.status.toLowerCase()}.
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
                  <span className="text-xs font-bold text-slate-800 tracking-wider">PAGE 1 OF 3</span>
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
                    onClick={() => window.print()}
                    className="material-symbols-outlined text-slate-500 hover:text-slate-800 text-[20px]"
                    title="Print Document"
                  >
                    print
                  </button>
                  <button 
                    onClick={() => alert('Download functionality will be available in production.')}
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
              <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 items-center">
                <div 
                  className="flex flex-col gap-8 items-center w-full transition-transform duration-200"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                >
                {/* Page 1 */}
                <div className="w-full max-w-3xl bg-white min-h-[900px] rounded shadow-xl flex flex-col relative shrink-0">
                  <div className="pt-24 pb-16 px-16 flex-1 flex flex-col">
                    <div className="flex justify-center mb-12">
                      <div className="w-20 h-20 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-[40px]">account_balance</span>
                      </div>
                    </div>
                    
                    <div className="text-center mb-16 space-y-4">
                      <h1 className="text-4xl font-bold tracking-[0.2em] text-[#0f2546]">CERTIFICATE OF</h1>
                      <h1 className="text-4xl font-bold tracking-[0.2em] text-[#0f2546]">INCORPORATION</h1>
                      <p className="text-xl text-slate-500 italic mt-4 font-serif">Of a Private Limited Company</p>
                    </div>

                    <div className="h-px bg-slate-200 w-full mb-12"></div>

                    <div className="text-center space-y-8 flex-1">
                      <p className="text-lg text-slate-600">The Registrar of Companies for England and Wales, hereby<br/>certifies that</p>
                      <h2 className="text-2xl font-bold text-[#0f2546]">TECHNOVA GLOBAL LTD</h2>
                      <p className="text-lg text-slate-600 leading-relaxed">
                        is this day incorporated under the Companies Act 2006 as a<br/>
                        private company, that the company is limited by shares, and<br/>
                        the situation of its registered office is in England and Wales
                      </p>
                    </div>

                    <div className="flex justify-between items-end mt-24">
                      <div>
                        <p className="text-xs font-bold text-slate-400 tracking-wider mb-2">COMPANY NUMBER</p>
                        <p className="text-lg font-bold">12948576</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 tracking-wider mb-2">DATE</p>
                        <p className="text-lg font-mono font-bold tracking-tight">24th October 2023</p>
                      </div>
                    </div>

                    <div className="mt-12 flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-slate-400 tracking-wider mb-2">GIVEN AT COMPANIES HOUSE</p>
                        <p className="text-base font-bold">CARDIFF</p>
                      </div>
                      <div className="w-24 h-24 bg-slate-50 border border-slate-100 opacity-50"></div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-slate-100" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}></div>
                </div>

                {/* Page 2 */}
                <div className="w-full max-w-3xl bg-white min-h-[900px] rounded shadow-xl flex flex-col relative shrink-0 p-16">
                  <div className="border-b-2 border-[#0f2546] pb-6 mb-10 flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#0f2546] tracking-wide">ARTICLES OF ASSOCIATION</h2>
                      <p className="text-sm text-slate-500 mt-2">Private Company Limited by Shares</p>
                    </div>
                    <div className="text-right">
                      <div className="w-16 h-16 border-2 border-indigo-100 rounded-full flex items-center justify-center text-indigo-200 mb-2 ml-auto">
                        <span className="material-symbols-outlined text-3xl">gavel</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400">PART 1: INTERPRETATION</p>
                    </div>
                  </div>

                  <div className="space-y-8 flex-1">
                    <section>
                      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-xs">1</span>
                        Defined Terms
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed pl-8">
                        In the articles, unless the context requires otherwise: "articles" means the company's articles of association; "bankruptcy" includes individual insolvency proceedings in a jurisdiction other than England and Wales or Northern Ireland which have an effect similar to that of bankruptcy.
                      </p>
                    </section>
                    
                    <section>
                      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-xs">2</span>
                        Liability of members
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed pl-8">
                        The liability of the members is limited to the amount, if any, unpaid on the shares held by them.
                      </p>
                    </section>
                    
                    <section>
                      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-xs">3</span>
                        Directors' general authority
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed pl-8">
                        Subject to the articles, the directors are responsible for the management of the company's business, for which purpose they may exercise all the powers of the company.
                      </p>
                    </section>
                    
                    <div className="h-px bg-slate-100 my-8"></div>
                    
                    <div className="grid grid-cols-2 gap-8 mt-12">
                      <div className="border border-slate-200 rounded p-6 bg-slate-50">
                        <p className="text-xs font-bold text-slate-500 mb-6">SIGNATURE OF DIRECTOR 1</p>
                        <div className="border-b border-slate-400 border-dashed pb-2 mb-2">
                          <span className="font-mono italic text-2xl text-indigo-900 opacity-80">J. Smith</span>
                        </div>
                        <p className="text-xs text-slate-600">Johnathan Smith</p>
                      </div>
                      <div className="border border-slate-200 rounded p-6 bg-slate-50">
                        <p className="text-xs font-bold text-slate-500 mb-6">SIGNATURE OF DIRECTOR 2</p>
                        <div className="border-b border-slate-400 border-dashed pb-2 mb-2">
                          <span className="font-mono italic text-2xl text-indigo-900 opacity-80">A. Davies</span>
                        </div>
                        <p className="text-xs text-slate-600">Alice Davies</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-12 flex justify-between items-center text-xs text-slate-400 font-bold border-t border-slate-100 pt-6">
                    <span>TECHNOVA GLOBAL LTD - 12948576</span>
                    <span>PAGE 2 OF 3</span>
                  </div>
                </div>

                {/* Page 3 */}
                <div className="w-full max-w-3xl bg-white min-h-[900px] rounded shadow-xl flex flex-col relative shrink-0 p-16">
                  <div className="flex justify-between items-start mb-12">
                    <div className="w-24 h-24 border-4 border-red-600/20 rounded-full flex items-center justify-center relative">
                      <div className="absolute inset-2 border border-red-600/40 rounded-full flex items-center justify-center">
                        <span className="text-red-600/60 font-bold text-[10px] text-center uppercase tracking-widest leading-tight -rotate-12">Official<br/>Seal</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 mb-1">APPENDIX A</p>
                      <h2 className="text-xl font-bold text-slate-800">Statement of Capital</h2>
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-sm text-slate-600 mb-6">
                      The total number of shares and total aggregate nominal value of issued share capital at the date of incorporation is detailed below:
                    </p>
                    
                    <div className="border border-slate-200 rounded-lg overflow-hidden mb-12">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                          <tr>
                            <th className="px-6 py-4 border-b border-slate-200">Currency</th>
                            <th className="px-6 py-4 border-b border-slate-200">Class of Shares</th>
                            <th className="px-6 py-4 border-b border-slate-200 text-right">Number of Shares</th>
                            <th className="px-6 py-4 border-b border-slate-200 text-right">Aggregate Nominal Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-6 py-4 border-b border-slate-100 font-medium">GBP</td>
                            <td className="px-6 py-4 border-b border-slate-100">ORDINARY</td>
                            <td className="px-6 py-4 border-b border-slate-100 text-right">100</td>
                            <td className="px-6 py-4 border-b border-slate-100 text-right">£100.00</td>
                          </tr>
                          <tr className="bg-slate-50/50 font-bold">
                            <td className="px-6 py-4" colSpan={2}>TOTAL</td>
                            <td className="px-6 py-4 text-right">100</td>
                            <td className="px-6 py-4 text-right">£100.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-amber-600">info</span>
                        <div>
                          <h4 className="text-sm font-bold text-amber-900">Prescribed particulars of rights attached to shares</h4>
                          <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                            Each share has full rights in the company with respect to voting, dividends and distributions.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-16 flex justify-end">
                      <div className="w-48">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Electronic Signature</p>
                        <div className="bg-slate-50 border border-slate-200 rounded px-4 py-3 font-mono text-xs text-slate-500 break-all">
                          3f8c2b9a1d4e7f0g5h8j2k1m4n7p0q3r
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-12 flex justify-between items-center text-xs text-slate-400 font-bold border-t border-slate-100 pt-6">
                    <span>TECHNOVA GLOBAL LTD - 12948576</span>
                    <span>PAGE 3 OF 3</span>
                  </div>
                </div>
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

                  <div className="grid grid-cols-2 gap-4">
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
                      href={activeDocument?.document_url} 
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
