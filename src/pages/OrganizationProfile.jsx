import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const mockOrg = {
  org_id: '1',
  name: 'NexuTech Solutions',
  slug: 'nexutech-solutions',
  email: 'contact@nexus-tech.io',
  industry: 'Software & IT',
  size: '1,000-5,000 employees',
  website: 'nexus-tech.io',
  location: 'San Francisco, USA',
  slogan: 'Building the future of software.',
  logo_url: 'NT', // using initials for placeholder
  cover_url: 'https://via.placeholder.com/1200x300',
  description: 'NexuTech Solutions is a global leader in cloud infrastructure and enterprise software. We build scalable tools that power modern businesses, focusing on reliability, speed, and developer experience. Trusted by Fortune 500 companies worldwide.',
  entity_type: 'COMPANY',
  institution_type: null,
  established_year: 2018,
  campus_location: null,
  verified_edu: false,
  verification_status: 'DOMAIN_VERIFIED',
  status: 'Active',
  followers_count: 12450,
  moderation_flags: 3
};

const mockTechStack = [
  { name: 'React', category: 'Frontend', color: 'bg-surface-container-low text-on-surface border-outline-variant' },
  { name: 'Node.js', category: 'Backend', color: 'bg-surface-container-low text-on-surface border-outline-variant' },
  { name: 'PostgreSQL', category: 'Database', color: 'bg-surface-container-low text-on-surface border-outline-variant' },
  { name: 'Docker', category: 'DevOps', color: 'bg-surface-container-low text-on-surface border-outline-variant' },
  { name: 'AWS', category: 'Infrastructure', color: 'bg-surface-container-low text-on-surface border-outline-variant' }
];

const mockMembers = [
  { id: 1, name: 'Alice Chen', role: 'Engineering Manager', initials: 'AC', color: 'bg-surface-container-high text-on-surface' },
  { id: 2, name: 'Bob Smith', role: 'Senior Developer', initials: 'BS', color: 'bg-surface-container-high text-on-surface' },
  { id: 3, name: 'Clara Jones', role: 'Product Manager', initials: 'CJ', color: 'bg-surface-container-high text-on-surface' },
  { id: 4, name: 'David Lee', role: 'UX Designer', initials: 'DL', color: 'bg-surface-container-high text-on-surface' }
];

const baseActivity = [
  { id: 1, type: 'job', text: 'Posted a new job: Senior React Developer', time: '2 hours ago', icon: 'work', color: 'text-blue-600 bg-blue-50' },
  { id: 2, type: 'post', text: 'Published an update: "Q3 Earnings and Roadmap..."', time: '1 day ago', icon: 'article', color: 'text-purple-600 bg-purple-50' },
  { id: 3, type: 'member', text: 'David Lee joined as UX Designer', time: '3 days ago', icon: 'person_add', color: 'text-green-600 bg-green-50' },
  { id: 4, type: 'milestone', text: 'Reached 10,000 Followers', time: '1 week ago', icon: 'social_leaderboard', color: 'text-amber-600 bg-amber-50' },
  { id: 5, type: 'job', text: 'Closed job: Marketing Intern', time: '2 weeks ago', icon: 'work_off', color: 'text-slate-600 bg-slate-50' },
  { id: 6, type: 'post', text: 'Shared an article: "The Future of Cloud Computing"', time: '3 weeks ago', icon: 'share', color: 'text-purple-600 bg-purple-50' },
  { id: 7, type: 'member', text: 'Clara Jones promoted to Product Manager', time: '1 month ago', icon: 'workspace_premium', color: 'text-green-600 bg-green-50' },
  { id: 8, type: 'job', text: 'Posted a new job: DevOps Engineer', time: '1 month ago', icon: 'work', color: 'text-blue-600 bg-blue-50' }
];

const mockAllActivity = [
  ...baseActivity,
  ...baseActivity.map(a => ({ ...a, id: a.id + 10, time: 'Older' })),
  ...baseActivity.map(a => ({ ...a, id: a.id + 20, time: 'Even Older' }))
];

