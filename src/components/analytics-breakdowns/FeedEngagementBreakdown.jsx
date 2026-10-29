import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

// Helper to format relative time
const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// Helper to get author initials
const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Helper to parse mention and content structure
export const parseContentData = (rawContent) => {
  if (!rawContent || !rawContent.trim()) {
    return {
      mention: null,
      cleanedText: '',
      hashtags: [],
      isEmpty: true
    };
  }

  let text = rawContent;
  let mention = null;

  // Match pattern @([Name](uuid)) or @[Name](uuid) or @([Name](id))
  const mentionRegex = /@\(?\[([^\]]+)\]\(([^)]+)\)\)?/g;
  const match = mentionRegex.exec(rawContent);
  if (match) {
    mention = {
      name: match[1],
      id: match[2]
    };
    text = rawContent.replace(mentionRegex, '').trim();
  }

  // Extract hashtags like #growthmindset
  const hashtagRegex = /#(\w+)/g;
  const hashtags = [];
  let hMatch;
  while ((hMatch = hashtagRegex.exec(text)) !== null) {
    hashtags.push(hMatch[1]);
  }

  return {
    mention,
    cleanedText: text,
    hashtags,
    isEmpty: !mention && !text.trim()
  };
};

export default function FeedEngagementBreakdown() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPostId = searchParams.get('postId');

  // Navigation Tabs: 'active' | 'unlisted' | 'deleted' | 'likes' | 'comments' | 'tags'
  const [activeTab, setActiveTab] = useState('active');
  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters, Sorting & Stream Search
  const [filterSort, setFilterSort] = useState('Recently Created');
  const [filterRole, setFilterRole] = useState('All Roles');
  const [filterLocation, setFilterLocation] = useState('All Locations');
  const [selectedTagFilter, setSelectedTagFilter] = useState(null);
  const [showDetailedFilters, setShowDetailedFilters] = useState(false);
  const [streamSearchQuery, setStreamSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPostsCount, setTotalPostsCount] = useState(35);

  // KPI Metrics
  const [metrics, setMetrics] = useState({
    engagementRate: 779.1,
    avgEngagementPerPost: 1.3,
    dailyActivityVolume: 3
  });

  // Local likes tracking
  const [likedPosts, setLikedPosts] = useState(new Set());

  // Post tags map (postId -> tags array)
  const [postTagsMap, setPostTagsMap] = useState({});

  // Comments & Drawers
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [postComments, setPostComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Three-dots more options dropdown menu
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);

  // Modals
  const [takedownModalOpen, setTakedownModalOpen] = useState(false);
  const [takedownPostId, setTakedownPostId] = useState(null);
  const [takedownReason, setTakedownReason] = useState('Community Guidelines Violation');
  const [takedownMessage, setTakedownMessage] = useState('Your post has been unlisted by moderation for violating community rules.');

  const [rawPayloadModalOpen, setRawPayloadModalOpen] = useState(false);
  const [editTagsModalOpen, setEditTagsModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState(null);

  const handleOpenAudit = async (postId) => {
    if (!postId) return;
    setAuditModalOpen(true);
    setLoadingAudit(true);
    setAuditError(null);
    try {
      const res = await fetch(`/api/admin/feed/posts/${postId}/audit-history`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) {
        throw new Error(`Failed to load audit history (${res.status})`);
      }
      const data = await res.json();
      setAuditEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching audit history:', err);
      setAuditError(err.message || 'Failed to fetch audit history');
    } finally {
      setLoadingAudit(false);
    }
  };
  const [tagsInput, setTagsInput] = useState('Corporate, Engineering, Networking');

  // Verified posts local tracking
  const [verifiedPosts, setVerifiedPosts] = useState(new Set());

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const copyToClipboard = (text, successMsg = 'Copied to clipboard!') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(successMsg);
  };

  // Close more menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
      }
    };
    if (moreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreMenuOpen]);

  // Fetch KPI Metrics
  const fetchMetrics = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch('/api/admin/feed/metrics', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMetrics({
          engagementRate: data.engagementRate ?? 779.1,
          avgEngagementPerPost: data.avgEngagementPerPost ?? 1.3,
          dailyActivityVolume: data.dailyActivityVolume ?? 3
        });
      }
    } catch (err) {
      console.error('Error fetching feed metrics:', err);
    }
  };

  // Fetch Feed Posts
  const fetchPosts = async () => {
    if (!accessToken) return;
    try {
      let sortParam = filterSort;
      if (activeTab === 'likes') sortParam = 'Most Liked';
      if (activeTab === 'comments') sortParam = 'Most Commented';
      if (filterSort === 'Most Engaged') sortParam = 'Most Engaged';
      if (filterSort === 'Highest Flag Risk') sortParam = 'Highly Reported';
      if (filterSort === 'Oldest First') sortParam = 'Oldest First';

      const queryParams = new URLSearchParams({
        role: filterRole,
        location: filterLocation,
        sort: sortParam,
        page: currentPage.toString(),
        limit: '10'
      });

      if (activeTab === 'unlisted') {
        queryParams.set('unlistedOnly', 'true');
      } else if (activeTab === 'deleted') {
        queryParams.set('deletedOnly', 'true');
      } else {
        queryParams.set('unlistedOnly', 'false');
      }

      const res = await fetch(`/api/admin/feed/posts?${queryParams.toString()}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        let fetchedPosts = data.posts || [];

        // Apply local tag filter if set or tab is 'tags'
        if (selectedTagFilter) {
          fetchedPosts = fetchedPosts.filter(p => {
            const parsed = parseContentData(p.content);
            const customTags = postTagsMap[p.id] || [];
            return parsed.hashtags.some(h => h.toLowerCase() === selectedTagFilter.toLowerCase()) ||
              customTags.some(t => t.toLowerCase() === selectedTagFilter.toLowerCase());
          });
        }

        setPosts(fetchedPosts);
        setTotalPages(data.totalPages || 1);
        if (data.totalPosts !== undefined) {
          setTotalPostsCount(data.totalPosts);
        }

        // Set or keep selected post
        if (fetchedPosts.length > 0) {
          if (!selectedPostId || !fetchedPosts.some(p => p.id === selectedPostId)) {
            setSelectedPostId(fetchedPosts[0].id);
          }
        } else {
          setSelectedPostId(null);
        }
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [accessToken]);

  useEffect(() => {
    fetchPosts();
  }, [accessToken, activeTab, filterSort, filterRole, filterLocation, currentPage, selectedTagFilter]);

  // Handle URL postId parameter (e.g., from Global Search or shared links)
  useEffect(() => {
    if (!urlPostId || !accessToken) return;

    const existing = posts.find(p => p.id === urlPostId);
    if (existing) {
      setSelectedPostId(urlPostId);
    } else {
      // Fetch specific post by ID and prepend to posts stream
      (async () => {
        try {
          const res = await fetch(`/api/admin/feed/posts/${urlPostId}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          if (res.ok) {
            const postData = await res.json();
            setPosts(prev => [postData, ...prev.filter(p => p.id !== urlPostId)]);
            setSelectedPostId(urlPostId);
            showToast(`Opened post ${urlPostId.slice(0, 8)}...`);
          }
        } catch (err) {
          console.error('Error fetching post from URL param:', err);
        }
      })();
    }
  }, [urlPostId, accessToken]);

  const selectedPost = useMemo(() => {
    return posts.find(p => p.id === selectedPostId) || posts[0] || null;
  }, [posts, selectedPostId]);

  // Sync tags input when selected post changes
  useEffect(() => {
    if (selectedPost) {
      const existing = postTagsMap[selectedPost.id];
      if (existing && existing.length > 0) {
        setTagsInput(existing.join(', '));
      } else {
        const parsed = parseContentData(selectedPost.content);
        if (parsed.hashtags.length > 0) {
          setTagsInput(parsed.hashtags.join(', '));
        } else {
          setTagsInput('Corporate, Engineering, Networking');
        }
      }
    }
  }, [selectedPostId]);

  // Refresh feed with animation and toast
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchPosts(), fetchMetrics()]);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Feed and analytics refreshed.');
    }, 400);
  };

  // Handle Takedown (Unlist)
  const handleOpenTakedown = (id) => {
    setTakedownPostId(id);
    setTakedownReason('Community Guidelines Violation');
    setTakedownMessage('Your post has been unlisted by moderation for violating community rules.');
    setTakedownModalOpen(true);
  };

  const submitTakedown = async () => {
    if (!takedownPostId) return;
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
        showToast('Post successfully unlisted.');
        fetchMetrics();
        setTakedownModalOpen(false);
      } else {
        const data = await res.json();
        showToast(`Failed: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Error unlisting post:', err);
      showToast('Error connecting to server.');
    }
  };

  // Handle Restore
  const handleRestorePost = async (id) => {
    try {
      const res = await fetch(`/api/admin/feed/posts/${id}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, isUnlisted: false, isDeleted: false, appeal: null } : p));
        showToast('Post restored to public view.');
        fetchMetrics();
        if (activeTab === 'deleted' || activeTab === 'unlisted') {
          fetchPosts();
        }
      } else {
        const data = await res.json();
        showToast(`Failed: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Error restoring post:', err);
      showToast('Error connecting to server.');
    }
  };

  // Handle Reject Appeal
  const handleRejectAppeal = async (id) => {
    try {
      const res = await fetch(`/api/admin/feed/posts/${id}/reject-appeal`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, appeal: null } : p));
        showToast('Appeal officially rejected.');
        fetchMetrics();
      } else {
        const data = await res.json();
        showToast(`Failed: ${data.error || 'Server error'}`);
      }
    } catch (err) {
      console.error('Error rejecting appeal:', err);
      showToast('Error connecting to server.');
    }
  };

  // Handle Delete Post
  const handleDeletePost = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post? This will unlist and remove the post from the moderation stream.')) return;
    try {
      const res = await fetch(`/api/admin/feed/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Admin deletion', message: 'Your post was removed by moderation.' })
      });
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== id));
        showToast('Post removed successfully.');
        fetchMetrics();
      } else {
        showToast('Failed to delete post.');
      }
    } catch (err) {
      showToast('Error deleting post.');
    }
  };

  // Handle Toggle Verified
  const handleToggleVerified = (id) => {
    setVerifiedPosts(prev => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
        showToast('Verification mark removed.');
      } else {
        updated.add(id);
        showToast('Post marked as verified by moderator.');
      }
      return updated;
    });
  };

  // Handle Like Toggle
  const handleToggleLike = (postId, e) => {
    e.stopPropagation();
    setLikedPosts(prev => {
      const updated = new Set(prev);
      const isLiked = updated.has(postId);
      if (isLiked) {
        updated.delete(postId);
        showToast('Like removed.');
      } else {
        updated.add(postId);
        showToast('Post upvoted.');
      }
      setPosts(current =>
        current.map(p => {
          if (p.id === postId) {
            const currentLikes = p.metrics?.likes || 0;
            return {
              ...p,
              metrics: {
                ...p.metrics,
                likes: isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1
              }
            };
          }
          return p;
        })
      );
      return updated;
    });
  };

  // Handle Share Post Link
  const handleSharePost = (post, e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/detailed-analytics?metric=feed_engagement&postId=${post.id}`;
    copyToClipboard(shareUrl, 'Post link copied to clipboard!');
  };

  // Handle Tag Click Filter
  const handleTagClick = (tag, e) => {
    if (e) e.stopPropagation();
    setSelectedTagFilter(tag);
    setCurrentPage(1);
    showToast(`Filtering by tag #${tag}`);
  };

  // Toggle comments
  const handleToggleComments = async (postId) => {
    if (commentsDrawerOpen && selectedPostId === postId) {
      setCommentsDrawerOpen(false);
      return;
    }
    setSelectedPostId(postId);
    setCommentsDrawerOpen(true);
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/admin/feed/posts/${postId}/comments`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPostComments(data || []);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  // Submit a new comment
  const handleCreateComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedPost) return;
    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/admin/feed/posts/${selectedPost.id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newCommentText.trim() })
      });
      if (res.ok) {
        const commentData = await res.json();
        setPostComments(prev => [...prev, commentData]);
        setNewCommentText('');
        showToast('Comment posted successfully.');
        setPosts(prev => prev.map(p => p.id === selectedPost.id ? {
          ...p,
          metrics: { ...p.metrics, comments: (p.metrics?.comments || 0) + 1 }
        } : p));
      } else {
        showToast('Failed to post comment.');
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      showToast('Error connecting to server.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Save tags
  const handleSaveTags = () => {
    if (!selectedPost) return;
    const tagArray = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    setPostTagsMap(prev => ({
      ...prev,
      [selectedPost.id]: tagArray
    }));
    setEditTagsModalOpen(false);
    showToast(`Updated tags: ${tagArray.join(', ')}`);
  };

  // Format inspector post content
  const selectedParsed = useMemo(() => {
    if (!selectedPost) return { mention: null, cleanedText: '', hashtags: [], isEmpty: true };
    return parseContentData(selectedPost.content);
  }, [selectedPost]);

  const activePostTags = useMemo(() => {
    if (!selectedPost) return [];
    if (postTagsMap[selectedPost.id]) {
      return postTagsMap[selectedPost.id];
    }
    return selectedParsed.hashtags.length > 0 ? selectedParsed.hashtags : ['Corporate', 'Engineering', 'Networking'];
  }, [selectedPost, postTagsMap, selectedParsed]);

  // Filter posts by stream search input (author, UUID or content)
  const displayedPosts = useMemo(() => {
    // In any active view, strictly filter out deleted posts; in 'deleted' tab, show them
    let base = posts;
    if (activeTab !== 'deleted') {
      base = base.filter(p => !p.isDeleted);
    }
    if (!streamSearchQuery.trim()) return base;
    const q = streamSearchQuery.trim().toLowerCase();
    return base.filter(p => 
      p.id.toLowerCase().includes(q) ||
      (p.author && p.author.toLowerCase().includes(q)) ||
      (p.content && p.content.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q))
    );
  }, [posts, streamSearchQuery, activeTab]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/75 text-slate-800 font-sans selection:bg-indigo-100 selection:text-indigo-800">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <i className="ph ph-check-circle text-emerald-400 text-base"></i>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* BEGIN: Top Metrics / KPI Bar */}
      <section aria-label="KPI Metrics" className="p-5 pb-3 shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Metric 1: Engagement Rate */}
          <div 
            onClick={() => {
              setFilterSort('Most Engaged');
              setCurrentPage(1);
              showToast('Filtered by highest engagement rate.');
            }}
            className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-card flex items-start justify-between cursor-pointer hover:border-indigo-300 transition-all hover:shadow-md group"
            title="Click to sort by Most Engaged"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase group-hover:text-indigo-600 transition-colors">Engagement Rate</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">{metrics.engagementRate}%</span>
                <span className="inline-flex items-center text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                  <i className="ph ph-trend-up mr-0.5 text-xs"></i> +14.2%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal">Calculated over rolling 7 days</p>
            </div>
            <button 
              type="button"
              aria-label="Filter most engaged"
              className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors active:scale-95"
            >
              <i className="ph ph-heart text-xl"></i>
            </button>
          </div>

          {/* Metric 2: Avg Engagement / Post */}
          <div 
            onClick={() => {
              setActiveTab('likes');
              setCurrentPage(1);
              showToast('Showing posts with highest like interactions.');
            }}
            className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-card flex items-start justify-between cursor-pointer hover:border-blue-300 transition-all hover:shadow-md group"
            title="Click to view Most Liked posts"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase group-hover:text-blue-600 transition-colors">Avg. Engagement / Post</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">{metrics.avgEngagementPerPost}</span>
                <span className="text-xs text-slate-500">interactions</span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal">+0.4 from last benchmark</p>
            </div>
            <button 
              type="button"
              aria-label="Filter likes"
              className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors active:scale-95"
            >
              <i className="ph ph-chart-line-up text-xl"></i>
            </button>
          </div>

          {/* Metric 3: Daily Activity Volume */}
          <div 
            onClick={() => {
              setActiveTab('active');
              setFilterSort('Recently Created');
              setCurrentPage(1);
              handleRefresh();
            }}
            className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-card flex items-start justify-between cursor-pointer hover:border-emerald-300 transition-all hover:shadow-md group"
            title="Click to reset to Active Feed and refresh"
          >
            <div className="space-y-1">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase group-hover:text-emerald-600 transition-colors">Daily Activity Volume</span>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">{metrics.dailyActivityVolume}</span>
                <span className="text-xs text-slate-500">Posts today</span>
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Realtime feed sync active</span>
              </div>
            </div>
            <button 
              type="button"
              aria-label="Refresh daily activity"
              className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors active:scale-95"
            >
              <i className="ph ph-article-ny-times text-xl"></i>
            </button>
          </div>

        </div>
      </section>
      {/* END: Top Metrics / KPI Bar */}

      {/* BEGIN: Moderation Filter Toolbar */}
      <section aria-label="Feed Filters and Sorting" className="px-5 py-2 shrink-0 flex items-center justify-between">
        
        {/* Sub-navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-200/60 p-1 rounded-xl">
          <button 
            onClick={() => { setActiveTab('active'); setSelectedTagFilter(null); setCurrentPage(1); }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'active' && !selectedTagFilter
                ? 'bg-white text-indigo-700 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Feed {activeTab === 'active' && <span className="ml-1 text-[10px] bg-indigo-100 text-indigo-700 font-mono px-1.5 py-0.2 rounded-full">{totalPostsCount}</span>}
          </button>
          
          <button 
            onClick={() => { setActiveTab('unlisted'); setSelectedTagFilter(null); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'unlisted' 
                ? 'bg-white text-indigo-700 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Unlisted Posts {activeTab === 'unlisted' && <span className="ml-1 text-[10px] bg-indigo-100 text-indigo-700 font-mono px-1.5 py-0.2 rounded-full">{totalPostsCount}</span>}
          </button>

          <button 
            onClick={() => { setActiveTab('deleted'); setSelectedTagFilter(null); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'deleted' 
                ? 'bg-white text-rose-700 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Deleted Posts {activeTab === 'deleted' && <span className="ml-1 text-[10px] bg-rose-100 text-rose-700 font-mono px-1.5 py-0.2 rounded-full">{totalPostsCount}</span>}
          </button>

          <button 
            onClick={() => { setActiveTab('likes'); setSelectedTagFilter(null); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'likes' 
                ? 'bg-white text-indigo-700 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Likes
          </button>

          <button 
            onClick={() => { setActiveTab('comments'); setSelectedTagFilter(null); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'comments' 
                ? 'bg-white text-indigo-700 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Comments
          </button>

          <button 
            onClick={() => { setActiveTab('tags'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'tags' || selectedTagFilter
                ? 'bg-white text-indigo-700 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tags {selectedTagFilter && <span className="ml-1 text-[10px] bg-indigo-200 text-indigo-900 px-1 rounded">#{selectedTagFilter}</span>}
          </button>
        </div>

        {/* Sorting & Display Options */}
        <div className="flex items-center space-x-2">
          {selectedTagFilter && (
            <button
              onClick={() => setSelectedTagFilter(null)}
              className="flex items-center space-x-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs hover:bg-indigo-100"
            >
              <span>#{selectedTagFilter}</span>
              <i className="ph ph-x text-xs"></i>
            </button>
          )}

          <div className="relative">
            <select 
              value={filterSort}
              onChange={(e) => {
                setFilterSort(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-slate-200 text-xs font-medium text-slate-700 rounded-lg pl-3 pr-8 py-1.5 shadow-2xs hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option>Recently Created</option>
              <option>Most Engaged</option>
              <option>Most Commented</option>
              <option>Highest Flag Risk</option>
              <option>Oldest First</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
              <i className="ph ph-caret-down text-xs"></i>
            </div>
          </div>

          <button 
            onClick={() => setShowDetailedFilters(!showDetailedFilters)}
            aria-label="Filter" 
            className={`p-1.5 border border-slate-200 rounded-lg transition-colors cursor-pointer ${
              showDetailedFilters ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
            title="Toggle Detailed Filters" 
            type="button"
          >
            <i className="ph ph-faders text-base"></i>
          </button>
        </div>

      </section>
      {/* END: Moderation Filter Toolbar */}

      {/* Optional Detailed Filters Row */}
      {showDetailedFilters && (
        <div className="px-5 py-2 flex items-center gap-4 bg-white/70 border-y border-slate-200/60 shrink-0 text-xs">
          <span className="font-semibold text-slate-600">Filters:</span>
          <div className="flex items-center gap-2">
            <label className="text-slate-500">Role:</label>
            <select 
              value={filterRole} 
              onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs cursor-pointer"
            >
              <option>All Roles</option>
              <option>Software Engineers</option>
              <option>Designers</option>
              <option>Founders / Executives</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-slate-500">Location:</label>
            <select 
              value={filterLocation} 
              onChange={(e) => { setFilterLocation(e.target.value); setCurrentPage(1); }}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs cursor-pointer"
            >
              <option>All Locations</option>
              <option>Remote / Hybrid</option>
              <option>India</option>
              <option>United States</option>
            </select>
          </div>
          <button 
            onClick={() => { setFilterRole('All Roles'); setFilterLocation('All Locations'); setSelectedTagFilter(null); setCurrentPage(1); }}
            className="text-indigo-600 hover:underline ml-auto font-medium cursor-pointer"
          >
            Reset All
          </button>
        </div>
      )}

      {/* BEGIN: Main Moderation 2-Column Split Workspace */}
      <section aria-label="Content Moderation Split Workspace" className="flex-1 px-5 pb-5 pt-2 grid grid-cols-12 gap-5 overflow-hidden min-h-0">
        
        {/* BEGIN: LeftFeedListColumn */}
        <div className="col-span-12 lg:col-span-5 flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-card overflow-hidden h-full min-h-0">
          
          {/* Feed Header */}
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Stream Items</span>
              <span className="text-[11px] text-slate-400 font-mono">
                Showing {displayedPosts.length > 0 ? `1-${displayedPosts.length}` : '0-0'}
              </span>
            </div>
            <button 
              onClick={handleRefresh}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-1 cursor-pointer active:scale-95 transition-transform"
              title="Refresh Stream Items"
            >
              <i className={`ph ph-arrows-clockwise text-xs ${isRefreshing ? 'animate-spin' : ''}`}></i>
              <span>Refresh</span>
            </button>
          </div>

          {/* Stream Filter / Quick Search Input */}
          <div className="px-3 py-2 border-b border-slate-100 bg-white shrink-0">
            <div className="relative">
              <i className="ph ph-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input 
                type="text"
                placeholder="Filter by Post UUID, author, or content..."
                value={streamSearchQuery}
                onChange={(e) => setStreamSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/90 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {streamSearchQuery && (
                <button
                  type="button"
                  onClick={() => setStreamSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <i className="ph ph-x text-xs"></i>
                </button>
              )}
            </div>
          </div>

          {/* Feed Posts Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar min-h-0">
            {displayedPosts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <i className="ph ph-newspaper-clipping text-3xl text-slate-300 block"></i>
                <p>No posts found for the selected view and filter criteria.</p>
                <button 

                
                  onClick={() => { 
                    setStreamSearchQuery('');
                    setActiveTab('active'); 
                    setSelectedTagFilter(null); 
                    setFilterRole('All Roles'); 
                    setFilterLocation('All Locations'); 
                    setFilterSort('Recently Created'); 
                    setCurrentPage(1); 
                  }}
                  className="text-indigo-600 underline font-medium cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              displayedPosts.map((post) => {
                const isSelected = selectedPost && selectedPost.id === post.id;
                const parsed = parseContentData(post.content);
                const initials = getInitials(post.author);
                const isUnlisted = !!post.isUnlisted;
                const isLiked = likedPosts.has(post.id);

                return (
                  <article 
                    key={post.id}
                    onClick={() => {
                      setSelectedPostId(post.id);
                      setSearchParams(prev => {
                        const next = new URLSearchParams(prev);
                        next.set('postId', post.id);
                        return next;
                      });
                    }}
                    data-purpose="feed-item"
                    className={`p-4 cursor-pointer transition-colors relative ${
                      isSelected 
                        ? 'bg-indigo-50/40 border-l-4 border-indigo-600 hover:bg-indigo-50/60' 
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className={`h-9 w-9 rounded-full text-white flex items-center justify-center font-semibold text-xs shadow-2xs ${
                          initials === 'VD' 
                            ? 'ring-2 ring-indigo-500/20 bg-gradient-to-tr from-amber-700 to-amber-900' 
                            : initials === 'SA'
                            ? 'bg-violet-100 text-violet-700 border border-violet-200'
                            : 'bg-slate-800'
                        }`}>
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <h2 className="text-xs font-bold text-slate-900 leading-tight">{post.author}</h2>
                            {post.isDeleted && (
                              <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1 py-0.2 rounded font-semibold uppercase">
                                Deleted
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">{post.title || 'Platform Member'}</span>
                        </div>
                      </div>

                      {/* Eye / Visibility / Restore Toggle */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (post.isDeleted || isUnlisted) {
                            handleRestorePost(post.id);
                          } else {
                            handleOpenTakedown(post.id);
                          }
                        }}
                        aria-label="Toggle post visibility" 
                        className={`p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer ${
                          post.isDeleted ? 'text-rose-600 hover:text-rose-800' : (isUnlisted ? 'text-slate-400 hover:text-slate-700' : 'text-indigo-600 hover:text-indigo-800')
                        }`}
                        title={post.isDeleted ? 'Restore Deleted Post' : (isUnlisted ? 'Restore Post' : 'Unlist Post')} 
                        type="button"
                      >
                        <i className={`ph ${post.isDeleted ? 'ph-arrow-counter-clockwise' : (isUnlisted ? 'ph-eye-slash' : 'ph-eye')} text-base`}></i>
                      </button>
                    </div>

                    {/* Content Preview */}
                    <div className="mt-3 text-xs text-slate-700 space-y-1">
                      {parsed.mention ? (
                        <>
                          <p className="leading-relaxed">
                            Referenced Organization: 
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (parsed.mention.id) {
                                  navigate(`/org-profile/${parsed.mention.id}`);
                                } else {
                                  navigate('/organizations');
                                }
                              }}
                              className="inline-flex items-center space-x-1 bg-indigo-100/80 hover:bg-indigo-200 text-indigo-800 font-medium text-[11px] px-2 py-0.5 rounded-full border border-indigo-200 ml-1 cursor-pointer transition-colors"
                              title="View Organization Profile"
                            >
                              <i className="ph ph-buildings text-xs mr-0.5"></i>
                              <span>{parsed.mention.name}</span>
                              <i className="ph ph-arrow-up-right text-[10px] ml-0.5"></i>
                            </button>
                          </p>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            UUID: {parsed.mention.id}
                          </div>
                        </>
                      ) : parsed.isEmpty && post.mediaUrl ? (
                        <p className="italic text-slate-500 font-sans">No text caption provided. Image media attached.</p>
                      ) : (
                        <div>
                          {parsed.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {parsed.hashtags.map((ht, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={(e) => handleTagClick(ht, e)}
                                  className="inline-flex items-center text-indigo-600 font-semibold text-xs hover:underline cursor-pointer"
                                  title={`Filter by #${ht}`}
                                >
                                  #{ht}
                                </button>
                              ))}
                            </div>
                          )}
                          <p className="text-slate-600 text-xs line-clamp-2">{parsed.cleanedText || 'Professional update'}</p>
                        </div>
                      )}
                    </div>

                    {/* Engagement Stats & Actions Bar */}
                    <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs ${
                      isSelected ? 'border-indigo-100/60 text-slate-500' : 'border-slate-100 text-slate-400'
                    }`}>
                      <div className="flex items-center space-x-3">
                        {/* Like Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleLike(post.id, e)}
                          className={`flex items-center space-x-1 py-0.5 px-1.5 rounded transition-colors cursor-pointer ${
                            isLiked ? 'text-indigo-600 font-bold bg-indigo-50' : 'hover:text-slate-800 hover:bg-slate-100'
                          }`}
                          title="Upvote Post"
                        >
                          <i className={`ph ${isLiked ? 'ph-thumbs-up-fill text-indigo-600' : 'ph-thumbs-up'} text-sm`}></i>
                          <span className="font-mono text-[11px]">{post.metrics?.likes || 0}</span>
                        </button>

                        {/* Comment Button */}
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleComments(post.id); }}
                          className="flex items-center space-x-1 py-0.5 px-1.5 rounded hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="View / Add Comments"
                        >
                          <i className="ph ph-chat-circle text-sm"></i>
                          <span className="font-mono text-[11px]">{post.metrics?.comments || 0}</span>
                        </button>

                        {/* Share Button */}
                        <button 
                          type="button"
                          onClick={(e) => handleSharePost(post, e)}
                          className="flex items-center space-x-1 py-0.5 px-1.5 rounded hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Copy Share Link"
                        >
                          <i className="ph ph-share-network text-sm"></i>
                          <span className="font-mono text-[11px]">{post.metrics?.shares || 0}</span>
                        </button>
                      </div>

                      {isSelected ? (
                        <span className="text-[10px] font-medium text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                          Active Inspector
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {formatTimeAgo(post.created_at)}
                        </span>
                      )}
                    </div>

                  </article>
                );
              })
            )}
          </div>

          {/* Feed Pagination Footer */}
          <div className="p-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
            <button 
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-medium text-slate-600">
              Page <span className="font-bold text-slate-900">{currentPage}</span> of <span className="font-bold text-slate-900">{totalPages}</span>
            </span>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>

        </div>
        {/* END: LeftFeedListColumn */}

        {/* BEGIN: RightPostInspectorColumn */}
        <div className="col-span-12 lg:col-span-7 flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-card overflow-hidden h-full min-h-0">
          
          {selectedPost ? (
            <>
              {/* Inspector Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-bold text-slate-900">Post Detail Inspector</span>
                  {selectedPost.isUnlisted ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1.5"></span> Unlisted
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5"></span> Published
                    </span>
                  )}
                  {verifiedPosts.has(selectedPost.id) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <i className="ph ph-seal-check text-xs mr-1 text-indigo-600"></i> Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                  <i className="ph ph-clock text-slate-400"></i>
                  <span>{new Date(selectedPost.created_at).toLocaleString()}</span>
                </div>
              </div>

              {/* Inspector Body Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar min-h-0">
                
                {/* Author & Platform Context Bar */}
                <div className="flex items-center justify-between bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-700 to-amber-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {getInitials(selectedPost.author)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{selectedPost.author}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">
                          ID: {selectedPost.authorId ? (selectedPost.authorId.length > 8 ? selectedPost.authorId.slice(0, 8) + '...' : selectedPost.authorId) : '8841-USR'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {selectedPost.title || 'Platform Member'} • {selectedPost.email || `${selectedPost.author?.toLowerCase().replace(/\s+/g, '.')}@example.com`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 relative" ref={moreMenuRef}>
                    <button 
                      onClick={() => {
                        if (selectedPost.authorId) {
                          navigate(`/profile/${selectedPost.authorId}`);
                        } else {
                          navigate('/users');
                        }
                      }}
                      aria-label="View user profile" 
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors shadow-2xs cursor-pointer" 
                      type="button"
                    >
                      User Profile
                    </button>
                    
                    {/* Three-dots Menu Button */}
                    <button 
                      onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                      aria-label="More options" 
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer" 
                      type="button"
                    >
                      <i className="ph ph-dots-three-vertical text-lg"></i>
                    </button>

                    {/* Dropdown Menu */}
                    {moreMenuOpen && (
                      <div className="absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                        <button 
                          onClick={() => { setRawPayloadModalOpen(true); setMoreMenuOpen(false); }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                        >
                          <i className="ph ph-code text-sm text-slate-500"></i>
                          <span>Inspect Raw Payload</span>
                        </button>
                        <button 
                          onClick={() => {
                            copyToClipboard(`${window.location.origin}/detailed-analytics?metric=feed_engagement&postId=${selectedPost.id}`, 'Post link copied!');
                            setMoreMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                        >
                          <i className="ph ph-link text-sm text-slate-500"></i>
                          <span>Copy Post Link</span>
                        </button>
                        <button 
                          onClick={() => {
                            copyToClipboard(selectedPost.id, `Post ID copied: ${selectedPost.id}`);
                            setMoreMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                        >
                          <i className="ph ph-fingerprint text-sm text-slate-500"></i>
                          <span>Copy Post ID</span>
                        </button>
                        <button 
                          onClick={() => {
                            if (selectedPost.authorId) navigate(`/profile/${selectedPost.authorId}`);
                            else navigate('/users');
                            setMoreMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center space-x-2 cursor-pointer"
                        >
                          <i className="ph ph-user text-sm text-slate-500"></i>
                          <span>Author Profile</span>
                        </button>
                        <div className="my-1 border-t border-slate-100"></div>
                        <button 
                          onClick={() => {
                            if (selectedPost.isUnlisted) {
                              handleRestorePost(selectedPost.id);
                            } else {
                              handleOpenTakedown(selectedPost.id);
                            }
                            setMoreMenuOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center space-x-2 text-amber-700 cursor-pointer"
                        >
                          <i className={`ph ${selectedPost.isUnlisted ? 'ph-eye' : 'ph-eye-slash'} text-sm`}></i>
                          <span>{selectedPost.isUnlisted ? 'Restore Post' : 'Unlist Post'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deleted Alert Banner */}
                {selectedPost.isDeleted && (
                  <div className="p-3 border border-rose-200 bg-rose-50/70 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-rose-800">
                      <i className="ph ph-trash text-base"></i>
                      <span>This post has been deleted by user or moderator.</span>
                    </div>
                    <button 
                      onClick={() => handleRestorePost(selectedPost.id)}
                      className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 rounded font-medium text-xs transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <i className="ph ph-arrow-counter-clockwise text-xs"></i>
                      <span>Restore to Feed</span>
                    </button>
                  </div>
                )}

                {/* Appeal Alert Banner (if pending appeal exists) */}
                {selectedPost.appeal && (
                  <div className="p-4 border border-amber-200 bg-amber-50/70 rounded-xl flex flex-col gap-2.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <i className="ph ph-gavel text-amber-700 text-lg mt-0.5"></i>
                      <div className="flex-1">
                        <span className="font-bold text-amber-900">User Appeal Submitted</span>
                        <p className="mt-1 text-slate-700 bg-white p-2.5 rounded-lg border border-amber-200/80">
                          {selectedPost.appeal.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button 
                        onClick={() => handleRejectAppeal(selectedPost.id)}
                        className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded font-medium text-xs transition-colors cursor-pointer"
                      >
                        Reject Appeal
                      </button>
                      <button 
                        onClick={() => handleRestorePost(selectedPost.id)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-xs transition-colors cursor-pointer"
                      >
                        Approve & Restore
                      </button>
                    </div>
                  </div>
                )}

                {/* Media Preview Card */}
                {selectedPost.mediaUrl ? (
                  <div className="border border-slate-200 rounded-xl bg-slate-900/5 p-4 flex flex-col items-center justify-center">
                    <img 
                      src={selectedPost.mediaUrl} 
                      alt="Post visual content" 
                      className="max-h-[320px] w-auto max-w-full rounded-lg object-contain shadow-xs" 
                    />
                    <div className="mt-3 flex items-center gap-3">
                      <a 
                        href={selectedPost.mediaUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <i className="ph ph-arrow-square-out text-sm"></i> View Full Resolution
                      </a>
                      <button 
                        onClick={() => setRawPayloadModalOpen(true)}
                        className="text-xs text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded shadow-2xs cursor-pointer"
                      >
                        Inspect Raw Payload
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shrink-0">
                        <i className="ph ph-article text-base"></i>
                      </span>
                      <div>
                        <div className="font-semibold text-slate-800 flex items-center space-x-2">
                          <span>Standard Text Publication</span>
                          <span className="text-[10px] bg-slate-200/80 text-slate-600 px-1.5 py-0.2 rounded font-medium">Text Only</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">This publication contains text metadata and organization entity links only.</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setRawPayloadModalOpen(true)}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors flex items-center space-x-1.5 cursor-pointer shrink-0 ml-3"
                      title="Inspect Raw JSON Payload"
                    >
                      <i className="ph ph-code text-xs"></i>
                      <span>Inspect Payload</span>
                    </button>
                  </div>
                )}

                {/* Description / Formatted Content Box */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>Description &amp; Mention Entities</span>
                    <button 
                      onClick={() => copyToClipboard(selectedPost.content, 'Formatted text copied!')}
                      className="text-indigo-600 lowercase font-normal cursor-pointer hover:underline text-xs bg-transparent border-0 p-0"
                    >
                      copy formatted text
                    </button>
                  </label>

                  {/* Parsed Description Container */}
                  <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-4 text-xs space-y-3">
                    
                    {selectedParsed.mention ? (
                      <>
                        <div className="text-slate-700 leading-relaxed">
                          Mention Entity Identified:{' '}
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedParsed.mention.id) {
                                navigate(`/org-profile/${selectedParsed.mention.id}`);
                              } else {
                                navigate('/organizations');
                              }
                            }}
                            className="inline-flex items-center space-x-1.5 bg-white text-indigo-700 font-semibold px-2.5 py-1 rounded-md border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition-colors cursor-pointer ml-1"
                            title="Navigate to Organization"
                          >
                            <i className="ph ph-buildings text-indigo-500 text-sm"></i>
                            <span>{selectedParsed.mention.name}</span>
                            <i className="ph ph-arrow-up-right text-xs text-indigo-400"></i>
                          </button>
                        </div>

                        {/* Raw UUID Metadata Pill */}
                        <div className="p-2.5 bg-slate-900 rounded-lg text-slate-200 font-mono text-[11px] flex items-center justify-between">
                          <div className="flex items-center space-x-2 truncate">
                            <span className="text-slate-400 select-none">Target ID:</span>
                            <span className="text-emerald-400 select-all truncate">{selectedParsed.mention.id}</span>
                          </div>
                          <button 
                            onClick={() => copyToClipboard(selectedParsed.mention.id, 'Target ID copied!')}
                            aria-label="Copy Target ID" 
                            className="text-slate-400 hover:text-white ml-2 shrink-0 transition-colors cursor-pointer" 
                            title="Copy ID" 
                            type="button"
                          >
                            <i className="ph ph-copy text-sm"></i>
                          </button>
                        </div>
                      </>
                    ) : null}

                    {/* Additional text content or hashtags */}
                    {selectedParsed.cleanedText && (
                      <div className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedParsed.cleanedText}
                      </div>
                    )}

                    {selectedParsed.isEmpty && (
                      <div className="text-slate-500 italic flex items-center space-x-2 py-0.5">
                        <i className="ph ph-info text-slate-400 text-sm"></i>
                        <span>{selectedPost.mediaUrl ? 'No text caption provided. Visual attachment only.' : 'No text caption provided. This publication acts as a reference or shared activity update.'}</span>
                      </div>
                    )}

                  </div>
                </div>



                {/* Active Tags Badge Row */}
                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Post Tags</span>
                    <button 
                      onClick={() => setEditTagsModalOpen(true)}
                      className="text-indigo-600 text-[11px] hover:underline cursor-pointer"
                    >
                      Edit Tags
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activePostTags.map((tag, i) => (
                      <span 
                        key={i} 
                        onClick={() => handleTagClick(tag)}
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200 cursor-pointer hover:bg-indigo-100"
                        title="Filter feed by this tag"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Collapsible Comments Section in Inspector */}
                {commentsDrawerOpen && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Comments ({postComments.length})
                      </span>
                      <button 
                        onClick={() => setCommentsDrawerOpen(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                    {/* New Comment Input Box */}
                    <form onSubmit={handleCreateComment} className="flex gap-2">
                      <input 
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Write an administrative comment..."
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button 
                        type="submit"
                        disabled={isSubmittingComment || !newCommentText.trim()}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {isSubmittingComment ? (
                          <i className="ph ph-spinner animate-spin"></i>
                        ) : (
                          <i className="ph ph-paper-plane-right"></i>
                        )}
                        <span>Post</span>
                      </button>
                    </form>

                    {loadingComments ? (
                      <div className="py-4 text-center text-xs text-slate-400">Loading comments...</div>
                    ) : postComments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No comments on this post yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {postComments.map((c) => (
                          <div key={c.id} className="p-2.5 bg-white border border-slate-200/80 rounded-lg text-xs space-y-1">
                            <div className="flex items-center justify-between font-semibold text-slate-800">
                              <span>{c.author}</span>
                              <span className="text-[10px] text-slate-400 font-normal">{formatTimeAgo(c.created_at)}</span>
                            </div>
                            <p className="text-slate-600">{c.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Inspector Action Footer */}
              <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <button 
                    type="button"
                    onClick={() => handleOpenAudit(selectedPost?.id)}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 rounded-lg shadow-2xs transition-colors flex items-center space-x-1.5 cursor-pointer hover:bg-slate-50"
                  >
                    <i className="ph ph-list-magnifying-glass text-slate-500"></i>
                    <span>Audit History</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {selectedPost.isUnlisted ? (
                    <button 
                      onClick={() => handleRestorePost(selectedPost.id)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <i className="ph ph-eye text-xs"></i>
                      <span>Restore</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleOpenTakedown(selectedPost.id)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                    >
                      <i className="ph ph-eye-slash text-xs"></i>
                      <span>Unlist</span>
                    </button>
                  )}

                  <button 
                    onClick={() => handleDeletePost(selectedPost.id)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <i className="ph ph-trash text-xs"></i>
                    <span>Delete</span>
                  </button>


                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <i className="ph ph-article text-4xl mb-2 text-slate-300"></i>
              <p className="text-sm font-medium">Select a feed post on the left to inspect its parameters.</p>
            </div>
          )}

        </div>
        {/* END: RightPostInspectorColumn */}

      </section>
      {/* END: Main Moderation Split Workspace */}

      {/* Modal: Takedown / Unlist */}
      {takedownModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setTakedownModalOpen(false)}
        >
          <div 
            className="bg-white border border-slate-200/90 w-[520px] max-w-[94vw] rounded-2xl shadow-2xl p-6 text-left space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 text-xl font-bold shadow-2xs">
                  <i className="ph ph-warning-circle text-2xl"></i>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Unlist Feed Post</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Content Moderation & Feed Takedown</p>
                </div>
              </div>
              <button 
                onClick={() => setTakedownModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <i className="ph ph-x text-lg"></i>
              </button>
            </div>

            {/* Warning Callout Notice */}
            <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 leading-relaxed">
              <i className="ph ph-info text-amber-700 text-base mt-0.5 shrink-0"></i>
              <div>
                <span className="font-semibold block">Public Feed Visibility Action</span>
                <span>Unlisting hides this post from the explore and live streams. It will remain accessible only in the moderation archive, and an official system warning will be dispatched to the author.</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Reason for Takedown
                </label>
                <select
                  value={takedownReason}
                  onChange={(e) => setTakedownReason(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 transition-all cursor-pointer mb-2"
                >
                  <option value="Community Guidelines Violation">Community Guidelines Violation</option>
                  <option value="Spam or Commercial Promotion Abuse">Spam or Commercial Promotion Abuse</option>
                  <option value="Inappropriate or Offensive Media">Inappropriate or Offensive Media</option>
                  <option value="Misinformation or False News">Misinformation or False News</option>
                  <option value="Harassment or Defamatory Remarks">Harassment or Defamatory Remarks</option>
                  <option value="Post Moderation Takedown">Other Policy Violation</option>
                </select>
                <input 
                  type="text"
                  placeholder="Specify or customize reason..."
                  value={takedownReason}
                  onChange={(e) => setTakedownReason(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Author Warning Notice
                  </label>
                  <span className="text-[10px] text-slate-400">Delivered in-app to author</span>
                </div>
                <textarea 
                  rows="3"
                  value={takedownMessage}
                  onChange={(e) => setTakedownMessage(e.target.value)}
                  placeholder="Enter notice message sent to post author..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500 transition-all resize-none"
                />
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setTakedownModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={submitTakedown}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <i className="ph ph-eye-slash text-sm"></i>
                <span>Confirm Unlist</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Raw Payload Inspection */}
      {rawPayloadModalOpen && selectedPost && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 text-slate-200 border border-slate-800 w-[720px] max-w-[95vw] rounded-2xl shadow-2xl p-6 text-left flex flex-col max-h-[85vh] relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <i className="ph ph-code text-indigo-400 text-lg"></i>
                <h3 className="text-sm font-bold text-white font-mono">Raw Post Payload Inspection</h3>
              </div>
              <button 
                onClick={() => setRawPayloadModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <i className="ph ph-x text-lg"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] custom-scrollbar text-emerald-400 select-all">
              <pre>{JSON.stringify(selectedPost, null, 2)}</pre>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-slate-400 text-xs font-mono">UUID: {selectedPost.id}</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => copyToClipboard(JSON.stringify(selectedPost, null, 2), 'JSON Payload copied!')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="ph ph-copy"></i>
                  <span>Copy JSON</span>
                </button>
                <button 
                  onClick={() => setRawPayloadModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-700 text-xs font-medium text-slate-300 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Edit Tags */}
      {editTagsModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 w-[460px] max-w-[92vw] rounded-2xl shadow-2xl p-6 text-left space-y-4 relative">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <i className="ph ph-tag text-indigo-600"></i>
                Edit Post Tags
              </h3>
              <button onClick={() => setEditTagsModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <i className="ph ph-x text-lg"></i>
              </button>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Tags (comma separated)</label>
              <input 
                type="text" 
                value={tagsInput} 
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Corporate, Engineering, AI"
                className="w-full text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setEditTagsModalOpen(false)}
                className="px-3 py-1.5 border border-slate-200 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveTags}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                Save Tags
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Audit History */}
      {auditModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 w-[540px] max-w-[94vw] rounded-2xl shadow-2xl p-6 text-left space-y-4 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <i className="ph ph-list-magnifying-glass text-indigo-600 text-base"></i>
                  Database Audit Log History
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                  Post: {selectedPost?.id?.slice(0, 13)}... • {auditEvents.length} Recorded Event{auditEvents.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => handleOpenAudit(selectedPost?.id)} 
                  disabled={loadingAudit}
                  title="Refresh Audit Trail"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  <i className={`ph ph-arrows-clockwise text-sm ${loadingAudit ? 'animate-spin text-indigo-600' : ''}`}></i>
                </button>
                <button onClick={() => setAuditModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                  <i className="ph ph-x text-base"></i>
                </button>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 max-h-[60vh] overflow-y-auto pr-1">
              {loadingAudit ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <i className="ph ph-circle-notch animate-spin text-2xl text-indigo-600"></i>
                  <span className="text-xs text-slate-500 font-medium">Querying PostgreSQL audit tables...</span>
                </div>
              ) : auditError ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                  <i className="ph ph-warning-circle text-base shrink-0 mt-0.5"></i>
                  <div className="flex-1">
                    <p className="font-semibold">Unable to query database audit log</p>
                    <p className="text-[11px] text-rose-600 mt-0.5">{auditError}</p>
                    <button 
                      onClick={() => handleOpenAudit(selectedPost?.id)} 
                      className="mt-2 px-2.5 py-1 bg-white border border-rose-300 rounded text-rose-700 font-semibold text-[11px] hover:bg-rose-50 cursor-pointer"
                    >
                      Retry Query
                    </button>
                  </div>
                </div>
              ) : auditEvents.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <i className="ph ph-clipboard-text text-3xl text-slate-300"></i>
                  <p className="text-xs text-slate-500 font-medium">No recorded audit actions found for this publication.</p>
                </div>
              ) : (
                auditEvents.map((event) => {
                  const colorStyles = {
                    blue: { dot: 'bg-blue-500', card: 'bg-blue-50/40 border-blue-200/70', badge: 'bg-blue-100/80 text-blue-800' },
                    amber: { dot: 'bg-amber-500', card: 'bg-amber-50/40 border-amber-200/70', badge: 'bg-amber-100/80 text-amber-800' },
                    emerald: { dot: 'bg-emerald-500', card: 'bg-emerald-50/40 border-emerald-200/70', badge: 'bg-emerald-100/80 text-emerald-800' },
                    rose: { dot: 'bg-rose-500', card: 'bg-rose-50/40 border-rose-200/70', badge: 'bg-rose-100/80 text-rose-800' },
                    indigo: { dot: 'bg-indigo-500', card: 'bg-indigo-50/40 border-indigo-200/70', badge: 'bg-indigo-100/80 text-indigo-800' },
                    slate: { dot: 'bg-slate-400', card: 'bg-slate-50 border-slate-200/80', badge: 'bg-slate-100 text-slate-700' }
                  }[event.color] || { dot: 'bg-indigo-500', card: 'bg-slate-50 border-slate-200/80', badge: 'bg-slate-100 text-slate-700' };

                  return (
                    <div key={event.id} className={`p-3 rounded-xl border ${colorStyles.card} transition-all`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${colorStyles.dot}`}></span>
                          {event.title}
                        </span>
                        <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${colorStyles.badge}`}>
                          {event.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 font-mono">
                        <span>{new Date(event.timestamp).toLocaleString()}</span>
                        <span>•</span>
                        <span>Actor: {event.actor || 'System'}</span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-700 leading-relaxed font-normal">
                        {event.description}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                <i className="ph ph-database text-slate-400"></i>
                Connected to PostgreSQL audit logs
              </span>
              <button 
                onClick={() => setAuditModalOpen(false)}
                className="px-3.5 py-1.5 border border-slate-200 text-xs font-semibold text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
