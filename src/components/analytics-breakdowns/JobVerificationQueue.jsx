import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import JobDetailCard from '../JobDetailCard';

export default function JobVerificationQueue() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState('UNDER_REVIEW');
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [activeTab, accessToken]);

  const fetchJobs = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs?moderation_status=${activeTab}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        if (data.jobs && data.jobs.length > 0 && !data.jobs.find(j => j.job_id === selectedJobId)) {
          setSelectedJobId(data.jobs[0].job_id);
        } else if (!data.jobs || data.jobs.length === 0) {
          setSelectedJobId(null);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (jobId, action) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/moderation`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action }) // 'approve' or 'reject'
      });

      if (res.ok) {
        setJobs(jobs.filter(j => j.job_id !== jobId));
        if (selectedJobId === jobId) {
          setSelectedJobId(null);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to moderate job');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedJob = jobs.find(j => j.job_id === selectedJobId);

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#2b07b3]">work_history</span>
          Jobs Moderation Queue
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Review, approve, or reject job postings submitted to the platform.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-xl border border-gray-200 overflow-x-auto mb-6 w-max shadow-sm">
        <button 
          onClick={() => setActiveTab('UNDER_REVIEW')}
          className={`px-5 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'UNDER_REVIEW' ? 'bg-[#2b07b3] text-white shadow-md' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
        >
          <span className="material-symbols-outlined text-[18px]">pending_actions</span>
          Under Review
          {activeTab === 'UNDER_REVIEW' && jobs.length > 0 && (
            <span className="bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full ml-1">
              {jobs.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('APPROVED')}
          className={`px-5 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'APPROVED' ? 'bg-[#2b07b3] text-white shadow-md' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
        >
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Approved
        </button>
        <button 
          onClick={() => setActiveTab('REJECTED')}
          className={`px-5 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'REJECTED' ? 'bg-[#2b07b3] text-white shadow-md' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
        >
          <span className="material-symbols-outlined text-[18px]">cancel</span>
          Rejected
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px]">
        {/* Left column: List of Jobs */}
        <div className="w-full lg:w-1/3 flex flex-col bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">
              Postings ({jobs.length})
            </h3>
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-2">
            {loading ? (
              <div className="flex justify-center p-8">
                <span className="material-symbols-outlined animate-spin text-3xl text-gray-400">progress_activity</span>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center p-8 text-gray-400">
                <p className="font-medium">No jobs found</p>
                <p className="text-sm">Queue is empty for this status</p>
              </div>
            ) : (
              jobs.map(job => (
                <div 
                  key={job.job_id} 
                  onClick={() => setSelectedJobId(job.job_id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedJobId === job.job_id ? 'border-[#2b07b3] bg-blue-50/50 shadow-sm' : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-bold truncate pr-2 ${selectedJobId === job.job_id ? 'text-[#2b07b3]' : 'text-gray-800'}`}>
                      {job.title}
                    </h4>
                    <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">
                      {new Date(job.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">corporate_fare</span>
                    {job.company_name}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-white border border-gray-200 px-2 py-1 rounded-md">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {job.location || 'Remote'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-white border border-gray-200 px-2 py-1 rounded-md">
                      <span className="material-symbols-outlined text-[14px]">badge</span>
                      {job.job_type || 'Full time'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Detail view */}
        <div className="w-full lg:w-2/3 flex flex-col">
          <JobDetailCard 
            job={selectedJob} 
            isProcessing={isProcessing}
            onApprove={(id) => handleModerate(id, 'approve')}
            onReject={(id) => handleModerate(id, 'reject')}
          />
        </div>
      </div>
    </div>
  );
}
