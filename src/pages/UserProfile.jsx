import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../AuthContext';
import DangerModal from '../components/DangerModal';
import PostModal from '../components/PostModal';

export default function UserProfile() {
  const { role, accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningReason, setWarningReason] = useState('Spam');
  const [warningMessage, setWarningMessage] = useState('');
  const [suspendConfirmModalOpen, setSuspendConfirmModalOpen] = useState(false);
  const [suspendDuration, setSuspendDuration] = useState('Short Temporary (3-7 days)');
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportsOnUser, setReportsOnUser] = useState([]);
  const [reportsSubmitted, setReportsSubmitted] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState('onUser');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('Activity');
  const [userThoughts, setUserThoughts] = useState([]);
  const [thoughtsLoading, setThoughtsLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState(null);
  React.useEffect(() => {
    if (!id || !accessToken) return;
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/admin/users/' + id, {
          headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
        }

        const reportsOnRes = await fetch(`/api/admin/reports?targetUserId=${id}&status=all&limit=50`, {
          headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        if (reportsOnRes.ok) {
          const onData = await reportsOnRes.json();
          setReportsOnUser(onData.reports || []);
        }

        const reportsSubRes = await fetch(`/api/admin/reports?reporterId=${id}&status=all&limit=50`, {
          headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        if (reportsSubRes.ok) {
          const subData = await reportsSubRes.json();
          setReportsSubmitted(subData.reports || []);
        }

        const thoughtsRes = await fetch(`/api/admin/users/${id}/thoughts`, {
          headers: { 'Authorization': 'Bearer ' + accessToken }
        });
        if (thoughtsRes.ok) {
          const thoughtsData = await thoughtsRes.json();
          setUserThoughts(thoughtsData || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setReportsLoading(false);
        setThoughtsLoading(false);
      }
    };
    fetchUser();
  }, [id, accessToken]);

  if (loading) return <div className="flex justify-center p-10"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>;
  if (!userData) return <div className="flex justify-center p-10">User not found</div>;

  const from = location.state?.from || '/users';
  const backLabel = location.state?.label || 'Users';

  if (role === 'moderator' && from !== '/moderation') {
    return (
      <div className="pt-8 pb-12 w-full max-w-max-width mx-auto flex justify-center">
        <div className="bg-surface border border-outline-variant rounded-xl p-xl w-full max-w-2xl text-center shadow-sm">
          <span className="material-symbols-outlined text-error text-[48px] mb-md">block</span>
          <h2 className="font-headline-md text-headline-md text-on-surface">Access Denied</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-sm">Moderators can only view user profiles directly from an active moderation case.</p>
        </div>
      </div>
    );
  }

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 5);
      setIsLoadingMore(false);
    }, 800);
  };

  const adminActions = (userData?.actionHistory || []).map(a => {
    let text = `received admin action: ${a.reason} - ${a.message || 'No message'}`;
    let icon = a.is_severe ? 'gavel' : 'warning';
    if (a.reason?.toLowerCase().includes('suspend') || a.message?.toLowerCase().includes('suspend')) {
      text = 'was suspended by Admin';
      icon = 'block';
    } else if (a.reason?.toLowerCase().includes('warn') || a.message?.toLowerCase().includes('warn')) {
      text = 'received a warning';
      icon = 'warning';
    } else if (a.reason?.toLowerCase().includes('restored') || a.message?.toLowerCase().includes('restored') || a.reason?.toLowerCase().includes('unsuspend') || a.message?.toLowerCase().includes('unsuspend')) {
      text = 'was restored by Admin';
      icon = 'check_circle';
    }
    
    return {
      id: `admin-${a.id}`,
      text,
      time: formatDistanceToNow(new Date(a.created_at), { addSuffix: true }),
      timestamp: new Date(a.created_at).getTime(),
      icon,
      color: a.is_severe ? 'bg-error-container text-error ring-2 ring-surface' : 'bg-warning-container text-warning ring-2 ring-surface',
      type: 'moderation'
    };
  });

  const joinedEvent = userData?.joined ? [{
    id: 'joined',
    text: 'joined the platform',
    time: formatDistanceToNow(new Date(userData.joined), { addSuffix: true }),
    timestamp: new Date(userData.joined).getTime(),
    icon: 'how_to_reg',
    color: 'bg-surface-container-highest text-primary ring-2 ring-surface',
    type: 'profile'
  }] : [];

  const realAllActivity = (userData?.activities || [])
    .map(a => {
      let icon = 'history';
      let color = 'bg-surface-container-highest text-primary ring-2 ring-surface';
      let text = `performed action: ${a.action_type}`;
      let type = 'other';

      if (a.action_type === 'like_post') { icon = 'thumb_up'; text = `liked ${a.target_user_name ? a.target_user_name + "'s" : 'a'} post`; type = 'engagement'; }
      else if (a.action_type === 'vote_poll') { icon = 'how_to_vote'; text = `voted on ${a.target_user_name ? a.target_user_name + "'s" : 'a'} poll`; type = 'engagement'; }
      else if (a.action_type === 'repost_post') { icon = 'repeat'; text = `reposted ${a.target_user_name ? a.target_user_name + "'s" : 'a'} post`; type = 'engagement'; }
      else if (a.action_type === 'comment_post') { icon = 'comment'; text = `commented on ${a.target_user_name ? a.target_user_name + "'s" : 'a'} post`; type = 'engagement'; }
      else if (a.action_type === 'POST_CREATED' || a.action_type.includes('post')) { icon = 'post_add'; color = 'bg-primary text-white ring-0'; text = 'created a new post'; type = 'post'; }
      else if (a.action_type === 'PROFILE_UPDATED' || a.action_type.includes('profile')) { icon = 'person'; text = 'updated their profile'; type = 'profile'; }
      else if (a.action_type === 'USER_LOGGED_IN') { icon = 'login'; text = 'logged in'; type = 'profile'; }
      else if (a.action_type === 'JOB_APPLIED' || a.action_type === 'apply_job' || (a.action_type.includes('job') && a.action_type.includes('appl'))) {
        icon = 'work';
        if (a.job_title && a.job_id) {
          text = `applied for a job: ${a.job_title} (ID: #${a.job_id.split('-')[0]})`;
        } else if (a.job_title) {
          text = `applied for a job: ${a.job_title}`;
        } else {
          text = 'applied for a job';
        }
        type = 'job';
      }
      else if (a.action_type === 'JOB_CREATED' || a.action_type === 'create_job' || a.action_type === 'job_created') {
        icon = 'work';
        if (a.job_title && a.job_id) {
          text = `published a job: ${a.job_title} (ID: #${a.job_id.split('-')[0]})`;
        } else if (a.job_title) {
          text = `published a job: ${a.job_title}`;
        } else {
          text = 'published a job';
        }
        type = 'job';
      }
      else if (a.action_type === 'view_job' || a.action_type === 'JOB_VIEWED') {
        icon = 'visibility';
        if (a.job_title && a.job_id) {
          text = `viewed a job: ${a.job_title} (ID: #${a.job_id.split('-')[0]})`;
        } else if (a.job_title) {
          text = `viewed a job: ${a.job_title}`;
        } else {
          text = 'viewed a job';
        }
        type = 'job';
      }
      else if (a.action_type === 'save_job' || a.action_type === 'JOB_SAVED') {
        icon = 'bookmark';
        if (a.job_title && a.job_id) {
          text = `saved a job: ${a.job_title} (ID: #${a.job_id.split('-')[0]})`;
        } else if (a.job_title) {
          text = `saved a job: ${a.job_title}`;
        } else {
          text = 'saved a job';
        }
        type = 'job';
      }
      else if (a.action_type === 'search_job' || a.action_type === 'JOB_SEARCHED') {
        icon = 'search';
        text = 'searched for jobs';
        type = 'job';
      }
      else if (a.action_type.includes('job')) {
        icon = 'work';
        text = `interacted with a job (${a.action_type})`;
        type = 'job';
      }
      else if (a.action_type.includes('CONNECTION') || a.action_type.includes('connect')) { icon = 'handshake'; text = 'network connection event'; type = 'network'; }

      return {
        id: a.id,
        text,
        time: formatDistanceToNow(new Date(a.created_at), { addSuffix: true }),
        timestamp: new Date(a.created_at).getTime(),
        icon,
        color,
        type,
        full_id: a.job_id,
        post_content: a.post_content,
        post_media: a.post_media,
        target_user_name: a.target_user_name,
        target_user_avatar: a.target_user_avatar,
        post_created_at: a.post_created_at
      };
    });

  const activitySource = [...realAllActivity, ...adminActions, ...joinedEvent]
    .sort((a, b) => b.timestamp - a.timestamp);

  const filteredActivity = activityFilter === 'All'
    ? activitySource
    : activitySource.filter(a => {
      if (activityFilter === 'Posts') return a.type === 'post';
      if (activityFilter === 'Engagement') return a.type === 'engagement';
      if (activityFilter === 'Moderation') return a.type === 'moderation';
      if (activityFilter === 'Network') return a.type === 'network' || a.type === 'group';
      if (activityFilter === 'Profile') return a.type === 'profile';
      if (activityFilter === 'Jobs') return a.type === 'job';
      return false;
    });

  const handleSendWarning = async () => {
    try {
      const isSevere = ['Targeted Harassment', 'Hate Speech', 'Fraud'].includes(warningReason);
      const res = await fetch(`/api/admin/users/${userData.id}/warn`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: warningReason, message: warningMessage, isSevere })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.autoSuspended) {
          setUserData({ ...userData, status: 'Suspended', stats: { ...userData.stats, moderation_flags: data.moderation_flags } });
          alert(data.message);
        } else {
          setUserData({ ...userData, stats: { ...userData.stats, moderation_flags: data.moderation_flags } });
          alert(`Warning sent to ${userData.name} for ${warningReason}`);
        }
      } else {
        alert('Failed to send warning.');
      }
    } catch (e) {
      console.error(e);
      alert('Error sending warning.');
    }
    setWarningModalOpen(false);
    setWarningMessage('');
  };

  const handleSuspendUser = async () => {
    try {
      await fetch(`/api/admin/users/${userData.id}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: suspendDuration })
      });
      setUserData({ ...userData, status: 'Suspended' });
      alert(`${userData.name} has been suspended.`);
    } catch (e) {
      console.error(e);
    }
    setSuspendConfirmModalOpen(false);
  };

  const handleUnsuspendUser = async () => {
    if (window.confirm(`Are you sure you want to unsuspend ${userData.name}? This will restore their access and reset their moderation flags to 0.`)) {
      try {
        await fetch(`/api/admin/users/${userData.id}/unsuspend`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });
        setUserData({ ...userData, status: 'Active', stats: { ...userData.stats, moderation_flags: 0 } });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDeleteUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${userData.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        alert('User deleted successfully.');
        navigate('/users');
      } else {
        alert('Failed to delete user.');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting user.');
    }
    setDeleteModalOpen(false);
  };

  const handleRestoreUser = async () => {
    if (window.confirm(`Are you sure you want to restore ${userData.name}? This will reactivate their account.`)) {
      try {
        const res = await fetch(`/api/admin/users/${userData.id}/restore`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          setUserData({ ...userData, status: 'Active' });
          alert('User restored successfully.');
        } else {
          alert('Failed to restore user.');
        }
      } catch (e) {
        console.error(e);
        alert('Error restoring user.');
      }
    }
  };

  const handleDismissReport = async () => {
    try {
      const res = await fetch(`/api/admin/reports/${selectedReport.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' })
      });
      if (res.ok) {
        const updateList = (list) => list.map(r => r.id === selectedReport.id ? { ...r, status: 'dismissed' } : r);
        setReportsOnUser(updateList);
        setReportsSubmitted(updateList);
        setSelectedReport(prev => ({ ...prev, status: 'dismissed' }));
        alert("Report dismissed.");
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteContent = async () => {
    if (window.confirm("Are you sure you want to delete this content?")) {
      try {
        const endpoint = (selectedReport.type === 'Content' || selectedReport.rawType === 'POST')
          ? `/api/admin/feed/posts/${selectedReport.postId}` : null;
        if (!endpoint) { alert('Deletion not implemented for this type.'); return; }
        const res = await fetch(endpoint, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
          alert("Content deleted.");
          setReportModalOpen(false);
        } else {
          const data = await res.json();
          alert(`Error deleting content: ${data.error}`);
        }
      } catch (e) { console.error(e); }
    }
  };

  try {
    return (
      <div className="w-full min-h-screen bg-transparent relative px-4 md:px-8">


        <div className="w-full max-w-full mx-auto pt-8 flex flex-col items-start gap-6 bg-transparent z-10 pb-20">

          {/* Header */}
          <div className="flex flex-row items-center gap-4 w-full h-[48px]">
            <button
              onClick={() => navigate(from)}
              className="box-border flex flex-row justify-center items-center p-2 gap-[10px] w-[48px] h-[48px] rounded-[100px] border border-outline-variant bg-surface bg-opacity-50 backdrop-blur-[12px] hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
            </button>

            <div className="flex flex-col items-start w-[159px] h-[42px]">
              <h1 className="w-[107px] font-medium text-[18px] leading-[26px] text-center text-on-surface whitespace-nowrap">User Details</h1>
              <p className="w-[159px] font-normal text-[12px] leading-[16px] text-center text-on-surface-variant whitespace-nowrap">View, manage user details</p>
            </div>
          </div>

          {/* Profile Card Area */}
          <div className="flex flex-col md:flex-row justify-between items-start py-2 gap-6 w-full min-h-[152px]">
            <div className="flex flex-col sm:flex-row items-start gap-4 mr-auto w-auto max-w-full">
              {/* Avatar */}
              <div className="w-[136px] h-[136px] rounded-[24px] relative">
                <img
                  alt={`${userData.name} Avatar`}
                  className="w-full h-full rounded-[24px] object-cover"
                  src={userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=3525cd&color=fff&size=256`}
                />
              </div>

              {/* Profile Info */}
              <div className="flex flex-col items-start gap-2 w-full max-w-full">
                <h2 className="w-[180px] font-semibold text-[24px] leading-[32px] text-on-surface whitespace-nowrap">{userData.name}</h2>

                <div className="flex flex-row items-center gap-2 h-[16px]">
                  <p className="font-normal text-[12px] leading-[16px] flex items-center text-on-surface-variant">Account Status</p>
                  <div className="flex flex-row items-center gap-2">
                    <div className={`w-[6px] h-[6px] rounded-full ${userData.status === 'Active' ? 'bg-[#22C55E]' : 'bg-red-500'}`}></div>
                    <p className={`font-normal text-[12px] leading-[16px] flex items-center ${userData.status === 'Active' ? 'text-[#22C55E]' : 'text-red-500'}`}>{userData.status}</p>
                  </div>
                </div>

                <div className="flex flex-row items-center gap-2 h-[16px] whitespace-nowrap">
                  <p className="font-normal text-[12px] leading-[16px] text-center text-on-surface-variant">Following {userData.stats?.following || 0}</p>
                  <div className="w-[4px] h-[4px] bg-outline-variant rounded-full"></div>
                  <p className="font-normal text-[12px] leading-[16px] text-center text-on-surface-variant">Followers {userData.stats?.followers || 0}</p>
                  <div className="w-[4px] h-[4px] bg-outline-variant rounded-full"></div>
                  <p className="font-normal text-[12px] leading-[16px] text-center text-on-surface-variant">Connections {userData.stats?.connections || 0}</p>
                </div>

                <div className="flex flex-row justify-center items-center gap-2 h-[20px] whitespace-nowrap">
                  <p className="font-normal text-[14px] leading-[20px] text-on-surface-variant">User ID: #{userData.id?.split('-')[0]}</p>
                  <div className="w-[6px] h-[6px] bg-outline-variant rounded-full"></div>
                  <p className="font-normal text-[14px] leading-[20px] text-on-surface-variant">Joined {userData.joined ? format(new Date(userData.joined), 'MMM d, yyyy') : 'Unknown'}</p>
                </div>

                <div className="flex flex-row items-center gap-2 w-full md:w-auto md:min-w-[300px] h-[20px] whitespace-nowrap">
                  <p className="font-normal text-[14px] leading-[20px] text-center text-on-surface">{userData.email}</p>
                  <div className="w-[6px] h-[6px] bg-outline-variant rounded-full"></div>
                  <p className="font-normal text-[14px] leading-[20px] text-center text-on-surface">{userData.phone || 'Not provided'}</p>
                  <div className="w-[6px] h-[6px] bg-outline-variant rounded-full"></div>
                  <p className="font-normal text-[14px] leading-[20px] text-center text-on-surface">{userData.location || 'Unknown'}</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="box-border flex flex-row items-center justify-center mx-auto w-[40px] h-[40px] border border-outline-variant rounded-[8px] hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface rotate-90 w-[24px] h-[24px] flex items-center justify-center">more_vert</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 bg-surface-container-high border border-outline-variant rounded-xl shadow-lg p-2 w-[160px] z-50 flex flex-col gap-1">
                  <button onClick={() => { setMenuOpen(false); setWarningModalOpen(true); }} className="text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container-highest rounded-md">Warn User</button>
                  {userData.status === 'Deleted' ? (
                    <button onClick={() => { setMenuOpen(false); handleRestoreUser(); }} className="text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container-highest rounded-md">Restore Account</button>
                  ) : (
                    <>
                      {userData.status === 'Suspended' ? (
                        <button onClick={() => { setMenuOpen(false); handleUnsuspendUser(); }} className="text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container-highest rounded-md">Restore User</button>
                      ) : (
                        <button onClick={() => { setMenuOpen(false); setSuspendConfirmModalOpen(true); }} className="text-left px-3 py-2 text-sm text-on-surface hover:bg-surface-container-highest rounded-md">Suspend User</button>
                      )}
                      <button onClick={() => { setMenuOpen(false); setDeleteModalOpen(true); }} className="text-left px-3 py-2 text-sm text-error hover:bg-error-container rounded-md">Delete Account</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full min-h-[94px]">
            <div className="box-border flex flex-col justify-center items-start p-4 gap-2 w-full flex-1 h-[94px] bg-surface border border-outline-variant rounded-[24px]">
              <div className="flex flex-col items-start w-full h-[32px]">
                <p className="font-semibold text-[24px] leading-[32px] flex items-center text-[#FF6B6B]">{userData.stats?.moderation_flags || 0}</p>
              </div>
              <div className="flex flex-col items-start w-full h-[20px]">
                <p className="w-full font-normal text-[14px] leading-[20px] flex items-center text-on-surface">Moderation Flags</p>
              </div>
            </div>

            <div className="box-border flex flex-col justify-center items-start p-4 gap-2 w-full flex-1 h-[94px] bg-surface border border-outline-variant rounded-[24px]">
              <div className="flex flex-col items-start w-full h-[32px]">
                <p className="font-semibold text-[24px] leading-[32px] flex items-center text-[#FBBF24]">{userData.suspensionCount || 0}</p>
              </div>
              <div className="flex flex-col items-start w-full h-[20px]">
                <p className="w-full font-normal text-[14px] leading-[20px] flex items-center text-on-surface">Suspensions</p>
              </div>
            </div>

            <div className="box-border flex flex-col justify-center items-start p-4 gap-2 w-full flex-1 h-[94px] bg-surface border border-outline-variant rounded-[24px]">
              <div className="flex flex-col items-start w-full h-[32px]">
                <p className="font-semibold text-[24px] leading-[32px] flex items-center text-[#6366F1]">{userData.socialAccounts?.length || 0}</p>
              </div>
              <div className="flex flex-col items-start w-full h-[20px]">
                <p className="w-full font-normal text-[14px] leading-[20px] flex items-center text-on-surface">Linked Accounts</p>
              </div>
            </div>
          </div>

          {/* Chips */}
          <div className="flex flex-row justify-between items-center w-full h-[40px] mb-2">
            <div className="flex flex-row items-center gap-4 h-[40px] overflow-x-auto pb-2 px-1 max-w-full">
              <button
                onClick={() => setActiveMainTab('Activity')}
                className={`box-border flex flex-row justify-center items-center px-4 py-[6px] h-[32px] rounded-[24px] transition-colors ${activeMainTab === 'Activity' ? 'bg-surface-container-high border-surface-container-high' : 'bg-surface border-outline-variant'} border`}
              >
                <p className={`h-[20px] font-medium text-[14px] leading-[20px] flex items-center text-center ${activeMainTab === 'Activity' ? 'text-primary' : 'text-on-surface-variant'}`}>Activity</p>
              </button>
              <button
                onClick={() => setActiveMainTab('Reports')}
                className={`box-border flex flex-row justify-center items-center px-4 py-[6px] h-[32px] rounded-[24px] transition-colors ${activeMainTab === 'Reports' ? 'bg-surface-container-high border-surface-container-high' : 'bg-surface border-outline-variant'} border`}
              >
                <p className={`font-normal text-[14px] leading-[20px] flex items-center text-center ${activeMainTab === 'Reports' ? 'text-primary' : 'text-on-surface-variant'}`}>Reports</p>
              </button>
              <button
                onClick={() => setActiveMainTab('Thoughts')}
                className={`box-border flex flex-row justify-center items-center px-4 py-[6px] h-[32px] rounded-[24px] transition-colors ${activeMainTab === 'Thoughts' ? 'bg-surface-container-high border-surface-container-high' : 'bg-surface border-outline-variant'} border`}
              >
                <p className={`font-normal text-[14px] leading-[20px] flex items-center text-center ${activeMainTab === 'Thoughts' ? 'text-primary' : 'text-on-surface-variant'}`}>Thoughts</p>
              </button>
            </div>
            <div className="flex flex-row items-center h-[40px] pb-2 px-1">
              <button
                onClick={() => setActiveMainTab('Admin Action History')}
                className={`box-border flex flex-row justify-center items-center px-4 py-[6px] h-[32px] rounded-[24px] transition-colors ${activeMainTab === 'Admin Action History' ? 'bg-error-container text-error border-error-container' : 'bg-surface border-outline-variant'} border`}
              >
                <p className={`font-medium text-[14px] leading-[20px] flex items-center text-center ${activeMainTab === 'Admin Action History' ? 'text-error' : 'text-on-surface-variant'}`}>Admin Action History</p>
              </button>
            </div>
          </div>

          {/* Tab Content Area */}
          {activeMainTab === 'Activity' && (
            <div className="flex flex-col items-start gap-4 w-full min-h-[522px]">
              <div className="flex flex-row items-center gap-2 w-full h-[26px]">
                <div className="flex flex-col items-start gap-1 w-[636px] h-[26px]">
                  <h3 className="w-[135px] font-medium text-[18px] leading-[26px] flex items-center text-on-surface">Activity History</h3>
                </div>
              </div>

              <div className="flex flex-col items-start gap-4 w-full h-[36px]">
                <div className="flex flex-row items-start gap-4 h-[36px]">
                  <button
                    onClick={() => { setActivityFilter('All'); setVisibleCount(10); }}
                    className={`box-border flex flex-row justify-center items-center px-4 py-2 gap-[10px] h-[36px] ${activityFilter === 'All' ? 'border-b border-primary' : ''}`}
                    style={{ filter: activityFilter === 'All' ? 'drop-shadow(0px 1px 4px rgba(99, 102, 241, 0.08))' : 'none' }}
                  >
                    <p className={`h-[20px] font-semibold text-[14px] leading-[20px] ${activityFilter === 'All' ? 'text-primary' : 'text-on-surface-variant'}`}>All</p>
                  </button>
                  <button
                    onClick={() => { setActivityFilter('Posts'); setVisibleCount(10); }}
                    className={`flex flex-row justify-center items-center px-4 py-2 gap-[10px] h-[36px] rounded-[24px] hover:bg-surface-container-high ${activityFilter === 'Posts' ? 'border-b border-primary rounded-none' : ''}`}
                  >
                    <p className={`font-normal text-[14px] leading-[20px] ${activityFilter === 'Posts' ? 'text-primary' : 'text-on-surface-variant'}`}>Posts</p>
                  </button>
                  <button
                    onClick={() => { setActivityFilter('Engagement'); setVisibleCount(10); }}
                    className={`flex flex-row justify-center items-center px-4 py-2 gap-[10px] h-[36px] rounded-[24px] hover:bg-surface-container-high ${activityFilter === 'Engagement' ? 'border-b border-primary rounded-none' : ''}`}
                  >
                    <p className={`font-normal text-[14px] leading-[20px] ${activityFilter === 'Engagement' ? 'text-primary' : 'text-on-surface-variant'}`}>Engagement</p>
                  </button>
                </div>
              </div>

              <div className="flex flex-row items-start gap-4 w-full h-[700px] md:h-auto md:flex-1 min-h-[600px]">
                <div className="w-full h-[700px] bg-surface-container-low rounded-[24px] p-6 overflow-y-auto">
                  {filteredActivity.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">inbox</span>
                      <p className="text-on-surface-variant font-medium">No activity found.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6 relative">
                      {/* Activity Line */}
                      <div className="absolute left-[15px] top-4 bottom-4 w-[2px] bg-outline-variant z-0"></div>
                      {filteredActivity.slice(0, visibleCount).map((activity) => (
                        <div key={activity.id} className="flex gap-4 relative items-start z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 border-surface-container ${activity.color}`}>
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{activity.icon}</span>
                          </div>
                          <div className="flex-1 pb-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-normal text-[14px] leading-[20px] text-on-surface"><span className="font-semibold">{userData.name}</span> {activity.text}.</p>
                              {activity.type === 'job' && activity.full_id && (
                                <button
                                  onClick={() => navigator.clipboard.writeText(activity.full_id)}
                                  className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center shrink-0 w-6 h-6 rounded-md hover:bg-surface-container-high"
                                  title="Copy full Job ID"
                                >
                                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                </button>
                              )}
                            </div>
                            {(activity.type === 'post' || activity.type === 'engagement') && (activity.post_content || (activity.post_media && activity.post_media.length > 0)) && (
                              <div className="mt-3 bg-surface p-4 rounded-[16px] shadow-sm w-full max-w-2xl border border-outline-variant">
                                {/* Post Header */}
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest shrink-0">
                                    <img src={activity.target_user_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.target_user_name || userData.name)}&background=3525cd&color=fff&size=256`} className="w-full h-full object-cover" alt="avatar" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <p className="font-bold text-[15px] text-on-surface leading-tight">{activity.target_user_name || userData.name}</p>
                                      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">more_vert</span>
                                    </div>
                                    <p className="text-[13px] text-on-surface-variant leading-tight mt-0.5">Working Professional</p>
                                    {activity.post_created_at && <p className="text-[12px] text-on-surface-variant mt-0.5">{formatDistanceToNow(new Date(activity.post_created_at), { addSuffix: true })}</p>}
                                  </div>
                                </div>
                                
                                {/* Post Content & Media */}
                                <div className="mt-2">
                                  {activity.post_content && (
                                    activity.post_content.trim().startsWith('<') || activity.post_content.includes('<!-- article_divider -->') ? (
                                      <div 
                                        className="text-[14px] text-on-surface mb-3 px-1 prose prose-sm max-w-none dark:prose-invert [&_*]:!bg-transparent [&_*]:!color-inherit"
                                        dangerouslySetInnerHTML={{ 
                                          __html: activity.post_content.replace(/<!--\s*article_divider\s*-->/g, '') 
                                        }} 
                                      />
                                    ) : (
                                      <p className="text-[14px] text-on-surface whitespace-pre-wrap mb-3 px-1">{activity.post_content}</p>
                                    )
                                  )}
                                  {activity.post_media && activity.post_media.length > 0 && (
                                    <div className={`grid gap-2 ${activity.post_media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                      {activity.post_media.map((media, idx) => (
                                        media.media_type === 'video' ? (
                                          <video key={idx} src={media.url} controls className="w-full rounded-[12px] h-auto max-h-[500px] object-cover bg-black" />
                                        ) : (
                                          <img key={idx} src={media.url} alt="Post media" className="w-full rounded-[12px] h-auto max-h-[500px] object-contain bg-surface-container-lowest" />
                                        )
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Post Actions */}
                                <div className="flex items-center justify-between mt-4 px-1">
                                  <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-1.5 cursor-pointer text-primary hover:text-primary-dark transition-colors">
                                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>thumb_up</span>
                                      <span className="text-[13px] font-medium">1</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 cursor-pointer text-on-surface-variant hover:text-primary transition-colors">
                                      <span className="material-symbols-outlined text-[20px] scale-x-[-1]">chat_bubble_outline</span>
                                      <span className="text-[13px] font-medium">0</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 cursor-pointer text-on-surface-variant hover:text-primary transition-colors">
                                      <span className="material-symbols-outlined text-[20px]">repeat</span>
                                      <span className="text-[13px] font-medium">0</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 cursor-pointer text-on-surface-variant hover:text-primary transition-colors">
                                      <span className="material-symbols-outlined text-[20px] -rotate-45 mb-1">send</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center cursor-pointer text-on-surface-variant hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">bookmark_border</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            <time className="text-[12px] text-on-surface-variant mt-2 block">{activity.time}</time>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeMainTab === 'Reports' && (
            <div className="flex flex-col items-start gap-4 w-full min-h-[522px]">
              <div className="w-full bg-surface-container-low rounded-[24px] p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-[18px] text-on-surface">Reports Associated with User</h3>
                  <div className="flex bg-surface-container-high rounded-lg p-1 border border-outline-variant">
                    <button
                      onClick={() => setActiveReportTab('onUser')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeReportTab === 'onUser' ? 'bg-surface text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                      Reports on User ({reportsOnUser.length})
                    </button>
                    <button
                      onClick={() => setActiveReportTab('submitted')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeReportTab === 'submitted' ? 'bg-surface text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
                    >
                      Submitted by User ({reportsSubmitted.length})
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {reportsLoading ? (
                    <div className="flex justify-center p-10"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>
                  ) : (
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="border-b border-outline-variant text-on-surface-variant text-sm font-medium">
                          <th className="pb-3 pr-4 font-semibold">Date</th>
                          <th className="pb-3 pr-4 font-semibold">Target / Reporter</th>
                          <th className="pb-3 pr-4 font-semibold">Reason</th>
                          <th className="pb-3 pr-4 font-semibold">Severity</th>
                          <th className="pb-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(activeReportTab === 'onUser' ? reportsOnUser : reportsSubmitted).length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center py-10 text-on-surface-variant">
                              No reports found.
                            </td>
                          </tr>
                        ) : (
                          (activeReportTab === 'onUser' ? reportsOnUser : reportsSubmitted).map(report => (
                            <tr key={report.id} className="border-b border-outline-variant hover:bg-surface-container-high transition-colors cursor-pointer" onClick={() => { setSelectedReport(report); setReportModalOpen(true); }}>
                              <td className="py-4 pr-4 text-sm text-on-surface-variant whitespace-nowrap">
                                {report.postTime ? format(new Date(report.postTime), 'MMM d, yyyy') : 'Unknown'}
                              </td>
                              <td className="py-4 pr-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-bold text-sm shrink-0">
                                    {(activeReportTab === 'onUser' ? report.reportedBy : report.targetUserName)?.charAt(0).toUpperCase() || '?'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-on-surface">
                                      {activeReportTab === 'onUser' ? report.reportedBy : report.targetUserName}
                                    </p>
                                    <p className="text-xs text-on-surface-variant">
                                      {activeReportTab === 'onUser' ? 'Reporter' : 'Target'}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 pr-4 max-w-[300px]">
                                <p className="text-sm font-medium text-on-surface">{report.reason}</p>
                                <p className="text-xs text-[#6B7280] truncate" title={report.contentPreview}>{report.contentPreview || 'No additional content'}</p>
                              </td>
                              <td className="py-4 pr-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${report.severity === 'High' ? 'bg-red-100 text-red-700' :
                                    report.severity === 'Medium' ? 'bg-orange-100 text-orange-700' :
                                      'bg-gray-100 text-gray-700'
                                  }`}>
                                  {report.severity || 'Low'}
                                </span>
                              </td>
                              <td className="py-4">
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                    report.status === 'dismissed' ? 'bg-gray-100 text-gray-700' :
                                      'bg-blue-100 text-blue-700'
                                  } capitalize`}>
                                  {report.status || 'Active'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeMainTab === 'Admin Action History' && (
            <div className="flex flex-col items-start gap-4 w-full min-h-[522px]">
              <div className="w-full bg-surface-container-low rounded-[24px] p-6 overflow-y-auto relative">
                <h3 className="font-medium text-[18px] text-on-surface mb-6">Admin Action History</h3>
                {(!userData.actionHistory || userData.actionHistory.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">assignment_late</span>
                    <p className="text-on-surface-variant font-medium">No past actions.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 relative">
                    <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-outline-variant z-0"></div>
                    {userData.actionHistory.map((action) => (
                      <div key={action.id} className="flex gap-4 relative items-start z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 border-surface-container ${action.is_severe ? 'bg-error-container text-error' : 'bg-warning-container text-warning'}`}>
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{action.is_severe ? 'gavel' : 'warning'}</span>
                        </div>
                        <div className="flex-1 pb-1">
                          <p className="font-semibold text-[14px] text-on-surface">{action.reason}</p>
                          <p className="text-[13px] text-on-surface-variant mb-1">{action.message || 'No additional message provided.'}</p>
                          <time className="text-[12px] text-on-surface-variant block">{formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}</time>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeMainTab === 'Thoughts' && (
            <div className="flex flex-col items-start gap-4 w-full min-h-[522px]">
              <div className="w-full bg-surface-container-low rounded-[24px] p-6 overflow-y-auto relative">
                <h3 className="font-medium text-[18px] text-on-surface mb-6">User Thoughts</h3>
                {thoughtsLoading ? (
                  <div className="flex justify-center p-10"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>
                ) : (!userThoughts || userThoughts.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">forum</span>
                    <p className="text-on-surface-variant font-medium">No thoughts posted by this user.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 relative">
                    <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-outline-variant z-0"></div>
                    {userThoughts.map((thought) => (
                      <div key={thought.id} className="flex gap-4 relative items-start z-10">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 border-surface-container bg-surface-container-highest text-primary">
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
                        </div>
                        <div className="flex-1 pb-1">
                          <p className="font-normal text-[14px] text-on-surface whitespace-pre-wrap mb-2">{thought.content}</p>
                          {thought.postSnippet && (
                            <div
                              className="bg-surface p-3 rounded-lg border border-outline-variant mb-2 cursor-pointer hover:bg-surface-container-high transition-colors"
                              onClick={() => thought.post_id && setSelectedPostId(thought.post_id)}
                            >
                              <p className="text-[11px] font-medium text-on-surface-variant mb-1">Replying to post:</p>
                              <p className="text-[13px] italic text-on-surface-variant">"{thought.postSnippet}"</p>
                            </div>
                          )}
                          <time className="text-[12px] text-on-surface-variant block">{formatDistanceToNow(new Date(thought.created_at), { addSuffix: true })}</time>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Report Details Modal */}
        {reportModalOpen && selectedReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
            <div className="bg-surface border border-outline-variant w-[550px] max-w-[90vw] rounded-xl shadow-xl p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">description</span>
                  Report Details
                </h3>
                <button onClick={() => setReportModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors">close</button>
              </div>

              <div className="overflow-y-auto pr-2 space-y-4">
                <div className="flex items-center gap-4 border-b border-outline-variant pb-4">
                  <div className="flex-1">
                    <p className="text-[11px] font-mono-label text-on-surface-variant mb-1 uppercase">Reported By</p>
                    <p className="font-medium text-sm">{selectedReport.reportedBy || 'Unknown'}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-mono-label text-on-surface-variant mb-1 uppercase">Target User</p>
                    <p className="font-medium text-sm">{selectedReport.targetUserName || 'Unknown'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-mono-label text-on-surface-variant mb-1 uppercase">Date Filed</p>
                    <p className="text-sm">{selectedReport.postTime ? format(new Date(selectedReport.postTime), 'MMM d, yyyy h:mm a') : 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono-label text-on-surface-variant mb-1 uppercase">Status</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${selectedReport.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        selectedReport.status === 'dismissed' ? 'bg-surface-container text-on-surface-variant' :
                          'bg-blue-100 text-blue-700'
                      } capitalize`}>
                      {selectedReport.status || 'Active'}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono-label text-on-surface-variant mb-1 uppercase">Reason</p>
                    <p className="text-sm font-medium">{selectedReport.reason}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono-label text-on-surface-variant mb-1 uppercase">Severity</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${selectedReport.severity === 'High' ? 'bg-error-container text-error' :
                        selectedReport.severity === 'Medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-surface-container-high text-on-surface'
                      }`}>
                      {selectedReport.severity || 'Low'}
                    </span>
                  </div>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-3">
                  <p className="text-[11px] font-mono-label text-on-surface-variant mb-1 uppercase">Reported Content Preview</p>
                  <p className="text-sm whitespace-pre-wrap text-on-surface">{selectedReport.contentPreview || 'No preview available.'}</p>
                </div>

                {selectedReport.image && (
                  <div className="mt-4">
                    <p className="text-[11px] font-mono-label text-on-surface-variant mb-2 uppercase">Attached Image</p>
                    <img src={selectedReport.image} alt="Report attachment" className="w-full rounded-lg border border-outline-variant max-h-[200px] object-cover" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 pt-4 mt-4 border-t border-outline-variant shrink-0">
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="w-full py-2 rounded-lg text-sm font-semibold border border-outline-variant text-on-surface hover:bg-surface-container transition-colors shadow-sm"
                >
                  Close
                </button>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handleDismissReport}
                    className="bg-[#310bba] text-white py-2.5 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center leading-tight hover:brightness-110"
                  >
                    <span>Dismiss All</span>
                    <span>Reports</span>
                  </button>
                  <button
                    onClick={() => { setReportModalOpen(false); setWarningModalOpen(true); }}
                    className="bg-[#ff6f00] text-white py-2.5 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center hover:brightness-110"
                  >
                    Warn User
                  </button>
                  <button
                    onClick={handleDeleteContent}
                    className="bg-[#b30000] text-white py-2.5 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center hover:brightness-110"
                  >
                    Delete Content
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                You are sending an official warning to <strong>{userData.name}</strong>. They will receive this via email.
              </p>

              <div className="flex flex-col gap-4 mb-6">
                <div>
                  <label className="block text-[11px] font-mono-label text-on-surface-variant mb-xs ml-1">REASON</label>
                  <select
                    value={warningReason}
                    onChange={(e) => setWarningReason(e.target.value)}
                    className="w-full bg-surface border border-outline-variant rounded-lg px-md py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  >
                    <optgroup label="Tier 1 (Minor)">
                      <option>Spam</option>
                      <option>Low-quality content</option>
                      <option>Wrong category posting</option>
                    </optgroup>
                    <optgroup label="Tier 2 (Moderate)">
                      <option>Mild Harassment</option>
                      <option>Misleading Info</option>
                      <option>Fake Engagement</option>
                    </optgroup>
                    <optgroup label="Tier 3 (Severe)">
                      <option>Targeted Harassment</option>
                      <option>Hate Speech</option>
                      <option>Fraud</option>
                    </optgroup>
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
                Are you sure you want to suspend <strong>{userData.name}</strong>? This will revoke their access to the platform based on the selected duration.
              </p>

              <div className="mb-6">
                <label className="block text-[11px] font-mono-label text-on-surface-variant mb-xs ml-1">SUSPENSION DURATION</label>
                <select
                  value={suspendDuration}
                  onChange={(e) => setSuspendDuration(e.target.value)}
                  className="w-full bg-surface border border-outline-variant rounded-lg px-md py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                >
                  <option value="Short Temporary (3-7 days)">Short Temporary (3-7 days)</option>
                  {role === 'admin' && (
                    <>
                      <option value="Long Temporary (30 days)">Long Temporary (30 days)</option>
                      <option value="Permanent (Pending Review)">Permanent (Pending Review)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setSuspendConfirmModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">Cancel</button>
                <button
                  onClick={handleSuspendUser}
                  className="bg-error text-on-error px-4 py-2 rounded-lg text-sm font-medium hover:bg-error/90 transition-colors shadow-sm active:scale-95"
                >
                  Yes, Suspend
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View All Activity Modal */}
        {activityModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface border border-outline-variant w-[650px] max-w-[90vw] max-h-[85vh] flex flex-col rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="p-6 border-b border-outline-variant flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">history</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-on-surface">Activity History</h3>
                    <p className="text-sm text-on-surface-variant font-medium">{userData.name}</p>
                  </div>
                </div>
                <button onClick={() => setActivityModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors p-1">close</button>
              </div>

              {/* Filters */}
              <div className="px-6 py-4 border-b border-outline-variant shrink-0 flex gap-3 overflow-x-auto">
                <button
                  onClick={() => { setActivityFilter('All'); setVisibleCount(10); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 transition-colors ${activityFilter === 'All' ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest'}`}
                >
                  All
                </button>
                <button
                  onClick={() => { setActivityFilter('Posts'); setVisibleCount(10); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 transition-colors ${activityFilter === 'Posts' ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest'}`}
                >
                  Posts
                </button>
                <button
                  onClick={() => { setActivityFilter('Engagement'); setVisibleCount(10); }}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 transition-colors ${activityFilter === 'Engagement' ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest'}`}
                >
                  Engagement
                </button>
              </div>

              {/* Scrollable Feed */}
              <div className="p-6 overflow-y-auto space-y-6 relative flex-1">
                <div className="absolute left-6 top-6 bottom-6 w-[2px] bg-outline-variant ml-[11px]"></div>

                {filteredActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 relative z-10 bg-surface rounded-xl">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">inbox</span>
                    <p className="text-on-surface-variant font-medium">No activity found for this category.</p>
                  </div>
                ) : (
                  filteredActivity.slice(0, visibleCount).map((activity) => (
                    <div key={activity.id} className="flex gap-4 relative group items-start">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0 shadow-md border-4 border-surface ${activity.color}`}>
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{activity.icon}</span>
                      </div>
                      <div className="flex-1 p-4 rounded-xl border border-outline-variant bg-surface hover:border-primary/50 hover:bg-primary/5 transition-colors shadow-sm">
                        <p className="font-body-md text-body-md text-on-surface mb-1"><span className="font-bold text-primary">{userData.name}</span> {activity.text}.</p>
                        <time className="text-sm text-on-surface-variant font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          {activity.time}
                        </time>
                      </div>
                    </div>
                  ))
                )}

                {/* Load More Button simulating pagination */}
                {visibleCount < filteredActivity.length && (
                  <div className="pt-4 flex justify-center relative z-10">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      className="px-6 py-2.5 rounded-full border border-outline-variant text-primary font-semibold hover:bg-primary/5 transition-colors flex items-center gap-2 bg-surface disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className={`material-symbols-outlined text-[20px] ${isLoadingMore ? 'animate-spin' : ''}`}>
                        {isLoadingMore ? 'progress_activity' : 'refresh'}
                      </span>
                      {isLoadingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DangerModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteUser}
          title="Delete Account"
          message={`Are you sure you want to permanently delete ${userData.name}'s account? This will softly delete the user from the database. This action cannot be easily undone.`}
          actionText="Permanently Delete"
        />

        <PostModal
          isOpen={!!selectedPostId}
          onClose={() => setSelectedPostId(null)}
          postId={selectedPostId}
        />
      </div>
    );
  } catch (err) {
    return (
      <div className="p-20 flex flex-col justify-center items-center h-screen bg-red-50">
        <h1 className="text-3xl text-red-600 font-bold mb-4">Runtime Crash</h1>
        <p className="text-lg text-red-800 font-mono bg-red-100 p-4 rounded-lg">{err.message}</p>
        <pre className="mt-4 p-4 bg-gray-900 text-red-400 rounded-lg max-w-4xl overflow-auto text-sm">
          {err.stack}
        </pre>
      </div>
    );
  }
}
