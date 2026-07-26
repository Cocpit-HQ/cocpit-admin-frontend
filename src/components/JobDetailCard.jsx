import React from 'react';

export default function JobDetailCard({ job, onApprove, onReject, isProcessing, hideActions }) {
  if (!job) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full min-h-[400px]">
        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">work_outline</span>
        <p className="text-lg font-medium text-gray-500">Select a job from the queue to view details</p>
        <p className="text-sm text-gray-400 mt-1">Review the job title, requirements, description, and salary details before approving or rejecting.</p>
      </div>
    );
  }

  // Format salary
  const formatSalary = () => {
    if (job.salary_visibility === 'PRIVATE' || job.salary_visibility === 'HIDDEN') {
      return 'Confidential / Competitive';
    }
    if (job.salary_min !== null && job.salary_min !== undefined) {
      const min = job.salary_min.toLocaleString();
      const max = job.salary_max ? job.salary_max.toLocaleString() : null;
      const currency = job.salary_currency || 'USD';
      const period = job.salary_period ? job.salary_period.toLowerCase() : 'yearly';
      return `${currency} ${min}${max ? ` - ${max}` : ''} / ${period}`;
    }
    return 'Not Specified';
  };

  // Format experience
  const formatExperience = () => {
    if (job.experience_label) return job.experience_label;
    if (job.experience_min !== null && job.experience_min !== undefined) {
      const min = job.experience_min;
      const max = job.experience_max;
      return `${min}${max ? ` - ${max}` : '+'} years`;
    }
    return 'No experience requirements';
  };

  // Skills
  const skills = job.ai_extracted_requirements?.skills || [];

  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-lg overflow-hidden flex flex-col h-full">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-[#2b07b3] to-[#4c24d9] p-6 text-white shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
              {job.moderation_status || 'UNDER_REVIEW'}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{job.title}</h2>
            <p className="text-white/80 font-medium mt-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">corporate_fare</span>
              {job.company_name}
            </p>
          </div>
          <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
            <span className="material-symbols-outlined text-3xl">work</span>
          </div>
        </div>
      </div>

      {/* Card Scrollable Body */}
      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        {/* Basic Meta Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#f8f9fc] p-3.5 rounded-xl border border-gray-100 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#2b07b3] bg-blue-50 p-2 rounded-lg">location_on</span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Location</p>
              <p className="text-sm font-bold text-gray-700 truncate">{job.location || 'Remote'}</p>
            </div>
          </div>

          <div className="bg-[#f8f9fc] p-3.5 rounded-xl border border-gray-100 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#2b07b3] bg-blue-50 p-2 rounded-lg">payments</span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Salary</p>
              <p className="text-sm font-bold text-gray-700 truncate">{formatSalary()}</p>
            </div>
          </div>

          <div className="bg-[#f8f9fc] p-3.5 rounded-xl border border-gray-100 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#2b07b3] bg-blue-50 p-2 rounded-lg">history_edu</span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Experience</p>
              <p className="text-sm font-bold text-gray-700 truncate">{formatExperience()}</p>
            </div>
          </div>

          <div className="bg-[#f8f9fc] p-3.5 rounded-xl border border-gray-100 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#2b07b3] bg-blue-50 p-2 rounded-lg">badge</span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Job Type & Mode</p>
              <p className="text-sm font-bold text-gray-700 truncate">
                {job.job_type || 'Full time'} {job.work_mode ? `• ${job.work_mode}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* AI Extracted Skills */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
            AI Extracted Requirements & Skills
          </h3>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="bg-blue-50 hover:bg-blue-100 text-[#2b07b3] text-xs font-bold px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No skills extracted</p>
          )}
        </div>

        {/* Job Description */}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">description</span>
            Job Description
          </h3>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-800 whitespace-pre-line leading-relaxed max-h-[300px] overflow-y-auto font-sans">
            {job.description || 'No description provided'}
          </div>
        </div>

        {/* Rejection Reason */}
        {job.moderation_status === 'REJECTED' && (
          <div className="border-t border-red-100 pt-4">
            <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">error</span>
              Rejection Reason
            </h3>
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-4 whitespace-pre-line font-medium">
              {job.rejection_reason || 'No specific reason provided for this rejection.'}
            </p>
          </div>
        )}

        {/* About Company */}
        {job.about_company && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">info</span>
              About {job.company_name}
            </h3>
            <p className="text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-4 whitespace-pre-line">
              {job.about_company}
            </p>
          </div>
        )}

        {/* Additional details */}
        <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 flex flex-col gap-1">
          <p>Job ID: <span className="font-mono text-gray-600">{job.job_id}</span></p>
          <p>Posted On: <span className="text-gray-600">{new Date(job.created_at).toLocaleString()}</span></p>
          {job.expires_at && <p>Expires On: <span className="text-gray-600">{new Date(job.expires_at).toLocaleString()}</span></p>}
        </div>
      </div>

      {/* Card Footer Actions */}
      {!hideActions && (
        <div className="p-4 border-t border-gray-100 bg-[#fbfbfe] shrink-0 flex items-center gap-3">
          <button
            onClick={() => onReject(job.job_id)}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3 rounded-xl transition-all shadow-sm active:scale-98"
          >
            <span className="material-symbols-outlined">block</span>
            Reject Posting
          </button>
          <button
            onClick={() => onApprove(job.job_id)}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3 rounded-xl transition-all shadow-md active:scale-98"
          >
            <span className="material-symbols-outlined">check_circle</span>
            Approve Posting
          </button>
        </div>
      )}
    </div>
  );
}
