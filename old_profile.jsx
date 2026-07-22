import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../AuthContext';
import DangerModal from '../components/DangerModal';

const baseActivity = [
  { id: 1, text: 'posted a new photo in Urban Photography', time: '12 minutes ago', icon: 'photo', color: 'bg-primary text-white ring-0', type: 'post' },
  { id: 2, text: 'updated his professional bio', time: '4 hours ago', icon: 'person', color: 'bg-surface-container-highest text-primary ring-2 ring-surface', type: 'profile' },
  { id: 3, text: 'joined the Tech Discussions group', time: 'Yesterday at 11:30 PM', icon: 'group_add', color: 'bg-surface-container-highest text-primary ring-2 ring-surface', type: 'group' },
  { id: 4, text: 'Account received a Spam Flag from a moderator', time: 'Oct 24, 2023', icon: 'warning', color: 'bg-error-container text-error ring-2 ring-surface', type: 'moderation' },
  { id: 41, text: 'Appeal Decision: Account Reinstated', time: 'Oct 23, 2023', icon: 'gavel', color: 'bg-green-100 text-green-700 ring-2 ring-surface', type: 'moderation' },
  { id: 42, text: 'Submitted an Appeal: "My account was hacked..."', time: 'Oct 23, 2023', icon: 'edit_document', color: 'bg-surface-container-highest text-primary ring-2 ring-surface', type: 'moderation' },
  { id: 43, text: 'Suspended (Short Temporary) by Admin', time: 'Oct 22, 2023', icon: 'block', color: 'bg-error text-white ring-0', type: 'moderation' },
  { id: 5, text: 'liked a comment on "The Future of AI"', time: 'Oct 21, 2023', icon: 'thumb_up', color: 'bg-surface-container-highest text-primary ring-2 ring-surface', type: 'engagement' },
  { id: 6, text: 'commented: "Great insights!"', time: 'Oct 22, 2023', icon: 'comment', color: 'bg-surface-container-highest text-primary ring-2 ring-surface', type: 'engagement' },
  { id: 7, text: 'shared a post from TechCrunch', time: 'Oct 21, 2023', icon: 'share', color: 'bg-surface-container-highest text-primary ring-2 ring-surface', type: 'post' },
  { id: 8, text: 'applied for a job at Google', time: 'Oct 20, 2023', icon: 'work', color: 'bg-surface-container-highest text-primary ring-2 ring-surface', type: 'job' },
  { id: 9, text: 'connected with Jane Doe', time: 'Oct 19, 2023', icon: 'handshake', color: 'bg-surface-container-highest text-primary ring-2 ring-surface', type: 'network' },
  { id: 10, text: 'published an article: "React best practices"', time: 'Oct 18, 2023', icon: 'article', color: 'bg-primary text-white ring-0', type: 'post' },
];

