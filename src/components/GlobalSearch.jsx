import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function GlobalSearch() {
  const { accessToken } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ users: [], organizations: [], jobs: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    const fetchResults = async () => {
      if (!query || query.trim().length < 2) {
        setResults({ users: [], organizations: [], jobs: [], posts: [] });
        setIsOpen(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        setResults({
          users: data.users || [],
          organizations: data.organizations || [],
          jobs: data.jobs || [],
          posts: data.posts || []
        });
        setIsOpen(true);
      } catch (err) {
        setError('Failed to fetch results');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query, accessToken]);

  const handleNavigate = (path) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  const hasAnyResults = 
    results.users.length > 0 || 
    results.organizations.length > 0 || 
    results.jobs.length > 0 || 
    results.posts.length > 0;

  return (
    <div className="relative w-full max-w-[448px] focus-within:ring-2 focus-within:ring-primary rounded-full transition-all min-w-0" ref={dropdownRef}>
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search Users, Posts, or UUIDs (Cmd+K)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (hasAnyResults) setIsOpen(true); }}
        className="w-full bg-surface-container-low border border-outline-variant rounded-full py-2 pl-10 pr-10 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none min-w-0 truncate"
      />
      {/* Loading Spinner Indicator */}
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
           <span className="material-symbols-outlined animate-spin text-on-surface-variant text-[20px]">progress_activity</span>
        </div>
      )}

      {/* Dropdown Results */}
      {isOpen && !loading && hasAnyResults && (
        <div className="absolute top-full left-0 mt-2 w-full max-h-[400px] overflow-y-auto bg-surface border border-outline-variant rounded-xl shadow-xl z-50">
          
          {/* Posts & Feed */}
          {results.posts.length > 0 && (
            <div className="p-2">
              <h3 className="px-3 py-1 text-xs font-bold text-on-surface-variant uppercase tracking-wider flex items-center justify-between">
                <span>Posts &amp; Feed</span>
                <span className="text-[10px] text-primary font-mono">{results.posts.length} found</span>
              </h3>
              {results.posts.map(post => (
                <button
                  key={post.post_id}
                  onClick={() => handleNavigate(`/detailed-analytics?metric=feed_engagement&postId=${post.post_id}`)}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">article</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-label-md text-on-surface truncate text-xs font-semibold">{post.author || 'Platform User'}</p>
                      {post.is_unlisted && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">Unlisted</span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">
                      {post.content ? (post.content.length > 55 ? post.content.slice(0, 55) + '...' : post.content) : `Post ID: ${post.post_id}`}
                    </p>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-mono shrink-0 bg-surface-container px-1 py-0.5 rounded">
                    {post.post_id.slice(0, 8)}...
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Users */}
          {results.users.length > 0 && (
            <div className="p-2 border-t border-outline-variant">
              <h3 className="px-3 py-1 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Users</h3>
              {results.users.map(user => (
                <button
                  key={user.user_id}
                  onClick={() => handleNavigate(`/profile/${user.user_id}`)}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                >
                  <img src={user.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.full_name)} alt={user.full_name} className="w-8 h-8 rounded-full shrink-0 object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="font-label-md text-on-surface truncate">{user.full_name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Organizations */}
          {results.organizations.length > 0 && (
            <div className="p-2 border-t border-outline-variant">
              <h3 className="px-3 py-1 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Organizations</h3>
              {results.organizations.map(org => (
                <button
                  key={org.org_id}
                  onClick={() => handleNavigate(`/org-profile/${org.org_id}`)}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-md bg-surface-container-highest flex items-center justify-center overflow-hidden shrink-0">
                    {org.logo_url ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-on-surface-variant text-[16px]">domain</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-label-md text-on-surface truncate">{org.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">@{org.slug}</p>
                  </div>
                  {org.verification_status === 'VERIFIED' && <span className="material-symbols-outlined text-[16px] text-green-500">verified</span>}
                </button>
              ))}
            </div>
          )}

          {/* Jobs */}
          {results.jobs && results.jobs.length > 0 && (
            <div className="p-2 border-t border-outline-variant">
              <h3 className="px-3 py-1 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Jobs</h3>
              {results.jobs.map(job => (
                <button
                  key={job.job_id}
                  onClick={() => handleNavigate(`/detailed-analytics?metric=active_jobs&jobId=${job.job_id}`)}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-blue-600 text-[18px]">work</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-label-md text-on-surface truncate">{job.title}</p>
                    <p className="text-xs text-on-surface-variant truncate">{job.company_name} • {job.status}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isOpen && !loading && !hasAnyResults && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 mt-2 w-full p-4 bg-surface border border-outline-variant rounded-xl shadow-xl z-50 text-center">
          <p className="text-body-sm text-on-surface-variant">No results found for "{query}"</p>
        </div>
      )}
    </div>
  );
}