export default function OrganizationProfile() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/organizations';
  const backLabel = location.state?.label || 'Organizations';

  if (role === 'moderator' && from !== '/moderation') {
    return (
      <div className="pt-8 pb-12 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
        <div className="bg-surface border border-outline-variant rounded-xl p-xl w-full max-w-2xl text-center shadow-sm">
          <span className="material-symbols-outlined text-error text-[48px] mb-md">block</span>
          <h2 className="font-headline-md text-headline-md text-on-surface">Access Denied</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-sm">Moderators can only view organization profiles directly from an active moderation case.</p>
        </div>
      </div>
    );
  }

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendDuration, setSuspendDuration] = useState('Short Temporary (3-7 days)');
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState('All');
  const [visibleCount, setVisibleCount] = useState(4);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 4);
      setIsLoadingMore(false);
    }, 800);
  };

  const filteredActivity = activityFilter === 'All' 
    ? mockAllActivity 
    : mockAllActivity.filter(a => {
        if (activityFilter === 'Jobs') return a.type === 'job';
        if (activityFilter === 'Updates') return a.type === 'post';
        if (activityFilter === 'Members') return a.type === 'member';
        if (activityFilter === 'Milestones') return a.type === 'milestone';
        return false;
      });

  return (
    <div className="pt-6 pb-12 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* Hero Section */}
      <div className="bg-surface rounded-2xl overflow-hidden mb-8 shadow-sm border border-outline-variant">
        {/* Cover Gradient */}
        <div className="h-40 sm:h-48 bg-gradient-to-r from-slate-200 to-gray-300 relative">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        <div className="px-6 sm:px-8 pb-8 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-16 sm:-mt-20 mb-6">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-surface-container-highest text-on-surface flex items-center justify-center text-5xl font-bold shadow-md border-4 border-surface shrink-0 relative z-10">
              {mockOrg.logo_url}
            </div>
            
            <div className="flex-grow pt-2 sm:pt-0 pb-2 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 w-full">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-on-surface">{mockOrg.name}</h1>
                  {mockOrg.status === 'Active' && (
                    <span className="material-symbols-outlined text-green-600 text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }} title="Active">check_circle</span>
                  )}
                  {mockOrg.moderation_flags > 0 && (
                    <span className="bg-error-container text-on-error-container text-xs font-bold px-2 py-1 rounded flex items-center gap-1 border border-error/20 ml-2" title={`${mockOrg.moderation_flags} Moderation Flags Raised`}>
                      <span className="material-symbols-outlined text-[14px]">flag</span>
                      {mockOrg.moderation_flags} {mockOrg.moderation_flags === 1 ? 'Flag' : 'Flags'}
                    </span>
                  )}
                </div>
                <p className="text-body-lg text-on-surface-variant font-medium mb-3">{mockOrg.slogan}</p>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-on-surface-variant font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">domain</span>
                    {mockOrg.industry}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    {mockOrg.location}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">group</span>
                    {mockOrg.followers_count.toLocaleString()} Followers
                  </div>
                </div>
              </div>
              
              <div className="shrink-0">
                {role !== 'developer' && (
                  <button 
                    onClick={() => setSuspendModalOpen(true)}
                    className="bg-error/10 text-error px-4 py-2.5 rounded-xl font-semibold hover:bg-error hover:text-white transition-all shadow-sm flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">block</span>
                    Suspend Organization
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (About & Tech) */}
        <div className="lg:col-span-2 space-y-8">
          {/* About Card */}
          <div className="bg-surface rounded-2xl p-6 sm:p-8 shadow-sm border border-outline-variant">
            <h3 className="text-xl font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              About
            </h3>
            <p className="text-base text-on-surface-variant leading-relaxed mb-8">
              {mockOrg.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 bg-surface-container-lowest rounded-xl p-6 border border-outline-variant">
              <div>
                <span className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Website</span>
                <a href={`https://${mockOrg.website}`} target="_blank" rel="noreferrer" className="text-primary font-medium hover:underline truncate block">{mockOrg.website}</a>
              </div>
              <div>
                <span className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Company Size</span>
                <span className="text-sm text-on-surface font-medium block truncate">{mockOrg.size}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Founded</span>
                <span className="text-sm text-on-surface font-medium block truncate">{mockOrg.established_year}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Entity Type</span>
                <span className="text-sm text-on-surface font-medium block truncate capitalize">{mockOrg.entity_type.toLowerCase()}</span>
              </div>
            </div>
          </div>

          {/* Tech Stack Card */}
          <div className="bg-surface rounded-2xl p-6 sm:p-8 shadow-sm border border-outline-variant">
            <h3 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">code</span>
              Tech Stack
            </h3>
            <div className="flex flex-wrap gap-3">
              {mockTechStack.map(tech => (
                <div key={tech.name} className={`px-4 py-2 border rounded-xl flex items-center gap-3 ${tech.color}`}>
                  <div>
                    <span className="block text-sm font-bold">{tech.name}</span>
                    <span className="block text-[10px] uppercase tracking-wider opacity-80 font-bold">{tech.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed Card */}
          <div className="bg-surface rounded-2xl p-6 sm:p-8 shadow-sm border border-outline-variant">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                Recent Activity
              </h3>
              <button onClick={() => setActivityModalOpen(true)} className="text-primary font-label-md text-label-md hover:underline">View All</button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockAllActivity.slice(0, 4).map(activity => (
                <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container-lowest transition-colors shadow-sm">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface shrink-0 shadow-sm ${activity.color}`}>
                    <span className="material-symbols-outlined text-[18px]">{activity.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface mb-1">{activity.text}</p>
                    <time className="text-xs text-on-surface-variant font-medium">{activity.time}</time>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Members) */}
        <div className="space-y-8">
          <div className="bg-surface rounded-2xl p-6 sm:p-8 shadow-sm border border-outline-variant">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">group</span>
                Key Members
              </h3>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">{mockMembers.length}</span>
            </div>
            
            <div className="space-y-4">
              {mockMembers.map(member => (
                <div key={member.id} onClick={() => navigate('/profile')} className="flex items-center gap-4 p-3 hover:bg-surface-container-lowest rounded-xl border border-transparent hover:border-outline-variant transition-all cursor-pointer">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${member.color}`}>
                    {member.initials}
                  </div>
                  <div>
                    <p className="text-base font-bold text-on-surface">{member.name}</p>
                    <p className="text-sm text-on-surface-variant font-medium">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button onClick={() => setMembersModalOpen(true)} className="w-full mt-6 py-3 border border-outline-variant rounded-xl text-primary font-semibold hover:bg-primary/5 transition-colors">
              View All Members
            </button>
          </div>
        </div>
      </div>

      {/* Suspend Confirmation Modal */}
      {suspendModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant w-[450px] max-w-[90vw] rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error mb-4">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <button onClick={() => setSuspendModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors p-1">close</button>
            </div>
            
            <h3 className="text-xl font-bold text-on-surface mb-2">
              Suspend Organization
            </h3>
            
            <p className="text-base text-on-surface-variant mb-6 leading-relaxed">
              Are you sure you want to suspend <strong>{mockOrg.name}</strong>? This action will hide their profile from the public, restrict members from taking actions on behalf of the company, and pause all active job postings based on the selected duration.
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
              <button 
                onClick={() => setSuspendModalOpen(false)} 
                className="px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => { alert(`Organization suspended. Duration: ${suspendDuration}`); setSuspendModalOpen(false); }}
                className="bg-error text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-error/90 transition-colors shadow-sm"
              >
                Yes, Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Members Modal */}
      {membersModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant w-[600px] max-w-[90vw] max-h-[80vh] flex flex-col rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">group</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface">All Members</h3>
                  <p className="text-sm text-on-surface-variant font-medium">{mockOrg.name}</p>
                </div>
              </div>
              <button onClick={() => setMembersModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors p-1">close</button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3">
              {[...mockMembers, ...mockMembers, ...mockMembers].map((member, i) => (
                <div key={`${member.id}-${i}`} onClick={() => navigate('/profile')} className="flex items-center gap-4 p-3 hover:bg-surface-container-lowest rounded-xl border border-transparent hover:border-outline-variant transition-all cursor-pointer group">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${member.color}`}>
                    {member.initials}
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">{member.name}</p>
                    <p className="text-sm text-on-surface-variant font-medium">{member.role}</p>
                  </div>
                  <div className="shrink-0">
                    <span className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                  </div>
                </div>
              ))}
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
                  <p className="text-sm text-on-surface-variant font-medium">{mockOrg.name}</p>
                </div>
              </div>
              <button onClick={() => setActivityModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors p-1">close</button>
            </div>

            {/* Filters */}
            <div className="px-6 py-4 border-b border-outline-variant shrink-0 flex gap-3 overflow-x-auto">
              <button 
                onClick={() => { setActivityFilter('All'); setVisibleCount(4); }} 
                className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 transition-colors ${activityFilter === 'All' ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest'}`}
              >
                All
              </button>
              <button 
                onClick={() => { setActivityFilter('Jobs'); setVisibleCount(4); }} 
                className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 transition-colors ${activityFilter === 'Jobs' ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest'}`}
              >
                Jobs
              </button>
              <button 
                onClick={() => { setActivityFilter('Updates'); setVisibleCount(4); }} 
                className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 transition-colors ${activityFilter === 'Updates' ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest'}`}
              >
                Updates
              </button>
              <button 
                onClick={() => { setActivityFilter('Members'); setVisibleCount(4); }} 
                className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 transition-colors ${activityFilter === 'Members' ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest'}`}
              >
                Members
              </button>
              <button 
                onClick={() => { setActivityFilter('Milestones'); setVisibleCount(4); }} 
                className={`px-4 py-1.5 rounded-full text-sm font-bold shrink-0 transition-colors ${activityFilter === 'Milestones' ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest'}`}
              >
                Milestones
              </button>
            </div>
            
            {/* Scrollable Feed */}
            <div className="p-6 overflow-y-auto space-y-6 relative flex-1">
              <div className="absolute left-6 top-6 bottom-6 w-[2px] bg-outline-variant ml-[11px]"></div>
              
              {filteredActivity.slice(0, visibleCount).map((activity) => (
                <div key={activity.id} className="flex gap-4 relative group">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 mt-1 shrink-0 shadow-sm ${activity.color} ring-2 ring-surface`}>
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>{activity.icon}</span>
                  </div>
                  <div className="flex-1 p-3 rounded-xl border border-transparent hover:border-outline-variant hover:bg-surface-container-lowest transition-colors">
                    <p className="font-body-md text-body-md text-on-surface">{activity.text}</p>
                    <time className="text-xs text-on-surface-variant font-medium mt-1">{activity.time}</time>
                  </div>
                </div>
              ))}

              {/* Load More Button */}
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