const mockAllActivity = [
  ...baseActivity,
  ...baseActivity.map(a => ({ ...a, id: a.id + 10, time: 'Older' })),
  ...baseActivity.map(a => ({ ...a, id: a.id + 20, time: 'Even Older' }))
];

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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
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

  const realAllActivity = (userData?.activities || [])
    .filter(a => {
      const type = (a.action_type || '').toLowerCase();
      return !(
        type === 'moderation_warn' ||
        type.includes('report') ||
        type.includes('suspend') ||
        type.includes('moderation')
      );
    })
    .map(a => {
      let icon = 'history';
      let color = 'bg-surface-container-highest text-primary ring-2 ring-surface';
      let text = `performed action: ${a.action_type}`;
      let type = 'other';

      if (a.action_type === 'like_post') { icon = 'thumb_up'; text = 'liked a post'; type = 'engagement'; }
      else if (a.action_type === 'vote_poll') { icon = 'how_to_vote'; text = 'voted on a poll'; type = 'engagement'; }
      else if (a.action_type === 'repost_post') { icon = 'repeat'; text = 'reposted a post'; type = 'engagement'; }
      else if (a.action_type === 'comment_post') { icon = 'comment'; text = 'commented on a post'; type = 'engagement'; }
      else if (a.action_type === 'POST_CREATED' || a.action_type.includes('post')) { icon = 'post_add'; color = 'bg-primary text-white ring-0'; text = 'created a new post'; type = 'post'; }
      else if (a.action_type === 'PROFILE_UPDATED' || a.action_type.includes('profile')) { icon = 'person'; text = 'updated their profile'; type = 'profile'; }
      else if (a.action_type === 'USER_LOGGED_IN') { icon = 'login'; text = 'logged in'; type = 'profile'; }
      else if (a.action_type === 'JOB_APPLIED' || a.action_type.includes('job')) { icon = 'work'; text = 'applied for a job'; type = 'job'; }
      else if (a.action_type.includes('CONNECTION') || a.action_type.includes('connect')) { icon = 'handshake'; text = 'network connection event'; type = 'network'; }

      return {
        id: a.id,
        text,
        time: formatDistanceToNow(new Date(a.created_at), { addSuffix: true }),
        icon,
        color,
        type
      };
    });

  const filteredActivity = activityFilter === 'All' 
    ? realAllActivity 
    : realAllActivity.filter(a => {
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

  try {
    return (
    <div className="max-w-[1440px] mx-auto pb-xl">
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate(from)} 
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Back to {backLabel}
        </button>
      </div>

      {/* Header Profile Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-lg mb-xl">
        <div className="flex items-center gap-lg">
          <div className="relative">
            <img 
              alt="${userData.name} Avatar" 
              className="w-32 h-32 rounded-xl border-4 border-surface shadow-sm object-cover" 
              src={userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=3525cd&color=fff&size=256`} 
            />
            <span className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-surface w-6 h-6 rounded-full" title="Status: Active"></span>
          </div>
          <div>
            <div className="flex items-center gap-sm mb-xs">
              <h2 className="font-display-lg text-display-lg text-on-surface">{userData.name}</h2>
              <span className="bg-primary-container text-on-primary-container font-label-md text-label-md px-sm py-xs rounded-lg">{userData.role}</span>
              <span className={`font-label-md text-label-md px-sm py-xs rounded-lg flex items-center gap-1 ${userData.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-error-container text-error'}`}>
    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{userData.status === 'Active' ? 'check_circle' : 'cancel'}</span>
    {userData.status}
  </span>
            </div>
            <p className="text-on-surface-variant font-body-md text-body-md">User ID: #{userData.id.split('-')[0]} ΓÇó Joined {userData.joined ? format(new Date(userData.joined), 'MMM d, yyyy') : 'Unknown'}</p>
          </div>
        </div>
        <div className="flex items-center gap-md">
          {role !== 'developer' && (
            <>
              <button 
                onClick={() => setWarningModalOpen(true)}
                className="flex items-center gap-xs border border-outline text-on-surface font-label-md text-label-md px-lg py-md rounded-xl hover:bg-surface-container-high transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                Notify User
              </button>
              {userData.status === 'Suspended' ? (
                <button 
                  onClick={handleUnsuspendUser}
                  className="flex items-center gap-xs border border-green-600 text-green-600 font-label-md text-label-md px-lg py-md rounded-xl hover:bg-green-50 hover:border-transparent transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">undo</span>
                  Unsuspend User
                </button>
              ) : (
                <button 
                  onClick={() => setSuspendConfirmModalOpen(true)}
                  className="flex items-center gap-xs border border-error text-error font-label-md text-label-md px-lg py-md rounded-xl hover:bg-error-container hover:border-transparent transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">gavel</span>
                  Suspend User
                </button>
              )}
              <button 
                onClick={() => setDeleteModalOpen(true)}
                className="flex items-center gap-xs border border-error text-error font-label-md text-label-md px-lg py-md rounded-xl hover:bg-error-container hover:border-transparent transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                Delete Account
              </button>
            </>
          )}
        </div>
      </section>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-lg">
        
        {/* ΓöÇΓöÇ Metrics Grid ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
        <div className="col-span-12 space-y-lg">

          {/* Row 1 ΓÇô Activity Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {/* Total Posts */}
            <div className="bg-surface border border-outline-variant rounded-2xl p-lg flex items-center gap-lg hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>newsmode</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-0.5">Total Posts</p>
                <p className="text-3xl font-black text-on-surface leading-none">{userData.stats.posts}</p>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-0.5 shrink-0">
                <span className="material-symbols-outlined text-[13px]">trending_up</span>+12%
              </span>
            </div>

            {/* Followers */}
            <div className="bg-surface border border-outline-variant rounded-2xl p-lg flex items-center gap-lg hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-0.5">Followers</p>
                <p className="text-3xl font-black text-on-surface leading-none">{userData.stats.followers}</p>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-0.5 shrink-0">
                <span className="material-symbols-outlined text-[13px]">trending_up</span>+5%
              </span>
            </div>

            {/* Following */}
            <div className="bg-surface border border-outline-variant rounded-2xl p-lg flex items-center gap-lg hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-0.5">Following</p>
                <p className="text-3xl font-black text-on-surface leading-none">{userData.stats.following}</p>
              </div>
              <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded-full flex items-center gap-0.5 shrink-0">
                <span className="material-symbols-outlined text-[13px]">horizontal_rule</span>Stable
              </span>
            </div>
          </div>

          {/* Row 2 ΓÇô Moderation Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {/* Moderation Flags */}
            <div className="bg-surface border border-outline-variant rounded-2xl p-lg flex items-center gap-lg hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/20 transition-colors">
                <span className="material-symbols-outlined text-amber-600 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-0.5">Moderation Flags</p>
                <p className="text-3xl font-black text-on-surface leading-none">{userData.stats.moderation_flags}</p>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full shrink-0">
                Active
              </span>
            </div>

            {/* Linked Accounts */}
            <div className="bg-surface border border-outline-variant rounded-2xl p-lg flex items-center gap-lg hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                <span className="material-symbols-outlined text-blue-600 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-0.5">Linked Accounts</p>
                <p className="text-3xl font-black text-on-surface leading-none">
                  {userData.socialAccounts && userData.socialAccounts.length > 0 ? userData.socialAccounts.length : 0}
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-full shrink-0">
                Connected
              </span>
            </div>

            {/* Suspensions */}
            <div className={`rounded-2xl p-lg flex items-center gap-lg hover:shadow-md transition-all group border ${(userData.suspensionCount || 0) > 0 ? 'bg-error-container/30 border-error/30' : 'bg-surface border-outline-variant'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${(userData.suspensionCount || 0) > 0 ? 'bg-error/15 group-hover:bg-error/25' : 'bg-surface-container group-hover:bg-surface-container-high'}`}>
                <span className={`material-symbols-outlined text-[22px] ${(userData.suspensionCount || 0) > 0 ? 'text-error' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-0.5">Suspensions</p>
                <p className={`text-3xl font-black leading-none ${(userData.suspensionCount || 0) > 0 ? 'text-error' : 'text-on-surface'}`}>
                  {userData.suspensionCount || 0}
                </p>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${(userData.suspensionCount || 0) > 0 ? 'text-error bg-error/10' : 'text-on-surface-variant bg-surface-container'}`}>
                {(userData.suspensionCount || 0) > 0 ? 'History' : 'Clean'}
              </span>
            </div>
          </div>

        </div>

        {/* User Details Section */}
        <div className="col-span-12 lg:col-span-4 bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col lg:h-[650px]">
          <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low flex items-center gap-xs shrink-0">
            <span className="material-symbols-outlined text-on-surface-variant">info</span>
            <h4 className="font-headline-sm text-headline-sm">User Details</h4>
          </div>
          <div className="p-lg space-y-md flex-1 overflow-y-auto">
            <div className="flex flex-col gap-xs">
              <p className="font-label-md text-label-md text-on-surface-variant">Full Name</p>
              <p className="font-body-md text-body-md font-semibold">{userData.name}</p>
            </div>
            <div className="flex flex-col gap-xs">
              <p className="font-label-md text-label-md text-on-surface-variant">Email Address</p>
              <p className="font-body-md text-body-md font-semibold">{userData.email}</p>
            </div>
            <div className="flex flex-col gap-xs">
              <p className="font-label-md text-label-md text-on-surface-variant">Phone Number</p>
              <p className="font-body-md text-body-md font-semibold">{userData.phone || 'Not provided'}</p>
            </div>
            <div className="flex flex-col gap-xs">
              <p className="font-label-md text-label-md text-on-surface-variant">Location</p>
              <p className="font-body-md text-body-md font-semibold">{userData.location || 'Unknown'}</p>
            </div>
            <div className="flex flex-col gap-xs">
              <p className="font-label-md text-label-md text-on-surface-variant">Last Login</p>
              <p className="font-body-md text-body-md font-semibold">{userData.lastActive ? formatDistanceToNow(new Date(userData.lastActive), { addSuffix: true }) : 'Unknown'}</p>
            </div>
            <div className="pt-md">
              <div className="bg-surface-container-high rounded-xl p-md">
                <p className="font-label-md text-label-md text-on-surface-variant mb-sm">Location Data</p>
                <div className="w-full h-40 rounded-lg overflow-hidden relative group border border-outline-variant">
                  {userData.coordinates?.lat && userData.coordinates?.lng ? (
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${userData.coordinates.lat},${userData.coordinates.lng}&z=13&output=embed`}
                      allowFullScreen
                      title="User Location Map"
                    ></iframe>
                  ) : userData.location && userData.location !== 'Unknown' ? (
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(userData.location)}&z=11&output=embed`}
                      allowFullScreen
                      title="User Location Map"
                    ></iframe>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-variant grayscale opacity-70 z-20">
                      <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>location_off</span>
                      <p className="text-sm font-medium text-on-surface-variant">Location unavailable</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="col-span-12 lg:col-span-5 bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col lg:h-[650px]">
          <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low flex items-center justify-between shrink-0">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-on-surface-variant">history</span>
              <h4 className="font-headline-sm text-headline-sm">Activity Feed</h4>
            </div>
            <button onClick={() => setActivityModalOpen(true)} className="text-primary font-label-md text-label-md hover:underline">View All</button>
          </div>
          <div className={`p-lg space-y-lg relative flex-1 overflow-y-auto ${realAllActivity.length === 0 ? 'flex flex-col items-center justify-center' : ''}`}>
            {realAllActivity.length > 0 && <div className="absolute left-lg top-[3.5rem] bottom-lg w-[2px] bg-outline-variant ml-[11px]"></div>}
            
            {realAllActivity.length > 0 ? (
              realAllActivity.slice(0, 10).map((activity) => {
                return (
                  <div key={activity.id} className="flex gap-md relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 mt-0.5 shadow-sm ${activity.color}`}>
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{activity.icon}</span>
                    </div>
                    <div className="flex-1 pb-1">
                      <p className="font-body-md text-body-md"><span className="font-bold">{userData.name}</span> {activity.text}.</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">history</span>
                <p className="text-headline-sm text-on-surface-variant font-medium">No recent activity.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action History Section */}
        <div className="col-span-12 lg:col-span-3 bg-surface border border-outline-variant rounded-xl overflow-hidden flex flex-col lg:h-[650px]">
          <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low flex items-center gap-xs shrink-0">
            <span className="material-symbols-outlined text-on-surface-variant">assignment_late</span>
            <h4 className="font-headline-sm text-headline-sm">Action History</h4>
          </div>
          <div className={`p-lg space-y-lg relative flex-1 overflow-y-auto ${(!userData.actionHistory || userData.actionHistory.length === 0) ? 'flex flex-col items-center justify-center' : ''}`}>
              {userData.actionHistory && userData.actionHistory.length > 0 && (
                <div className="absolute left-lg top-[3.5rem] bottom-lg w-[2px] bg-outline-variant ml-[11px]"></div>
              )}
              
              {userData.actionHistory && userData.actionHistory.length > 0 ? (
                userData.actionHistory.map((action) => {
                  return (
                    <div key={action.id} className="flex gap-md relative w-full">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 mt-0.5 shadow-sm ${action.is_severe ? 'bg-error-container text-error ring-2 ring-surface' : 'bg-orange-100 text-orange-600 ring-2 ring-surface'}`}>
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>{action.is_severe ? 'gavel' : 'warning'}</span>
                      </div>
                      <div className="flex-1 pb-1">
                        <p className="font-body-md text-body-md font-bold">{action.reason}</p>
                        <p className="text-sm text-on-surface mb-1">{action.message || 'No additional message provided.'}</p>
                        <p className="text-xs text-on-surface-variant">{formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">assignment_late</span>
                  <p className="text-headline-sm text-on-surface-variant font-medium">No past actions.</p>
                </div>
              )}
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
