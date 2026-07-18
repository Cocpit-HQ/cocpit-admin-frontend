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
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [notes, setNotes] = useState('');

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/moderation/appeals?status=PENDING', {
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
    fetchAppeals();
  }, []);

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
        fetchAppeals();
      }
    } catch (err) {
      console.error('Failed to update appeal', err);
    }
  };

  return (
    <div className="flex-1 bg-surface min-h-screen relative overflow-x-hidden md:pl-[80px] group-hover:md:pl-[280px] transition-all duration-300">
      <Header title="Account Appeals Queue" />
      <main className="p-4 md:p-6 lg:p-8 pt-24 md:pt-28 max-w-7xl mx-auto space-y-6">
        
        <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-12 flex justify-center"><Spinner /></div>
          ) : appeals.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">task_alt</span>
              <p className="font-body-lg">No pending appeals</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-high text-on-surface-variant font-label-md uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Action Type</th>
                    <th className="px-6 py-4">Appeal Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/50 bg-surface">
                  {appeals.map((appeal) => (
                    <tr key={appeal.appeal_id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={appeal.user_avatar || 'https://ui-avatars.com/api/?name=' + appeal.user_name} alt="avatar" className="w-8 h-8 rounded-full" />
                          <div>
                            <p className="font-body-md text-on-surface font-medium">{appeal.user_name}</p>
                            <p className="text-body-sm text-on-surface-variant">{appeal.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-error-container text-error text-xs font-bold">
                          {appeal.action_type}
                        </span>
                        <p className="text-body-sm text-on-surface-variant mt-1 line-clamp-1 max-w-[200px]">{appeal.action_reason}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-body-sm text-on-surface-variant">{new Date(appeal.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="secondary" onClick={() => setSelectedAppeal(appeal)}>Review Appeal</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Review Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 bg-scrim/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden animate-scale-in my-8 relative">
            <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between sticky top-0 bg-surface z-10">
              <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">Review Appeal</h2>
              <button onClick={() => setSelectedAppeal(null)} className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
                <h3 className="text-label-md text-on-surface-variant uppercase tracking-wider mb-2">Original Moderation Action</h3>
                <div className="flex gap-2 items-center mb-2">
                  <span className="px-2 py-1 bg-error-container text-error font-bold text-xs rounded uppercase">{selectedAppeal.action_type}</span>
                  <span className="text-body-sm text-on-surface-variant">Duration: {selectedAppeal.duration_days ? `${selectedAppeal.duration_days} days` : 'Indefinite'}</span>
                </div>
                <p className="text-body-md text-on-surface"><strong>Reason:</strong> {selectedAppeal.action_reason}</p>
              </div>

              <div className="bg-primary-container/10 border border-primary/20 rounded-xl p-4 relative">
                <span className="material-symbols-outlined absolute top-4 right-4 text-primary opacity-20 text-[48px]">format_quote</span>
                <h3 className="text-label-md text-primary uppercase tracking-wider mb-2">User's Appeal Reason</h3>
                <p className="text-body-lg text-on-surface italic pr-12 whitespace-pre-wrap">{selectedAppeal.appeal_reason}</p>
              </div>

              <div>
                <label className="block text-label-md text-on-surface-variant uppercase tracking-wider mb-2">Admin Notes (Required for rejection)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter internal notes or reason for rejection..."
                  className="w-full bg-surface-container-lowest border border-outline rounded-lg p-3 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px]"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3 sticky bottom-0">
              <Button variant="outline" onClick={() => setSelectedAppeal(null)}>Cancel</Button>
              <button
                onClick={() => handleAction('reject')}
                disabled={!notes.trim()}
                className="px-4 py-2 bg-error text-on-error rounded font-label-lg tracking-wider disabled:opacity-50 hover:bg-error/90 transition-colors"
              >
                Reject Appeal
              </button>
              <button
                onClick={() => handleAction('approve')}
                className="px-4 py-2 bg-green-600 text-white rounded font-label-lg tracking-wider hover:bg-green-700 transition-colors"
              >
                Approve & Reinstate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
