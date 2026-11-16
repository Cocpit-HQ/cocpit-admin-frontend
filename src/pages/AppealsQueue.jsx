import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import Header from '../components/Header';
import Table from '../components/Table';
import Button from '../components/Button';
import Spinner from '../components/Spinner';

export default function AppealsQueue() {
  const { role, accessToken } = useAuth();
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [notes, setNotes] = useState('');

  const filterTabs = [
    { key: 'ALL', label: 'All Records' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
  ];

  const fetchAppeals = async (status = statusFilter) => {
    try {
      setLoading(true);
      const url = status && status !== 'ALL'
        ? `/api/admin/moderation/appeals?status=${status}`
        : '/api/admin/moderation/appeals?status=ALL';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error('Failed to fetch appeals');
      const data = await res.json();
      setAppeals(data.appeals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppeals(statusFilter);
  }, [statusFilter]);

  const handleAction = async (action) => {
    if (!selectedAppeal) return;
    try {
      const res = await fetch(`/api/admin/moderation/appeals/${selectedAppeal.appeal_id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ notes })
      });
      if (res.ok) {
        setSelectedAppeal(null);
        setNotes('');
        fetchAppeals(statusFilter);
      }
    } catch (err) {
      console.error('Failed to update appeal', err);
    }
  };

  return (
    <div className="flex-1 bg-surface min-h-screen relative overflow-x-hidden md:pl-[80px] group-hover:md:pl-[280px] transition-all duration-300">
      <Header title="Account Appeals Queue" />
      <main className="p-4 md:p-6 lg:p-8 pt-24 md:pt-28 max-w-7xl mx-auto space-y-6">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-outline-variant pb-3 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.key
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 flex justify-center"><Spinner /></div>
          ) : appeals.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">task_alt</span>
              <p className="font-body-lg">No {statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} appeals found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-high text-on-surface-variant font-label-md uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Account / Org</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Action Reason</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Appeal Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50 bg-surface">
                  {appeals.map((appeal) => (
                    <tr key={appeal.appeal_id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={appeal.user_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(appeal.user_name || 'User')} 
                            alt="avatar" 
                            className="w-9 h-9 rounded-full object-cover border border-outline-variant" 
                          />
                          <div>
                            <p className="font-body-md text-on-surface font-semibold">{appeal.user_name || 'Unnamed'}</p>
                            <p className="text-body-sm text-on-surface-variant">{appeal.user_email || 'No email'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                          appeal.target_type === 'ORGANIZATION'
                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                        }`}>
                          {appeal.target_type || 'USER'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-error-container text-error text-xs font-bold mr-2">
                          {appeal.action_type || 'SUSPENSION'}
                        </span>
                        <p className="text-body-sm text-on-surface-variant mt-1 line-clamp-1 max-w-[220px]">{appeal.action_reason}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          appeal.status === 'APPROVED'
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                            : appeal.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        }`}>
                          {appeal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-body-sm text-on-surface-variant">{new Date(appeal.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {appeal.status === 'PENDING' ? (
                          <Button variant="secondary" onClick={() => { setSelectedAppeal(appeal); setNotes(''); }}>
                            Review Appeal
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={() => { setSelectedAppeal(appeal); setNotes(appeal.review_notes || ''); }}>
                            View Details
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Review / Details Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 bg-scrim/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-scale-in my-8 relative">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between sticky top-0 bg-surface z-10">
              <div className="flex items-center gap-3">
                <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                  {selectedAppeal.status === 'PENDING' ? 'Review Appeal' : 'Appeal Details'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  selectedAppeal.status === 'APPROVED'
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                    : selectedAppeal.status === 'REJECTED'
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                }`}>
                  {selectedAppeal.status}
                </span>
              </div>
              <button onClick={() => setSelectedAppeal(null)} className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container-high transition-colors cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
                <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-2">Original Moderation Action</h3>
                <div className="flex gap-2 items-center mb-2">
                  <span className="px-2 py-1 bg-error-container text-error font-bold text-xs rounded uppercase">{selectedAppeal.action_type}</span>
                  <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant text-xs font-semibold rounded uppercase">{selectedAppeal.target_type || 'USER'}</span>
                  <span className="text-body-sm text-on-surface-variant">Duration: {selectedAppeal.duration_days ? `${selectedAppeal.duration_days} days` : 'Indefinite'}</span>
                </div>
                <p className="text-body-md text-on-surface"><strong>Reason:</strong> {selectedAppeal.action_reason}</p>
              </div>

              <div className="bg-primary-container/10 border border-primary/20 rounded-xl p-4 relative">
                <span className="material-symbols-outlined absolute top-4 right-4 text-primary opacity-20 text-[48px]">format_quote</span>
                <h3 className="text-label-md text-primary uppercase tracking-wider mb-2">
                  {selectedAppeal.target_type === 'ORGANIZATION' ? "Organization's Appeal Reason" : "User's Appeal Reason"}
                </h3>
                <p className="text-body-lg text-on-surface italic pr-12 whitespace-pre-wrap">{selectedAppeal.appeal_reason}</p>
              </div>

              {selectedAppeal.status === 'PENDING' ? (
                <div>
                  <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-2">Admin Notes (Required for rejection)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter internal notes or reason for rejection/approval..."
                    className="w-full bg-surface-container-lowest border border-outline rounded-lg p-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px]"
                  />
                </div>
              ) : (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 space-y-2">
                  <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider">Resolution History</h3>
                  {selectedAppeal.reviewed_at && (
                    <p className="text-body-sm text-on-surface-variant">
                      <strong>Reviewed At:</strong> {new Date(selectedAppeal.reviewed_at).toLocaleString()}
                    </p>
                  )}
                  {selectedAppeal.review_notes && (
                    <p className="text-body-md text-on-surface">
                      <strong>Admin Notes:</strong> {selectedAppeal.review_notes}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3 sticky bottom-0">
              {selectedAppeal.status === 'PENDING' ? (
                <>
                  <Button variant="outline" onClick={() => setSelectedAppeal(null)}>Cancel</Button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={!notes.trim()}
                    className="px-4 py-2 bg-error text-on-error rounded font-label-lg tracking-wider disabled:opacity-50 hover:bg-error/90 transition-colors cursor-pointer"
                  >
                    Reject Appeal
                  </button>
                  <button
                    onClick={() => handleAction('approve')}
                    className="px-4 py-2 bg-green-600 text-white rounded font-label-lg tracking-wider hover:bg-green-700 transition-colors cursor-pointer"
                  >
                    Approve & Reinstate
                  </button>
                </>
              ) : (
                <Button variant="secondary" onClick={() => setSelectedAppeal(null)}>Close</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
