import React, { useState } from 'react';

// --- Mock Data ---
const initialPosts = [
  {
    id: 'P-112',
    author: 'Sarah Jenkins',
    title: 'Senior UI/UX Designer',
    company: 'Figma',
    location: 'Remote',
    avatar: 'https://i.pravatar.cc/150?u=sarah',
    content: 'Just published my new case study on redesigning the checkout flow for enterprise e-commerce platforms. The key to high conversion is minimizing cognitive load! Let me know your thoughts.',
    mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    metrics: { likes: 1450, comments: 234, shares: 89, saves: 512, clicks: 890 },
    aiFlag: null,
    status: 'active'
  },
  {
    id: 'P-984',
    author: 'Alex Mercer',
    title: 'Frontend Engineer',
    company: 'StartupX',
    location: 'San Francisco, CA',
    avatar: 'https://i.pravatar.cc/150?u=alex',
    content: 'We are hiring! Looking for talented React developers to join our fast-paced team. DM me for details.',
    mediaUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    metrics: { likes: 320, comments: 45, shares: 12, saves: 4, clicks: 150 },
    aiFlag: { type: 'aspect_ratio', message: 'Warning: Image aspect ratio exceeds 4:5. Text overlay may be cropped on mobile devices.' },
    status: 'pinned'
  },
  {
    id: 'P-655',
    author: 'Crypto King',
    title: 'CEO | Founder | Visionary | Web3 | Blockchain | AI Expert',
    company: 'MoonLabs',
    location: 'Dubai',
    avatar: 'https://i.pravatar.cc/150?u=crypto',
    content: 'Get rich quick! Click the link below to double your ETH in 24 hours. Limited slots remaining!',
    mediaUrl: null,
    metrics: { likes: 12, comments: 2, shares: 0, saves: 1, clicks: 4 },
    aiFlag: { type: 'safety', message: 'High Risk: Detected financial scam terminology. Human review recommended.' },
    status: 'shadowbanned'
  }
];

const initialHashtags = [
  { id: 'H-1', tag: '#ReactJS', velocity: '+450/hr', status: 'active' },
  { id: 'H-2', tag: '#Hiring2026', velocity: '+320/hr', status: 'pinned' },
  { id: 'H-3', tag: '#CryptoScam', velocity: '+800/hr', status: 'shadowbanned' },
  { id: 'H-4', tag: '#DesignSystems', velocity: '+150/hr', status: 'active' }
];

const initialUnverified = [
  { id: 'U-1', name: 'John Doe', claimedTitle: 'Senior Software Engineer | Ex-FAANG | AI Prompt Master | 10x Developer', claimedCompany: 'Google', reason: 'Extreme Keyword Stuffing' },
  { id: 'U-2', name: 'Jane Smith', claimedTitle: 'Chief Happiness Officer', claimedCompany: 'Apple', reason: 'Unverified Company Domain' }
];

const initialLeaderboard = [
  { id: 'L-1', title: 'Why AI is replacing Junior Devs (And what to do)', author: 'Mark Z.', likes: 4520, comments: 890 },
  { id: 'L-2', title: 'My journey from bootcamp to Senior Dev', author: 'Emily C.', likes: 3200, comments: 450 },
  { id: 'L-3', title: 'The ultimate guide to CSS Grid in 2026', author: 'CSS Tricks', likes: 2800, comments: 120 }
];

