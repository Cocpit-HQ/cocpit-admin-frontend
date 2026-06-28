import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';

const stripHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const parseMarkdown = (text) => {
  if (!text) return '';
  
  // Escape HTML to prevent XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  // Headers (e.g. ## Error Type)
  html = html.replace(/^##\s+(.+)$/gm, '<h4 class="font-bold text-base text-gray-900 mt-4 mb-2">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h5 class="font-bold text-sm text-gray-800 mt-3 mb-1.5">$1</h5>');
  
  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Code block frame lines (e.g. 294 | };)
  html = html.replace(/^&gt;\s*(\d+\s*\|.*)$/gm, '<div class="font-mono text-xs text-red-700 bg-red-50 border-l-4 border-red-500 px-3 py-1 my-1 font-semibold">$1</div>');
  html = html.replace(/^(\d+\s*\|.*)$/gm, '<div class="font-mono text-xs text-gray-600 bg-gray-50 border-l-4 border-gray-300 px-3 py-0.5 my-0.5">$1</div>');

  // Convert normal blockquotes (like &gt; blockquote text)
  html = html.replace(/^&gt;\s*(.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 italic my-2 text-gray-600">$1</blockquote>');
  
  // Handle newlines
  html = html.replace(/\n/g, '<br />');
  
  return html;
};

export default function FeedEngagementBreakdown() {
  const { accessToken } = useAuth();
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'list'
  const [posts, setPosts] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  
  // Filters
  const [filterRole, setFilterRole] = useState('All Roles');
  const [filterLocation, setFilterLocation] = useState('All Locations');
  const [filterSort, setFilterSort] = useState('Recently Created');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Comments State
  const [expandedComments, setExpandedComments] = useState({}); // { postId: [comments] }
  const [loadingComments, setLoadingComments] = useState({}); // { postId: boolean }

  // KPI Metrics
  const [metrics, setMetrics] = useState({
    engagementRate: 0,
    dailyActivityVolume: 0,
    avgEngagementPerPost: 0
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/feed/metrics', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Error fetching feed metrics', err);
    }
  };

  const fetchPosts = async () => {
    try {
      const queryParams = new URLSearchParams({
        role: filterRole,
        location: filterLocation,
        sort: filterSort,
        page: currentPage.toString(),
        limit: '10'
      });
      const res = await fetch(`/api/admin/feed/posts?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching posts', err);
    }
  };

  const fetchHashtags = async () => {
    try {
      const res = await fetch('/api/admin/feed/hashtags', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHashtags(data);
      }
    } catch (err) {
      console.error('Error fetching hashtags', err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/admin/feed/leaderboard', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error('Error fetching leaderboard', err);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchMetrics();
      fetchHashtags();
      fetchLeaderboard();
    }
  }, [accessToken]);

  // Reset page to 1 when filters change
  useEffect(() => {
    if (accessToken) {
      setCurrentPage(1);
    }
  }, [filterRole, filterLocation, filterSort]);

  // Fetch posts when access token, filters or page change
  useEffect(() => {
    if (accessToken) {
      fetchPosts();
    }
  }, [accessToken, filterRole, filterLocation, filterSort, currentPage]);

  const toggleComments = async (postId) => {
    if (expandedComments[postId]) {
      setExpandedComments(prev => {
        const copy = { ...prev };
        delete copy[postId];
        return copy;
      });
    } else {
      setLoadingComments(prev => ({ ...prev, [postId]: true }));
      try {
        const res = await fetch(`/api/admin/feed/posts/${postId}/comments`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setExpandedComments(prev => ({ ...prev, [postId]: data }));
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      } finally {
        setLoadingComments(prev => ({ ...prev, [postId]: false }));
      }
    }
  };

  const handleTakedownPost = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this post?')) return;
    try {
      const res = await fetch(`/api/admin/feed/posts/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== id));
        showToast('Post permanently removed from feed.');
        fetchMetrics();
        fetchLeaderboard();
      } else {
        const data = await res.json();
        showToast(`Failed: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Error deleting post', err);
      showToast('Error connection to server.');
    }
  };

  const renderCardView = () => (
    <div className="flex flex-col gap-6">
      {posts.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl border border-gray-200 text-gray-500">
          No posts found matching the current filters.
        </div>
      ) : (
        posts.map(post => (
          <div key={post.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative">
            
            {/* Post Header */}
            <div className="p-5 flex justify-between items-start">
              <div className="flex items-center gap-3">
                <img src={post.avatar} alt={post.author} className="w-12 h-12 rounded-full border border-gray-100" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 leading-tight">{post.author}</h4>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {post.title && post.company ? (
                      <>
                        <span className="font-medium text-gray-800">{post.title}</span>
                        {" @ "}
                        <span className="text-blue-600 font-semibold">{post.company}</span>
                      </>
                    ) : post.title ? (
                      <span className="font-medium text-gray-800">{post.title}</span>
                    ) : post.company ? (
                      <span className="text-blue-600 font-semibold">{post.company}</span>
                    ) : (
                      <span className="text-gray-400 font-medium">Platform Member</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">location_on</span> {post.location}
                  </p>
                </div>
              </div>
              
              {/* Post Moderation Actions */}
              <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
                <button onClick={() => handleTakedownPost(post.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Takedown Post">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>

            {/* AI Flags Alert (If Author Has Moderation Flags) */}
            {post.aiFlag && (
              <div className="px-5 py-3 border-y flex items-start gap-2 bg-red-50 border-red-100">
                <span className="material-symbols-outlined text-[18px] mt-0.5 text-red-600">warning</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-red-800">Moderation Alert</p>
                  <p className="text-xs mt-0.5 text-red-700">{post.aiFlag.message}</p>
                </div>
              </div>
            )}

            {/* Post Content */}
            <div className="p-5 pt-3 text-sm text-gray-800">
              {post.content && post.content.includes('<') ? (
                <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: post.content }} />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: parseMarkdown(post.content) }} />
              )}
            </div>

            {/* Media Content */}
            {post.mediaUrl && (
              <div className="w-full bg-gray-100">
                <img src={post.mediaUrl} alt="Post media" className="w-full h-auto max-h-[400px] object-cover" />
              </div>
            )}

            {/* Interactive Metric Analytics Overlay */}
            <div className="bg-slate-50 border-t border-gray-100 p-4 flex items-center justify-between">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-full" title="Likes">
                  <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                  <span className="text-xs font-bold">{post.metrics.likes.toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors"
                  title="View Comments"
                >
                  <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                  <span className="text-xs font-bold">{post.metrics.comments.toLocaleString()}</span>
                </button>
                <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded-full" title="Reposts">
                  <span className="material-symbols-outlined text-[16px]">repeat</span>
                  <span className="text-xs font-bold">{post.metrics.shares.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Collapsible Comments Section */}
            {expandedComments[post.id] && (
              <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 flex flex-col gap-3">
                <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Comments ({expandedComments[post.id].length})</h5>
                {expandedComments[post.id].length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No comments on this post yet.</p>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[250px] overflow-y-auto pr-1">
                    {expandedComments[post.id].map(comment => (
                      <div key={comment.id} className="flex gap-2.5 items-start bg-white p-2.5 rounded-lg border border-gray-100 shadow-xs">
                        <img src={comment.avatar} alt={comment.author} className="w-8 h-8 rounded-full border border-gray-50 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <span className="text-xs font-bold text-gray-900">{comment.author}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">{comment.title} @ <span className="text-blue-500 font-semibold">{comment.company}</span></p>
                          <p className="text-xs text-gray-700 leading-snug break-words">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {loadingComments[post.id] && (
              <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-semibold w-[220px]">Author</th>
              <th className="p-4 font-semibold">Content Snippet</th>
              <th className="p-4 font-semibold text-center w-[120px]">Metrics</th>
              <th className="p-4 font-semibold text-right w-[100px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  No posts found matching the current filters.
                </td>
              </tr>
            ) : (
              posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <p className="font-bold text-gray-900 text-sm truncate">{post.author}</p>
                    <p className="text-xs text-gray-500 truncate" title={`${post.title} @ ${post.company}`}>
                      {post.title} @ <span className="text-blue-600">{post.company}</span>
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-700 truncate max-w-md">{stripHtml(post.content)}</p>
                    {post.mediaUrl && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold mt-1 inline-block mr-2">Has Media</span>}
                    {post.aiFlag && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold mt-1 inline-block bg-red-100 text-red-700">Flagged</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-center">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full w-full text-center">👍 {post.metrics.likes}</span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full w-full text-center">💬 {post.metrics.comments}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleTakedownPost(post.id)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
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

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-blue-600 text-2xl">favorite</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Engagement Rate</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-gray-900">{metrics.engagementRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-indigo-600 text-2xl">analytics</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Avg. Engagement / Post</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-gray-900">{metrics.avgEngagementPerPost}</span>
              <span className="text-xs text-gray-500 font-medium mb-1">interactions</span>
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
              <span className="text-2xl font-black text-gray-900">{metrics.dailyActivityVolume}</span>
              <span className="text-xs text-gray-500 font-medium mb-1">Posts today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Bar: Controls + Dual-View Toggle */}
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
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column: Feed Stream */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          {viewMode === 'card' ? renderCardView() : renderListView()}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-sm mt-4">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-2 border border-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-4 py-2 border border-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Side Panels */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 sticky top-6">
          
          {/* Viral Content Leaderboard */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-amber-50 p-5 border-b border-amber-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">local_fire_department</span>
                Viral Content Leaderboard
              </h3>
            </div>
            <div className="p-0">
              <ul className="divide-y divide-gray-100">
                {leaderboard.length === 0 ? (
                  <li className="p-4 text-center text-gray-500 text-sm">No viral content.</li>
                ) : (
                  leaderboard.map((item, index) => {
                    const getRankStyle = (idx) => {
                      switch (idx) {
                        case 0: return 'bg-amber-100 text-amber-700 ring-2 ring-amber-300';
                        case 1: return 'bg-slate-100 text-slate-700 ring-2 ring-slate-300';
                        case 2: return 'bg-orange-100 text-orange-700 ring-2 ring-orange-300';
                        default: return 'bg-gray-50 text-gray-400 border border-gray-200';
                      }
                    };
                    return (
                      <li key={item.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${getRankStyle(index)}`}>
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{stripHtml(item.title)}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">by {item.author}</p>
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-[10px] font-extrabold text-blue-600 bg-blue-50/60 px-1.5 py-0.5 rounded-md" title="Likes">
                                <span className="material-symbols-outlined text-[12px]">thumb_up</span> {item.likes.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-600 bg-indigo-50/60 px-1.5 py-0.5 rounded-md" title="Comments">
                                <span className="material-symbols-outlined text-[12px]">chat_bubble</span> {item.comments.toLocaleString()}
                              </span>
                              {item.shares > 0 && (
                                <span className="flex items-center gap-1 text-[10px] font-extrabold text-green-600 bg-green-50/60 px-1.5 py-0.5 rounded-md" title="Shares">
                                  <span className="material-symbols-outlined text-[12px]">repeat</span> {item.shares.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          </div>

          {/* Trending Hashtags */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 border-b border-indigo-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-indigo-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600">tag</span>
                  Trending Hashtags
                </h3>
              </div>
            </div>
            <div className="p-0">
              <ul className="divide-y divide-gray-100">
                {hashtags.length === 0 ? (
                  <li className="p-4 text-center text-gray-500 text-sm">No hashtags found.</li>
                ) : (
                  hashtags.map(tag => (
                    <li key={tag.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{tag.tag}</p>
                        <p className="text-xs text-green-600 font-semibold mt-0.5">{tag.velocity}</p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
