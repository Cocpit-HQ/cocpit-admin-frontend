import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const defaultOrgData = {
  org_id: '1',
  name: 'NexuTech Solutions',
  slug: 'nexutech-solutions',
  email: 'contact@nexus-tech.io',
  industry: 'Software & IT',
  size: '1,000-5,000 employees',
  website: 'nexus-tech.io',
  location: 'San Francisco, USA',
  slogan: 'Building the future of software.',
  logo_url: 'NT', // using initials for placeholder
  cover_url: 'https://via.placeholder.com/1200x300',
  description: 'NexuTech Solutions is a global leader in cloud infrastructure and enterprise software. We build scalable tools that power modern businesses, focusing on reliability, speed, and developer experience. Trusted by Fortune 500 companies worldwide.',
  entity_type: 'COMPANY',
  institution_type: null,
  established_year: 2018,
  campus_location: null,
  verified_edu: false,
  verification_status: 'DOMAIN_VERIFIED',
  status: 'Active',
  followers_count: 12450,
  moderation_flags: 3
};

// Dummy data constants removed, using live data from backend

export default function OrganizationProfile() {
  const { role, accessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const from = location.state?.from || '/organizations';
  const backLabel = location.state?.label || 'Organizations';

  const [mockOrg, setMockOrg] = useState(defaultOrgData);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (id && accessToken) {
      fetch(`/api/admin/organisations/${id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          const processedActivity = (data.activity || []).map(a => ({
            id: a.id,
            type: a.type,
            text: a.text || (a.metadata && a.metadata.text) || `Action: ${a.type}`,
            note: a.note || (a.metadata && a.metadata.note) || '',
            time: new Date(a.time).toLocaleString(),
            icon: a.type === 'CREATE' ? 'add_circle' : (a.type === 'VIEW' ? 'visibility' : 'info'),
            color: 'text-indigo-600 bg-indigo-50',
            author: { 
              name: a.author_name || 'System', 
              initials: (a.author_name || 'SY').substring(0, 2).toUpperCase(), 
              avatarColor: 'bg-slate-100 text-slate-500' 
            }
          }));

          const processedTechStack = (data.techStack || []).map(tech => ({
            name: tech.name,
            category: tech.category || 'General',
            bg: 'bg-slate-50/50', border: 'border-slate-100', iconBg: 'bg-white', iconBorder: 'border-slate-100', iconText: 'text-slate-600', icon: 'deployed_code', colSpan: 1
          }));

          const processedMembers = (data.members || []).map(m => ({
            id: m.id,
            name: m.name || 'Unknown User',
            role: m.role || 'Member',
            initials: (m.name || 'U ').substring(0, 2).toUpperCase(),
            color: m.color || 'bg-slate-100 text-slate-700',
            department: 'General',
            email: m.email || '',
            status: m.status || 'ACTIVE'
          }));

          setMockOrg(prev => ({ 
            ...prev, 
            ...data,
            activity: processedActivity,
            techStack: processedTechStack,
            members: processedMembers,
            documents: data.documents || []
          }));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching org:', err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id, accessToken]);

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendDuration, setSuspendDuration] = useState('Short Temporary (3-7 days)');
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [activeDocumentStatus, setActiveDocumentStatus] = useState('Pending');
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [auditLogsModalOpen, setAuditLogsModalOpen] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('Last 30 Days');
  const [activityPage, setActivityPage] = useState(1);

  if (loading) {
    return <div className="p-8 text-center text-on-surface">Loading organization profile...</div>;
  }

  if (role === 'moderator' && from !== '/moderation') {
    return (
      <div className="pt-8 pb-12 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
        <div className="bg-surface border border-outline-variant rounded-xl p-xl w-full max-w-2xl text-center shadow-sm">
          <span className="material-symbols-outlined text-error text-[48px] mb-md">block</span>
          <h2 className="font-headline-md text-headline-md text-on-surface">Access Denied</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-sm">Moderators can only view organization profiles directly from an active moderation case.</p>
        </div>
      </div>
    );
  }

  const itemsPerPage = 3;

  const filteredActivity = (mockOrg.activity || []).filter(a => 
    a.text?.toLowerCase().includes(activitySearch.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredActivity.length / itemsPerPage);
  const paginatedActivity = filteredActivity.slice((activityPage - 1) * itemsPerPage, activityPage * itemsPerPage);

  return (
    <div className="pt-6 pb-12 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate(from)} 
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Back to {backLabel}
        </button>
      </div>

      {/* Header Section */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden mb-8 relative">
        {/* Cover Image */}
        <div className="h-48 w-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')" }}></div>

        <div className="px-6 pb-6 relative">
          {/* Profile Picture */}
          <div className="w-[136px] h-[136px] rounded-2xl border-[4px] border-white bg-slate-900 overflow-hidden absolute -top-[68px] shadow-sm flex items-center justify-center">
             <span className="material-symbols-outlined text-[80px] text-blue-400">all_inclusive</span>
          </div>
          
          {/* Action buttons */}
          <div className="absolute right-6 top-6 flex gap-3">
            <button className="flex items-center gap-2 bg-transparent text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium text-[13px] transition-colors border border-slate-300">
              <span className="material-symbols-outlined text-[16px]">notifications</span>
              Warn Organization
            </button>
            <button 
              onClick={() => setSuspendModalOpen(true)}
              className="flex items-center gap-2 bg-transparent text-[#b91c1c] hover:bg-red-50 px-4 py-2 rounded-lg font-medium text-[13px] transition-colors border border-[#b91c1c]"
            >
              <span className="material-symbols-outlined text-[16px]">gavel</span>
              Suspend Organization
            </button>
          </div>

          {/* Profile Info */}
          <div className="pt-20 max-w-3xl">
            <h1 className="text-[26px] font-bold text-slate-900 leading-tight flex items-center gap-2">
              {mockOrg.name}
              <span className="material-symbols-outlined text-[#0a66c2] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              {mockOrg.moderation_flags > 0 && (
                <span className="ml-2 text-sm bg-orange-100 text-orange-800 px-3 py-1 rounded-full border border-orange-200 flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[16px]">flag</span>
                  {mockOrg.moderation_flags} Moderation Flags
                </span>
              )}
            </h1>
            <p className="text-[16px] text-slate-800 mt-2">SaaS and Fintech Solutions</p>
            <p className="text-[14px] text-slate-500 mt-3">
              Technology &bull; Mumbai, Maharashtra, India &bull; 1 - 50 Members
            </p>
            <a href="https://www.nexsus.com" className="text-[#0a66c2] text-[14px] font-medium hover:underline mt-2 inline-block">
              https://www.nexsus.com
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Info Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm flex flex-col">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Founded</span>
              </div>
              <span className="text-sm font-bold text-on-surface leading-tight">March 14,<br/>2012</span>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm flex flex-col">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <span className="material-symbols-outlined text-[18px]">group</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Headcount</span>
              </div>
              <span className="text-sm font-bold text-on-surface leading-tight">250 - 500</span>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm flex flex-col">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <span className="material-symbols-outlined text-[18px]">precision_manufacturing</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Industry</span>
              </div>
              <span className="text-sm font-bold text-on-surface leading-tight">Quantum<br/>SaaS</span>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm flex flex-col">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <span className="material-symbols-outlined text-[18px]">account_balance</span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Structure</span>
              </div>
              <span className="text-sm font-bold text-on-surface leading-tight">LLC, CA</span>
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-surface rounded-xl p-4 border border-outline-variant shadow-sm flex flex-col sm:flex-row items-center gap-6">
            <div className="w-full sm:w-40 h-28 bg-surface-container flex items-center justify-center rounded-lg border border-outline-variant shrink-0">
              <span className="material-symbols-outlined text-outline text-4xl">map</span>
            </div>
            <div className="w-full">
              <div className="flex items-center gap-2 text-indigo-600 mb-1">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                <span className="text-xs font-semibold">Headquarters</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-1">Palo Alto, California</h3>
              <p className="text-sm text-on-surface-variant font-medium">1200 Technology Drive, Suite 400</p>
            </div>
          </div>

          {/* Verification Documents */}
          <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600">verified_user</span>
                <h3 className="font-bold text-on-surface">Verification Documents</h3>
              </div>
              <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                {(mockOrg.documents || []).length} Documents
              </span>
            </div>
            <div className="p-6 space-y-4">
              
              {(mockOrg.documents || []).length === 0 ? (
                <div className="text-center p-8 text-on-surface-variant bg-surface-container-lowest rounded-xl border border-dashed border-outline">
                  No verification documents uploaded.
                </div>
              ) : (
                (mockOrg.documents || []).map(doc => (
                  <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface border border-outline-variant rounded-xl shadow-sm hover:shadow-md transition-shadow gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-2xl">
                          {doc.document_type === 'BUSINESS_LICENSE' ? 'description' : 
                           doc.document_type === 'TAX_ID' ? 'request_quote' : 'insert_drive_file'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface text-sm mb-1">{doc.document_name || 'Document'}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant font-medium">
                          <span>Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                          <span className="text-orange-600 font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">more_horiz</span>
                            {mockOrg.verification_status || 'PENDING REVIEW'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setDocumentModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2 border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors shrink-0">
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                      View Document
                    </button>
                  </div>
                ))
              )}

            </div>
          </div>

          {/* Review Lifecycle Audit */}
          <div className="bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[20px]">history</span>
                <h3 className="font-bold text-on-surface">Review Lifecycle Audit</h3>
              </div>
              <button onClick={() => setAuditLogsModalOpen(true)} className="text-indigo-600 text-sm font-semibold flex items-center gap-1 hover:underline">
                View detailed logs <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              </button>
            </div>
            <div className="p-6">
              <div className="relative border-l-2 border-outline-variant ml-6 space-y-8 pb-4">
                
                {/* Event 1 */}
                <div className="relative pl-8">
                  <div className="absolute -left-[21px] top-1 w-10 h-10 rounded-full bg-surface border-2 border-indigo-400 text-indigo-600 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">edit_document</span>
                  </div>
                  <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-on-surface">Documents Re-submitted</h4>
                      <span className="bg-indigo-50 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">Today, 2:45 PM</span>
                    </div>
                    <p className="text-sm text-on-surface-variant font-medium mb-4">The organization updated their 'Business License' following an initial request for better resolution. Metadata validation passed.</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-slate-500 text-[16px]">person</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface">Sarah Jenkins</p>
                          <p className="text-[10px] uppercase text-on-surface-variant font-bold tracking-wider">ORGANIZATION ADMIN</p>
                        </div>
                      </div>
                      <span className="bg-green-50 text-green-700 text-[9px] font-bold px-2 py-1 uppercase rounded tracking-wider shrink-0">External Action</span>
                    </div>
                  </div>
                </div>

                {/* Event 2 */}
                <div className="relative pl-8">
                  <div className="absolute -left-[21px] top-1 w-10 h-10 rounded-full bg-surface border-2 border-red-500 text-red-600 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">warning</span>
                  </div>
                  <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-on-surface">Initial Document Rejection</h4>
                      <span className="bg-indigo-50 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">Today, 11:30 AM</span>
                    </div>
                    <p className="text-sm text-on-surface-variant font-medium italic mb-4">Reviewer rejected 'Business License' citing: "Document image is too blurry to verify watermark. Please upload a high-resolution scan."</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-slate-500 text-[16px]">person</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface">Marcus Aurelius</p>
                          <p className="text-[10px] uppercase text-on-surface-variant font-bold tracking-wider">LEAD REVIEWER</p>
                        </div>
                      </div>
                      <span className="bg-purple-50 text-purple-700 text-[9px] font-bold px-2 py-1 uppercase rounded tracking-wider shrink-0">Internal Review</span>
                    </div>
                  </div>
                </div>

                {/* Event 3 */}
                <div className="relative pl-8">
                  <div className="absolute -left-[21px] top-1 w-10 h-10 rounded-full bg-surface border-2 border-slate-400 text-slate-600 flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                  </div>
                  <div className="bg-surface border border-outline-variant rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-on-surface">Application Received</h4>
                      <span className="bg-indigo-50 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">Yesterday, 4:12 PM</span>
                    </div>
                    <p className="text-sm text-on-surface-variant font-medium mb-4">Initial registration and document upload completed for Enterprise Tier access. Auto-KYC check initialized.</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-outline-variant flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-slate-400 text-[16px]">smart_toy</span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface">System Automation</p>
                          <p className="text-[10px] uppercase text-on-surface-variant font-bold tracking-wider">INFRASTRUCTURE</p>
                        </div>
                      </div>
                      <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-1 uppercase rounded tracking-wider shrink-0">System Event</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* About Card */}
          <div className="bg-surface rounded-2xl p-6 sm:p-8 shadow-sm border border-outline-variant">
            <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">info</span>
              About
            </h3>
            <p className="text-base text-on-surface-variant leading-relaxed mb-4">
              {mockOrg.description}
            </p>
            <div className="flex gap-4 mb-4">
               <span className="text-sm bg-surface px-3 py-1.5 rounded border border-outline-variant font-bold text-on-surface shadow-sm">Website: {mockOrg.website}</span>
               <span className="text-sm bg-surface px-3 py-1.5 rounded border border-outline-variant font-bold text-on-surface shadow-sm">Followers: {mockOrg.followers_count.toLocaleString()}</span>
               <span className={`text-sm px-3 py-1.5 rounded border font-bold shadow-sm ${mockOrg.moderation_flags > 0 ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-surface border-outline-variant text-on-surface'}`}>Moderation Flags: {mockOrg.moderation_flags}</span>
            </div>
          </div>
          

        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* Decision Panel */}
          <div className="bg-slate-800 text-white rounded-xl p-6 shadow-lg border border-slate-700">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-indigo-400">gavel</span>
              <h3 className="text-lg font-bold text-white">Decision Panel</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Current Verification Status</label>
                <div className="bg-slate-700 border border-slate-600 rounded-lg p-3 flex justify-between items-center">
                  <span className={`flex items-center gap-2 font-bold text-sm ${mockOrg.verification_status === 'VERIFIED' ? 'text-green-400' : mockOrg.verification_status === 'REJECTED' ? 'text-red-400' : 'text-yellow-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${mockOrg.verification_status === 'VERIFIED' ? 'bg-green-400' : mockOrg.verification_status === 'REJECTED' ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
                    {mockOrg.verification_status || 'UNVERIFIED'}
                  </span>
                  <span className="material-symbols-outlined text-slate-400 text-[18px]">info</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Rejection Reason</label>
                <select className="w-full bg-slate-700 border border-slate-600 text-sm text-slate-200 rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none">
                  <option>No rejection reason selected</option>
                  <option>Missing Document</option>
                  <option>Invalid License</option>
                  <option>Fraud Suspected</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Internal Reviewer Notes</label>
                <textarea 
                  className="w-full bg-slate-700 border border-slate-600 text-sm text-slate-200 rounded-lg p-3 h-24 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400 resize-none"
                  placeholder="Type private observations here..."
                  defaultValue={mockOrg.review_notes || ''}
                ></textarea>
              </div>

              <div className="pt-2 space-y-3">
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                  Approve Organization
                </button>
                <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border border-slate-600">
                  <span className="material-symbols-outlined text-[20px]">block</span>
                  Deny Application
                </button>
              </div>
            </div>
          </div>

          {/* Key Members Card */}
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-indigo-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[20px]">group</span>
                Key Members
              </h3>
              <span className="bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{(mockOrg.members || []).length}</span>
            </div>
            
            <div className="space-y-4">
              {(mockOrg.members || []).map(member => (
                <div key={member.id} onClick={() => navigate('/profile')} className="flex items-center gap-3 p-2 hover:bg-surface-container-lowest rounded-xl border border-transparent hover:border-outline-variant transition-all cursor-pointer">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${member.color}`}>
                    {member.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{member.name}</p>
                    <p className="text-[11px] text-on-surface-variant font-medium">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setMembersModalOpen(true)} className="w-full mt-6 py-2 bg-surface border border-indigo-200 rounded-lg text-indigo-700 text-sm font-bold hover:bg-indigo-50 transition-colors shadow-sm">
              View All Members
            </button>
          </div>

          {/* Tech Stack Card */}
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-indigo-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[20px]">code</span>
                Tech Stack
              </h3>
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{(mockOrg.techStack || []).length} TECHNOLOGIES</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(mockOrg.techStack || []).map(tech => (
                <div key={tech.name} className={`p-3 border rounded-xl flex items-center gap-3 ${tech.bg} ${tech.border} ${tech.colSpan === 2 ? 'col-span-2' : 'col-span-1'}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${tech.iconBg} ${tech.iconBorder} ${tech.iconText}`}>
                    {tech.isTextIcon ? (
                      <span className="font-black text-[12px]">{tech.textIcon}</span>
                    ) : (
                      <span className="material-symbols-outlined text-[20px]">{tech.icon}</span>
                    )}
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-800">{tech.name}</span>
                    <span className={`block text-[9px] uppercase tracking-wider font-bold ${tech.iconText}`}>{tech.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed Card */}
          <div className="bg-surface rounded-2xl p-6 shadow-sm border border-outline-variant">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-indigo-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-600 text-[20px]">history</span>
                Recent Activity
              </h3>
              <button onClick={() => setActivityModalOpen(true)} className="text-indigo-600 text-sm font-bold uppercase tracking-wider hover:underline">VIEW ALL</button>
            </div>
            
            <div className="flex flex-col gap-3">
              {(mockOrg.activity || []).slice(0, 4).map(activity => (
                <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container-lowest transition-colors shadow-sm">
                  <div className={`flex items-center justify-center w-8 h-8 rounded shrink-0 ${activity.color.split(' ')[0]} bg-surface`}>
                    <span className="material-symbols-outlined text-[20px]">{activity.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-on-surface mb-1 leading-snug">{activity.text}</p>
                    <time className="text-[10px] text-on-surface-variant font-medium">{activity.time}</time>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Suspend Confirmation Modal */}
      {suspendModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-outline-variant w-[450px] max-w-[90vw] rounded-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error mb-4">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <button onClick={() => setSuspendModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface transition-colors p-1">close</button>
            </div>
            
            <h3 className="text-xl font-bold text-on-surface mb-2">
              Suspend Organization
            </h3>
            
            <p className="text-base text-on-surface-variant mb-6 leading-relaxed">
              Are you sure you want to suspend <strong>{mockOrg.name}</strong>? This action will hide their profile from the public, restrict members from taking actions on behalf of the company, and pause all active job postings based on the selected duration.
            </p>

            <div className="mb-6">
              <label className="block text-[11px] font-mono-label text-on-surface-variant mb-xs ml-1">SUSPENSION DURATION</label>
              <select 
                value={suspendDuration}
                onChange={(e) => setSuspendDuration(e.target.value)}
                className="w-full bg-surface border border-outline-variant rounded-lg px-md py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              >
                <option value="Short Temporary (3-7 days)">Short Temporary (3-7 days)</option>
                {role === 'admin' && (
                  <>
                    <option value="Long Temporary (30 days)">Long Temporary (30 days)</option>
                    <option value="Permanent (Pending Review)">Permanent (Pending Review)</option>
                  </>
                )}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setSuspendModalOpen(false)} 
                className="px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => { alert(`Organization suspended. Duration: ${suspendDuration}`); setSuspendModalOpen(false); }}
                className="bg-error text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-error/90 transition-colors shadow-sm"
              >
                Yes, Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Members Modal */}
      {membersModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-[800px] max-w-[95vw] max-h-[90vh] flex flex-col rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-800">Organization Members</h3>
                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold">12 Members</span>
              </div>
              <button onClick={() => setMembersModalOpen(false)} className="material-symbols-outlined text-slate-400 hover:text-slate-600 transition-colors">close</button>
            </div>

            {/* Toolbar */}
            <div className="p-4 border-b border-outline-variant flex items-center gap-4 shrink-0 bg-white">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                <input 
                  type="text" 
                  placeholder="Search members by name or email..." 
                  className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                />
              </div>
              <select className="border border-outline-variant rounded-lg px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none bg-white font-medium cursor-pointer">
                <option>All Departments</option>
                <option>Engineering</option>
                <option>Product</option>
              </select>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-outline-variant text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
              <div className="col-span-4">MEMBER</div>
              <div className="col-span-3">DEPARTMENT</div>
              <div className="col-span-3">EMAIL</div>
              <div className="col-span-1">STATUS</div>
              <div className="col-span-1 text-right">ACTIONS</div>
            </div>

            {/* Table Body */}
            <div className="overflow-y-auto bg-white flex-1">
              {mockMembers.map((member, i) => (
                <div key={member.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-outline-variant items-center hover:bg-slate-50 transition-colors">
                  
                  {/* Member */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${member.color}`}>
                      {member.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{member.name}</p>
                      <p className="text-[12px] text-slate-500">{member.role}</p>
                    </div>
                  </div>

                  {/* Department */}
                  <div className="col-span-3 text-sm text-slate-600">{member.department}</div>

                  {/* Email */}
                  <div className="col-span-3 text-sm text-slate-600">{member.email}</div>

                  {/* Status */}
                  <div className="col-span-1">
                    {member.status === 'ACTIVE' ? (
                      <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">ACTIVE</span>
                    ) : (
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">INVITED</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-end">
                    <button 
                      onClick={() => navigate('/profile')}
                      className="material-symbols-outlined text-slate-400 hover:text-indigo-600 transition-colors text-[20px]"
                      title="View Profile"
                    >
                      visibility
                    </button>
                  </div>

                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-outline-variant bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setMembersModalOpen(false)} 
                className="px-6 py-2 border border-outline-variant rounded-lg text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* View All Activity Modal */}
      {activityModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-[800px] max-w-[95vw] max-h-[90vh] flex flex-col rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-800">Recent Activity</h3>
                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold">48 Events</span>
              </div>
              <button onClick={() => setActivityModalOpen(false)} className="material-symbols-outlined text-slate-400 hover:text-slate-600 transition-colors">close</button>
            </div>

            {/* Toolbar */}
            <div className="p-4 border-b border-outline-variant flex items-center gap-4 shrink-0 bg-white">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                <input 
                  type="text" 
                  placeholder="Search activity logs..." 
                  value={activitySearch}
                  onChange={(e) => {
                    setActivitySearch(e.target.value);
                    setActivityPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                />
              </div>
              <div className="relative border border-outline-variant rounded-lg bg-white flex items-center shrink-0 pr-2">
                <span className="material-symbols-outlined text-slate-400 pl-3 text-[18px]">calendar_today</span>
                <select 
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="pl-2 pr-6 py-2 text-sm text-slate-700 focus:outline-none appearance-none bg-transparent font-medium cursor-pointer"
                >
                  <option>Last 30 Days</option>
                  <option>Last 7 Days</option>
                  <option>All Time</option>
                </select>
                <span className="material-symbols-outlined absolute right-2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
              </div>
            </div>

            {/* Scrollable Feed */}
            <div className="p-6 overflow-y-auto space-y-4 relative flex-1 bg-slate-50/50">
              {paginatedActivity.map((activity) => (
                <div key={activity.id} className="bg-white border border-outline-variant rounded-xl p-4 flex gap-4 shadow-sm hover:shadow-md transition-shadow relative">
                  
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${activity.color.split(' ')[1]} ${activity.color.split(' ')[0]}`}>
                    <span className="material-symbols-outlined text-[24px]">{activity.icon}</span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-[15px] font-bold text-slate-800">{activity.text}</h4>
                      <span className="text-xs text-slate-400 font-medium">{activity.time}</span>
                    </div>
                    {activity.note && (
                      <p className="text-[13px] text-slate-600 mb-3">{activity.note}</p>
                    )}
                    
                    {activity.author && (
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${activity.author.avatarColor}`}>
                          {activity.author.initials}
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">{activity.author.name}</span>
                      </div>
                    )}
                  </div>

                </div>
              ))}
            </div>

            {/* Footer with Pagination */}
            <div className="p-4 border-t border-outline-variant bg-white flex justify-between items-center shrink-0">
              <div className="flex gap-2">
                <button 
                  onClick={() => setActivityPage(p => Math.max(1, p - 1))}
                  disabled={activityPage === 1}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setActivityPage(p => Math.min(totalPages, p + 1))}
                  disabled={activityPage === totalPages || totalPages === 0}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
              <button 
                onClick={() => setActivityModalOpen(false)} 
                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Detailed Audit Logs Modal */}
      {auditLogsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4 sm:p-8">
          <div className="bg-white w-full max-w-[1200px] h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden relative">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-start shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[28px]">history</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#0f2546] mb-1">Detailed Audit Logs</h2>
                  <div className="flex items-center gap-3">
                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Enterprise Registry</span>
                    <span className="text-slate-500 text-xs font-medium">&bull; 4,284 Events Tracked</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setAuditLogsModalOpen(false)} className="material-symbols-outlined text-slate-400 hover:text-slate-700 transition-colors">close</button>
            </div>

            {/* Toolbar */}
            <div className="px-8 py-4 border-b border-slate-100 flex items-center gap-4 shrink-0 bg-slate-50/50">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                <input 
                  type="text" 
                  placeholder="Search by activity, admin name, or event ID..." 
                  className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-400 shadow-sm"
                />
              </div>
              <div className="relative border border-slate-200 bg-white rounded-xl flex items-center shrink-0 pr-3 shadow-sm hover:border-indigo-200 transition-colors">
                <span className="material-symbols-outlined text-indigo-600 pl-4 pr-2 text-[20px]">calendar_today</span>
                <select className="pl-1 pr-6 py-2.5 text-sm font-bold text-slate-700 focus:outline-none appearance-none bg-transparent cursor-pointer">
                  <option>Oct 01 - Oct 31, 2023</option>
                  <option>Sep 01 - Sep 30, 2023</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
              </div>
              <button className="flex items-center gap-2 border border-slate-200 bg-white px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[20px] text-slate-600">filter_list</span>
                <span className="text-sm font-bold text-slate-700">Filters</span>
                <span className="bg-indigo-100 text-indigo-700 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ml-1">2</span>
              </button>
              <button className="border border-slate-200 bg-white w-11 h-11 flex items-center justify-center rounded-xl hover:bg-slate-50 transition-colors shadow-sm shrink-0">
                <span className="material-symbols-outlined text-slate-600 text-[20px]">download</span>
              </button>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-6 px-8 py-4 bg-slate-100/50 border-b border-slate-200 shrink-0">
              <div className="col-span-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">TIMESTAMP</div>
              <div className="col-span-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">CLASSIFICATION</div>
              <div className="col-span-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">ACTIVITY</div>
              <div className="col-span-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">EXECUTOR</div>
              <div className="col-span-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">METADATA & DETAILS</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto">
              
              {/* Row 1 */}
              <div className="grid grid-cols-12 gap-6 px-8 py-6 border-b border-slate-100 items-start hover:bg-slate-50/50 transition-colors">
                <div className="col-span-2 flex flex-col">
                  <span className="text-sm font-medium text-slate-700">Oct 24,</span>
                  <span className="text-sm font-bold text-slate-800">11:30:05 AM</span>
                </div>
                <div className="col-span-2">
                  <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> SECURITY
                  </span>
                </div>
                <div className="col-span-3 flex flex-col">
                  <span className="text-sm font-bold text-error mb-1">Reject Credentials</span>
                  <span className="text-[10px] font-mono text-slate-400">ID: #DOC-882-QX</span>
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus" alt="Marcus" className="w-9 h-9 rounded-full bg-slate-100" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#0f2546] leading-snug">Marcus<br/>Aurelius</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">LEAD REVIEWER</span>
                  </div>
                </div>
                <div className="col-span-3">
                  <div className="bg-red-50/50 border border-red-100 rounded-lg p-3">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-bold text-error mr-1">REASON:</span>
                      Image resolution too low to verify security watermarks. Manual review required.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-12 gap-6 px-8 py-6 border-b border-slate-100 items-start hover:bg-slate-50/50 transition-colors">
                <div className="col-span-2 flex flex-col">
                  <span className="text-sm font-medium text-slate-700">Oct 23,</span>
                  <span className="text-sm font-bold text-slate-800">4:12:44 PM</span>
                </div>
                <div className="col-span-2">
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> INFRASTRUCTURE
                  </span>
                </div>
                <div className="col-span-3 flex flex-col">
                  <span className="text-sm font-bold text-[#0f2546] mb-1">Initialize Auto-<br/>KYC</span>
                  <span className="text-[10px] font-mono text-slate-400">ID: #KYC-SEQ-001</span>
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-slate-500 text-[18px]">smart_toy</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#0f2546] leading-snug">Indigo System<br/>Bot</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">AUTOMATED<br/>ROUTINE</span>
                  </div>
                </div>
                <div className="col-span-3">
                  <div className="bg-indigo-50/50 border border-indigo-50 rounded-lg p-3">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Automated identity verification protocol triggered for Enterprise Tier onboarding application.
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-12 gap-6 px-8 py-6 border-b border-slate-100 items-start hover:bg-slate-50/50 transition-colors">
                <div className="col-span-2 flex flex-col">
                  <span className="text-sm font-medium text-slate-700">Oct 22,</span>
                  <span className="text-sm font-bold text-slate-800">10:20:18 AM</span>
                </div>
                <div className="col-span-2">
                  <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> IAM CHANGE
                  </span>
                </div>
                <div className="col-span-3 flex flex-col">
                  <span className="text-sm font-bold text-[#0f2546] mb-1">Grant "Manager"<br/>Role</span>
                  <span className="text-[10px] font-mono text-slate-400">USER: #CLARA-J</span>
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold text-xs">
                    SJ
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#0f2546] leading-snug">Sarah Jenkins</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">ORG<br/>ADMINISTRATOR</span>
                  </div>
                </div>
                <div className="col-span-3">
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Promoted Clara Jones to Product Manager within the NexuTech organization workspace.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-slate-200 bg-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-500">Rows per page:</span>
                  <span className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg text-sm font-bold">25</span>
                </div>
                <span className="text-xs text-slate-500">Showing <span className="font-bold text-slate-700">1-25</span> of 4,284 entries</span>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center border border-slate-200 rounded-lg bg-white shadow-sm overflow-hidden">
                  <button className="px-3 py-2 text-slate-300 border-r border-slate-200 bg-slate-50 flex items-center justify-center pointer-events-none">
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>
                  <span className="px-5 py-2 text-sm font-bold text-indigo-600 bg-indigo-50/50">Page 1</span>
                  <button className="px-3 py-2 text-slate-600 border-l border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>
                </div>
                <button 
                  onClick={() => setAuditLogsModalOpen(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-sm transition-colors text-sm"
                >
                  Done
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Document Verification Modal */}
      {documentModalOpen && (
        <div className="fixed inset-0 z-[100] flex bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex w-full h-full p-4 sm:p-8 gap-0">
            {/* Left side: Document Viewer */}
            <div className="flex-1 bg-slate-700 rounded-l-2xl flex flex-col overflow-hidden relative shadow-2xl border-r border-slate-600">
              
              {/* Top toolbar */}
              <div className="h-14 bg-white/95 shrink-0 px-6 flex justify-between items-center border-b border-slate-200">
                <div className="flex items-center gap-6">
                  <span className="text-xs font-bold text-slate-800 tracking-wider">PAGE 1 OF 3</span>
                  <div className="h-4 w-px bg-slate-300"></div>
                  <div className="flex items-center gap-3">
                    <button className="material-symbols-outlined text-slate-500 hover:text-slate-800 text-[20px]">zoom_out</button>
                    <span className="text-sm font-medium text-slate-700">100%</span>
                    <button className="material-symbols-outlined text-slate-500 hover:text-slate-800 text-[20px]">zoom_in</button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button className="material-symbols-outlined text-slate-500 hover:text-slate-800 text-[20px]">print</button>
                  <button className="material-symbols-outlined text-slate-500 hover:text-slate-800 text-[20px]">download</button>
                  <button className="material-symbols-outlined text-slate-500 hover:text-slate-800 text-[20px]">fullscreen</button>
                </div>
              </div>

              {/* Document Scroll Area */}
              <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8 items-center">
                {/* Page 1 */}
                <div className="w-full max-w-3xl bg-white min-h-[900px] rounded shadow-xl flex flex-col relative shrink-0">
                  <div className="pt-24 pb-16 px-16 flex-1 flex flex-col">
                    <div className="flex justify-center mb-12">
                      <div className="w-20 h-20 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-[40px]">account_balance</span>
                      </div>
                    </div>
                    
                    <div className="text-center mb-16 space-y-4">
                      <h1 className="text-4xl font-bold tracking-[0.2em] text-[#0f2546]">CERTIFICATE OF</h1>
                      <h1 className="text-4xl font-bold tracking-[0.2em] text-[#0f2546]">INCORPORATION</h1>
                      <p className="text-xl text-slate-500 italic mt-4 font-serif">Of a Private Limited Company</p>
                    </div>

                    <div className="h-px bg-slate-200 w-full mb-12"></div>

                    <div className="text-center space-y-8 flex-1">
                      <p className="text-lg text-slate-600">The Registrar of Companies for England and Wales, hereby<br/>certifies that</p>
                      <h2 className="text-2xl font-bold text-[#0f2546]">TECHNOVA GLOBAL LTD</h2>
                      <p className="text-lg text-slate-600 leading-relaxed">
                        is this day incorporated under the Companies Act 2006 as a<br/>
                        private company, that the company is limited by shares, and<br/>
                        the situation of its registered office is in England and Wales
                      </p>
                    </div>

                    <div className="flex justify-between items-end mt-24">
                      <div>
                        <p className="text-xs font-bold text-slate-400 tracking-wider mb-2">COMPANY NUMBER</p>
                        <p className="text-lg font-bold">12948576</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 tracking-wider mb-2">DATE</p>
                        <p className="text-lg font-mono font-bold tracking-tight">24th October 2023</p>
                      </div>
                    </div>

                    <div className="mt-12 flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-slate-400 tracking-wider mb-2">GIVEN AT COMPANIES HOUSE</p>
                        <p className="text-base font-bold">CARDIFF</p>
                      </div>
                      <div className="w-24 h-24 bg-slate-50 border border-slate-100 opacity-50"></div>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-slate-100" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}></div>
                </div>

                {/* Page 2 */}
                <div className="w-full max-w-3xl bg-white min-h-[900px] rounded shadow-xl flex flex-col relative shrink-0 p-16">
                  <div className="border-b-2 border-[#0f2546] pb-6 mb-10 flex justify-between items-end">
                    <div>
                      <h2 className="text-2xl font-bold text-[#0f2546] tracking-wide">ARTICLES OF ASSOCIATION</h2>
                      <p className="text-sm text-slate-500 mt-2">Private Company Limited by Shares</p>
                    </div>
                    <div className="text-right">
                      <div className="w-16 h-16 border-2 border-indigo-100 rounded-full flex items-center justify-center text-indigo-200 mb-2 ml-auto">
                        <span className="material-symbols-outlined text-3xl">gavel</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400">PART 1: INTERPRETATION</p>
                    </div>
                  </div>

                  <div className="space-y-8 flex-1">
                    <section>
                      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-xs">1</span>
                        Defined Terms
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed pl-8">
                        In the articles, unless the context requires otherwise: "articles" means the company's articles of association; "bankruptcy" includes individual insolvency proceedings in a jurisdiction other than England and Wales or Northern Ireland which have an effect similar to that of bankruptcy.
                      </p>
                    </section>
                    
                    <section>
                      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-xs">2</span>
                        Liability of members
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed pl-8">
                        The liability of the members is limited to the amount, if any, unpaid on the shares held by them.
                      </p>
                    </section>
                    
                    <section>
                      <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-xs">3</span>
                        Directors' general authority
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed pl-8">
                        Subject to the articles, the directors are responsible for the management of the company's business, for which purpose they may exercise all the powers of the company.
                      </p>
                    </section>
                    
                    <div className="h-px bg-slate-100 my-8"></div>
                    
                    <div className="grid grid-cols-2 gap-8 mt-12">
                      <div className="border border-slate-200 rounded p-6 bg-slate-50">
                        <p className="text-xs font-bold text-slate-500 mb-6">SIGNATURE OF DIRECTOR 1</p>
                        <div className="border-b border-slate-400 border-dashed pb-2 mb-2">
                          <span className="font-mono italic text-2xl text-indigo-900 opacity-80">J. Smith</span>
                        </div>
                        <p className="text-xs text-slate-600">Johnathan Smith</p>
                      </div>
                      <div className="border border-slate-200 rounded p-6 bg-slate-50">
                        <p className="text-xs font-bold text-slate-500 mb-6">SIGNATURE OF DIRECTOR 2</p>
                        <div className="border-b border-slate-400 border-dashed pb-2 mb-2">
                          <span className="font-mono italic text-2xl text-indigo-900 opacity-80">A. Davies</span>
                        </div>
                        <p className="text-xs text-slate-600">Alice Davies</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-12 flex justify-between items-center text-xs text-slate-400 font-bold border-t border-slate-100 pt-6">
                    <span>TECHNOVA GLOBAL LTD - 12948576</span>
                    <span>PAGE 2 OF 3</span>
                  </div>
                </div>

                {/* Page 3 */}
                <div className="w-full max-w-3xl bg-white min-h-[900px] rounded shadow-xl flex flex-col relative shrink-0 p-16">
                  <div className="flex justify-between items-start mb-12">
                    <div className="w-24 h-24 border-4 border-red-600/20 rounded-full flex items-center justify-center relative">
                      <div className="absolute inset-2 border border-red-600/40 rounded-full flex items-center justify-center">
                        <span className="text-red-600/60 font-bold text-[10px] text-center uppercase tracking-widest leading-tight -rotate-12">Official<br/>Seal</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 mb-1">APPENDIX A</p>
                      <h2 className="text-xl font-bold text-slate-800">Statement of Capital</h2>
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-sm text-slate-600 mb-6">
                      The total number of shares and total aggregate nominal value of issued share capital at the date of incorporation is detailed below:
                    </p>
                    
                    <div className="border border-slate-200 rounded-lg overflow-hidden mb-12">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                          <tr>
                            <th className="px-6 py-4 border-b border-slate-200">Currency</th>
                            <th className="px-6 py-4 border-b border-slate-200">Class of Shares</th>
                            <th className="px-6 py-4 border-b border-slate-200 text-right">Number of Shares</th>
                            <th className="px-6 py-4 border-b border-slate-200 text-right">Aggregate Nominal Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="px-6 py-4 border-b border-slate-100 font-medium">GBP</td>
                            <td className="px-6 py-4 border-b border-slate-100">ORDINARY</td>
                            <td className="px-6 py-4 border-b border-slate-100 text-right">100</td>
                            <td className="px-6 py-4 border-b border-slate-100 text-right">£100.00</td>
                          </tr>
                          <tr className="bg-slate-50/50 font-bold">
                            <td className="px-6 py-4" colSpan={2}>TOTAL</td>
                            <td className="px-6 py-4 text-right">100</td>
                            <td className="px-6 py-4 text-right">£100.00</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-amber-600">info</span>
                        <div>
                          <h4 className="text-sm font-bold text-amber-900">Prescribed particulars of rights attached to shares</h4>
                          <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                            Each share has full rights in the company with respect to voting, dividends and distributions.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-16 flex justify-end">
                      <div className="w-48">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Electronic Signature</p>
                        <div className="bg-slate-50 border border-slate-200 rounded px-4 py-3 font-mono text-xs text-slate-500 break-all">
                          3f8c2b9a1d4e7f0g5h8j2k1m4n7p0q3r
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-12 flex justify-between items-center text-xs text-slate-400 font-bold border-t border-slate-100 pt-6">
                    <span>TECHNOVA GLOBAL LTD - 12948576</span>
                    <span>PAGE 3 OF 3</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Verification Panel */}
            <div className="w-[420px] bg-white rounded-r-2xl flex flex-col shadow-2xl relative shrink-0">
              <button 
                onClick={() => setDocumentModalOpen(false)}
                className="absolute right-4 top-4 material-symbols-outlined text-slate-400 hover:text-slate-700 bg-white rounded-full transition-colors z-10"
              >
                close
              </button>

              <div className="p-6 border-b border-slate-100 shrink-0 mt-2">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-indigo-600 bg-indigo-50 rounded-full text-[20px] p-1 font-bold">verified</span>
                  <h2 className="text-lg font-bold text-[#0f2546]">Verification Panel</h2>
                </div>

                <div className="bg-[#f0f4f8] rounded-xl p-4 border border-indigo-100 mb-4 border-l-4 border-l-indigo-600">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">FILE NAME</p>
                  <p className="text-sm font-bold text-[#0f2546] truncate">COI_TechNova_Global_2023.pdf</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">SIZE</p>
                    <p className="text-sm font-bold text-[#0f2546]">1.4 MB</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">UPLOADED</p>
                    <p className="text-sm font-bold text-[#0f2546]">Oct 25, 2023</p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-b border-slate-100 flex-1 overflow-y-auto">
                <div className="mb-8">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">DOCUMENT STATUS</p>
                  <div className="flex bg-slate-50 p-1 rounded-xl">
                    <button 
                      onClick={() => setActiveDocumentStatus('Pending')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeDocumentStatus === 'Pending' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Pending
                    </button>
                    <button 
                      onClick={() => setActiveDocumentStatus('Approved')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeDocumentStatus === 'Approved' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Approved
                    </button>
                    <button 
                      onClick={() => setActiveDocumentStatus('Rejected')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeDocumentStatus === 'Rejected' ? 'bg-white text-error shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Rejected
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">INTERNAL ADMIN NOTES</p>
                  <textarea 
                    placeholder="Add private notes for other auditors..."
                    className="w-full h-32 resize-none border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder-slate-400"
                  ></textarea>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-br-2xl shrink-0">
                <button 
                  onClick={() => { setDocumentModalOpen(false); }}
                  className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white py-3.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 mb-4"
                >
                  Submit Decision
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
                <p className="text-center text-[11px] text-slate-500 italic">Action will be logged in the Audit History</p>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
