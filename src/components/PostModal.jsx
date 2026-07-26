import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function PostModal({ isOpen, onClose, postId }) {
  const { accessToken } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !postId) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const postRes = await fetch(`/api/admin/feed/posts/${postId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (postRes.ok) {
          const postData = await postRes.json();
          setPost(postData);
        }

        const commentsRes = await fetch(`/api/admin/feed/posts/${postId}/comments`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (commentsRes.ok) {
          const commentsData = await commentsRes.json();
          setComments(commentsData || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [isOpen, postId, accessToken]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-surface rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-outline-variant shrink-0">
          <h2 className="text-xl font-semibold text-on-surface">Post Context</h2>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="flex flex-col flex-1 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-10"><span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span></div>
          ) : post ? (
            <div className="flex flex-col h-full">
              {/* Original Post */}
              <div className="p-6 shrink-0 border-b border-outline-variant">
                <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={post.author_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author)}`} alt="Author" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h3 className="font-semibold text-on-surface text-sm">{post.author}</h3>
                      <p className="text-xs text-on-surface-variant">{post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }) : ''}</p>
                    </div>
                  </div>
                  {post.content && post.content.trim().startsWith('<') ? (
                    <>
                      <style>{`
                        .article-content-wrapper * {
                          background-color: transparent !important;
                          color: inherit !important;
                        }
                      `}</style>
                      <div 
                        className="text-on-surface prose prose-sm dark:prose-invert max-w-none article-content-wrapper" 
                        dangerouslySetInnerHTML={{ __html: post.content }} 
                      />
                    </>
                  ) : (
                    <p className="text-on-surface whitespace-pre-wrap">{post.content}</p>
                  )}
                  
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {post.hashtags.map((tag, i) => (
                        <span key={i} className="text-primary text-sm font-medium">#{tag}</span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-4 mt-4 pt-4 border-t border-outline-variant">
                    <span className="text-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-lg">thumb_up</span> {post.likes_count}
                    </span>
                    <span className="text-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-lg">chat_bubble</span> {post.comments_count}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Comments Thread - Independently scrollable */}
              <div className="p-6 flex-1 overflow-y-auto bg-surface-container-lowest/30">
                <h4 className="font-semibold text-on-surface mb-4">All Thoughts ({comments.length})</h4>
                {comments.length === 0 ? (
                  <p className="text-on-surface-variant text-sm">No thoughts yet.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {comments.map(c => (
                      <div key={c.id || c.comment_id} className="flex gap-3">
                        <img src={c.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author)}`} alt="Avatar" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        <div className="bg-surface-container p-3 rounded-lg flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-on-surface text-sm">{c.author}</span>
                            <span className="text-xs text-on-surface-variant">{c.created_at ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true }) : ''}</span>
                          </div>
                          <p className="text-sm text-on-surface whitespace-pre-wrap">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-on-surface-variant">Post not found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
