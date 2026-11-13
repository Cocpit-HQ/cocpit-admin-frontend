import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

export default function OrganizationVerificationModal({ isOpen, onClose, organization, onVerificationSubmitted }) {
  const { accessToken } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [fetchingDocs, setFetchingDocs] = useState(false);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const orgId = organization?.org_id || organization?.id;

  useEffect(() => {
    if (isOpen && organization) {
      setActionError('');
      setActionSuccess('');
      setReviewerNotes(organization.review_notes || '');
      setRejectionReason('');

      // If documents are already populated on organization object
      if (organization.documents && Array.isArray(organization.documents)) {
        setDocuments(organization.documents);
      } else if (orgId) {
        // Fetch organization details to get submitted legal documents
        setFetchingDocs(true);
        fetch(`/api/admin/organisations/${orgId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
          .then(res => res.json())
          .then(data => {
            setDocuments(data.documents || []);
            if (data.legal_name && !organization.legal_name) {
              organization.legal_name = data.legal_name;
            }
          })
          .catch(err => {
            console.error('Error fetching organization documents:', err);
          })
          .finally(() => {
            setFetchingDocs(false);
          });
      }
    }
  }, [isOpen, organization, orgId, accessToken]);

  if (!isOpen || !organization) return null;

  const handleDecision = async (status) => {
    if (status === 'REJECTED' && !rejectionReason.trim()) {
      setActionError('A rejection reason is required to deny an application.');
      return;
    }

    setActionLoading(true);
    setActionError('');
    setActionSuccess('');

    try {
      const response = await fetch(`/api/admin/organisations/verifications/${orgId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          status,
          notes: reviewerNotes.trim(),
          rejectionReason: status === 'REJECTED' ? rejectionReason.trim() : null
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete verification review');
      }

      setActionSuccess(`Organization verification ${status.toLowerCase()} successfully.`);
      
      if (onVerificationSubmitted) {
        onVerificationSubmitted({
          ...organization,
          verification_status: status,
          review_notes: reviewerNotes.trim()
        });
      }

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      console.error('Error submitting verification decision:', err);
      setActionError(err.message || 'Something went wrong during review.');
    } finally {
      setActionLoading(false);
    }
  };

  const isVerified = organization.verification_status === 'VERIFIED';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-[680px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        style={{ maxWidth: '680px', width: '100%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            {organization.logo_url && (organization.logo_url.startsWith('http') || organization.logo_url.startsWith('/')) ? (
              <img 
                src={organization.logo_url} 
                alt={organization.name} 
                className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
                {organization.name ? organization.name.substring(0, 2).toUpperCase() : 'CO'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">{organization.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                  isVerified
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : organization.verification_status === 'UNDER_REVIEW'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : organization.verification_status === 'REJECTED'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {organization.verification_status || 'UNVERIFIED'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Verification Review & Document Inspection</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {actionSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-rose-600">error</span>
            <span>{actionError}</span>
          </div>
        )}

        {/* Company Identity Metadata Card */}
        <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-4 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Official Legal Full Name</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {organization.legal_name || organization.name || 'Not Specified'}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Incorporation / Registration Date</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {organization.incorporation_date
                ? new Date(organization.incorporation_date).toLocaleDateString()
                : 'Not Specified'}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Industry & Entity Type</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {organization.industry || 'Technology'} • {organization.entity_type || 'Company'}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Registered Email</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              {organization.email || 'Not Provided'}
            </p>
          </div>
        </div>

        {/* Submitted Legal Documents (View-Only Inspection) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-indigo-600">folder_open</span>
              Submitted Verification Documents
            </h4>
            <span className="text-[11px] font-mono text-slate-500">
              {documents.length} document(s)
            </span>
          </div>

          {fetchingDocs ? (
            <div className="py-3 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              Loading uploaded documents...
            </div>
          ) : documents.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
              {documents.map((doc, idx) => (
                <div key={doc.id || doc.document_id || idx} className="p-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">description</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {doc.document_name || `${organization.name}_Document_${idx + 1}`}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-600">{doc.document_type || 'CERTIFICATE_OF_INCORPORATION'}</span>
                        {doc.uploaded_at && ` • Uploaded ${new Date(doc.uploaded_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  {doc.document_url ? (
                    <a
                      href={doc.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors cursor-pointer"
                    >
                      <span>View File</span>
                      <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No URL recorded</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-3 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 flex items-center justify-center gap-2.5 text-center">
              <span className="material-symbols-outlined text-slate-400 text-lg shrink-0">folder_off</span>
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">No verification documents submitted yet.</span> Awaiting upload from company administrator.
              </p>
            </div>
          )}
        </div>

        {/* Decision & Adjudication Controls */}
        <div className="pt-4 border-t border-slate-100 space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Internal Review Notes <span className="font-normal text-slate-400">(Saved to admin audit log)</span>
            </label>
            <textarea
              rows={2}
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="Add private review observations regarding incorporation, registry check, tax ID validity, etc..."
              className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 text-slate-800 transition-all placeholder-slate-400 resize-none"
            />
          </div>

          {!isVerified && (
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Rejection Reason <span className="font-normal text-slate-400">(Required if denying application)</span>
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Blur on certificate stamp, Registration number mismatch with government registry..."
                className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-rose-500 text-slate-800 transition-all placeholder-slate-400"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={actionLoading}
              className="w-full sm:w-auto px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-700 font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {!isVerified && (
                <button
                  type="button"
                  onClick={() => handleDecision('REJECTED')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Deny Application
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDecision('VERIFIED')}
                disabled={actionLoading}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    <span>{isVerified ? 'Re-confirm Verification' : 'Approve & Grant Badge'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
