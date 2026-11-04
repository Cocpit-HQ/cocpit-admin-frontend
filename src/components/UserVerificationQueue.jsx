import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function UserVerificationQueue({ targetUserIdProp, targetStatusProp }) {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetUserId = targetUserIdProp || searchParams.get('userId');
  const targetStatus = targetStatusProp || searchParams.get('status');
  const initialFilter = targetStatus === 'Verified' || targetStatus === 'Approved' ? 'Approved' : (targetStatus === 'Rejected' ? 'Rejected' : 'Under Review');

  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [activeUser, setActiveUser] = useState(null);

  // Review & Rejection State
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Blurry or unreadable document');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Image Viewer
  const [modalImage, setModalImage] = useState(null);
  const [modalTitle, setModalTitle] = useState('');
  const [zoom, setZoom] = useState(100);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users/verifications/queue', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setVerifications(data);
      }
    } catch (err) {
      console.error('Failed to fetch user verification queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchQueue();
    }
  }, [accessToken]);

  const filteredList = verifications
    .filter(item => {
      if (filter === 'Under Review') {
        return item.status === 'Under Review' || item.status === 'PENDING';
      }
      return item.status === filter;
    })
    .sort((a, b) => {
      if (targetUserId) {
        const isAMatch = String(a.user_id || '').toLowerCase() === String(targetUserId).toLowerCase() || String(a.id || '').toLowerCase() === String(targetUserId).toLowerCase();
        const isBMatch = String(b.user_id || '').toLowerCase() === String(targetUserId).toLowerCase() || String(b.id || '').toLowerCase() === String(targetUserId).toLowerCase();
        if (isAMatch) return -1;
        if (isBMatch) return 1;
      }
      return 0;
    });

  useEffect(() => {
    if (targetUserId && verifications.length > 0) {
      const match = verifications.find(v => 
        String(v.user_id || '').toLowerCase() === String(targetUserId).toLowerCase() ||
        String(v.id || '').toLowerCase() === String(targetUserId).toLowerCase()
      );
      if (match) {
        if (filter !== match.status) {
          setFilter(match.status);
        }
        setActiveUser(match);
        return;
      } else if (accessToken) {
        // Target user not in verifications list yet; fetch directly from user details
        fetch(`/api/admin/users/${targetUserId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
          .then(r => r.json())
          .then(u => {
            if (u && (u.id || u.user_id)) {
              const userStatus = u.verification?.status || (u.isIdentityVerified ? 'Approved' : 'Under Review');
              const stub = {
                id: u.id || u.user_id,
                user_id: u.id || u.user_id,
                name: u.name || u.full_name || 'User',
                email: u.email || '',
                avatar_url: u.avatar || u.avatar_url || '',
                document_type: u.verification?.documentType || 'NATIONAL_ID',
                status: userStatus,
                statusBadgeColor: userStatus === 'Approved' ? 'bg-emerald-600' : userStatus === 'Rejected' ? 'bg-rose-600' : 'bg-amber-500',
                is_verified: Boolean(u.isIdentityVerified || u.verification?.isVerified),
                front_image_url: null,
                back_image_url: null,
                created_at: u.verification?.submittedAt || u.joined || new Date().toISOString()
              };
              setVerifications(prev => [stub, ...prev.filter(x => String(x.user_id).toLowerCase() !== String(stub.user_id).toLowerCase())]);
              setFilter(userStatus);
              setActiveUser(stub);
            }
          })
          .catch(err => console.error('Error fetching specific user for queue:', err));
        return;
      }
    }
    if (filteredList.length > 0) {
      setActiveUser(filteredList[0]);
    } else {
      setActiveUser(null);
    }
  }, [filter, verifications, targetUserId]);

  const stats = {
    underReview: verifications.filter(v => v.status === 'Under Review' || v.status === 'PENDING').length,
    approved: verifications.filter(v => v.status === 'Approved' || v.status === 'VERIFIED').length,
    rejected: verifications.filter(v => v.status === 'Rejected' || v.status === 'REJECTED').length
  };

  const handleReview = async (status) => {
    if (!activeUser || isSubmitting) return;

    if (status === 'REJECTED' && (activeUser.status === 'Approved' || activeUser.is_verified)) {
      const confirmed = window.confirm(
        `Warning: User "${activeUser.name}" is currently APPROVED.\n\nRejecting this verification will REVOKE their verified badge, block them from posting new jobs, pause their active jobs, and enable them to verify again.\n\nDo you wish to proceed?`
      );
      if (!confirmed) return;
    }

    if (status === 'VERIFIED' && activeUser.status === 'Rejected') {
      const confirmed = window.confirm(
        `User "${activeUser.name}" was previously REJECTED.\n\nDo you want to re-approve their verification and restore their verified status?`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/verifications/${activeUser.id}/review`, {
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
      if (!res.ok) {
        alert(data.error || 'Failed to submit review');
        return;
      }

      alert(`User identity verification has been ${status === 'VERIFIED' ? 'APPROVED' : 'REJECTED'}.`);
      setReviewerNotes('');
      fetchQueue();
    } catch (err) {
      console.error(err);
      alert('Error updating user verification status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openImageViewer = (imageUrl, title) => {
    setModalImage(imageUrl);
    setModalTitle(title);
    setZoom(100);
  };

  const formatDocType = (type) => {
    if (!type) return 'Identity Proof';
    switch (type) {
      case 'DRIVING_LICENSE': return 'Driving License';
      case 'PASSPORT': return 'Passport';
      case 'NATIONAL_ID': return 'National ID';
      case 'PAN_CARD': return 'PAN Card';
      default: return type.replace(/_/g, ' ');
    }
  };

  return (
    <div className="flex w-full h-[800px] border border-outline-variant bg-surface mt-4 rounded-xl overflow-hidden shadow-sm">
      {/* Left Sidebar */}
      <div className="w-[300px] sm:w-[380px] border-r border-outline-variant flex flex-col bg-surface-container-lowest shrink-0">
        <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface">
          <span className="font-label-md font-bold text-on-surface uppercase text-sm">
            Users ({filteredList.length})
          </span>
        </div>

        {/* Filter Pills */}
        <div className="p-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-outline-variant bg-surface items-center whitespace-nowrap">
          <button 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold transition-all shrink-0 ${filter === 'Under Review' ? 'bg-[#5a4fcf] text-white shadow-sm' : 'bg-surface border border-outline-variant text-slate-500 hover:bg-slate-50'}`}
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

        {/* List of Users */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center text-on-surface-variant text-sm">Loading queue...</div>
          ) : filteredList.length === 0 ? (
            <div className="p-6 text-center text-on-surface-variant text-sm">No verification requests found.</div>
          ) : (
            filteredList.map(user => (
              <div 
                key={user.id} 
                onClick={() => setActiveUser(user)}
                className={`p-4 cursor-pointer border-b border-outline-variant transition-colors ${activeUser?.id === user.id ? 'bg-[#4f46e5]/5 border-l-4 border-l-[#4f46e5]' : 'hover:bg-surface-container-low border-l-4 border-l-transparent'}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border border-outline-variant shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {user.name ? user.name[0]?.toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-on-surface text-sm truncate">{user.name}</h4>
                    <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs mt-2">
                  <span className="bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                    {formatDocType(user.document_type)}
                  </span>
                  <span className="text-on-surface-variant text-[11px]">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 overflow-y-auto bg-surface-container-lowest p-6">
        {activeUser ? (
          <div>
            {/* Header Banner */}
            <div className={`text-white rounded-2xl p-6 mb-6 shadow-md ${activeUser.statusBadgeColor || 'bg-[#4f46e5]'}`}>
              <div className="flex justify-between items-start mb-3">
                <span className="bg-white/20 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase backdrop-blur-sm border border-white/10">
                  {activeUser.status.toUpperCase()}
                </span>
                <span className="text-white/80 text-xs">
                  Submitted: {new Date(activeUser.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div 
                  onClick={() => navigate(`/profile/${activeUser.user_id}`)}
                  className="cursor-pointer group relative"
                  title="Click to view user profile"
                >
                  {activeUser.avatar_url ? (
                    <img src={activeUser.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white/40 shadow-sm group-hover:border-white transition-all" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 group-hover:border-white text-white flex items-center justify-center font-bold text-2xl transition-all">
                      {activeUser.name ? activeUser.name[0]?.toUpperCase() : 'U'}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h1 
                      onClick={() => navigate(`/profile/${activeUser.user_id}`)}
                      className="text-2xl font-bold hover:underline cursor-pointer flex items-center gap-2 group transition-all"
                      title="Click to open user profile"
                    >
                      <span>{activeUser.name}</span>
                      <span className="material-symbols-outlined text-[20px] opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">open_in_new</span>
                    </h1>

                    <button
                      type="button"
                      onClick={() => navigate(`/profile/${activeUser.user_id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-full text-xs font-semibold backdrop-blur-sm transition-all cursor-pointer shadow-sm border border-white/20"
                      title="View user details in User Profile"
                    >
                      <span className="material-symbols-outlined text-[15px]">person</span>
                      View User Profile
                    </button>
                  </div>
                  <p className="text-white/90 text-sm mt-0.5">{activeUser.email}</p>
                  <p 
                    onClick={() => navigate(`/profile/${activeUser.user_id}`)}
                    className="text-white/80 text-xs mt-1 hover:underline cursor-pointer font-mono inline-block"
                  >
                    User ID: {activeUser.user_id}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Details Section */}
            <div className="bg-surface border border-outline-variant rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600">badge</span>
                  Submitted Identity Document ({formatDocType(activeUser.document_type)})
                </h3>
              </div>

              {/* Front and Back Images Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Front Image */}
                <div className="border border-outline-variant rounded-xl p-4 bg-surface-container-low flex flex-col items-center">
                  <div className="w-full flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                      Front Side
                    </span>
                    {activeUser.front_image_url && (
                      <button 
                        onClick={() => openImageViewer(activeUser.front_image_url, `${activeUser.name} - Front Document`)}
                        className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">zoom_in</span> Zoom
                      </button>
                    )}
                  </div>
                  {activeUser.front_image_url ? (
                    <div 
                      onClick={() => openImageViewer(activeUser.front_image_url, `${activeUser.name} - Front Document`)}
                      className="w-full h-56 bg-black/5 rounded-lg overflow-hidden border border-outline-variant flex items-center justify-center cursor-pointer group hover:opacity-95 transition-opacity"
                    >
                      <img 
                        src={activeUser.front_image_url} 
                        alt="Front Image" 
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-56 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-4xl mb-1">image_not_supported</span>
                      <span className="text-xs">No front image uploaded</span>
                    </div>
                  )}
                </div>

                {/* Back Image */}
                <div className="border border-outline-variant rounded-xl p-4 bg-surface-container-low flex flex-col items-center">
                  <div className="w-full flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                      Back Side
                    </span>
                    {activeUser.back_image_url && (
                      <button 
                        onClick={() => openImageViewer(activeUser.back_image_url, `${activeUser.name} - Back Document`)}
                        className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">zoom_in</span> Zoom
                      </button>
                    )}
                  </div>
                  {activeUser.back_image_url ? (
                    <div 
                      onClick={() => openImageViewer(activeUser.back_image_url, `${activeUser.name} - Back Document`)}
                      className="w-full h-56 bg-black/5 rounded-lg overflow-hidden border border-outline-variant flex items-center justify-center cursor-pointer group hover:opacity-95 transition-opacity"
                    >
                      <img 
                        src={activeUser.back_image_url} 
                        alt="Back Image" 
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-56 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-4xl mb-1">image_not_supported</span>
                      <span className="text-xs">No back image uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Decision Panel */}
            <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-base text-on-surface mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">rate_review</span>
                Verification Decision
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                    Rejection Reason (if rejecting)
                  </label>
                  <select 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full p-2.5 text-sm border border-outline-variant rounded-lg bg-surface text-on-surface outline-none focus:border-indigo-600"
                  >
                    <option value="Blurry or unreadable document">Blurry or unreadable document</option>
                    <option value="Document expired">Document expired</option>
                    <option value="Name mismatch with profile">Name mismatch with profile</option>
                    <option value="Invalid document type">Invalid document type</option>
                    <option value="Suspected alteration/tampering">Suspected alteration/tampering</option>
                    <option value="Missing details or incomplete photo">Missing details or incomplete photo</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                    Internal Reviewer Notes
                  </label>
                  <textarea 
                    value={reviewerNotes}
                    onChange={(e) => setReviewerNotes(e.target.value)}
                    placeholder="Enter any additional feedback or review notes..."
                    rows={3}
                    className="w-full p-2.5 text-sm border border-outline-variant rounded-lg bg-surface text-on-surface outline-none focus:border-indigo-600 resize-none"
                  />
                </div>
              </div>

              {/* Accidental Approval / Current Status Notice */}
              {activeUser.status === 'Approved' && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-amber-600 text-lg mt-0.5">warning</span>
                  <div className="text-xs text-amber-800">
                    <span className="font-bold">Accidental Approval Correction:</span> This user is currently approved. If this was approved by mistake, click <strong>"Revoke & Reject Verification"</strong> below. It will revoke their badge, pause their active jobs, and enable them to verify again.
                  </div>
                </div>
              )}

              {activeUser.status === 'Rejected' && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-rose-600 text-lg mt-0.5">info</span>
                  <div className="text-xs text-rose-800">
                    <span className="font-bold">Currently Rejected:</span> {activeUser.rejection_reason ? `Reason: ${activeUser.rejection_reason}.` : 'This verification was previously rejected.'} If this was a mistake, click <strong>"Approve Verification"</strong> to restore them.
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReview('REJECTED')}
                  className="px-5 py-2.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">cancel</span>
                  {activeUser.status === 'Approved' ? 'Revoke & Reject Verification' : 'Reject Verification'}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReview('VERIFIED')}
                  className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-lg">verified</span>
                  {activeUser.status === 'Rejected' ? 'Re-Approve Verification' : 'Verify User'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-2 text-slate-300">person_search</span>
            <p className="text-sm">Select a user verification request from the sidebar to inspect.</p>
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {modalImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-surface rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface">
              <h4 className="font-bold text-sm text-on-surface">{modalTitle}</h4>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setZoom(prev => Math.max(50, prev - 25))} 
                  className="p-1 rounded hover:bg-surface-container text-on-surface-variant cursor-pointer"
                  title="Zoom Out"
                >
                  <span className="material-symbols-outlined text-lg">zoom_out</span>
                </button>
                <span className="text-xs text-on-surface-variant min-w-[40px] text-center">{zoom}%</span>
                <button 
                  onClick={() => setZoom(prev => Math.min(300, prev + 25))} 
                  className="p-1 rounded hover:bg-surface-container text-on-surface-variant cursor-pointer"
                  title="Zoom In"
                >
                  <span className="material-symbols-outlined text-lg">zoom_in</span>
                </button>
                <button 
                  onClick={() => setModalImage(null)} 
                  className="p-1 rounded-full hover:bg-surface-container text-on-surface ml-3 cursor-pointer"
                  title="Close"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/5 min-h-[400px]">
              <img 
                src={modalImage} 
                alt="Enlarged document" 
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
                className="max-h-[70vh] object-contain transition-transform duration-150"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

