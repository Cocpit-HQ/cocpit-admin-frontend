import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

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
  const { role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningReason, setWarningReason] = useState('Spam');
  const [warningMessage, setWarningMessage] = useState('');
  const [suspendConfirmModalOpen, setSuspendConfirmModalOpen] = useState(false);
  const [suspendDuration, setSuspendDuration] = useState('Short Temporary (3-7 days)');
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 5);
      setIsLoadingMore(false);
    }, 800);
  };

  const filteredActivity = activityFilter === 'All' 
    ? mockAllActivity 
    : mockAllActivity.filter(a => {
        if (activityFilter === 'Posts') return a.type === 'post';
        if (activityFilter === 'Engagement') return a.type === 'engagement';
        if (activityFilter === 'Moderation') return a.type === 'moderation';
        if (activityFilter === 'Network') return a.type === 'network' || a.type === 'group';
        if (activityFilter === 'Profile') return a.type === 'profile';
        if (activityFilter === 'Jobs') return a.type === 'job';
        return false;
      });

  const handleSendWarning = () => {
    alert(`Warning sent to Omar Al-Fayed for ${warningReason}`);
    setWarningModalOpen(false);
    setWarningMessage('');
  };

  const handleSuspendUser = () => {
    alert(`Omar Al-Fayed has been suspended. Duration: ${suspendDuration}`);
    setSuspendConfirmModalOpen(false);
  };

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
              alt="Omar Al-Fayed Avatar" 
              className="w-32 h-32 rounded-xl border-4 border-surface shadow-sm object-cover" 
              src="https://ui-avatars.com/api/?name=Omar+Al-Fayed&background=3525cd&color=fff&size=256" 
            />
            <span className="absolute -bottom-2 -right-2 bg-green-500 border-4 border-surface w-6 h-6 rounded-full" title="Status: Active"></span>
          </div>
          <div>
            <div className="flex items-center gap-sm mb-xs">
              <h2 className="font-display-lg text-display-lg text-on-surface">Omar Al-Fayed</h2>
              <span className="bg-primary-container text-on-primary-container font-label-md text-label-md px-sm py-xs rounded-lg">Admin</span>
              <span className="bg-green-100 text-green-700 font-label-md text-label-md px-sm py-xs rounded-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                Active
              </span>
            </div>
            <p className="text-on-surface-variant font-body-md text-body-md">User ID: #USR-99421 • Joined Jan 12, 2021</p>
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
              <button 
                onClick={() => setSuspendConfirmModalOpen(true)}
                className="flex items-center gap-xs border border-error text-error font-label-md text-label-md px-lg py-md rounded-xl hover:bg-error-container hover:border-transparent transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">gavel</span>
                Suspend User
              </button>
            </>
          )}
        </div>
      </section>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-lg">
        
        {/* Statistics Grid */}
        <div className="col-span-12 grid grid-cols-2 md:grid-cols-4 gap-lg mb-sm">
          <div className="bg-surface border border-outline-variant p-lg rounded-xl flex flex-col justify-between hover:border-primary transition-all hover:bg-surface-container-low">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-primary">post</span>
              <span className="text-green-600 font-label-md text-label-md flex items-center">+12% <span className="material-symbols-outlined text-[14px]">trending_up</span></span>
            </div>
            <div className="mt-md">
              <p className="font-label-md text-label-md text-on-surface-variant">Total Posts</p>
              <h3 className="font-display-lg text-display-lg font-black mt-xs">1,284</h3>
            </div>
          </div>
          
          <div className="bg-surface border border-outline-variant p-lg rounded-xl flex flex-col justify-between hover:border-primary transition-all hover:bg-surface-container-low">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-primary">groups</span>
              <span className="text-green-600 font-label-md text-label-md flex items-center">+5% <span className="material-symbols-outlined text-[14px]">trending_up</span></span>
            </div>
            <div className="mt-md">
              <p className="font-label-md text-label-md text-on-surface-variant">Followers</p>
              <h3 className="font-display-lg text-display-lg font-black mt-xs">42.5k</h3>
            </div>
          </div>
          
          <div className="bg-surface border border-outline-variant p-lg rounded-xl flex flex-col justify-between hover:border-primary transition-all hover:bg-surface-container-low">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-primary">person_add</span>
              <span className="text-on-surface-variant font-label-md text-label-md flex items-center">Stable <span className="material-symbols-outlined text-[14px]">horizontal_rule</span></span>
            </div>
            <div className="mt-md">
              <p className="font-label-md text-label-md text-on-surface-variant">Following</p>
              <h3 className="font-display-lg text-display-lg font-black mt-xs">892</h3>
            </div>
          </div>
          
          <div className="bg-surface border border-outline-variant p-lg rounded-xl flex flex-col justify-between hover:border-primary transition-all hover:bg-surface-container-low border-l-4 border-l-tertiary">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-tertiary">flag</span>
              <span className="text-error font-label-md text-label-md flex items-center">-2 <span className="material-symbols-outlined text-[14px]">trending_down</span></span>
            </div>
            <div className="mt-md">
              <p className="font-label-md text-label-md text-on-surface-variant">Moderation Flags</p>
              <h3 className="font-display-lg text-display-lg font-black mt-xs">3</h3>
            </div>
          </div>
        </div>

        {/* User Details Section */}
        <div className="col-span-12 lg:col-span-4 bg-surface border border-outline-variant rounded-xl overflow-hidden">
          <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low flex items-center gap-xs">
            <span className="material-symbols-outlined text-on-surface-variant">info</span>
            <h4 className="font-headline-sm text-headline-sm">User Details</h4>
          </div>
          <div className="p-lg space-y-md">
            <div className="flex flex-col gap-xs">
              <p className="font-label-md text-label-md text-on-surface-variant">Full Name</p>
              <p className="font-body-md text-body-md font-semibold">Omar Al-Fayed</p>
            </div>
            <div className="flex flex-col gap-xs">
              <p className="font-label-md text-label-md text-on-surface-variant">Email Address</p>
              <p className="font-body-md text-body-md font-semibold">omar.alfayed@enterprise.com</p>
            </div>
            <div className="flex flex-col gap-xs">
              <p className="font-label-md text-label-md text-on-surface-variant">Phone Number</p>
              <p className="font-body-md text-body-md font-semibold">+1 (555) 012-3456</p>
            </div>
            <div className="flex flex-col gap-xs">
              <p className="font-label-md text-label-md text-on-surface-variant">Location</p>
              <p className="font-body-md text-body-md font-semibold">Dubai, United Arab Emirates</p>
            </div>
            <div className="flex flex-col gap-xs">
              <p className="font-label-md text-label-md text-on-surface-variant">Last Login</p>
              <p className="font-body-md text-body-md font-semibold">2 hours ago (10.42.1.254)</p>
            </div>
            <div className="pt-md">
              <div className="bg-surface-container-high rounded-xl p-md">
                <p className="font-label-md text-label-md text-on-surface-variant mb-sm">Location Data</p>
                <div className="w-full h-32 rounded-lg bg-surface-container-highest overflow-hidden relative group cursor-pointer">
                  <div className="absolute inset-0 bg-primary/10 z-10"></div>
                  <div className="w-full h-full bg-surface-variant grayscale opacity-50"></div>
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="col-span-12 lg:col-span-5 bg-surface border border-outline-variant rounded-xl overflow-hidden">
          <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-on-surface-variant">history</span>
              <h4 className="font-headline-sm text-headline-sm">Activity Feed</h4>
            </div>
            <button onClick={() => setActivityModalOpen(true)} className="text-primary font-label-md text-label-md hover:underline">View All</button>
          </div>
          <div className="p-lg space-y-lg relative">
            <div className="absolute left-lg top-[3.5rem] bottom-lg w-[2px] bg-outline-variant ml-[11px]"></div>
            
            <div className="flex gap-md relative">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center z-10 mt-1">
                <span className="material-symbols-outlined text-[14px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>photo</span>
              </div>
              <div>
                <p className="font-body-md text-body-md"><span className="font-bold">Omar</span> posted a new photo in <span className="text-primary">Urban Photography</span>.</p>
                <p className="text-xs text-on-surface-variant mt-1">12 minutes ago</p>
                <div className="mt-md rounded-xl overflow-hidden border border-outline-variant max-w-sm bg-surface-variant h-32 flex items-center justify-center">
                  <span className="material-symbols-outlined text-outline-variant text-4xl">image</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-md relative">
              <div className="w-6 h-6 bg-surface-container-highest rounded-full flex items-center justify-center z-10 mt-1 ring-2 ring-surface">
                <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
              <div>
                <p className="font-body-md text-body-md"><span className="font-bold">Omar</span> updated his professional bio.</p>
                <p className="text-xs text-on-surface-variant mt-1">4 hours ago</p>
              </div>
            </div>
            
            <div className="flex gap-md relative">
              <div className="w-6 h-6 bg-surface-container-highest rounded-full flex items-center justify-center z-10 mt-1 ring-2 ring-surface">
                <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>group_add</span>
              </div>
              <div>
                <p className="font-body-md text-body-md"><span className="font-bold">Omar</span> joined the <span className="text-primary">Tech Discussions</span> group.</p>
                <p className="text-xs text-on-surface-variant mt-1">Yesterday at 11:30 PM</p>
              </div>
            </div>
            
            <div className="flex gap-md relative">
              <div className="w-6 h-6 bg-error-container rounded-full flex items-center justify-center z-10 mt-1 ring-2 ring-surface">
                <span className="material-symbols-outlined text-[14px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
              </div>
              <div>
                <p className="font-body-md text-body-md">Account received a <span className="text-error font-bold">Spam Flag</span> from a moderator.</p>
                <p className="text-xs text-on-surface-variant mt-1">Oct 24, 2023</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Security Section */}
        <div className="col-span-12 lg:col-span-3 space-y-lg">
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden">
            <div className="px-lg py-md border-b border-outline-variant bg-surface-container-low flex items-center gap-xs">
              <span className="material-symbols-outlined text-on-surface-variant">security</span>
              <h4 className="font-headline-sm text-headline-sm">Security</h4>
            </div>
            <div className="p-lg space-y-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-md">
                  <span className="material-symbols-outlined text-green-600">verified_user</span>
                  <div>
                    <p className="font-label-md text-label-md font-bold">2FA Enabled</p>
                    <p className="text-xs text-on-surface-variant">SMS &amp; Authenticator</p>
                  </div>
                </div>
                <span className="w-8 h-4 bg-green-500 rounded-full relative"><span className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></span></span>
              </div>
              <div className="h-[1px] bg-outline-variant"></div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Linked Accounts</p>
              <div className="space-y-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-md">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-bold text-primary">G</div>
                    <span className="font-body-md text-body-md">Google</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">check_circle</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-md">
                    <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-bold text-on-surface">GH</div>
                    <span className="font-body-md text-body-md">GitHub</span>
                  </div>
                  <span className="material-symbols-outlined text-outline">circle</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Admin Notes/Private */}
          <div className="bg-tertiary-container text-on-tertiary-fixed p-lg rounded-xl">
            <div className="flex items-center gap-sm mb-md">
              <span className="material-symbols-outlined">description</span>
              <h5 className="font-headline-sm text-headline-sm">Admin Notes</h5>
            </div>
            <p className="font-body-sm text-body-sm mb-md">This user is an internal platform tester. Please avoid suspending without notifying the engineering lead first.</p>
            {role === 'admin' && (
              <button className="w-full py-sm bg-tertiary text-white rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity">Edit Notes</button>
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
              You are sending an official warning to <strong>Omar Al-Fayed</strong>. They will receive this via email.
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
              Are you sure you want to suspend <strong>Omar Al-Fayed</strong>? This will revoke their access to the platform based on the selected duration.
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
                  <p className="text-sm text-on-surface-variant font-medium">Omar Al-Fayed</p>
                </div>
              </div>
              <button onClick={() => setActivityModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors p-1">close</button>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 border-b border-outline-variant shrink-0 flex gap-3 overflow-x-auto">
              <button 
                onClick={() => { setActivityFilter('All'); setVisibleCount(5); }} 
                className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 transition-colors ${activityFilter === 'All' ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest'}`}
              >
                All
              </button>
              <button 
                onClick={() => { setActivityFilter('Posts'); setVisibleCount(5); }} 
                className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 transition-colors ${activityFilter === 'Posts' ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest'}`}
              >
                Posts
              </button>
              <button 
                onClick={() => { setActivityFilter('Engagement'); setVisibleCount(5); }} 
                className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 transition-colors ${activityFilter === 'Engagement' ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest'}`}
              >
                Engagement
              </button>
              <button 
                onClick={() => { setActivityFilter('Moderation'); setVisibleCount(5); }} 
                className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 transition-colors ${activityFilter === 'Moderation' ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest'}`}
              >
                Moderation
              </button>
              <button 
                onClick={() => { setActivityFilter('Network'); setVisibleCount(5); }} 
                className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 transition-colors ${activityFilter === 'Network' ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest'}`}
              >
                Network
              </button>
              <button 
                onClick={() => { setActivityFilter('Profile'); setVisibleCount(5); }} 
                className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 transition-colors ${activityFilter === 'Profile' ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest'}`}
              >
                Profile Updates
              </button>
              <button 
                onClick={() => { setActivityFilter('Jobs'); setVisibleCount(5); }} 
                className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 transition-colors ${activityFilter === 'Jobs' ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest'}`}
              >
                Jobs
              </button>
            </div>
            
            {/* Scrollable Feed */}
            <div className="p-6 overflow-y-auto space-y-6 relative flex-1">
              <div className="absolute left-6 top-6 bottom-6 w-[2px] bg-outline-variant ml-[11px]"></div>
              
              {filteredActivity.slice(0, visibleCount).map((activity) => (
                <div key={activity.id} className="flex gap-4 relative group">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 mt-1 shrink-0 shadow-sm ${activity.color}`}>
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{activity.icon}</span>
                  </div>
                  <div className="flex-1 p-3 rounded-xl border border-transparent hover:border-outline-variant hover:bg-surface-container-lowest transition-colors">
                    <p className="font-body-md text-body-md text-on-surface"><span className="font-bold">Omar</span> {activity.text}.</p>
                    <time className="text-xs text-on-surface-variant font-medium mt-1">{activity.time}</time>
                  </div>
                </div>
              ))}

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
    </div>
  );
}
