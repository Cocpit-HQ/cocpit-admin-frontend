import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

export default function SystemControls() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('systemControlsTab') || 'Authentication';
  });

  const [settings, setSettings] = useState({
    // Master Module Kill-Switches
    enableJobsModule: true,
    enableFeedModule: true,
    enableNetworkingModule: true,
    enableMessagingModule: true,
    enableProfileModule: true,
    enableAIModule: true,
    enableAuthModule: true,
    enableOrganizationsModule: true,

    // Authentication & Onboarding
    enableUserLogin: true,
    enableUserSignup: true,
    requireOtpVerification: true,
    requireOnboarding: true,

    // Feed & Post Creation
    enableFeedAccess: true,
    enablePostCreation: true,
    enableFeedPostInteractions: true,
    enableTrendingNow: true,
    enablePostReporting: true,
    enableNotInterested: true,
    enableAiPostEnhancement: true,
    enableMediaUploads: true,
    channel_thoughts_enabled: true,

    // Notifications
    enableNotifications: true,

    // Messaging & Chats
    enableMessaging: true,
    enableMessageRequests: true,
    enableNewChatCreation: true,
    enableGroupChats: true,

    // Connections & Following
    enableConnectionsTab: true,
    enableConnectionSuggestions: true,
    enableConnectionManagement: true,
    enableUserFollowing: true,

    // AI Assistant & Projects
    enableAITab: true,
    enableAIChatHistory: true,
    enableAIProjects: true,

    // Jobs & Careers
    enableJobsBoard: true,
    enableJobApplications: true,
    enableApplicationTracking: true,
    enableSavedJobs: true,
    enableJobOffers: true,
    enableMyListings: true,
    enableJobCreation: true,
    enableAiJobDescription: true,

    // Analytics
    enableAnalyticsTab: true,

    // User Profile
    enableProfileTab: true,
    enableProfileEditing: true,
    enableResumeParsing: true,
    enableCoverImageUpload: true,
    enableProfileSkills: true,
    enableProfileEducation: true,
    enableProfileExperience: true,
    enableContactInfo: true,
    enableProfileSharing: true,
    enableUserReporting: true,
    enableLivingResumeDownload: true,

    // Global Search
    enableGlobalSearch: true,

    // Settings & Privacy
    enableSettingsPage: true,
    enableSavedPosts: true,
    enableActivityHistory: true,
    enableUserBlocking: true,
    enableSessionManagement: true,
    enableCommentHiding: true,
    enableOrgCreation: true,
    enableAccountDeletion: true,

    // User-Facing Messaging
    maintenanceModeMessage: 'We are currently down for maintenance.',
    enableGlobalBanner: false,
    globalBannerMessage: '',
    scheduledPlatformNotice: '',

    // Legacy Settings (kept for compatibility with original code if any)
    maintenanceMode: false,
    readOnlyMode: false,
    disableJobBoard: false,
    disableMessaging: false,
    apiAccess: true,
    enableUserRegistration: true,
    enableOrgRegistration: true,
    enableGoogleAuth: true,
    enableGithubAuth: true,
    enablePasswordAuth: true,
    enableMessagingBetweenUsers: true,
    enableUploads: true,
    enableSearch: true,
    enablePublicProfiles: true,
    enforceAutoFlag: true,
    enableNewReports: true,
    enableEmailWarnings: true,
    globalRateLimit: '100',
    enableNewSessions: true,
    blockSpecificIps: false,
    force2FA: false,
    pauseJobQueue: false,
    enableEmailDelivery: true,
    enableWebhookDelivery: true,
    integrationStripe: true,
    integrationSendgrid: true,
    enableDatabaseWrites: true,
    verboseLogging: false,
    enableAuditLogging: true,
    dataRetentionPeriod: '90',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Fetch initial feature flags from the backend
    const fetchFlags = async () => {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        if (data && data.features) {
          // Map backend flags to frontend settings
          // Backend keys are snake_case (e.g. saved_jobs, jobs_board)
          // Since the settings state uses camelCase, we need to map or just add the snake_case keys
          // For simplicity, we merge the backend features into our settings.
          // Note: The UI checkboxes will need to use the snake_case keys if we map them directly, 
          // or we can just map the specific ones. 
          // Let's use the backend features directly and append to our settings state.
          const mappedSettings = { ...settings };
          Object.keys(data.features).forEach(key => {
            // we will just use the backend keys natively in our settings object
            mappedSettings[key] = data.features[key];
          });
          setSettings(mappedSettings);
        }
      } catch (err) {
        console.error("Failed to fetch config:", err);
      }
    };
    fetchFlags();
  }, []);

  const handleToggle = (key) => {
    const newValue = !settings[key];
    const newSettings = { ...settings, [key]: newValue };

    // Sync master module keys with section switches
    if (key === 'enableJobsBoard') newSettings.enableJobsModule = newValue;
    if (key === 'enableFeedAccess') newSettings.enableFeedModule = newValue;
    if (key === 'enableConnectionsTab') newSettings.enableNetworkingModule = newValue;
    if (key === 'enableMessaging') newSettings.enableMessagingModule = newValue;
    if (key === 'enableProfileTab') newSettings.enableProfileModule = newValue;
    if (key === 'enableAITab') newSettings.enableAIModule = newValue;

    setSettings(newSettings);
  };


  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const tabs = [
    { id: 'Authentication', icon: 'login', label: 'Auth & Onboarding' },
    { id: 'Feed', icon: 'feed', label: 'Feed & Posts' },
    { id: 'Networking', icon: 'group', label: 'Connections & Following' },
    { id: 'Messaging', icon: 'chat', label: 'Messaging & Chats' },
    { id: 'Notifications', icon: 'notifications', label: 'Notifications' },
    { id: 'Jobs', icon: 'work', label: 'Jobs & Careers' },
    { id: 'Organizations', icon: 'corporate_fare', label: 'Organizations & Companies' },
    { id: 'AI', icon: 'robot_2', label: 'AI Assistant' },
    { id: 'Profile', icon: 'person', label: 'User Profile' },
    { id: 'Search', icon: 'search', label: 'Global Search' },
    { id: 'Settings', icon: 'settings', label: 'Settings & Privacy' },
    { id: 'Announcements', icon: 'campaign', label: 'User-Facing Messaging' },
    { id: 'System', icon: 'memory', label: 'System & DB (Legacy)' },
  ];

  const ToggleRow = ({ label, description, settingKey, danger = false }) => {
    const isEnabled = Boolean(settings[settingKey]);
    return (
      <div className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
        isEnabled 
          ? 'bg-emerald-500/5 border-emerald-500/20' 
          : 'bg-rose-500/5 border-rose-500/20'
      }`}>
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm text-on-surface">{label}</p>
            <span className={`px-2 py-0.5 text-[10px] font-black rounded-full tracking-wider uppercase ${
              isEnabled 
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
            }`}>
              {isEnabled ? '● ON' : '○ OFF'}
            </span>
          </div>
          <p className="text-xs text-secondary mt-1">{description}</p>
        </div>

        <button
          onClick={() => handleToggle(settingKey)}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer ${
            isEnabled ? (danger ? 'bg-error' : 'bg-emerald-600') : 'bg-gray-300 dark:bg-gray-700'
          }`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${
            isEnabled ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full pb-xl px-4 sm:px-6 lg:px-8 pt-8">
      {/* Page Header */}
      <div className="mb-md">
        <h2 className="font-display-lg text-display-lg text-on-surface flex items-center gap-sm">
          <span className="material-symbols-outlined text-[32px] text-primary">admin_panel_settings</span>
          System Controls
        </h2>
        <p className="font-body-md text-on-surface-variant mt-xs">Developer-exclusive platform configuration and emergency controls.</p>
      </div>

      {/* Explanatory Feature Toggle Note Card */}
      <div className="mb-lg p-4 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-start gap-3 shadow-sm">
        <span className="material-symbols-outlined text-[24px] text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">info</span>
        <div className="text-xs leading-relaxed text-blue-900 dark:text-blue-200">
          <p className="font-bold text-sm mb-1 text-blue-950 dark:text-blue-100">📌 How Feature Toggles Work (Master vs Sub-Features):</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Master Switches (e.g. Jobs Board, Feed Access):</strong> Turning <strong>OFF</strong> a master switch puts the <u>entire portal/page</u> under maintenance for both Candidates and Employers.</li>
            <li><strong>Sub-Feature Switches (e.g. Job Applications, Job Creation, Saved Jobs):</strong> Turning <strong>OFF</strong> a sub-feature keeps the page open, but <u>degrades specific action buttons & tabs</u> into a disabled state with a maintenance tooltip.</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-lg">
        {/* Vertical Tabs Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm h-full max-h-[800px] overflow-y-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  localStorage.setItem('systemControlsTab', tab.id);
                }}
                className={`w-full flex items-center gap-md px-md py-sm text-left font-label-md text-label-md transition-colors border-l-4 ${activeTab === tab.id
                    ? 'bg-primary-container text-on-primary-container border-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low border-transparent hover:text-on-surface'
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-sm min-h-[500px]">

            {activeTab === 'Authentication' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">Authentication & Onboarding</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <ToggleRow label="User Login" description="If disabled, existing users cannot log in." settingKey="enableUserLogin" danger />
                  <ToggleRow label="User Signup" description="If disabled, new users cannot create accounts." settingKey="enableUserSignup" danger />
                  <ToggleRow label="OTP Verification" description="If disabled, bypasses the OTP step." settingKey="requireOtpVerification" />
                  <ToggleRow label="User Onboarding" description="If disabled, users skip profile setup flow." settingKey="requireOnboarding" />
                </div>
              </div>
            )}

            {activeTab === 'Feed' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">Feed & Post Creation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <ToggleRow label="Feed Access" description="Master switch. Hides feed entirely." settingKey="enableFeedAccess" danger />
                  <ToggleRow label="Post Creation" description="Users cannot create new posts." settingKey="enablePostCreation" />
                  <ToggleRow label="Feed Interactions" description="Disable likes, comments, and shares in feed." settingKey="enableFeedPostInteractions" />
                  <ToggleRow label="Trending Now" description="Hide trending topics from the feed." settingKey="enableTrendingNow" />
                  <ToggleRow label="Report Post" description="Users cannot report posts." settingKey="enablePostReporting" danger />
                  <ToggleRow label="Not Interested" description="Users cannot mark posts as Not interested." settingKey="enableNotInterested" />
                  <ToggleRow label="AI Post Enhancement" description="Disable AI text generation for posts." settingKey="enableAiPostEnhancement" />
                  <ToggleRow label="Media Uploads" description="Users can only post text." settingKey="enableMediaUploads" />
                  <ToggleRow label="Enable Channel Thoughts" description="Disable comments/thoughts on articles globally." settingKey="channel_thoughts_enabled" />
                </div>
              </div>
            )}

            {activeTab === 'Networking' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">Connections & Following</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <ToggleRow label="Connections Page" description="Master switch for the network page." settingKey="enableConnectionsTab" danger />
                  <ToggleRow label="Connection Suggestions" description="Hide AI-driven suggestions grid." settingKey="enableConnectionSuggestions" />
                  <ToggleRow label="Connection Management" description="Disable accept/decline for pending requests." settingKey="enableConnectionManagement" />
                  <ToggleRow label="Follow Users" description="Disable the Follow button." settingKey="enableUserFollowing" />
                </div>
              </div>
            )}

            {activeTab === 'Messaging' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">Messaging & Chats</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <ToggleRow label="Messaging System" description="Master switch to turn off DMs entirely." settingKey="enableMessaging" danger />
                  <ToggleRow label="Message Requests" description="Disable message requests from non-followers." settingKey="enableMessageRequests" />
                  <ToggleRow label="New Chat Creation" description="Disable starting new chats." settingKey="enableNewChatCreation" />
                  <ToggleRow label="Group Chats" description="Users can only start 1-on-1 chats." settingKey="enableGroupChats" />
                </div>
              </div>
            )}

            {activeTab === 'Notifications' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">Notifications</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <ToggleRow label="Notifications System" description="Master switch to hide the entire notification system." settingKey="enableNotifications" danger />
                </div>
              </div>
            )}

            {activeTab === 'Jobs' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">Jobs & Careers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <ToggleRow label="Jobs Board" description="Master switch for the Jobs portal." settingKey="enableJobsBoard" danger />
                  <ToggleRow label="Job Applications" description="Users can view but cannot apply to jobs." settingKey="enableJobApplications" />
                  <ToggleRow label="Application Tracking" description="Users cannot track submitted applications." settingKey="enableApplicationTracking" />
                  <ToggleRow label="Saved Jobs" description="Users cannot bookmark jobs." settingKey="saved_jobs" />
                  <ToggleRow label="Job Offers" description="Users cannot manage direct job offers." settingKey="enableJobOffers" />

                  <ToggleRow label="Job Listings Management" description="Users/companies cannot manage their posted jobs." settingKey="enableMyListings" />
                  <ToggleRow label="Job Creation" description="Users cannot post new jobs." settingKey="enableJobCreation" />
                  <ToggleRow label="AI Job Description" description="Disable AI generation for job descriptions." settingKey="enableAiJobDescription" />
                </div>
              </div>
            )}

            {activeTab === 'Organizations' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">Organizations & Companies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <ToggleRow label="Organizations Module" description="Master switch to hide all company features." settingKey="enableOrganizationsModule" danger />
                  <ToggleRow label="Organization Showcases" description="Users cannot view public company pages." settingKey="enableOrganizations" />
                  <ToggleRow label="Organization Creation" description="Users cannot create Company pages." settingKey="enableOrgCreation" />
                </div>
              </div>
            )}

            {activeTab === 'AI' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">AI Assistant & Projects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <ToggleRow label="AI Assistant Page" description="Master switch to disable Cyphex AI." settingKey="enableAITab" danger />
                  <ToggleRow label="AI Chat History" description="Users cannot view past AI conversations." settingKey="enableAIChatHistory" />
                  <ToggleRow label="AI Projects" description="Users cannot manage AI project workspaces." settingKey="enableAIProjects" />
                </div>
              </div>
            )}

            {activeTab === 'Profile' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">User Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <ToggleRow label="Profile Page" description="Master switch to hide all user profiles." settingKey="enableProfileTab" danger />
                  <ToggleRow label="Profile Editing" description="Users cannot edit basic profile details." settingKey="enableProfileEditing" />
                  <ToggleRow label="Resume Upload & Parsing" description="Disable uploading resumes." settingKey="enableResumeParsing" />
                  <ToggleRow label="Cover Image Upload" description="Disable changing profile cover photos." settingKey="enableCoverImageUpload" />
                  <ToggleRow label="Profile Skills" description="Users cannot modify their skills list." settingKey="enableProfileSkills" />
                  <ToggleRow label="Profile Education" description="Users cannot modify their educational history." settingKey="enableProfileEducation" />
                  <ToggleRow label="Profile Experience" description="Users cannot view or modify work experience." settingKey="enableProfileExperience" />
                  <ToggleRow label="Contact Info" description="Hide email and URLs on profiles." settingKey="enableContactInfo" />
                  <ToggleRow label="Profile Sharing" description="Disable share/copy link options." settingKey="enableProfileSharing" />
                  <ToggleRow label="User Reporting" description="Users cannot report other profiles." settingKey="enableUserReporting" danger />
                  <ToggleRow label="Living Resume Download" description="Users cannot download living resumes." settingKey="enableLivingResumeDownload" />
                </div>
              </div>
            )}

            {activeTab === 'Search' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">Global Search</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <ToggleRow label="Global Search" description="Master switch for the main search bar." settingKey="enableGlobalSearch" />
                </div>
              </div>
            )}

            {activeTab === 'Settings' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">Settings & Privacy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <ToggleRow label="Settings Page" description="Master switch to hide the entire settings page." settingKey="enableSettingsPage" danger />
                  <ToggleRow label="Saved Posts & Collections" description="Users cannot save posts or create collections." settingKey="enableSavedPosts" />
                  <ToggleRow label="Activity History" description="Users cannot view or clear interaction history." settingKey="enableActivityHistory" />
                  <ToggleRow label="User Blocking" description="Users cannot block/unblock accounts." settingKey="enableUserBlocking" danger />
                  <ToggleRow label="Active Sessions" description="Users cannot view or revoke logged-in devices." settingKey="enableSessionManagement" />
                  <ToggleRow label="Comment Hiding" description="Users cannot hide specific comments." settingKey="enableCommentHiding" />
                  <ToggleRow label="Account Deletion" description="Users cannot delete their accounts." settingKey="enableAccountDeletion" danger />
                </div>
              </div>
            )}

            {activeTab === 'Announcements' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">User-Facing Messaging</h3>
                <div className="space-y-md">
                  <div className="p-md bg-surface border border-outline-variant rounded">
                    <label className="font-label-md font-bold text-on-surface block mb-xs">Maintenance Mode Message</label>
                    <textarea
                      value={settings.maintenanceModeMessage}
                      onChange={(e) => handleChange('maintenanceModeMessage', e.target.value)}
                      className="w-full h-24 bg-surface-container-lowest border border-outline-variant rounded px-md py-sm text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                      placeholder="Message shown when a feature is unavailable"
                    ></textarea>
                  </div>

                  <ToggleRow label="Global Announcement Banner" description="Toggle visibility of the global banner across the platform." settingKey="enableGlobalBanner" />

                  <div className="p-md bg-surface border border-outline-variant rounded">
                    <label className="font-label-md font-bold text-on-surface block mb-xs">Banner Message</label>
                    <input
                      type="text"
                      value={settings.globalBannerMessage}
                      placeholder="e.g. We are experiencing issues"
                      onChange={(e) => handleChange('globalBannerMessage', e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded px-md py-sm text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="p-md bg-surface border border-outline-variant rounded">
                    <label className="font-label-md font-bold text-on-surface block mb-xs">Scheduled Platform Notice</label>
                    <input
                      type="text"
                      value={settings.scheduledPlatformNotice}
                      placeholder="e.g. Scheduled downtime warning"
                      onChange={(e) => handleChange('scheduledPlatformNotice', e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded px-md py-sm text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'System' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">System & DB (Legacy)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <ToggleRow label="Maintenance Mode" description="Takes the platform offline." settingKey="maintenanceMode" danger />
                  <ToggleRow label="Read-Only Mode" description="Disables all writes." settingKey="readOnlyMode" danger />
                  <ToggleRow label="Enable Public API Access" description="Allow external API access." settingKey="apiAccess" />
                  <ToggleRow label="Auto-flag Enforcement" description="Pause auto-suspend rules." settingKey="enforceAutoFlag" />
                  <ToggleRow label="Email Delivery" description="Send outgoing emails." settingKey="enableEmailDelivery" />
                  <ToggleRow label="Webhook Delivery" description="Send outgoing webhooks." settingKey="enableWebhookDelivery" />
                  <ToggleRow label="Enable Database Writes" description="Emergency read-only DB lock." settingKey="enableDatabaseWrites" danger />
                  <ToggleRow label="Audit Logging" description="Keep this ON." settingKey="enableAuditLogging" danger />
                </div>

                <div className="mt-md p-md bg-surface border border-outline-variant rounded flex flex-col md:flex-row items-start md:items-center justify-between gap-md">
                  <div>
                    <p className="font-label-md font-bold text-on-surface">Manual Cache Invalidation</p>
                    <p className="font-body-sm text-secondary mt-1">Clear specific cache layers without a full restart.</p>
                  </div>
                  <button onClick={() => alert('Cache invalidated.')} className="bg-primary text-on-primary px-md py-sm rounded-lg font-label-md shadow-sm active:scale-95 whitespace-nowrap">Clear Cache</button>
                </div>
              </div>
            )}

            {/* Save Buttons (Persistent at bottom of active tab) */}
            <div className="mt-lg pt-md border-t border-outline-variant flex justify-end">
              <button
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    let token = accessToken || localStorage.getItem('accessToken') || localStorage.getItem('token');
                    
                    let res = await fetch('/api/admin/feature-flags', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                      },
                      body: JSON.stringify({ features: settings })
                    });

                    // If token is expired or missing, auto-refresh session and retry
                    if (res.status === 401 || res.status === 403) {
                      try {
                        const refreshRes = await fetch('/api/auth/refresh', { method: 'POST' });
                        if (refreshRes.ok) {
                          const refreshData = await refreshRes.json();
                          if (refreshData?.accessToken) {
                            token = refreshData.accessToken;
                            localStorage.setItem('accessToken', token);
                            res = await fetch('/api/admin/feature-flags', {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({ features: settings })
                            });
                          }
                        }
                      } catch (refreshErr) {
                        console.error("Auto refresh failed:", refreshErr);
                      }
                    }

                    if (res.ok) {
                      alert('All feature flags and module controls saved to backend successfully.');
                    } else {
                      const data = await res.json().catch(() => ({}));
                      alert(`Failed to save settings: ${data.message || data.error || 'Unauthorized or Forbidden'}. Please ensure you are logged in as Admin.`);
                    }
                  } catch (err) {
                    console.error("Error saving flags:", err);
                    alert("Failed to save settings to backend.");
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
                className={`bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md shadow-sm hover:bg-primary/90 transition-colors active:scale-95 flex items-center gap-xs ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
