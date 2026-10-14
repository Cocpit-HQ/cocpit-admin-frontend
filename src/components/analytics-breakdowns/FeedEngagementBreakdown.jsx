import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../AuthContext';
import { useEnvironment } from '../../EnvironmentContext';

const isVideoMedia = (item) => {
  if (!item) return false;
  if (typeof item === 'string') {
    const url = item.toLowerCase();
    return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || url.includes('/video/upload/');
  }
  if (item.media_type === 'video' || item.mediaType === 'video') return true;
  const url = (item.url || item.mediaUrl || '').toLowerCase();
  return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || url.includes('/video/upload/');
};

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
  html = html.replace(/^##\s+(.+)$/gm, '<h4 class="font-bold text-base text-on-surface mt-4 mb-2">$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h5 class="font-bold text-sm text-on-surface mt-3 mb-1.5">$1</h5>');

  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Code block frame lines (e.g. 294 | };)
  html = html.replace(/^&gt;\s*(\d+\s*\|.*)$/gm, '<div class="font-mono text-xs text-red-700 bg-red-50 border-l-4 border-red-500 px-3 py-1 my-1 font-semibold">$1</div>');
  html = html.replace(/^(\d+\s*\|.*)$/gm, '<div class="font-mono text-xs text-on-surface-variant bg-surface-container-lowest border-l-4 border-outline-variant px-3 py-0.5 my-0.5">$1</div>');

  // Convert normal blockquotes (like &gt; blockquote text)
  html = html.replace(/^&gt;\s*(.+)$/gm, '<blockquote class="border-l-4 border-outline-variant pl-4 italic my-2 text-on-surface-variant">$1</blockquote>');

  // Handle newlines
  html = html.replace(/\n/g, '<br />');

  return html;
};

