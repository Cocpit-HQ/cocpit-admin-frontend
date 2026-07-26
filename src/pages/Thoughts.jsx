import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import PostModal from '../components/PostModal';

export default function Thoughts() {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  
  const [view, setView] = useState(() => sessionStorage.getItem('adminThoughts_view') || 'channels'); // 'channels' | 'articles' | 'thoughts'
  const [loading, setLoading] = useState(true);
  
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(() => JSON.parse(sessionStorage.getItem('adminThoughts_channel') || 'null'));
  
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(() => JSON.parse(sessionStorage.getItem('adminThoughts_article') || 'null'));
  
  const [thoughts, setThoughts] = useState([]);
  const [totalThoughts, setTotalThoughts] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [newThoughtContent, setNewThoughtContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [isPosting, setIsPosting] = useState(false);

  const handleSetView = (newView) => {
    setView(newView);
    sessionStorage.setItem('adminThoughts_view', newView);
  };

  const handleSetChannel = (channel) => {
    setSelectedChannel(channel);
    if (channel) sessionStorage.setItem('adminThoughts_channel', JSON.stringify(channel));
    else sessionStorage.removeItem('adminThoughts_channel');
  };

  const handleSetArticle = (article) => {
    setSelectedArticle(article);
    if (article) sessionStorage.setItem('adminThoughts_article', JSON.stringify(article));
    else sessionStorage.removeItem('adminThoughts_article');
  };

  useEffect(() => {
    // Determine the active view from state initialization
    const currentView = view;
    
    // Always fetch channels in background
    fetchChannels(currentView !== 'channels');
    
    if (currentView === 'articles' && selectedChannel) {
      fetchArticles(selectedChannel, true);
    } else if (currentView === 'thoughts' && selectedArticle) {
      fetchThoughtsForArticle(selectedArticle, true);
      // Fetch articles in background so they are ready if user clicks Back
      if (selectedChannel) fetchArticles(selectedChannel, true, true);
    }
  }, []);

  const fetchChannels = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/admin/feed/channels`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchArticles = async (channel, isRestore = false, silent = false) => {
    if (!isRestore) {
      handleSetChannel(channel);
      handleSetView('articles');
    }
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/admin/feed/channels/${channel.id}/articles`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchThoughtsForArticle = async (article, isRestore = false, silent = false) => {
    if (!isRestore) {
      handleSetArticle(article);
      handleSetView('thoughts');
    }
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/admin/feed/posts/${article.id}/comments`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setThoughts(data || []);
        setTotalThoughts(data.length || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this thought?')) {
      try {
        const res = await fetch(`/api/admin/feed/thoughts/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
          setThoughts(prev => prev.filter(t => t.id !== id && t.parent_id !== id));
          setTotalThoughts(prev => prev - 1);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handlePostThought = async (e) => {
    e.preventDefault();
    if (!newThoughtContent.trim() || !selectedArticle) return;
    
    setIsPosting(true);
    try {
      const res = await fetch(`/api/admin/feed/posts/${selectedArticle.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          content: newThoughtContent,
          parent_id: replyingTo?.id || null
        })
      });
      if (res.ok) {
        const newComment = await res.json();
        setThoughts(prev => [...prev, newComment]);
        setTotalThoughts(prev => prev + 1);
        setNewThoughtContent('');
        setReplyingTo(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsPosting(false);
    }
  };

  const parentThoughts = thoughts.filter(t => !t.parent_id);
  const childThoughts = thoughts.filter(t => t.parent_id);
  
  const getVisibleParents = () => {
    if (!searchQuery) return parentThoughts;
    const q = searchQuery.toLowerCase();
    const matchingParents = parentThoughts.filter(t => t.content.toLowerCase().includes(q) || t.author.toLowerCase().includes(q));
    const matchingChildren = childThoughts.filter(t => t.content.toLowerCase().includes(q) || t.author.toLowerCase().includes(q));
    
    matchingChildren.forEach(child => {
      if (!matchingParents.find(p => p.id === child.parent_id)) {
        const parent = parentThoughts.find(p => p.id === child.parent_id);
        if (parent) matchingParents.push(parent);
      }
    });
    
    return matchingParents;
  };

  const getVisibleChildren = (parentId) => {
    const children = childThoughts.filter(t => t.parent_id === parentId);
    if (!searchQuery) return children;
    const q = searchQuery.toLowerCase();
    const parentMatches = parentThoughts.find(p => p.id === parentId)?.content.toLowerCase().includes(q) || 
                          parentThoughts.find(p => p.id === parentId)?.author.toLowerCase().includes(q);
    
    // If the parent matches the search, show all its children. Otherwise, show only matching children.
    if (parentMatches) return children;
    return children.filter(t => t.content.toLowerCase().includes(q) || t.author.toLowerCase().includes(q));
  };

  const renderThought = (thought, isChild = false) => (
    <div key={thought.id} className={`flex gap-3 p-3 bg-surface rounded-xl border border-outline-variant hover:border-outline transition-colors group ${isChild ? 'ml-8 mt-2 relative before:absolute before:-left-4 before:top-6 before:w-3 before:h-px before:bg-outline-variant' : ''}`}>
      <img src={thought.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(thought.author)}`} alt="Avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-semibold text-on-surface text-sm truncate pr-2">{thought.author}</h4>
          <span className="text-[11px] text-on-surface-variant shrink-0">{thought.created_at ? formatDistanceToNow(new Date(thought.created_at), { addSuffix: true }) : ''}</span>
        </div>
        <p className="text-sm text-on-surface whitespace-pre-wrap break-words">{thought.content}</p>
        
        <div className="flex items-center justify-between mt-3">
          {!isChild && (
            <button 
              onClick={(e) => { e.stopPropagation(); setReplyingTo(thought); document.getElementById('thought-input').focus(); }} 
              className="flex items-center gap-1 text-xs text-primary font-medium hover:bg-primary-container px-2 py-1 rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">reply</span>
              Reply
            </button>
          )}
          {isChild && <div></div>}
          
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="flex items-center gap-1 text-xs text-on-surface-variant hover:bg-surface-container-high px-2 py-1 rounded transition-colors">
              <span className="material-symbols-outlined text-[16px]">info</span>
              Report
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDelete(thought.id); }} 
              className="flex items-center gap-1 text-xs text-error hover:bg-error-container px-2 py-1 rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-max-width mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {view !== 'channels' && (
              <button 
                onClick={() => {
                  if (view === 'articles') {
                    handleSetView('channels');
                    handleSetChannel(null);
                  } else if (view === 'thoughts') {
                    handleSetView('articles');
                    handleSetArticle(null);
                  }
                }}
                className="flex items-center text-primary hover:bg-surface-container p-1 rounded transition-colors"
              >
                <span className="material-symbols-outlined mr-1 text-sm">arrow_back</span>
                Back
              </button>
            )}
          </div>
          <h1 className="text-3xl font-semibold text-on-surface">
            {view === 'channels' && 'Channel Thoughts'}
            {view === 'articles' && `${selectedChannel?.name} - Articles`}
            {view === 'thoughts' && 'Article Thoughts'}
          </h1>
          <p className="text-on-surface-variant mt-2">
            {view === 'channels' && 'Select a channel to view its articles'}
            {view === 'articles' && 'Select an article to moderate its thoughts'}
            {view === 'thoughts' && `Moderating thoughts on "${selectedArticle?.title}" (${totalThoughts} total)`}
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl shadow-sm border border-outline-variant p-6 min-h-[500px]">
        {loading ? (
          <div className="flex justify-center p-10"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>
        ) : view === 'channels' ? (
          channels.length === 0 ? (
            <div className="text-center text-on-surface-variant py-20 flex flex-col items-center">
              <span className="material-symbols-outlined text-5xl mb-2 text-outline">forum</span>
              <p>No channels found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {channels.map(channel => (
                <div 
                  key={channel.id} 
                  onClick={() => fetchArticles(channel)}
                  className="p-5 border border-outline-variant rounded-xl hover:bg-surface-container transition-colors cursor-pointer flex flex-col items-start gap-4"
                >
                  <div className="w-full flex justify-between items-start">
                    {channel.banner_url ? (
                      <img src={channel.banner_url} alt="Banner" className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-surface-container-highest flex items-center justify-center">
                        <span className="material-symbols-outlined text-outline">image</span>
                      </div>
                    )}
                    <span className="text-xs font-medium bg-primary-container text-on-primary-container px-2 py-1 rounded-full">
                      {channel.article_count || 0} Articles
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-on-surface text-lg">{channel.name}</h3>
                    <p className="text-sm text-on-surface-variant line-clamp-2 mt-1">{channel.description}</p>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-auto">
                    Created by {channel.created_by_name}
                  </p>
                </div>
              ))}
            </div>
          )
        ) : view === 'articles' ? (
          articles.length === 0 ? (
            <div className="text-center text-on-surface-variant py-20 flex flex-col items-center">
              <span className="material-symbols-outlined text-5xl mb-2 text-outline">article</span>
              <p>No articles found in this channel.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {articles.map(article => (
                <div 
                  key={article.id} 
                  onClick={() => fetchThoughtsForArticle(article)}
                  className="p-5 border border-outline-variant rounded-xl hover:bg-surface-container transition-colors cursor-pointer flex justify-between items-center"
                >
                  <div className="flex-1 mr-4">
                    <h3 className="font-semibold text-on-surface text-lg mb-1">{article.title}</h3>
                    <p className="text-sm text-on-surface-variant">
                      Published {article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : 'Unknown date'}
                    </p>
                  </div>
                  <div 
                    onClick={(e) => { e.stopPropagation(); fetchThoughtsForArticle(article); }}
                    className="flex items-center gap-2 shrink-0 bg-surface-container-high px-4 py-2 rounded-lg hover:bg-surface-container-highest transition-colors"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">forum</span>
                    <span className="font-medium text-on-surface">{article.commentsCount || 0} Thoughts</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-row gap-6 h-[calc(100vh-200px)]">
            {/* Left Column: Article Document */}
            <div className="flex-[2] border border-outline-variant rounded-xl flex flex-col bg-surface overflow-hidden">
              {selectedArticle?.mediaUrl && (
                <div className="w-full h-64 shrink-0 border-b border-outline-variant">
                  <img src={selectedArticle.mediaUrl} alt="Article Banner" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6 border-b border-outline-variant bg-surface-container-lowest shrink-0">
                <h2 className="text-2xl font-bold text-on-surface mb-2">{selectedArticle?.title}</h2>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-base">person</span>
                  <span>{selectedArticle?.author || 'Unknown Author'}</span>
                  <span>•</span>
                  <span>{selectedArticle?.publishedAt ? formatDistanceToNow(new Date(selectedArticle.publishedAt), { addSuffix: true }) : 'Unknown date'}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-surface-container-lowest">
                {selectedArticle?.content && selectedArticle.content.trim().startsWith('<') ? (
                  <>
                    <style>{`
                      .article-content-wrapper * {
                        background-color: transparent !important;
                        color: inherit !important;
                      }
                    `}</style>
                    <div 
                      className="text-on-surface prose prose-sm dark:prose-invert max-w-none article-content-wrapper" 
                      dangerouslySetInnerHTML={{ __html: selectedArticle.content }} 
                    />
                  </>
                ) : (
                  <p className="text-on-surface whitespace-pre-wrap">{selectedArticle?.content || 'No content available.'}</p>
                )}
              </div>
            </div>

            {/* Right Column: Thoughts Moderation */}
            <div className="flex-1 border border-outline-variant rounded-xl flex flex-col bg-surface overflow-hidden">
              <div className="p-4 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined">forum</span>
                  Thoughts ({totalThoughts})
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 bg-surface-container-lowest/30 flex flex-col gap-4 relative">
                
                <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur pb-4 space-y-3">
                  <form onSubmit={handlePostThought} className="relative">
                    {replyingTo && (
                      <div className="flex items-center justify-between bg-primary-container text-on-primary-container text-xs px-3 py-1.5 rounded-t-xl border-x border-t border-outline-variant">
                        <span>Replying to <strong>{replyingTo.author}</strong></span>
                        <button type="button" onClick={() => setReplyingTo(null)} className="hover:text-error">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    )}
                    <div className="relative">
                      <input
                        id="thought-input"
                        type="text"
                        placeholder="Write your thoughts"
                        value={newThoughtContent}
                        onChange={(e) => setNewThoughtContent(e.target.value)}
                        disabled={isPosting}
                        className={`w-full bg-surface border border-outline-variant ${replyingTo ? 'rounded-b-xl border-t-0' : 'rounded-full'} px-4 py-2.5 pr-10 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors`}
                      />
                      <button 
                        type="submit" 
                        disabled={isPosting || !newThoughtContent.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 disabled:opacity-50 p-1 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-xl">send</span>
                      </button>
                    </div>
                  </form>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search thoughts"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-surface border border-outline-variant rounded-full px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-primary transition-colors"
                    />
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                  </div>
                </div>

                {thoughts.length === 0 ? (
                  <div className="text-center text-on-surface-variant py-10 mt-4">
                    <p>No thoughts yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 mt-2">
                    {getVisibleParents().map(parent => (
                      <React.Fragment key={parent.id}>
                        {renderThought(parent)}
                        {getVisibleChildren(parent.id).length > 0 && (
                          <div className="flex flex-col gap-2 relative before:absolute before:left-5 before:top-[-10px] before:bottom-6 before:w-px before:bg-outline-variant">
                            {getVisibleChildren(parent.id).map(child => renderThought(child, true))}
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
