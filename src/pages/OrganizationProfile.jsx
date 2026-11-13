import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import OrganizationVerificationModal from '../components/OrganizationVerificationModal';

export default function OrganizationProfile() {
  const { role, accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const from = location.state?.from || '/organizations';
  const backLabel = location.state?.label || 'Organizations';

  // Active Main Tab
  const [activeTab, setActiveTab] = useState('overview');

  // Core Organization Profile State (Module 1 & Header)
  const [org, setOrg] = useState(null);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [orgError, setOrgError] = useState(null);

  // Modals
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [warnModalOpen, setWarnModalOpen] = useState(false);
  const [editIdentityModalOpen, setEditIdentityModalOpen] = useState(false);

  // Actions form state
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [warnReason, setWarnReason] = useState('');
  const [warnMessage, setWarnMessage] = useState('');
  const [isSevereWarn, setIsSevereWarn] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');

  // Edit Identity Form
  const [identityForm, setIdentityForm] = useState({
    name: '',
    legal_name: '',
    incorporation_date: '',
    industry: '',
    size: '',
    website: '',
    email: '',
    phone: '',
    location: '',
    description: '',
    slogan: ''
  });

  // Module 2: Jobs State
  const [jobsData, setJobsData] = useState({ jobs: [], stats: {}, total: 0, page: 1, totalPages: 1 });
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobStatusFilter, setJobStatusFilter] = useState('ALL');
  const [jobSearch, setJobSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [jobModerationReason, setJobModerationReason] = useState('');

  // Module 3: Members State
  const [membersData, setMembersData] = useState({ members: [], invitations: [], stats: {}, total: 0, page: 1, totalPages: 1 });
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberRoleFilter, setMemberRoleFilter] = useState('ALL');
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [removeMemberConfirm, setRemoveMemberConfirm] = useState(null);
  const [removeReason, setRemoveReason] = useState('');

  // Module 4: Posts State
  const [postsData, setPostsData] = useState({ posts: [], stats: {}, total: 0, page: 1, totalPages: 1 });
  const [postsLoading, setPostsLoading] = useState(false);
  const [postSearch, setPostSearch] = useState('');
  const [selectedPostComments, setSelectedPostComments] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsList, setCommentsList] = useState([]);
  const [postModAction, setPostModAction] = useState(null);
  const [postModReason, setPostModReason] = useState('');

  // Module 5: Risk & Fraud State
  const [riskData, setRiskData] = useState({ riskLevel: 'NORMAL', indicators: [], reports: [], investigationNotes: [] });
  const [riskLoading, setRiskLoading] = useState(false);
  const [newInvestigationNote, setNewInvestigationNote] = useState('');
  const [investigationDecision, setInvestigationDecision] = useState('Review ongoing');
  const [investigationRiskStatus, setInvestigationRiskStatus] = useState('Needs Review');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Module 6: History & Timeline State
  const [timelineData, setTimelineData] = useState({ events: [], total: 0, page: 1, totalPages: 1 });
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineCategory, setTimelineCategory] = useState('ALL');
  const [timelineSearch, setTimelineSearch] = useState('');
  const [timelinePage, setTimelinePage] = useState(1);

  // Module 7: Security State
  const [securityData, setSecurityData] = useState({ sessions: [], memberSecurity: [], incidents: [] });
  const [securityLoading, setSecurityLoading] = useState(false);
  const [revokeSessionConfirm, setRevokeSessionConfirm] = useState(null);
  const [revokeAllConfirm, setRevokeAllConfirm] = useState(false);

  // Toast Helper
  const showToast = (successMsg, errorMsg = '') => {
    if (successMsg) {
      setActionSuccess(successMsg);
      setTimeout(() => setActionSuccess(''), 4000);
    }
    if (errorMsg) {
      setActionError(errorMsg);
      setTimeout(() => setActionError(''), 5000);
    }
  };

  // 1. Fetch Core Org Profile
  const fetchOrgDetails = useCallback(() => {
    if (!id || !accessToken) return;
    setLoadingOrg(true);
    fetch(`/api/admin/organisations/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load organization profile');
        return res.json();
      })
      .then(data => {
        setOrg(data);
        setIdentityForm({
          name: data.name || '',
          legal_name: data.legal_name || '',
          incorporation_date: data.incorporation_date ? data.incorporation_date.split('T')[0] : '',
          industry: data.industry || '',
          size: data.size || '',
          website: data.website || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.location || '',
          description: data.description || '',
          slogan: data.slogan || ''
        });
        setLoadingOrg(false);
      })
      .catch(err => {
        setOrgError(err.message);
        setLoadingOrg(false);
      });
  }, [id, accessToken]);

  useEffect(() => {
    fetchOrgDetails();
  }, [fetchOrgDetails]);

  // 2. Fetch Module 2: Jobs
  const fetchJobs = useCallback((page = 1) => {
    if (!id || !accessToken) return;
    setJobsLoading(true);
    const params = new URLSearchParams({
      page,
      limit: 8,
      status: jobStatusFilter,
      search: jobSearch
    });
    fetch(`/api/admin/organisations/${id}/jobs?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setJobsData(data);
        setJobsLoading(false);
      })
      .catch(() => setJobsLoading(false));
  }, [id, accessToken, jobStatusFilter, jobSearch]);

  // 3. Fetch Module 3: Members
  const fetchMembers = useCallback((page = 1) => {
    if (!id || !accessToken) return;
    setMembersLoading(true);
    const params = new URLSearchParams({
      page,
      limit: 8,
      role: memberRoleFilter,
      search: memberSearch
    });
    fetch(`/api/admin/organisations/${id}/members?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setMembersData(data);
        setMembersLoading(false);
      })
      .catch(() => setMembersLoading(false));
  }, [id, accessToken, memberRoleFilter, memberSearch]);

  // 4. Fetch Module 4: Posts
  const fetchPosts = useCallback((page = 1) => {
    if (!id || !accessToken) return;
    setPostsLoading(true);
    const params = new URLSearchParams({
      page,
      limit: 6,
      search: postSearch
    });
    fetch(`/api/admin/organisations/${id}/posts?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setPostsData(data);
        setPostsLoading(false);
      })
      .catch(() => setPostsLoading(false));
  }, [id, accessToken, postSearch]);

  // 5. Fetch Module 5: Risk
  const fetchRisk = useCallback(() => {
    if (!id || !accessToken) return;
    setRiskLoading(true);
    fetch(`/api/admin/organisations/${id}/risk`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setRiskData(data);
        setRiskLoading(false);
      })
      .catch(() => setRiskLoading(false));
  }, [id, accessToken]);

  // 6. Fetch Module 6: Timeline
  const fetchTimeline = useCallback((page = 1) => {
    if (!id || !accessToken) return;
    setTimelineLoading(true);
    const params = new URLSearchParams({
      page,
      limit: 12,
      category: timelineCategory,
      search: timelineSearch
    });
    fetch(`/api/admin/organisations/${id}/timeline?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setTimelineData(data);
        setTimelinePage(page);
        setTimelineLoading(false);
      })
      .catch(() => setTimelineLoading(false));
  }, [id, accessToken, timelineCategory, timelineSearch]);

  // 7. Fetch Module 7: Security
  const fetchSecurity = useCallback(() => {
    if (!id || !accessToken) return;
    setSecurityLoading(true);
    fetch(`/api/admin/organisations/${id}/security`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => res.json())
      .then(data => {
        setSecurityData(data);
        setSecurityLoading(false);
      })
      .catch(() => setSecurityLoading(false));
  }, [id, accessToken]);

  // Tab change trigger
  useEffect(() => {
    if (activeTab === 'jobs') fetchJobs(1);
    if (activeTab === 'members') fetchMembers(1);
    if (activeTab === 'posts') fetchPosts(1);
    if (activeTab === 'risk') fetchRisk();
    if (activeTab === 'timeline') fetchTimeline(1);
    if (activeTab === 'security') fetchSecurity();
  }, [activeTab, fetchJobs, fetchMembers, fetchPosts, fetchRisk, fetchTimeline, fetchSecurity]);

  // Handlers for Module 1 Actions
  const handleUpdateIdentity = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/organisations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(identityForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update organization details');
      showToast('Organization details updated successfully.');
      setEditIdentityModalOpen(false);
      fetchOrgDetails();
    } catch (err) {
      showToast('', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerificationDecision = async (status) => {
    if (status === 'REJECTED' && !rejectReason.trim()) {
      showToast('', 'Rejection reason is mandatory.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/organisations/verifications/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          status,
          notes: reviewerNotes,
          rejectionReason: status === 'REJECTED' ? rejectReason : null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete review');
      showToast(`Organization verification ${status.toLowerCase()} successfully.`);
      fetchOrgDetails();
    } catch (err) {
      showToast('', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWarn = async (e) => {
    e.preventDefault();
    if (!warnReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/organisations/${id}/warn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          reason: warnReason,
          message: warnMessage,
          isSevere: isSevereWarn
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue warning');
      showToast(data.autoSuspended ? 'Warning sent. Org automatically suspended due to strike limit.' : 'Warning issued successfully.');
      setWarnModalOpen(false);
      setWarnReason('');
      setWarnMessage('');
      fetchOrgDetails();
    } catch (err) {
      showToast('', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendToggle = async () => {
    const isSuspended = org?.status === 'Suspended';
    const endpoint = isSuspended ? `/api/admin/organisations/${id}/unsuspend` : `/api/admin/organisations/${id}/suspend`;
    setActionLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      showToast(isSuspended ? 'Organization successfully unsuspended.' : 'Organization suspended.');
      setSuspendModalOpen(false);
      fetchOrgDetails();
    } catch (err) {
      showToast('', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers for Module 2: Jobs
  const handleModerateJob = async (newStatus) => {
    if (!selectedJob) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/organisations/${id}/jobs/${selectedJob.job_id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          status: newStatus,
          rejection_reason: jobModerationReason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update job status');
      showToast(`Job status changed to ${newStatus}`);
      setJobModalOpen(false);
      setSelectedJob(null);
      setJobModerationReason('');
      fetchJobs(jobsData.page);
    } catch (err) {
      showToast('', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers for Module 3: Members
  const handleRemoveMember = async () => {
    if (!removeMemberConfirm) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/organisations/${id}/members/${removeMemberConfirm.user_id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ reason: removeReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove member');
      showToast('Member removed from organization.');
      setRemoveMemberConfirm(null);
      setRemoveReason('');
      fetchMembers(membersData.page);
      fetchOrgDetails();
    } catch (err) {
      showToast('', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers for Module 4: Posts
  const handleModeratePost = async (postId, action) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/organisations/${id}/posts/${postId}/moderation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ action, reason: postModReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to moderate post');
      showToast(`Post ${action === 'restore' ? 'restored' : 'hidden'}`);
      setPostModAction(null);
      setPostModReason('');
      fetchPosts(postsData.page);
    } catch (err) {
      showToast('', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenComments = async (post) => {
    setSelectedPostComments(post);
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/admin/organisations/${id}/posts/${post.post_id}/comments`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      setCommentsList(data.comments || []);
    } catch {
      setCommentsList([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Handlers for Module 5: Risk Investigation Notes
  const handleAddInvestigationNote = async (e) => {
    e.preventDefault();
    if (!newInvestigationNote.trim()) return;
    setNoteSubmitting(true);
    try {
      const res = await fetch(`/api/admin/organisations/${id}/risk/investigation-note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          note: newInvestigationNote,
          decision: investigationDecision,
          riskStatus: investigationRiskStatus
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record note');
      showToast('Investigation note recorded.');
      setNewInvestigationNote('');
      fetchRisk();
    } catch (err) {
      showToast('', err.message);
    } finally {
      setNoteSubmitting(false);
    }
  };

  // Handlers for Module 7: Security Sessions
  const handleRevokeSession = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/organisations/${id}/security/revoke-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          sessionId: revokeSessionConfirm?.sessionId,
          revokeAll: revokeAllConfirm
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke session');
      showToast(revokeAllConfirm ? 'All member sessions terminated.' : 'Session revoked successfully.');
      setRevokeSessionConfirm(null);
      setRevokeAllConfirm(false);
      fetchSecurity();
    } catch (err) {
      showToast('', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loadingOrg) {
    return (
      <div className="min-h-screen bg-[#f3f6fb] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Loading Organization Profile...</p>
        </div>
      </div>
    );
  }

  if (orgError || !org) {
    return (
      <div className="min-h-screen bg-[#f3f6fb] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-[460px] w-full text-center shadow-sm" style={{ maxWidth: '460px', width: '100%' }}>
          <span className="material-symbols-outlined text-4xl text-rose-500 mb-2">error</span>
          <h2 className="text-lg font-bold text-slate-900">Failed to Load Organization</h2>
          <p className="text-xs text-slate-500 mt-1 mb-4">{orgError || 'Organization not found'}</p>
          <button
            onClick={() => navigate('/organizations')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
          >
            Return to Organizations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f3f6fb] text-slate-800 antialiased min-h-screen pb-20">
      {/* Toast Alert */}
      {actionSuccess && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="fixed top-5 right-5 z-50 bg-rose-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-base">warning</span>
          {actionError}
        </div>
      )}

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-6">
        
        {/* TopBarNavigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(from)}
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px] mr-1.5 transition-transform group-hover:-translate-x-0.5 text-slate-500">arrow_back</span>
            Back to {backLabel}
          </button>

          {/* Quick Status Pills */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono bg-slate-200/70 text-slate-700 px-2.5 py-1 rounded-md">
              ID: {org.org_id?.substring(0, 8)}...
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${
              org.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {org.status}
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${
              org.verification_status === 'VERIFIED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
              org.verification_status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              {org.verification_status}
            </span>
          </div>
        </div>

        {/* HeroProfileCard */}
        <header className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Cover Banner */}
          <div className="h-32 sm:h-40 w-full bg-gradient-to-r from-[#1c748c] via-[#245388] to-[#262c68] relative">
            {org.cover_url && (
              <img src={org.cover_url} alt="Cover" className="w-full h-full object-cover opacity-60" />
            )}
          </div>

          <div className="px-6 pb-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 sm:-mt-14 mb-4 gap-4">
              
              {/* Logo & Identity */}
              <div className="flex items-end space-x-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-indigo-50 border-4 border-white shadow-md flex items-center justify-center text-indigo-700 font-bold text-2xl sm:text-3xl shrink-0 overflow-hidden">
                  {org.logo_url && (org.logo_url.startsWith('http') || org.logo_url.startsWith('/')) ? (
                    <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
                  ) : (
                    org.name ? org.name.substring(0, 2).toUpperCase() : 'CO'
                  )}
                </div>
                <div className="pt-2 sm:pt-0">
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{org.name || 'Unnamed Organization'}</h1>
                    {(org.verification_status === 'VERIFIED' || org.verification_status === 'DOMAIN_VERIFIED') && (
                      <span className="inline-flex text-blue-500" title="Verified Organization">
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    {org.slogan || `${org.industry || 'Business'} • ${org.entity_type || 'Company'}`}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 self-start sm:self-end flex-wrap">
                <button
                  type="button"
                  onClick={() => setVerifyModalOpen(true)}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50/70 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] mr-1.5 text-indigo-600">verified</span>
                  {org.verification_status === 'VERIFIED' ? 'Review Verification' : 'Review & Verify'}
                </button>
                <button
                  type="button"
                  onClick={() => setWarnModalOpen(true)}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50/50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] mr-1.5 text-amber-600">notifications</span>
                  Warn
                </button>
                <button
                  type="button"
                  onClick={() => setSuspendModalOpen(true)}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-lg border border-rose-300 bg-rose-50/40 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] mr-1.5 text-rose-600">block</span>
                  {org.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
                </button>
              </div>
            </div>

            {/* Subline Details */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] text-slate-500">
              <span className="font-medium text-slate-700">{org.industry || 'Technology'}</span>
              <span className="text-slate-300">•</span>
              <span>{org.location || 'Location Not Specified'}</span>
              <span className="text-slate-300">•</span>
              <span>{org.size || '1 - 50 Members'}</span>
              <span className="text-slate-300">•</span>
              {org.website ? (
                <a
                  className="text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                  href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {org.website}
                  <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                </a>
              ) : (
                <span>No website provided</span>
              )}
            </div>
          </div>
        </header>

        {/* Organization Overview KPI Metric Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">MEMBERS</span>
              <span className="material-symbols-outlined text-[18px] text-indigo-600">groups</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{org.overview?.totalMembers || 0}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Active team directory</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">JOBS</span>
              <span className="material-symbols-outlined text-[18px] text-blue-600">work</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{org.overview?.totalJobs || 0}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Total job postings</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">POSTS</span>
              <span className="material-symbols-outlined text-[18px] text-emerald-600">feed</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{org.overview?.totalPosts || 0}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Broadcast content</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">OPEN REPORTS</span>
              <span className="material-symbols-outlined text-[18px] text-amber-600">report_problem</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{org.overview?.openReports || 0}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Pending user flags</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">RISK ALERTS</span>
              <span className={`material-symbols-outlined text-[18px] ${
                (org.overview?.riskAlertsCount || 0) > 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'
              }`}>
                shield
              </span>
            </div>
            <p className="text-xl font-bold text-slate-900">{org.overview?.riskAlertsCount || 0}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Automated fraud signals</p>
          </div>
        </section>

        {/* Main Navigation Tabs */}
        <nav className="flex items-center border-b border-slate-200 gap-1 overflow-x-auto pb-px">
          {[
            { id: 'overview', label: 'Overview', icon: 'dashboard' },
            { id: 'identity', label: 'Company Identity', icon: 'badge' },
            { id: 'jobs', label: 'Jobs & Hiring', icon: 'work' },
            { id: 'members', label: 'People & Team', icon: 'groups' },
            { id: 'posts', label: 'Posts & Content', icon: 'article' },
            { id: 'risk', label: 'Risk & Fraud', icon: 'gavel' },
            { id: 'timeline', label: 'History & Activity', icon: 'history' },
            { id: 'security', label: 'Security & Sessions', icon: 'security' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ESTABLISHED</span>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {org.incorporation_date ? new Date(org.incorporation_date).toLocaleDateString() : (org.established_year || 'Not Specified')}
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">STRUCTURE</span>
                <p className="text-sm font-semibold text-slate-900 mt-1">{org.legal_name || org.entity_type || 'Corporation'}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">REGISTRATION DATE</span>
                <p className="text-sm font-semibold text-slate-900 mt-1">{new Date(org.created_at).toLocaleDateString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">MODERATION FLAGS</span>
                <p className="text-sm font-semibold text-slate-900 mt-1">{org.moderation_flags} Active Flags</p>
              </div>
            </div>

            {/* Split Grid: Left Column About & Documents, Right Column Decision & Team */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column (2 Cols wide) */}
              <div className="lg:col-span-2 space-y-6">
                {/* About Section */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-indigo-600">info</span>
                    About the Company
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {org.description || 'No description provided by the organization.'}
                  </p>
                  
                  {/* Tech Stack Chips */}
                  {org.techStack && org.techStack.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-2">Technologies Used:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {org.techStack.map(t => (
                          <span key={t.id} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                            {t.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Verification Documents Vault */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-indigo-600">folder_open</span>
                      Uploaded Verification Documents
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {org.documents?.length || 0} document(s)
                    </span>
                  </div>

                  {org.documents && org.documents.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {org.documents.map(doc => (
                        <div key={doc.id} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-slate-400">description</span>
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{doc.document_name || 'Document'}</p>
                              <p className="text-[10px] text-slate-400">
                                {doc.document_type} • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {doc.document_url && (
                            <a
                              href={doc.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold hover:bg-indigo-100"
                            >
                              View File
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                      No legal verification documents uploaded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Decision Panel & Key Members */}
              <div className="space-y-6">
                {/* Decision Panel */}
                <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">balance</span>
                    Verification Decision
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-1">Current Status:</span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 text-indigo-300">
                        {org.verification_status}
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Internal Notes:</label>
                      <textarea
                        value={reviewerNotes}
                        onChange={(e) => setReviewerNotes(e.target.value)}
                        placeholder="Add private review observations..."
                        rows={3}
                        className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    {org.verification_status !== 'VERIFIED' && (
                      <div className="pt-2 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleVerificationDecision('VERIFIED')}
                          disabled={actionLoading}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          Approve Verification Badge
                        </button>

                        <div className="pt-1">
                          <input
                            type="text"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Mandatory rejection reason..."
                            className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 placeholder-slate-500 mb-2 focus:outline-none focus:border-rose-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleVerificationDecision('REJECTED')}
                            disabled={actionLoading}
                            className="w-full py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            Deny Application
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Members Snapshot */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-indigo-600">group</span>
                      Key Members
                    </h3>
                    <button
                      onClick={() => setActiveTab('members')}
                      className="text-indigo-600 text-[11px] font-semibold hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  {org.members && org.members.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {org.members.slice(0, 4).map(m => (
                        <div key={m.id} className="py-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs flex items-center justify-center font-bold">
                              {m.name ? m.name.substring(0, 2).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{m.name}</p>
                              <p className="text-[10px] text-slate-400">{m.role}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            m.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center">No associated members found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPANY IDENTITY (MODULE 1) */}
        {activeTab === 'identity' && (
          <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Company Identity & Registration Dossier</h2>
                <p className="text-xs text-slate-500">Official legal credentials, registered address, and corporate identity metadata.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditIdentityModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Edit Company Details
              </button>
            </div>

            {/* Grid of Identity Attributes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Company Name</span>
                <p className="text-sm font-semibold text-slate-900 mt-1">{org.name || 'Not Provided'}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Legal Full Name</span>
                <p className="text-sm font-semibold text-slate-900 mt-1">{org.legal_name || 'Not Specified'}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Organization UUID</span>
                <p className="text-xs font-mono text-slate-700 mt-1 bg-slate-50 p-1.5 rounded border border-slate-200 break-all">{org.org_id}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Industry</span>
                <p className="text-sm font-semibold text-slate-900 mt-1">{org.industry || 'Not Provided'}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Company Size</span>
                <p className="text-sm font-semibold text-slate-900 mt-1">{org.size || 'Not Specified'}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Entity Type</span>
                <p className="text-sm font-semibold text-slate-900 mt-1">{org.entity_type || 'COMPANY'}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Registered Email</span>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-semibold text-slate-900">{org.email || 'Not Provided'}</p>
                  {org.email_verified ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Verified</span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Unverified</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Contact Phone</span>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-semibold text-slate-900">{org.phone || 'Not Provided'}</p>
                  {org.phone_verified && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Verified</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Incorporation Date</span>
                <p className="text-sm font-semibold text-slate-900 mt-1">
                  {org.incorporation_date ? new Date(org.incorporation_date).toLocaleDateString() : 'Not Specified'}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Headquarters / Location</span>
                <p className="text-sm font-semibold text-slate-900 mt-1">{org.location || 'Not Specified'}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Onboarding Progress</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    org.onboarding_completed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {org.onboarding_completed ? 'Completed' : `Incomplete (${org.onboarding_step || 'IDENTITY'})`}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Primary Owner Account</span>
                {org.owner ? (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs font-semibold text-indigo-700 hover:underline cursor-pointer" onClick={() => navigate(`/profile/${org.owner.id}`)}>
                      {org.owner.name} ({org.owner.email})
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">Not Assigned</p>
                )}
              </div>
            </div>

            {/* Social Links */}
            {org.links && org.links.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Connected Social & Professional Links</span>
                <div className="flex flex-wrap gap-2">
                  {org.links.map(link => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <span className="capitalize">{link.platform || 'Link'}:</span>
                      <span className="text-indigo-600 truncate max-w-[200px]">{link.url}</span>
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: JOBS AND HIRING (MODULE 2) */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            {/* Jobs KPI Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: 'Total', count: jobsData.stats?.totalJobs || 0, color: 'text-slate-900' },
                { label: 'Active', count: jobsData.stats?.activeJobs || 0, color: 'text-emerald-600' },
                { label: 'Drafts', count: jobsData.stats?.draftJobs || 0, color: 'text-slate-500' },
                { label: 'Closed', count: jobsData.stats?.closedJobs || 0, color: 'text-amber-600' },
                { label: 'Expired', count: jobsData.stats?.expiredJobs || 0, color: 'text-rose-600' },
                { label: 'In Review', count: jobsData.stats?.reviewJobs || 0, color: 'text-indigo-600' },
                { label: 'Applications', count: jobsData.stats?.totalApplications || 0, color: 'text-purple-600' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200/90 p-3 text-center shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400">{stat.label}</span>
                  <p className={`text-lg font-bold ${stat.color} mt-0.5`}>{stat.count}</p>
                </div>
              ))}
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-500">Status:</span>
                <select
                  value={jobStatusFilter}
                  onChange={(e) => setJobStatusFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  <option value="CLOSED">Closed</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Filter jobs by title..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
                <span className="material-symbols-outlined text-[16px] text-slate-400 absolute left-2.5 top-2">search</span>
              </div>
            </div>

            {/* Jobs Table */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              {jobsLoading ? (
                <div className="py-12 text-center text-xs text-slate-500">Loading jobs catalog...</div>
              ) : jobsData.jobs && jobsData.jobs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Job Title & Location</th>
                        <th className="py-3 px-4">Type & Mode</th>
                        <th className="py-3 px-4">Salary Range</th>
                        <th className="py-3 px-4">Applications</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {jobsData.jobs.map(job => (
                        <tr key={job.job_id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900">{job.title}</p>
                            <p className="text-[11px] text-slate-400">{job.location || 'Remote'} • Posted {new Date(job.created_at).toLocaleDateString()}</p>
                            {job.hiring_flags?.duplicate_title && (
                              <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1">
                                Duplicate Title Warning
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-slate-800 font-medium">{job.job_type || 'Full-time'}</p>
                            <p className="text-[11px] text-slate-400">{job.work_mode || 'Onsite'}</p>
                          </td>
                          <td className="py-3 px-4">
                            {job.salary_min || job.salary_max ? (
                              <span className="font-mono text-slate-800">
                                {job.salary_currency || '$'}{job.salary_min ? job.salary_min.toLocaleString() : '0'} - {job.salary_max ? job.salary_max.toLocaleString() : 'N/A'}
                              </span>
                            ) : (
                              <span className="text-slate-400">Undisclosed</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full text-[11px]">
                              {job.applications_count || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              job.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              job.status === 'CLOSED' ? 'bg-slate-100 text-slate-600' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedJob(job);
                                setJobModerationReason(job.rejection_reason || '');
                                setJobModalOpen(true);
                              }}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  No job postings found matching the selected criteria.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PEOPLE AND COMPANY TEAM (MODULE 3) */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            {/* Team KPI Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total Staff', count: membersData.stats?.totalMembers || 0, color: 'text-slate-900' },
                { label: 'Active', count: membersData.stats?.activeMembers || 0, color: 'text-emerald-600' },
                { label: 'Owners', count: membersData.stats?.ownersCount || 0, color: 'text-indigo-600' },
                { label: 'Admins', count: membersData.stats?.adminsCount || 0, color: 'text-blue-600' },
                { label: 'Recruiters', count: membersData.stats?.recruitersCount || 0, color: 'text-purple-600' },
                { label: 'Pending Invites', count: membersData.stats?.pendingInvites || 0, color: 'text-amber-600' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200/90 p-3 text-center shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400">{stat.label}</span>
                  <p className={`text-lg font-bold ${stat.color} mt-0.5`}>{stat.count}</p>
                </div>
              ))}
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-500">Role:</span>
                <select
                  value={memberRoleFilter}
                  onChange={(e) => setMemberRoleFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="Owner">Owner</option>
                  <option value="Admin">Admin</option>
                  <option value="Recruiter">Recruiter</option>
                  <option value="Member">Member</option>
                </select>
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search staff by name or email..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
                <span className="material-symbols-outlined text-[16px] text-slate-400 absolute left-2.5 top-2">search</span>
              </div>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              {membersLoading ? (
                <div className="py-12 text-center text-xs text-slate-500">Loading team directory...</div>
              ) : membersData.members && membersData.members.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Member</th>
                        <th className="py-3 px-4">Designation / Role</th>
                        <th className="py-3 px-4">Joined Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {membersData.members.map(member => (
                        <tr key={member.member_id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0 overflow-hidden">
                                {member.avatar_url ? (
                                  <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  member.full_name ? member.full_name.substring(0, 2).toUpperCase() : 'U'
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{member.full_name || 'Anonymous'}</p>
                                <p className="text-[11px] text-slate-400">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {member.role_name}
                            </span>
                            {member.headline && <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{member.headline}</p>}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {new Date(member.joined_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              member.membership_status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {member.membership_status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            <button
                              onClick={() => {
                                setSelectedMember(member);
                                setPermissionsModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                            >
                              Permissions
                            </button>
                            <button
                              onClick={() => setRemoveMemberConfirm(member)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">No members match your search criteria.</div>
              )}
            </div>

            {/* Pending Invitations Table */}
            {membersData.invitations && membersData.invitations.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Pending Invitations ({membersData.invitations.length})</h3>
                <div className="divide-y divide-slate-100">
                  {membersData.invitations.map(invite => (
                    <div key={invite.invite_id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{invite.email}</p>
                        <p className="text-[11px] text-slate-400">Invited Role: {invite.role} • Expires {new Date(invite.expires_at).toLocaleDateString()}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: POSTS AND CONTENT (MODULE 4) */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {/* Content KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total Posts', count: postsData.stats?.totalPosts || 0, color: 'text-slate-900' },
                { label: 'Hidden/Removed', count: postsData.stats?.hiddenPosts || 0, color: 'text-amber-600' },
                { label: 'Flagged', count: postsData.stats?.flaggedPosts || 0, color: 'text-rose-600' },
                { label: 'Total Likes', count: postsData.stats?.totalLikes || 0, color: 'text-emerald-600' },
                { label: 'Total Comments', count: postsData.stats?.totalComments || 0, color: 'text-blue-600' },
                { label: 'Total Shares', count: postsData.stats?.totalShares || 0, color: 'text-purple-600' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200/90 p-3 text-center shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400">{stat.label}</span>
                  <p className={`text-lg font-bold ${stat.color} mt-0.5`}>{stat.count}</p>
                </div>
              ))}
            </div>

            {/* Post Feed Cards */}
            {postsLoading ? (
              <div className="py-12 text-center text-xs text-slate-500">Loading feed broadcasts...</div>
            ) : postsData.posts && postsData.posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {postsData.posts.map(post => (
                  <div key={post.post_id} className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      {/* Post Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {post.post_type}
                          </span>
                          {post.is_broadcast && (
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                              Broadcast
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          post.is_removed ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {post.is_removed ? 'Hidden' : 'Published'}
                        </span>
                      </div>

                      {post.title && <h4 className="text-sm font-bold text-slate-900 mb-1">{post.title}</h4>}
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">{post.content}</p>

                      {/* Media Thumbnail */}
                      {post.media && post.media.length > 0 && (
                        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                          {post.media.map((m, mIdx) => (
                            <a key={mIdx} href={m.url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                              <img src={m.url} alt="" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Engagement & Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-3 text-[11px]">
                        <span>👍 {post.likes_count || 0}</span>
                        <span>💬 {post.comments_count || 0}</span>
                        <span>🔁 {post.shares_count || 0}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenComments(post)}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 text-xs font-semibold"
                        >
                          Comments
                        </button>
                        {post.is_removed ? (
                          <button
                            onClick={() => handleModeratePost(post.post_id, 'restore')}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-xs font-semibold"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setPostModAction({ postId: post.post_id, action: 'hide' });
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold"
                          >
                            Hide
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-xs text-slate-400">
                No organization posts published yet.
              </div>
            )}
          </div>
        )}

        {/* TAB 6: RISK AND FRAUD DETECTION (MODULE 5) */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            {/* Risk Overview Banner */}
            <div className={`rounded-xl border p-5 flex items-center justify-between ${
              riskData.riskLevel === 'HIGH_RISK' ? 'bg-rose-50 border-rose-200 text-rose-900' :
              riskData.riskLevel === 'NEEDS_REVIEW' ? 'bg-amber-50 border-amber-200 text-amber-900' :
              'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-3xl">
                  {riskData.riskLevel === 'HIGH_RISK' ? 'gavel' : riskData.riskLevel === 'NEEDS_REVIEW' ? 'warning' : 'verified_user'}
                </span>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Overall Risk Assessment: {riskData.riskLevel.replace('_', ' ')}</h3>
                  <p className="text-xs opacity-90 mt-0.5">Automated heuristic analysis across corporate registration, job postings, reports, and staff.</p>
                </div>
              </div>
            </div>

            {/* Risk Indicators List */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Detected Risk Signals & Discrepancies</h3>
              {riskData.indicators && riskData.indicators.length > 0 ? (
                <div className="space-y-3">
                  {riskData.indicators.map(ind => (
                    <div key={ind.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            ind.severity === 'CRITICAL' || ind.severity === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                            ind.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-200 text-slate-800'
                          }`}>
                            {ind.severity}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{ind.name}</span>
                        </div>
                        <p className="text-xs text-slate-600">{ind.reason}</p>
                        <p className="text-[11px] font-mono text-slate-500 mt-1">Evidence: {ind.evidence}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                        Status: {ind.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-emerald-600 bg-emerald-50/50 rounded-lg border border-emerald-100">
                  ✓ No active risk or fraud anomalies flagged for this organization.
                </div>
              )}
            </div>

            {/* User Abuse Reports Filed Against Company */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Community Abuse Reports</h3>
              {riskData.reports && riskData.reports.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {riskData.reports.map(rep => (
                    <div key={rep.id} className="py-3 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                            {rep.category_label || 'COMPLAINT'}
                          </span>
                          <span className="text-xs font-semibold text-slate-800">{rep.custom_reason || rep.reason || 'No description provided'}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Reported by {rep.reporter_name || 'Anonymous User'} • {new Date(rep.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">{rep.status || 'PENDING'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">No community complaints filed against this company.</div>
              )}
            </div>

            {/* Investigation Workflow Notes */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Admin Investigation Log</h3>
              
              {/* Add Note Form */}
              <form onSubmit={handleAddInvestigationNote} className="mb-4 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <textarea
                  value={newInvestigationNote}
                  onChange={(e) => setNewInvestigationNote(e.target.value)}
                  placeholder="Record internal findings, investigator notes, or compliance review..."
                  rows={2}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Decision:</span>
                    <select
                      value={investigationDecision}
                      onChange={(e) => setInvestigationDecision(e.target.value)}
                      className="text-xs bg-white border border-slate-300 rounded px-2.5 py-1"
                    >
                      <option value="Review ongoing">Review ongoing</option>
                      <option value="Cleared / No Violation">Cleared / No Violation</option>
                      <option value="Issued Warning">Issued Warning</option>
                      <option value="Escalated to Legal">Escalated to Legal</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={noteSubmitting}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold disabled:opacity-50"
                  >
                    Save Note
                  </button>
                </div>
              </form>

              {/* Past Investigation Notes */}
              {riskData.investigationNotes && riskData.investigationNotes.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {riskData.investigationNotes.map(n => (
                    <div key={n.id} className="py-2.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-700">{n.adminName}</span>
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-700">{n.note}</p>
                      <span className="inline-block text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1">
                        Decision: {n.decision}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3 text-center">No previous investigation notes recorded.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: COMPANY HISTORY AND ACTIVITY (MODULE 6) */}
        {activeTab === 'timeline' && (
          <div className="space-y-6">
            {/* Filter Pills */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['ALL', 'PROFILE', 'VERIFICATION', 'JOBS', 'MEMBERS', 'POSTS', 'MODERATION'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setTimelineCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      timelineCategory === cat ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={timelineSearch}
                  onChange={(e) => setTimelineSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
                <span className="material-symbols-outlined text-[16px] text-slate-400 absolute left-2.5 top-2">search</span>
              </div>
            </div>

            {/* Timeline Events List */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-2xs">
              {timelineLoading ? (
                <div className="py-12 text-center text-xs text-slate-500">Loading chronological timeline...</div>
              ) : timelineData.events && timelineData.events.length > 0 ? (
                <div className="relative border-l border-slate-200 ml-4 space-y-6 pl-6">
                  {timelineData.events.map(event => (
                    <div key={event.id} className="relative group">
                      {/* Timeline dot */}
                      <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                        event.category === 'VERIFICATION' ? 'bg-indigo-600' :
                        event.category === 'MODERATION' ? 'bg-rose-600' :
                        event.category === 'JOBS' ? 'bg-blue-600' :
                        event.category === 'MEMBERS' ? 'bg-emerald-600' :
                        'bg-slate-500'
                      }`} />

                      <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            event.category === 'VERIFICATION' ? 'bg-indigo-100 text-indigo-800' :
                            event.category === 'MODERATION' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-200 text-slate-800'
                          }`}>
                            {event.category}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(event.created_at).toLocaleString()}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 mt-1">{event.title}</h4>
                        
                        {event.metadata && (
                          <p className="text-[11px] text-slate-600 mt-1">
                            {event.metadata.description || event.metadata.notes || event.metadata.reason || JSON.stringify(event.metadata)}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-slate-400">
                          <span>Actor:</span>
                          <span className="font-semibold text-slate-600">{event.actor_name || 'System'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">No activity events found.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 8: COMPANY SECURITY AND SESSIONS (MODULE 7) */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Security Posture Health Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600 text-lg">shield</span>
                  Corporate Account Security Overview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Remote session monitoring and token invalidation for all accounts holding administrative credentials in this company.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRevokeAllConfirm(true)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-semibold transition-colors"
              >
                Terminate All Member Sessions
              </button>
            </div>

            {/* Active Member Sessions Table */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Active Device Sessions ({securityData.sessions?.length || 0})</h4>
              </div>

              {securityLoading ? (
                <div className="py-12 text-center text-xs text-slate-500">Loading session telemetry...</div>
              ) : securityData.sessions && securityData.sessions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">Member Account</th>
                        <th className="py-3 px-4">Platform & Browser</th>
                        <th className="py-3 px-4">IP Address</th>
                        <th className="py-3 px-4">Login Time</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Session Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {securityData.sessions.map((sess, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900">{sess.memberName}</p>
                            <p className="text-[11px] text-slate-400">{sess.memberEmail}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-800 capitalize">{sess.platform}</span>
                            <p className="text-[10px] text-slate-400 truncate max-w-xs">{sess.userAgent || 'Unknown browser'}</p>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            {sess.ipAddress}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {new Date(sess.loginTime).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              sess.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {sess.isActive ? 'Active' : 'Revoked'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {sess.isActive && (
                              <button
                                onClick={() => setRevokeSessionConfirm(sess)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded text-xs font-semibold"
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">No active login sessions recorded.</div>
              )}
            </div>

            {/* Security Guarantee Notice */}
            <div className="p-4 rounded-lg bg-slate-100/60 text-slate-600 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600 text-base">lock</span>
              <span>
                <strong>Privacy & Safety Notice:</strong> Passwords, session tokens, OTPs, and authentication keys are cryptographically hashed and never exposed to platform administrators.
              </span>
            </div>
          </div>
        )}

      </div>

      {/* ================= MODALS ================= */}

      {/* Verification Modal (Zero-DB Changes Flow) */}
      <OrganizationVerificationModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        organization={org}
        onVerificationSubmitted={() => {
          showToast('Verification submitted successfully.');
          fetchOrgDetails();
        }}
      />

      {/* Edit Permitted Details Modal */}
      {editIdentityModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-[680px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            style={{ maxWidth: '680px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <span className="material-symbols-outlined text-[20px]">edit_note</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">Edit Organization Details</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Update corporate metadata directly. All edits are logged to audit trails.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditIdentityModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleUpdateIdentity} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Company Display Name *</label>
                  <input
                    type="text"
                    required
                    value={identityForm.name}
                    onChange={(e) => setIdentityForm({...identityForm, name: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800 transition-all"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Legal Full Name</label>
                  <input
                    type="text"
                    value={identityForm.legal_name}
                    onChange={(e) => setIdentityForm({...identityForm, legal_name: e.target.value})}
                    placeholder="Registered Legal Entity Name"
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800 transition-all"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Industry</label>
                  <input
                    type="text"
                    value={identityForm.industry}
                    onChange={(e) => setIdentityForm({...identityForm, industry: e.target.value})}
                    placeholder="e.g., Software, Aviation, Design"
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800 transition-all"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Company Size</label>
                  <input
                    type="text"
                    value={identityForm.size}
                    onChange={(e) => setIdentityForm({...identityForm, size: e.target.value})}
                    placeholder="e.g., 1-50, 50-200, 500+"
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800 transition-all"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Incorporation Date</label>
                  <input
                    type="date"
                    value={identityForm.incorporation_date}
                    onChange={(e) => setIdentityForm({...identityForm, incorporation_date: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800 transition-all"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Official Website</label>
                  <input
                    type="text"
                    value={identityForm.website}
                    onChange={(e) => setIdentityForm({...identityForm, website: e.target.value})}
                    placeholder="https://company.com"
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800 transition-all"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Registered Corporate Email</label>
                  <input
                    type="email"
                    value={identityForm.email}
                    onChange={(e) => setIdentityForm({...identityForm, email: e.target.value})}
                    placeholder="contact@company.com"
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800 transition-all"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={identityForm.phone}
                    onChange={(e) => setIdentityForm({...identityForm, phone: e.target.value})}
                    placeholder="+1 555-0199"
                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Headquarters / Location</label>
                <input
                  type="text"
                  value={identityForm.location}
                  onChange={(e) => setIdentityForm({...identityForm, location: e.target.value})}
                  placeholder="e.g., San Francisco, CA, USA"
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800 transition-all"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Slogan / Headline</label>
                <input
                  type="text"
                  value={identityForm.slogan}
                  onChange={(e) => setIdentityForm({...identityForm, slogan: e.target.value})}
                  placeholder="e.g., Pioneering cloud logistics solutions"
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800 transition-all"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Company Description</label>
                <textarea
                  rows={4}
                  value={identityForm.description}
                  onChange={(e) => setIdentityForm({...identityForm, description: e.target.value})}
                  placeholder="Comprehensive description of the organization, operations, and mission..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-800 transition-all"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditIdentityModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-700 font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warn Modal */}
      {warnModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-6 sm:p-7"
            style={{ maxWidth: '500px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Issue Disciplinary Warning</h3>
                  <p className="text-xs text-slate-500">Official policy citation to organization administrator.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWarnModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleWarn} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Warning Reason *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Unverified recruiter recruitment solicitation"
                  value={warnReason}
                  onChange={(e) => setWarnReason(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-amber-500 text-slate-800 transition-all"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Detailed Message</label>
                <textarea
                  rows={3}
                  placeholder="Provide guidance on required corrective actions..."
                  value={warnMessage}
                  onChange={(e) => setWarnMessage(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-amber-500 text-slate-800 transition-all"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                <input
                  type="checkbox"
                  id="severeWarn"
                  checked={isSevereWarn}
                  onChange={(e) => setIsSevereWarn(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="severeWarn" className="text-xs font-semibold text-rose-700 cursor-pointer">
                  Mark as Severe Strike (+1 Moderation Strike on Corporate Record)
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWarnModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-semibold shadow-sm cursor-pointer"
                >
                  {actionLoading ? 'Issuing...' : 'Issue Warning'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-[460px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-6 sm:p-7 text-center"
            style={{ maxWidth: '460px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[30px]">warning</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {org.status === 'Suspended' ? 'Unsuspend Organization?' : 'Suspend Organization?'}
            </h3>
            <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
              {org.status === 'Suspended'
                ? 'This will restore corporate profile visibility and allow members to post jobs, recruit talent, and publish content.'
                : 'This will freeze corporate access, hide public company profiles, and immediately pause all active job postings.'}
            </p>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setSuspendModalOpen(false)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSuspendToggle}
                disabled={actionLoading}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
              >
                {actionLoading ? 'Processing...' : `Confirm ${org.status === 'Suspended' ? 'Unsuspend' : 'Suspension'}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Details & Moderation Modal */}
      {jobModalOpen && selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-[640px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-6 sm:p-7 max-h-[85vh] overflow-y-auto"
            style={{ maxWidth: '640px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedJob.title}</h3>
                <p className="text-xs text-slate-500">{selectedJob.location || 'Remote'} • {selectedJob.job_type}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {selectedJob.status}
                </span>
                <button
                  onClick={() => setJobModalOpen(false)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Description</span>
                <p className="p-3 bg-slate-50 rounded-xl text-slate-600 whitespace-pre-line leading-relaxed border border-slate-100">{selectedJob.description || 'No description provided.'}</p>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">Recruiter / Contact</span>
                <p className="text-slate-800 font-semibold">{selectedJob.recruiter_name || 'Organization Recruiter'} <span className="text-slate-500 font-normal">({selectedJob.recruiter_email || 'No email'})</span></p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Moderation Reason / Internal Notes</label>
                <input
                  type="text"
                  value={jobModerationReason}
                  onChange={(e) => setJobModerationReason(e.target.value)}
                  placeholder="Reason for job listing status update..."
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setJobModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-700 font-semibold cursor-pointer"
                >
                  Close
                </button>
                <div className="flex items-center gap-2">
                  {selectedJob.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      onClick={() => handleModerateJob('CLOSED')}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold cursor-pointer"
                    >
                      Close Job
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleModerateJob('ACTIVE')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold cursor-pointer"
                    >
                      Publish / Activate
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleModerateJob('REJECTED')}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold cursor-pointer"
                  >
                    Takedown Job
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {permissionsModalOpen && selectedMember && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-6 sm:p-7"
            style={{ maxWidth: '480px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedMember.full_name}</h3>
                <p className="text-xs text-indigo-600 font-semibold mt-0.5">Assigned Role: {selectedMember.role_name}</p>
              </div>
              <button
                onClick={() => setPermissionsModalOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 text-xs mb-5 border border-slate-100">
              <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block mb-2">Granted RBAC Capabilities:</span>
              {selectedMember.role_permissions && Array.isArray(selectedMember.role_permissions) && selectedMember.role_permissions.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedMember.role_permissions.map((p, pIdx) => (
                    <span key={pIdx} className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-[11px] font-medium text-slate-700 shadow-2xs">
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-xs">Standard organization member permissions.</p>
              )}
            </div>

            <button
              onClick={() => setPermissionsModalOpen(false)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation */}
      {removeMemberConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-[460px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-6 sm:p-7 text-center"
            style={{ maxWidth: '460px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[24px]">person_remove</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Remove Organization Member?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Revoke corporate workspace access for <strong className="text-slate-700">{removeMemberConfirm.full_name}</strong> ({removeMemberConfirm.role_name}).
            </p>
            <input
              type="text"
              placeholder="Reason for member removal..."
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-rose-500 mb-4"
            />
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setRemoveMemberConfirm(null)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
              >
                Confirm Removal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {selectedPostComments && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-6 sm:p-7 max-h-[85vh] overflow-y-auto"
            style={{ maxWidth: '560px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[18px]">chat</span>
                <h3 className="text-sm font-bold text-slate-900">Post Comments ({commentsList.length})</h3>
              </div>
              <button onClick={() => setSelectedPostComments(null)} className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {commentsLoading ? (
              <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                Loading comments...
              </div>
            ) : commentsList.length > 0 ? (
              <div className="divide-y divide-slate-100 space-y-3">
                {commentsList.map(c => (
                  <div key={c.comment_id} className="pt-3 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-slate-800">{c.author_name || 'User'}</span>
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">{c.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No comments on this post yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Hide Post Confirmation */}
      {postModAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-[460px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-6 sm:p-7 text-center"
            style={{ maxWidth: '460px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[24px]">visibility_off</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Hide Post from Feed?</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              This will suppress the broadcast from public community feeds while preserving audit logs and moderation trails.
            </p>
            <input
              type="text"
              placeholder="Reason for hiding post..."
              value={postModReason}
              onChange={(e) => setPostModReason(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-amber-500 mb-4"
            />
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setPostModAction(null)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleModeratePost(postModAction.postId, 'hide')}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
              >
                Hide Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Session Confirmation */}
      {revokeSessionConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-[460px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-6 sm:p-7 text-center"
            style={{ maxWidth: '460px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[24px]">logout</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Revoke Active Session?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
              Terminates corporate access for <strong className="text-slate-700">{revokeSessionConfirm.memberName}</strong> on platform <strong>{revokeSessionConfirm.platform}</strong>.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setRevokeSessionConfirm(null)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeSession}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke All Sessions Confirmation */}
      {revokeAllConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-[460px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-6 sm:p-7 text-center"
            style={{ maxWidth: '460px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[24px]">security</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">Terminate ALL Member Sessions?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5 leading-relaxed">
              Emergency action: Immediately revokes all active device sessions for every staff member in this organization.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setRevokeAllConfirm(false)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeSession}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
              >
                Terminate All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