export default function FeedEngagementBreakdown() {
  const { accessToken } = useAuth();
  const { environment } = useEnvironment();

  const [viewMode, setViewMode] = useState('active'); // 'active' or 'unlisted'
  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
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

  // Likes State (original DB like data)
  const [postLikes, setPostLikes] = useState({}); // { [postId]: Array<LikeUser> }
  const [loadingLikes, setLoadingLikes] = useState({}); // { [postId]: boolean }

  // Takedown Warning Modal State
  const [takedownModalOpen, setTakedownModalOpen] = useState(false);
  const [takedownPostId, setTakedownPostId] = useState(null);
  const [takedownReason, setTakedownReason] = useState('Community Guidelines Violation');
  const [takedownMessage, setTakedownMessage] = useState('Your post has been unlisted by moderation for violating community rules.');

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

  const getHeaders = (extra = {}) => ({
    'Authorization': `Bearer ${accessToken}`,
    'x-environment': environment || localStorage.getItem('admin_environment') || 'staging',
    ...extra
  });

  // Reset active media when switching selected post
  useEffect(() => {
    setActiveMediaIndex(0);
  }, [selectedPostId]);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/feed/metrics', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Error fetching feed metrics', err);
    }
  };

  const fetchPostLikes = async (postId) => {
    if (!postId || postLikes[postId]) return;
    setLoadingLikes(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/admin/feed/posts/${postId}/likes`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setPostLikes(prev => ({ ...prev, [postId]: data }));
      }
    } catch (err) {
      console.error('Error fetching post likes:', err);
    } finally {
      setLoadingLikes(prev => ({ ...prev, [postId]: false }));
    }
  };

  const fetchPosts = async () => {
    try {
      const isLikesTab = viewMode === 'likes';
      const isCommentsTab = viewMode === 'comments';
      const isDeletedOnly = viewMode === 'deleted';

      // When user selects Likes and Recently Created: show same active feed data
      // Only when user clicks/selects Most Liked: show posts according to likes (> 0 likes, sorted by likes DESC)
      const isLikedOnly = (isLikesTab && filterSort === 'Most Liked') || (viewMode === 'active' && filterSort === 'Most Liked');
      const isCommentedOnly = (isCommentsTab && filterSort === 'Most Commented') || (viewMode === 'active' && filterSort === 'Most Commented');

      const effectiveSort = filterSort;

      const queryParams = new URLSearchParams({
        role: filterRole,
        location: filterLocation,
        sort: effectiveSort,
        page: currentPage.toString(),
        limit: '10',
        unlistedOnly: viewMode === 'unlisted' ? 'true' : 'false',
        deletedOnly: isDeletedOnly ? 'true' : 'false',
        likedOnly: isLikedOnly ? 'true' : 'false',
        commentedOnly: isCommentedOnly ? 'true' : 'false'
      });
      const res = await fetch(`/api/admin/feed/posts?${queryParams.toString()}`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        let fetchedPosts = data.posts || [];
        // Only when user clicks on most likes: filter to > 0 likes and display in descending order of likes
        if (effectiveSort === 'Most Liked') {
          fetchedPosts = fetchedPosts.filter(p => (p.metrics?.likes || 0) > 0);
          fetchedPosts.sort((a, b) => (b.metrics?.likes || 0) - (a.metrics?.likes || 0));
        } else if (effectiveSort === 'Most Commented') {
          fetchedPosts = fetchedPosts.filter(p => (p.metrics?.comments || 0) > 0);
          fetchedPosts.sort((a, b) => (b.metrics?.comments || 0) - (a.metrics?.comments || 0));
        } else if (effectiveSort === 'Most Tagged') {
          fetchedPosts.sort((a, b) => (b.metrics?.tags || 0) - (a.metrics?.tags || 0));
        }
        setPosts(fetchedPosts);
        setTotalPages(data.totalPages || 1);
        if (fetchedPosts.length > 0) {
          setSelectedPostId(fetchedPosts[0].id);
        } else {
          setSelectedPostId(null);
        }
      }
    } catch (err) {
      console.error('Error fetching posts', err);
    }
  };

  useEffect(() => {
    if (selectedPostId) {
      fetchPostLikes(selectedPostId);
    }
  }, [selectedPostId]);

  const fetchHashtags = async () => {
    try {
      const res = await fetch('/api/admin/feed/hashtags', {
        headers: getHeaders()
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
        headers: getHeaders()
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
  }, [accessToken, environment]);

  // Reset page to 1 when filters or viewMode change
  useEffect(() => {
    if (accessToken) {
      setCurrentPage(1);
    }
  }, [filterRole, filterLocation, filterSort, viewMode, environment]);

  // Fetch posts when access token, filters, viewMode or page change
  useEffect(() => {
    if (accessToken) {
      fetchPosts();
    }
  }, [accessToken, filterRole, filterLocation, filterSort, currentPage, viewMode, environment]);

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
          headers: getHeaders()
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

  const handleTakedownPost = (id) => {
    setTakedownPostId(id);
    setTakedownReason('Community Guidelines Violation');
    setTakedownMessage('Your post has been unlisted by moderation for violating community rules.');
    setTakedownModalOpen(true);
  };

  const submitTakedown = async () => {
    try {
      const res = await fetch(`/api/admin/feed/posts/${takedownPostId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: takedownReason, message: takedownMessage })
      });
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === takedownPostId ? { ...p, isUnlisted: true } : p));
        showToast('Post successfully unlisted and warning sent.');
        fetchMetrics();
        fetchLeaderboard();
        setTakedownModalOpen(false);
      } else {
        const data = await res.json();
        showToast(`Failed: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Error unlisting post', err);
      showToast('Error connecting to server.');
    }
  };

  const renderTakedownModal = () => {
    if (!takedownModalOpen) return null;
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
        <div className="bg-surface border border-outline-variant w-[450px] max-w-[90vw] rounded-xl shadow-xl p-6 animate-in zoom-in-95 duration-200 flex flex-col text-left">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500">warning</span>
              Unlist Post (Takedown)
            </h3>
            <button
              onClick={() => setTakedownModalOpen(false)}
              className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors"
            >
              close
            </button>
          </div>

          <p className="text-sm text-on-surface-variant mb-4">
            Unlisting this post will hide it from public feed views. The author will receive a warning notice.
          </p>

          <div className="flex flex-col gap-4 mb-6">
            <div>
              <label className="block text-[11px] font-mono-label text-on-surface-variant mb-1 ml-1">REASON</label>
              <input
                type="text"
                value={takedownReason}
                onChange={(e) => setTakedownReason(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono-label text-on-surface-variant mb-1 ml-1">WARNING MESSAGE TO AUTHOR</label>
              <textarea
                rows="3"
                value={takedownMessage}
                onChange={(e) => setTakedownMessage(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => setTakedownModalOpen(false)}
              className="px-4 py-2 border border-outline-variant text-sm font-semibold rounded-lg hover:bg-surface-container-low text-on-surface transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={submitTakedown}
              className="px-4 py-2 bg-error hover:bg-red-700 text-on-primary text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              Unlist Post
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  const handleRestorePost = async (id) => {
    if (!window.confirm('Are you sure you want to restore this post to public view?')) return;
    try {
      const res = await fetch(`/api/admin/feed/posts/${id}/restore`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, isUnlisted: false, isDeleted: false, appeal: null } : p));
        showToast('Post restored to public view.');
        fetchMetrics();
        fetchLeaderboard();
      } else {
        const data = await res.json();
        showToast(`Failed: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Error restoring post', err);
      showToast('Error connecting to server.');
    }
  };

  const handleRejectAppeal = async (id) => {
    if (!window.confirm('Are you sure you want to reject this appeal? The post will remain unlisted.')) return;
    try {
      const res = await fetch(`/api/admin/feed/posts/${id}/reject-appeal`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, appeal: null } : p));
        showToast('Appeal rejected. Post remains unlisted.');
      } else {
        const data = await res.json();
        showToast(`Failed: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Error rejecting appeal', err);
      showToast('Error connecting to server.');
    }
  };

  const renderPostDetail = () => {
    const post = posts.find(p => p.id === selectedPostId);
    if (!post) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 bg-surface border border-gray-200 rounded-xl">
          <span className="material-symbols-outlined text-5xl mb-3 text-gray-300">hide_image</span>
          <p className="text-sm font-medium">Select a post to view details</p>
        </div>
      );
    }

    const mediaItems = (post.mediaList && post.mediaList.length > 0)
      ? post.mediaList
      : (post.mediaUrl ? [{ url: post.mediaUrl, media_type: post.mediaType || 'image' }] : []);

    const currentMedia = mediaItems[activeMediaIndex] || mediaItems[0];

    return (
      <div className="w-full flex flex-col bg-surface border border-gray-200 rounded-xl overflow-hidden shadow-sm h-fit max-h-full">
        {/* Post Detail Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900">Post Detail</h3>
            {mediaItems.length > 1 && (
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                {mediaItems.length} media attached
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
            {new Date(post.created_at).toLocaleString()}
          </span>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex flex-col gap-5">
          {/* Deleted Post Warning Banner */}
          {post.isDeleted && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-red-600 text-[22px]">delete_forever</span>
                <div>
                  <h4 className="text-xs font-bold text-red-800">Deleted Post</h4>
                  <p className="text-[11px] text-red-600">This post has been deleted by the user.</p>
                </div>
              </div>
              <button
                onClick={() => handleRestorePost(post.id)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">settings_backup_restore</span>
                Restore Post
              </button>
            </div>
          )}

          {/* Large Image / Video View */}
          <div className="w-full bg-gray-900/5 rounded-xl border border-gray-200 overflow-hidden flex flex-col items-center justify-center min-h-[300px] relative">
            {currentMedia ? (
              isVideoMedia(currentMedia) ? (
                <video
                  key={currentMedia.url}
                  src={currentMedia.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-auto max-h-[500px] object-contain rounded-xl bg-black"
                />
              ) : (
                <img
                  key={currentMedia.url}
                  src={currentMedia.url}
                  alt="User Uploaded"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[500px] object-contain rounded-xl"
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-400 p-10">
                <span className="material-symbols-outlined text-4xl mb-2">image_not_supported</span>
                <p className="text-sm">No media uploaded</p>
              </div>
            )}
          </div>

          {/* Multiple Media Thumbnails Selector */}
          {mediaItems.length > 1 && (
            <div className="flex flex-col gap-1.5 -mt-2">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Attached Media ({mediaItems.length})
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {mediaItems.map((item, idx) => {
                  const isVid = isVideoMedia(item);
                  const isSelected = (activeMediaIndex === idx) || (!mediaItems[activeMediaIndex] && idx === 0);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveMediaIndex(idx)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-600/20 shadow-sm scale-105'
                          : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-400'
                        }`}
                    >
                      {isVid ? (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white relative">
                          <span className="material-symbols-outlined text-[20px]">play_circle</span>
                        </div>
                      ) : (
                        <img
                          src={item.url}
                          alt={`Media ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] px-1 rounded-tl font-bold">
                        {idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Post Description Text */}
          <div className="p-4 bg-surface-container border border-outline-variant rounded-xl shadow-sm">
            <h4 className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wide">Description</h4>
            <div className="text-[14px] leading-[20px] text-on-surface font-normal post-content-container">
              {post.content && post.content.includes('<') ? (
                <div dangerouslySetInnerHTML={{ __html: post.content }} />
              ) : post.content ? (
                <div dangerouslySetInnerHTML={{ __html: parseMarkdown(post.content) }} />
              ) : (
                <span className="text-gray-400 italic text-xs">No description text provided</span>
              )}
            </div>
          </div>

          {/* Original Liked By Users Section (from post_likes DB) */}
          <div className="p-4 bg-surface border border-outline-variant rounded-xl shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-on-surface uppercase tracking-wide flex items-center gap-1.5">
                <span className="material-symbols-outlined text-blue-600 text-[18px]">thumb_up</span>
                Liked by ({post.metrics.likes.toLocaleString()})
              </h4>
              {loadingLikes[post.id] && (
                <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>

            {loadingLikes[post.id] ? (
              <p className="text-xs text-on-surface-variant italic py-1">Retrieving likes from database...</p>
            ) : postLikes[post.id] && postLikes[post.id].length > 0 ? (
              <div className="flex flex-col divide-y divide-gray-100 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {postLikes[post.id].map(like => (
                  <div key={like.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={like.avatar} 
                        alt={like.author} 
                        referrerPolicy="no-referrer" 
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200" 
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">{like.author}</p>
                        <p className="text-[11px] text-on-surface-variant truncate">
                          {like.title}{like.company ? ` • ${like.company}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-on-surface-variant shrink-0 font-medium">
                      {new Date(like.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic py-1">
                {post.metrics.likes > 0 ? 'Loading like records...' : 'No likes recorded on this post yet.'}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCardView = () => (
    <div className="bg-surface border border-gray-200 rounded-xl overflow-hidden shadow-sm font-['Poppins',sans-serif] w-full h-full flex flex-col">
      {posts.length === 0 ? (
        <div className="p-8 text-center text-on-surface-variant my-auto flex flex-col items-center justify-center gap-2">
          <span className="material-symbols-outlined text-3xl text-gray-400">
            {viewMode === 'deleted' ? 'delete_sweep' : 'inbox'}
          </span>
          <p className="text-sm">
            {viewMode === 'deleted'
              ? 'No deleted posts found.'
              : 'No posts found matching the current filters.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-[#DADADA] overflow-y-auto custom-scrollbar h-full">
          {posts.map(post => (
            <div
              key={post.id}
              onClick={() => setSelectedPostId(post.id)}
              className={`relative flex flex-col p-4 gap-2 cursor-pointer transition-colors shrink-0 ${selectedPostId === post.id ? 'bg-blue-50/40 border-l-4 border-l-blue-500' : 'bg-surface hover:bg-gray-50 border-l-4 border-l-transparent'}`}
            >

              {/* Deleted Status Banner */}
              {/* {post.isDeleted && (
                <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 mb-2 w-max">
                  <span className="material-symbols-outlined text-red-600 text-sm">delete</span>
                  <span className="text-xs font-bold text-red-700">Deleted Post</span>
                </div>
              )} */}

              {/* Unlisted Status Banner */}
              {!post.isDeleted && post.isUnlisted && (
                <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md flex items-center gap-2 mb-2 w-max">
                  <span className="material-symbols-outlined text-gray-500 text-sm">visibility_off</span>
                  <span className="text-xs font-bold text-gray-700">Unlisted (Soft-Takedown)</span>
                </div>
              )}

              {/* User Appeal Warning Block */}
              {post.appeal && (
                <div className="px-4 py-3 mb-2 border border-orange-200 bg-orange-50 rounded-lg flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[20px] text-orange-700 mt-0.5">gavel</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-orange-900">User Appeal Submitted</p>
                      <div className="mt-1 bg-white border border-orange-200 p-2 rounded-lg text-sm font-medium text-orange-800 shadow-sm">
                        {post.appeal.reason}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end items-center mt-1">
                    <button
                      onClick={() => handleRejectAppeal(post.id)}
                      className="px-3 py-1.5 bg-white border border-orange-300 text-xs font-bold rounded-lg hover:bg-orange-100 text-orange-900 shadow-sm transition-all"
                    >
                      Reject Appeal
                    </button>
                    <button
                      onClick={() => handleRestorePost(post.id)}
                      className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-xs font-bold rounded-lg text-white shadow-sm transition-all"
                    >
                      Approve & Restore
                    </button>
                  </div>
                </div>
              )}

              {/* Main Post Data */}
              <div className={`flex flex-col gap-2 ${post.isDeleted ? 'opacity-70' : post.isUnlisted ? 'opacity-60' : ''}`}>
                {/* Frame 2609286 - Post Header */}
                <div className="flex justify-between items-start h-[36px]">
                  {/* Frame 2609288 - Avatar + Name Group */}
                  <div className="flex items-center gap-[6px]">
                    {/* Ellipse 3 - Avatar */}
                    <img src={post.avatar} alt={post.author} referrerPolicy="no-referrer" className="w-[32px] h-[32px] rounded-full object-cover shrink-0" />
                    {/* Frame 2609287 - Name + Role */}
                    <div className="flex flex-col justify-center h-[36px]">
                      {/* Name */}
                      <h4 className="font-semibold text-on-surface text-[14px] leading-[20px] m-0">{post.author}</h4>
                      {/* Role */}
                      <p className="font-normal text-on-surface-variant text-[12px] leading-[16px] m-0">
                        {post.title || 'Platform Member'}
                      </p>
                    </div>
                  </div>

                  {/* Moderation Actions (Vector Icon) */}
                  <div className="flex items-center h-[36px]">
                    {post.isDeleted ? (
                      <button onClick={() => handleRestorePost(post.id)} className="w-[24px] h-[24px] flex items-center justify-center text-green-600 hover:bg-green-50 rounded transition-colors" title="Restore Deleted Post">
                        <span className="material-symbols-outlined text-[18px]">restore_from_trash</span>
                      </button>
                    ) : post.isUnlisted ? (
                      <button onClick={() => handleRestorePost(post.id)} className="w-[24px] h-[24px] flex items-center justify-center text-indigo-500 hover:bg-indigo-50 rounded transition-colors" title="Restore Post">
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>settings_backup_restore</span>
                      </button>
                    ) : (
                      <button onClick={() => handleTakedownPost(post.id)} className="w-[24px] h-[24px] flex items-center justify-center text-indigo-500 hover:bg-indigo-50 rounded transition-colors" title="Takedown Post">
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>visibility_off</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Flags Alert */}
                {post.aiFlag && (
                  <div className="mt-1 px-3 py-2 rounded-lg flex items-start gap-2 bg-red-50 border border-red-100">
                    <span className="material-symbols-outlined text-[16px] mt-0.5 text-red-600">warning</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-red-800">Moderation Alert: {post.aiFlag.message}</p>
                    </div>
                  </div>
                )}

                {/* Frame 2609297 - Content Row */}
                <div className="flex flex-row items-center gap-[16px] min-h-[76px] mt-1">

                  {/* Background+Border - Image Thumbnail */}
                  {post.mediaUrl && (
                    <div className="w-[76px] h-[76px] rounded-[12px] border border-[#E5E7EB] bg-[#F3F4F6] flex items-center justify-center overflow-hidden shrink-0 relative group">
                      {isVideoMedia({ url: post.mediaUrl, media_type: post.mediaType }) ? (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white relative">
                          <span className="material-symbols-outlined text-[24px]">play_circle</span>
                        </div>
                      ) : (
                        <img
                          src={post.mediaUrl}
                          alt="Post media"
                          referrerPolicy="no-referrer"
                          className="w-[74px] h-[74px] object-cover"
                        />
                      )}
                      {post.mediaList && post.mediaList.length > 1 && (
                        <span className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 pointer-events-none">
                          <span className="material-symbols-outlined text-[10px]">photo_library</span>
                          {post.mediaList.length}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Frame 2609254 - Text Content */}
                  <div className="flex flex-col items-start gap-[8px] flex-1 max-h-[76px] overflow-hidden">
                    <div className="text-[14px] leading-[20px] text-on-surface font-normal line-clamp-3 post-content-container">
                      {post.content && post.content.includes('<') ? (
                        <div dangerouslySetInnerHTML={{ __html: post.content }} />
                      ) : post.content ? (
                        <div dangerouslySetInnerHTML={{ __html: parseMarkdown(post.content) }} />
                      ) : (
                        <span className="text-gray-400 italic text-xs">Media post without text caption</span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Interactive Metric Analytics Overlay (Not in Figma specs, keeping original style but adapting spacing) */}
                <div className="mt-2 flex items-center gap-4">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPostId(post.id);
                      fetchPostLikes(post.id);
                    }}
                    className="flex items-center gap-1.5 text-indigo-500 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                    <span className="text-xs font-semibold">{post.metrics.likes.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                    <span className="text-xs font-semibold">{post.metrics.comments.toLocaleString()}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[16px]">repeat</span>
                    <span className="text-xs font-semibold">{post.metrics.shares.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 px-2 py-1 rounded-md transition-colors cursor-pointer" title="Tags">
                    <span className="material-symbols-outlined text-[16px]">tag</span>
                    <span className="text-xs font-semibold">{(post.metrics.tags || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* Collapsible Comments Section */}
                {expandedComments[post.id] && (
                  <div className="mt-3 border-t border-gray-100 pt-3 flex flex-col gap-3">
                    {expandedComments[post.id].length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No comments on this post yet.</p>
                    ) : (
                      <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto pr-1">
                        {expandedComments[post.id].map(comment => (
                          <div key={comment.id} className="flex gap-2.5 items-start bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            <img src={comment.avatar} alt={comment.author} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline mb-0.5">
                                <span className="text-xs font-bold text-on-surface">{comment.author}</span>
                                <span className="text-[10px] text-gray-500">
                                  {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mb-1">{comment.title}</p>
                              <p className="text-xs text-on-surface break-words">{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {loadingComments[post.id] && (
                  <div className="mt-3 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderListView = () => (
    <div className="bg-surface border border-outline-variant rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-lowest border-b border-outline-variant text-xs uppercase tracking-wider text-on-surface-variant">
              <th className="p-4 font-semibold w-[220px]">Author</th>
              <th className="p-4 font-semibold">Content Snippet</th>
              <th className="p-4 font-semibold text-center w-[120px]">Metrics</th>
              <th className="p-4 font-semibold text-right w-[100px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {posts.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-on-surface-variant">
                  No posts found matching the current filters.
                </td>
              </tr>
            ) : (
              posts.map(post => (
                <tr key={post.id} className={`hover:bg-surface-container-lowest transition-colors group ${post.isUnlisted ? 'opacity-60 bg-surface-container-lowest/50' : ''}`}>
                  <td className="p-4">
                    <p className="font-bold text-on-surface text-sm truncate">{post.author}</p>
                    <p className="text-xs text-on-surface-variant truncate" title={`${post.title} @ ${post.company}`}>
                      {post.title} @ <span className="text-blue-600">{post.company}</span>
                    </p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-on-surface truncate max-w-md">{stripHtml(post.content)}</p>
                    {post.mediaUrl && <span className="text-[10px] bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded font-bold mt-1 inline-block mr-2">Has Media</span>}
                    {post.aiFlag && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold mt-1 inline-block bg-red-100 text-red-700 mr-2">Flagged</span>}
                    {post.isUnlisted && <span className="text-[10px] px-1.5 py-0.5 rounded font-bold mt-1 inline-block bg-surface-container text-on-surface">Unlisted</span>}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1 items-center">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full w-full text-center">👍 {post.metrics.likes}</span>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full w-full text-center">💬 {post.metrics.comments}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {post.isUnlisted ? (
                        <button onClick={() => handleRestorePost(post.id)} className="p-1 text-outline hover:text-green-600 hover:bg-green-50 dark:bg-green-900/20 rounded transition-colors" title="Restore Post">
                          <span className="material-symbols-outlined text-[16px]">settings_backup_restore</span>
                        </button>
                      ) : (
                        <button onClick={() => handleTakedownPost(post.id)} className="p-1 text-outline hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Takedown Post">
                          <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                        </button>
                      )}
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

  const handleTabClick = (tabId) => {
    setViewMode(tabId);
    if (tabId === 'tags') {
      setFilterSort('Most Tagged');
    }
  };

  return (
    <div className="flex flex-col gap-8 relative pb-12">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-surface-container-highest text-on-primary px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-up">
          <span className="material-symbols-outlined text-green-400">check_circle</span>
          <p className="font-medium text-sm">{toastMessage}</p>
        </div>
      )}

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-blue-600 text-2xl">favorite</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Engagement Rate</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-on-surface">{metrics.engagementRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-indigo-600 text-2xl">analytics</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Avg. Engagement / Post</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-on-surface">{metrics.avgEngagementPerPost}</span>
              <span className="text-xs text-on-surface-variant font-medium mb-1">interactions</span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-green-600 text-2xl">post_add</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Daily Activity Volume</p>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-black text-on-surface">{metrics.dailyActivityVolume}</span>
              <span className="text-xs text-on-surface-variant font-medium mb-1">Posts today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Bar: Controls + Dual-View Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'active', label: 'Active Feed' },
            { id: 'unlisted', label: 'Unlisted Posts' },
            { id: 'likes', label: 'Likes' },
            { id: 'comments', label: 'Comments' },
            { id: 'tags', label: 'Tags' },
            { id: 'deleted', label: 'Deleted Posts' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all ${viewMode === tab.id ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'bg-surface text-on-surface-variant border border-outline-variant hover:border-blue-300 hover:text-blue-500'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <select
            value={filterSort}
            onChange={(e) => setFilterSort(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant text-on-surface text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 font-medium"
          >
            <option>Recently Created</option>
            <option>Most Liked</option>
            <option>Most Commented</option>
            <option>Most Tagged</option>
            <option>Highly Reported</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-stretch">

        {/* Left Column: Feed List (Master) */}
        <div
          className="w-full lg:w-[35%] flex flex-col justify-between"
          style={{ height: '750px' }}
        >
          <div className="flex flex-col overflow-hidden flex-1 mb-4">
            {renderCardView()}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-surface border border-outline-variant rounded-xl p-4 shadow-sm shrink-0">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 border border-outline-variant text-xs font-semibold rounded-lg hover:bg-surface-container-lowest text-on-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <span className="text-xs font-medium text-on-surface">
                {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-3 py-1.5 border border-outline-variant text-xs font-semibold rounded-lg hover:bg-surface-container-lowest text-on-surface disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Center Column: Post Detail (Detail) */}
        <div
          className="w-full lg:w-[65%] flex flex-col"
          style={{ height: '750px' }}
        >
          {renderPostDetail()}
        </div>
      </div>
      {renderTakedownModal()}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        .post-content-container * {
          background-color: transparent !important;
          background: transparent !important;
          color: inherit !important;
        }
      `}} />
    </div>
  );
}

// force refresh
