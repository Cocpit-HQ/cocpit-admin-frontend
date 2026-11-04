import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../AuthContext';

export default function OrganizationVerificationModal({ isOpen, onClose, organization, onVerificationSubmitted }) {
  const { accessToken } = useAuth();
  const [legalName, setLegalName] = useState('');
  const [incorporationDate, setIncorporationDate] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (organization) {
      setLegalName(organization.legal_name || organization.name || '');
      setIncorporationDate(organization.incorporation_date ? organization.incorporation_date.split('T')[0] : '');
      setDocumentFile(null);
      setDocumentPreviewUrl('');
      setDocumentName('');
      setFileSize('');
      setErrorMessage('');
    }
  }, [organization, isOpen]);

  if (!isOpen || !organization) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size must be under 10MB.');
      return;
    }

    setErrorMessage('');
    setDocumentFile(file);
    setDocumentName(file.name);
    
    // Format file size
    const mb = file.size / (1024 * 1024);
    if (mb >= 1) {
      setFileSize(`${mb.toFixed(1)} MB`);
    } else {
      setFileSize(`${Math.round(file.size / 1024)} KB`);
    }

    // Convert file to Base64/DataURL for document_url payload
    const reader = new FileReader();
    reader.onloadend = () => {
      setDocumentPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setDocumentFile(null);
    setDocumentPreviewUrl('');
    setDocumentName('');
    setFileSize('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!legalName.trim()) {
      setErrorMessage('Please provide the official legal full name.');
      return;
    }
    if (!incorporationDate) {
      setErrorMessage('Please select the incorporation date.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Use relative API path through Vite proxy
      const response = await fetch(`/api/admin/organisations/${organization.id}/submit-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          legal_name: legalName.trim(),
          incorporation_date: incorporationDate,
          document_url: documentPreviewUrl || 'https://placeholder.cocpit.ai/incorporation_document.pdf',
          document_name: documentName || `${legalName.trim()}_Incorporation_Certificate`,
          document_type: 'CERTIFICATE_OF_INCORPORATION'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit organization verification.');
      }

      if (onVerificationSubmitted) {
        onVerificationSubmitted(data.org);
      }
      onClose();
    } catch (err) {
      console.error('Error submitting organization verification:', err);
      setErrorMessage(err.message || 'Something went wrong while submitting verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = legalName.trim() !== '' && incorporationDate !== '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-[700px] bg-[#0c0f17] text-white rounded-2xl border border-white/10 shadow-2xl p-6 sm:p-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header matching exact mockup */}
        <div className="flex items-center justify-between pb-6 border-b border-white/5 mb-6">
          <div className="flex items-center gap-3">
            {organization.logo_url ? (
              <img 
                src={organization.logo_url} 
                alt={organization.name} 
                className="w-10 h-10 rounded-lg object-cover bg-white/5 border border-white/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold flex items-center justify-center text-sm">
                {organization.initials || (organization.name ? organization.name.substring(0, 2).toUpperCase() : 'OR')}
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white text-base sm:text-lg">{organization.name}</span>
              <span className="text-white/40">•</span>
              <span className="text-white/70 text-sm sm:text-base font-normal">Verify your account</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs sm:text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Two Fields: Legal Name & Incorporation Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organization legal full name */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-white/60 tracking-wide">
                Organization legal full name
              </label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Enter registered legal full name"
                className="w-full bg-transparent border-b border-white/20 hover:border-white/40 focus:border-indigo-400 text-white pb-2 pt-1 text-sm sm:text-base outline-none transition-colors"
                required
              />
            </div>

            {/* Incorporation date */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-white/60 tracking-wide">
                Incorporation date
              </label>
              <div className="relative border-b border-white/20 hover:border-white/40 focus-within:border-indigo-400 transition-colors">
                <input
                  type="date"
                  value={incorporationDate}
                  onChange={(e) => setIncorporationDate(e.target.value)}
                  className="w-full bg-transparent text-white pb-2 pt-1 text-sm sm:text-base outline-none pr-8 cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                  required
                />
                <span className="material-symbols-outlined absolute right-1 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none text-xl">
                  calendar_month
                </span>
              </div>
            </div>
          </div>

          {/* Verification document */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-medium text-white/60 tracking-wide">
              Verification document
            </label>
            
            {/* Drop / Upload zone */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-b border-white/20 hover:border-white/40 pb-4 pt-2 cursor-pointer group transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {documentFile ? (
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl">description</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white max-w-[300px] truncate">{documentName}</p>
                      <p className="text-xs text-white/50">{fileSize} • Ready to submit</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                    className="p-2 text-white/40 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                    title="Remove document"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2 group-hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined text-white/60 group-hover:text-white transition-colors text-2xl">
                      upload
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm text-white/60 group-hover:text-white/80 transition-colors">
                    Click or drag & drop certificate/document (PDF, PNG, JPG up to 10MB)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons: Submit & Cancel */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                isFormValid && !isSubmitting
                  ? 'bg-[#1e2330] hover:bg-[#282f42] text-white cursor-pointer shadow-lg hover:shadow-indigo-500/10 border border-white/10'
                  : 'bg-[#151922] text-white/30 cursor-not-allowed border border-white/5'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Submitting...</span>
                </>
              ) : (
                'Submit'
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-8 py-2.5 rounded-full text-sm font-semibold text-white/80 hover:text-white bg-transparent hover:bg-white/10 transition-colors border border-transparent"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