export default function FeedEngagementBreakdown() {
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [posts, setPosts] = useState(initialPosts);
  const [hashtags, setHashtags] = useState(initialHashtags);
  const [unverified, setUnverified] = useState(initialUnverified);
  const [leaderboard] = useState(initialLeaderboard);
  const [toastMessage, setToastMessage] = useState('');
  
  // Filters
  const [filterRole, setFilterRole] = useState('All Roles');
  const [filterLocation, setFilterLocation] = useState('All Locations');
  const [filterSort, setFilterSort] = useState('Recently Created');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleTakedownPost = (id) => {
    setPosts(posts.filter(p => p.id !== id));
    showToast(`Post ${id} permanently removed from feed.`);
  };

  const handleBlurMedia = (id) => {
    setPosts(posts.map(p => {
      if (p.id === id && p.mediaUrl) {
        return { ...p, mediaBlurred: true, aiFlag: null };
      }
      return p;
    }));
    showToast(`Media asset for ${id} has been blurred and flagged for user.`);
  };

  const toggleHashtagStatus = (id, newStatus) => {
    setHashtags(hashtags.map(h => h.id === id ? { ...h, status: newStatus } : h));
    showToast(`Hashtag status updated to ${newStatus}.`);
  };

  const togglePostStatus = (id, newStatus) => {
    setPosts(posts.map(p => p.id === id ? { ...p, status: newStatus } : p));
    showToast(`Post ${id} marked as ${newStatus}.`);
  };

  const handleStripBadge = (id) => {
    setUnverified(unverified.filter(u => u.id !== id));
    showToast(`Unverified badge stripped from user ${id}.`);
  };

  // 1. Dual-View Feed Stream
  const renderCardView = () => (
    <div className="flex flex-col gap-6">
      {posts.map(post => (
        <div key={post.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative">
          
          {/* Post Header */}
          <div className="p-5 flex justify-between items-start">
            <div className="flex items-center gap-3">
              <img src={post.avatar} alt={post.author} className="w-12 h-12 rounded-full border border-gray-100" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-gray-900 leading-tight hover:underline cursor-pointer">{post.author}</h4>
                  {post.status === 'pinned' && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Pinned</span>}
                  {post.status === 'shadowbanned' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Shadowbanned</span>}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  <span className="font-medium text-gray-800">{post.title}</span> @ <span className="text-blue-600 font-semibold">{post.company}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">location_on</span> {post.location}
                </p>
              </div>
            </div>
            
            {/* Post Moderation Actions */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
              {post.status !== 'pinned' && (
                <button onClick={() => togglePostStatus(post.id, 'pinned')} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Force Feature (Pin)">
                  <span className="material-symbols-outlined text-[18px]">push_pin</span>
                </button>
              )}
              {post.status !== 'shadowbanned' && (
                <button onClick={() => togglePostStatus(post.id, 'shadowbanned')} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors" title="Shadowban Post">
                  <span className="material-symbols-outlined text-[18px]">visibility_off</span>
                </button>
              )}
              {post.status !== 'active' && (
                <button onClick={() => togglePostStatus(post.id, 'active')} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Restore Default Status">
                  <span className="material-symbols-outlined text-[18px]">restore</span>
                </button>
              )}
              <div className="w-px h-5 bg-gray-300 mx-1"></div>
              <button onClick={() => handleTakedownPost(post.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Takedown Post">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>

          {/* AI Media Asset & Safety Flags */}
          {post.aiFlag && (
            <div className={`px-5 py-3 border-y flex items-start gap-2 ${post.aiFlag.type === 'safety' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
              <span className={`material-symbols-outlined text-[18px] mt-0.5 ${post.aiFlag.type === 'safety' ? 'text-red-600' : 'text-amber-600'}`}>
                {post.aiFlag.type === 'safety' ? 'warning' : 'aspect_ratio'}
              </span>
              <div className="flex-1">
                <p className={`text-xs font-bold ${post.aiFlag.type === 'safety' ? 'text-red-800' : 'text-amber-800'}`}>
                  Automated AI Flag
                </p>
                <p className={`text-xs mt-0.5 ${post.aiFlag.type === 'safety' ? 'text-red-700' : 'text-amber-700'}`}>
                  {post.aiFlag.message}
                </p>
              </div>
              {post.aiFlag.type === 'aspect_ratio' && post.mediaUrl && (
                <button 
                  onClick={() => handleBlurMedia(post.id)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm"
                >
                  Force Fit / Blur
                </button>
              )}
            </div>
          )}

          {/* Post Content */}
          <div className="p-5 pt-3">
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{post.content}</p>
          </div>

          {/* Media Content */}
          {post.mediaUrl && (
            <div className={`w-full bg-gray-100 ${post.mediaBlurred ? 'filter blur-md opacity-75' : ''}`}>
              <img src={post.mediaUrl} alt="Post media" className="w-full h-auto max-h-[400px] object-cover" />
            </div>
          )}

          {/* Interactive Metric Analytics Overlay */}
          <div className="bg-slate-50 border-t border-gray-100 p-4 flex items-center justify-between">
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-full cursor-help" title="Likes">
                <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                <span className="text-xs font-bold">{post.metrics.likes.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full cursor-help" title="Comments">
                <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                <span className="text-xs font-bold">{post.metrics.comments.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded-full cursor-help" title="Reposts">
                <span className="material-symbols-outlined text-[16px]">repeat</span>
                <span className="text-xs font-bold">{post.metrics.shares.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-full cursor-help" title="Saves">
                <span className="material-symbols-outlined text-[16px]">bookmark</span>
                <span className="text-xs font-bold">{post.metrics.saves.toLocaleString()}</span>
              </div>
            </div>
            
            {/* Click-Through Tracking */}
            <div className="flex items-center gap-2 text-gray-500">
              <span className="material-symbols-outlined text-[16px]">ads_click</span>
              <span className="text-xs font-semibold">{post.metrics.clicks.toLocaleString()} Profile Clicks</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-semibold w-[220px]">Author & Badge</th>
              <th className="p-4 font-semibold">Content Snippet</th>
              <th className="p-4 font-semibold text-center w-[120px]">Metrics</th>
              <th className="p-4 font-semibold text-center w-[140px]">Post Status</th>
              <th className="p-4 font-semibold text-right w-[180px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.map(post => (
              <tr key={post.id} className="hover:bg-gray-50 transition-colors group">
                <td className="p-4">
                  <p className="font-bold text-gray-900 text-sm truncate">{post.author}</p>
                  <p className="text-xs text-gray-500 truncate" title={`${post.title} @ ${post.company}`}>
                    {post.title} @ <span className="text-blue-600">{post.company}</span>
                  </p>
                </td>
                <td className="p-4">
                  <p className="text-sm text-gray-700 truncate max-w-md">{post.content}</p>
                  {post.mediaUrl && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold mt-1 inline-block mr-2">Has Media</span>}
                  {post.aiFlag && <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold mt-1 inline-block ${post.aiFlag.type === 'safety' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>Flagged</span>}
                </td>
                <td className="p-4">
                  <div className="flex flex-col gap-1 items-center">
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-full text-center">👍 {post.metrics.likes}</span>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full w-full text-center">💬 {post.metrics.comments}</span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  {post.status === 'active' && <span className="text-xs font-semibold text-gray-500">Active</span>}
                  {post.status === 'pinned' && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Pinned</span>}
                  {post.status === 'shadowbanned' && <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Hidden</span>}
                </td>
                <td className="p-4 text-right">
                   <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {post.status !== 'pinned' && (
                      <button onClick={() => togglePostStatus(post.id, 'pinned')} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Force Feature">
                        <span className="material-symbols-outlined text-[16px]">push_pin</span>
                      </button>
                    )}
                    {post.status !== 'shadowbanned' && (
                      <button onClick={() => togglePostStatus(post.id, 'shadowbanned')} className="p-1 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors" title="Shadowban Post">
                        <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                      </button>
                    )}
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    <button onClick={() => handleTakedownPost(post.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 relative pb-12">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-up">
          <span className="material-symbols-outlined text-green-400">check_circle</span>
          <p className="font-medium text-sm">{toastMessage}</p>
        </div>
      )}

      {/* PHASE 3: Platform Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-blue-600 text-2xl">favorite</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Engagement Rate</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-gray-900">14.5%</span>
              <span className="text-xs text-green-600 font-bold mb-1 flex items-center"><span className="material-symbols-outlined text-[14px]">arrow_upward</span> 2.1%</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-indigo-600 text-2xl">speed</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">System Latency</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-gray-900">210ms</span>
              <span className="text-xs text-gray-500 font-medium mb-1">Load time</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-green-600 text-2xl">post_add</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Daily Activity Volume</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-gray-900">4,520</span>
              <span className="text-xs text-gray-500 font-medium mb-1">Posts today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Bar: Job Title & Filter Controls + Dual-View Toggle */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
        
        <div className="flex items-center gap-4">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button 
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === 'card' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <span className="material-symbols-outlined text-[18px]">view_agenda</span>
              Visual Cards
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <span className="material-symbols-outlined text-[18px]">table_rows</span>
              Condensed List
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <select 
            value={filterSort}
            onChange={(e) => setFilterSort(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 font-medium"
          >
            <option>Recently Created</option>
            <option>Most Liked</option>
            <option>Highly Reported</option>
          </select>
          <div className="w-px h-8 bg-gray-200 mx-1"></div>
          <select 
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 font-medium"
          >
            <option>All Roles</option>
            <option>Software Engineers</option>
            <option>Designers</option>
            <option>Founders / Executives</option>
          </select>
          <select 
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 font-medium"
          >
            <option>All Locations</option>
            <option>Remote / Hybrid</option>
            <option>San Francisco, CA</option>
            <option>New York, NY</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column: Feed Stream */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          {viewMode === 'card' ? renderCardView() : renderListView()}
        </div>

        {/* Right Column: Moderation Panels */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 sticky top-6">
          
          {/* PHASE 3: Viral Content Leaderboard */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-amber-50 p-5 border-b border-amber-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">local_fire_department</span>
                Viral Content Leaderboard
              </h3>
            </div>
            <div className="p-0">
              <ul className="divide-y divide-gray-100">
                {leaderboard.map((item, index) => (
                  <li key={item.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                    <span className="text-2xl font-black text-gray-200 w-8 text-center">{index + 1}</span>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm cursor-pointer hover:text-blue-600 transition-colors leading-tight line-clamp-2">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1">by {item.author}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">thumb_up</span> {item.likes.toLocaleString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Trending & Hashtag Override Panel */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 border-b border-indigo-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-indigo-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600">tag</span>
                  Live Trending Overrides
                </h3>
                <p className="text-xs text-indigo-700 mt-1">Control hashtag algorithmic traction.</p>
              </div>
            </div>
            <div className="p-0">
              <ul className="divide-y divide-gray-100">
                {hashtags.map(tag => (
                  <li key={tag.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{tag.tag}</p>
                      <p className="text-xs text-green-600 font-semibold mt-0.5">{tag.velocity}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {tag.status === 'pinned' && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Pinned</span>}
                      {tag.status === 'shadowbanned' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Hidden</span>}
                      
                      <div className="flex gap-1 ml-2">
                        {tag.status !== 'pinned' && (
                          <button 
                            onClick={() => toggleHashtagStatus(tag.id, 'pinned')}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Force Feature"
                          >
                            <span className="material-symbols-outlined text-[18px]">push_pin</span>
                          </button>
                        )}
                        {tag.status !== 'shadowbanned' && (
                          <button 
                            onClick={() => toggleHashtagStatus(tag.id, 'shadowbanned')}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Shadowban"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility_off</span>
                          </button>
                        )}
                        {tag.status !== 'active' && (
                          <button 
                            onClick={() => toggleHashtagStatus(tag.id, 'active')}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Restore to Active"
                          >
                            <span className="material-symbols-outlined text-[18px]">restore</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Workplace Status Auditing */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-slate-50 p-5 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-600">verified_user</span>
                Workplace Status Auditing
              </h3>
              <p className="text-xs text-slate-600 mt-1">Flagged profiles claiming unverified titles.</p>
            </div>
            <div className="p-0">
              {unverified.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">All flagged badges resolved.</div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {unverified.map(user => (
                    <li key={user.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900 text-sm">{user.name}</h4>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200">
                          {user.reason}
                        </span>
                      </div>
                      
                      <div className="bg-gray-100 p-2 rounded text-xs mb-3 border border-gray-200">
                        <span className="text-gray-500 font-medium">Claimed Badge: </span>
                        <span className="font-mono text-red-600 bg-red-50 px-1 rounded truncate block mt-1">{user.claimedTitle} @ {user.claimedCompany}</span>
                      </div>

                      <button 
                        onClick={() => handleStripBadge(user.id)}
                        className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold py-2 rounded transition-colors shadow-sm"
                      >
                        Strip Professional Badge
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
