import React, { useState } from 'react';

export default function SystemControls() {
  const [activeTab, setActiveTab] = useState('Maintenance');

  const [settings, setSettings] = useState({
    // Maintenance
    maintenanceMode: false,
    readOnlyMode: false,
    disableJobBoard: false,
    disableMessaging: false,
    apiAccess: true,

    // Feature Flags
    enableUserRegistration: true,
    enableOrgRegistration: true,
    enableGoogleAuth: true,
    enableGithubAuth: true,
    enablePasswordAuth: true,
    enablePostCreation: true,
    enableMessagingBetweenUsers: true,
    enableNotifications: true,
    enableUploads: true,
    enableSearch: true,
    enablePublicProfiles: true,

    // Moderation
    enforceAutoFlag: true,
    enableNewReports: true,
    enableEmailWarnings: true,

    // Rate Limiting
    globalRateLimit: '100',
    enableNewSessions: true,
    blockSpecificIps: false,
    force2FA: false,

    // Background Jobs
    pauseJobQueue: false,
    enableEmailDelivery: true,
    enableWebhookDelivery: true,
    integrationStripe: true,
    integrationSendgrid: true,

    // Data & Storage
    enableDatabaseWrites: true,
    verboseLogging: false,
    enableAuditLogging: true,
    dataRetentionPeriod: '90',

    // Messaging
    maintenanceMessage: 'We are currently down for maintenance.',
    bannerMessage: '',
    enableGlobalBanner: false,
    platformNotice: '',
  });

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const tabs = [
    { id: 'Maintenance', icon: 'power_settings_new', label: 'Maintenance & Availability' },
    { id: 'FeatureFlags', icon: 'toggle_on', label: 'Feature Flags' },
    { id: 'Moderation', icon: 'shield', label: 'Moderation Controls' },
    { id: 'Security', icon: 'security', label: 'Rate Limiting & Security' },
    { id: 'Jobs', icon: 'memory', label: 'Background Jobs' },
    { id: 'Data', icon: 'database', label: 'Data & Storage' },
    { id: 'Messaging', icon: 'campaign', label: 'User-Facing Messaging' },
  ];

  const ToggleRow = ({ label, description, settingKey, danger = false }) => (
    <div className="flex items-center justify-between p-md bg-surface border border-outline-variant rounded hover:border-primary/30 transition-colors">
      <div>
        <p className="font-label-md font-bold text-on-surface">{label}</p>
        <p className="font-body-sm text-secondary mt-1">{description}</p>
      </div>
      <button 
        onClick={() => handleToggle(settingKey)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          settings[settingKey] ? (danger ? 'bg-error' : 'bg-primary') : 'bg-gray-300'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${settings[settingKey] ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full pb-xl px-4 sm:px-6 lg:px-8 pt-8">
      {/* Page Header */}
      <div className="mb-lg">
        <h2 className="font-display-lg text-display-lg text-on-surface flex items-center gap-sm">
          <span className="material-symbols-outlined text-[32px] text-primary">admin_panel_settings</span>
          System Controls
        </h2>
        <p className="font-body-md text-on-surface-variant mt-xs">Developer-exclusive platform configuration and emergency controls.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-lg">
        {/* Vertical Tabs Sidebar */}
        <div className="w-full lg:w-64 shrink-0">
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-md px-md py-sm text-left font-label-md text-label-md transition-colors border-l-4 ${
                  activeTab === tab.id 
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
            {activeTab === 'Maintenance' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">Maintenance & Availability</h3>
                <div className="grid grid-cols-1 gap-md">
                  <ToggleRow label="Maintenance Mode" description="Takes the platform offline for regular users with a custom message." settingKey="maintenanceMode" danger />
                  <ToggleRow label="Read-Only Mode" description="Platform stays live but all write actions (posting, messaging, applying) are disabled." settingKey="readOnlyMode" danger />
                  <ToggleRow label="Disable Job Board" description="Take down the job board page individually." settingKey="disableJobBoard" />
                  <ToggleRow label="Disable Messaging" description="Take down the messaging system individually." settingKey="disableMessaging" />
                  <ToggleRow label="Enable Public API Access" description="Allow external third-party API access to the platform." settingKey="apiAccess" />
                </div>
              </div>
            )}

            {activeTab === 'FeatureFlags' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">Feature Flags</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  <ToggleRow label="User Registration" description="Allow new user signups." settingKey="enableUserRegistration" />
                  <ToggleRow label="Org Registration" description="Allow new organization signups." settingKey="enableOrgRegistration" />
                  <ToggleRow label="Google OAuth" description="Enable Google SSO login." settingKey="enableGoogleAuth" />
                  <ToggleRow label="GitHub OAuth" description="Enable GitHub SSO login." settingKey="enableGithubAuth" />
                  <ToggleRow label="Password Login" description="Enable standard email/password authentication." settingKey="enablePasswordAuth" />
                  <ToggleRow label="Post Creation" description="Allow users to create new content." settingKey="enablePostCreation" />
                  <ToggleRow label="User Messaging" description="Enable messaging between users." settingKey="enableMessagingBetweenUsers" />
                  <ToggleRow label="Notifications" description="Enable the in-app notifications system." settingKey="enableNotifications" />
                  <ToggleRow label="File Uploads" description="Enable file and image uploads." settingKey="enableUploads" />
                  <ToggleRow label="Search" description="Enable global search functionality." settingKey="enableSearch" />
                  <ToggleRow label="Public Profiles" description="Make all profiles public (turn off to force private temporarily)." settingKey="enablePublicProfiles" />
                </div>
              </div>
            )}

            {activeTab === 'Moderation' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">Moderation Controls</h3>
                <div className="grid grid-cols-1 gap-md">
                  <ToggleRow label="Auto-flag Enforcement" description="Pause the >5 / >15 flag auto-suspend rules." settingKey="enforceAutoFlag" />
                  <ToggleRow label="New Report Submissions" description="Allow users to file new reports." settingKey="enableNewReports" />
                  <ToggleRow label="Email Warnings" description="Send email warnings (turn off to queue them without delivering)." settingKey="enableEmailWarnings" />
                </div>
              </div>
            )}

            {activeTab === 'Security' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">Rate Limiting & Security</h3>
                <div className="grid grid-cols-1 gap-md mb-lg">
                  <div className="p-md bg-surface border border-outline-variant rounded">
                    <label className="font-label-md font-bold text-on-surface block mb-xs">Global Rate Limit (requests/min/IP)</label>
                    <input 
                      type="number" 
                      value={settings.globalRateLimit} 
                      onChange={(e) => handleChange('globalRateLimit', e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded px-md py-sm text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <ToggleRow label="New Session Creation" description="Allow new logins (turn off to force all logged-in users to stay but block new ones)." settingKey="enableNewSessions" danger />
                  <ToggleRow label="Block Specific IP Ranges" description="Activate the emergency IP blocklist." settingKey="blockSpecificIps" />
                  <ToggleRow label="Force Admin 2FA" description="Make two-factor authentication mandatory for all admin accounts." settingKey="force2FA" />
                </div>
              </div>
            )}

            {activeTab === 'Jobs' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">Background Jobs & Integrations</h3>
                <div className="grid grid-cols-1 gap-md mb-lg">
                  <ToggleRow label="Pause Background Jobs" description="Stop processing jobs without clearing the queue." settingKey="pauseJobQueue" danger />
                  <ToggleRow label="Email Delivery" description="Send outgoing emails (turn off to queue only)." settingKey="enableEmailDelivery" />
                  <ToggleRow label="Webhook Delivery" description="Send outgoing webhooks." settingKey="enableWebhookDelivery" />
                  <ToggleRow label="Stripe Integration" description="Enable Stripe payment processing." settingKey="integrationStripe" />
                  <ToggleRow label="SendGrid Integration" description="Enable SendGrid for bulk mailing." settingKey="integrationSendgrid" />
                  
                  <div className="p-md bg-surface border border-outline-variant rounded flex flex-col md:flex-row items-start md:items-center justify-between gap-md mt-md">
                    <div>
                      <p className="font-label-md font-bold text-on-surface">Manual Cache Invalidation</p>
                      <p className="font-body-sm text-secondary mt-1">Clear specific cache layers without a full restart.</p>
                    </div>
                    <button onClick={() => alert('Cache invalidated.')} className="bg-primary text-on-primary px-md py-sm rounded-lg font-label-md shadow-sm active:scale-95 whitespace-nowrap">Clear Cache</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Data' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">Data & Storage</h3>
                <div className="grid grid-cols-1 gap-md">
                  <ToggleRow label="Enable Database Writes" description="Emergency read-only lock at the DB level." settingKey="enableDatabaseWrites" danger />
                  <ToggleRow label="Verbose Logging" description="Turn on detailed logs for debugging without a deployment." settingKey="verboseLogging" />
                  <ToggleRow label="Audit Logging" description="Keep this ON. Should almost never be turned off." settingKey="enableAuditLogging" danger />
                  <div className="p-md bg-surface border border-outline-variant rounded">
                    <label className="font-label-md font-bold text-on-surface block mb-xs">Data Retention Period (Days)</label>
                    <select 
                      value={settings.dataRetentionPeriod}
                      onChange={(e) => handleChange('dataRetentionPeriod', e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded px-md py-sm text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="30">30 Days</option>
                      <option value="90">90 Days</option>
                      <option value="180">180 Days</option>
                      <option value="365">1 Year</option>
                      <option value="infinite">Indefinite</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Messaging' && (
              <div className="animate-in fade-in duration-300">
                <h3 className="font-headline-sm mb-md pb-xs border-b border-outline-variant">User-Facing Messaging</h3>
                <div className="space-y-md">
                  <div className="p-md bg-surface border border-outline-variant rounded">
                    <label className="font-label-md font-bold text-on-surface block mb-xs">Maintenance Mode Message</label>
                    <textarea 
                      value={settings.maintenanceMessage}
                      onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                      className="w-full h-24 bg-surface-container-lowest border border-outline-variant rounded px-md py-sm text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                    ></textarea>
                  </div>
                  
                  <ToggleRow label="Global Announcement Banner" description="Toggle visibility of the banner across the platform." settingKey="enableGlobalBanner" />
                  
                  <div className="p-md bg-surface border border-outline-variant rounded">
                    <label className="font-label-md font-bold text-on-surface block mb-xs">Banner Message</label>
                    <input 
                      type="text" 
                      value={settings.bannerMessage}
                      placeholder="e.g. We are experiencing issues"
                      onChange={(e) => handleChange('bannerMessage', e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded px-md py-sm text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  
                  <div className="p-md bg-surface border border-outline-variant rounded">
                    <label className="font-label-md font-bold text-on-surface block mb-xs">Scheduled Platform Notice</label>
                    <input 
                      type="text" 
                      value={settings.platformNotice}
                      placeholder="e.g. Scheduled downtime warning"
                      onChange={(e) => handleChange('platformNotice', e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded px-md py-sm text-body-sm text-on-surface focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="pt-md flex justify-end">
                    <button 
                      onClick={() => alert('Messaging updates confirmed.')}
                      className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md shadow-sm hover:bg-primary/90 transition-colors active:scale-95 flex items-center gap-xs"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      Confirm Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
