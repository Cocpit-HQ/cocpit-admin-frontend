import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- Mock Data for Widgets ---
const activeJobs = [
  { id: 'JB-104', title: 'Senior React Engineer', company: 'TechNova', salary: '$120k-$150k', mode: 'Remote', type: 'Full-time', status: 'Actively Hiring', easyApply: true },
  { id: 'JB-105', title: 'Product Manager', company: 'Global Solutions', salary: 'Private', mode: 'Hybrid', type: 'Full-time', status: 'Active', easyApply: false },
  { id: 'JB-106', title: 'DevOps Intern', company: 'CloudScale', salary: '$30/hr', mode: 'Onsite', type: 'Internship', status: 'Active', easyApply: true },
  { id: 'JB-107', title: 'UX/UI Designer', company: 'Creative Labs', salary: '$90k-$110k', mode: 'Remote', type: 'Contract', status: 'Under Review', easyApply: false },
];

const atsPipelineData = [
  { stage: 'Applied', count: 12450, icon: 'how_to_reg', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
  { stage: 'Under Review', count: 4200, icon: 'troubleshoot', color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
  { stage: 'Interviewing', count: 850, icon: 'forum', color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
  { stage: 'Offers Extended', count: 120, icon: 'workspace_premium', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
];

const versionControlLog = [
  { id: 1, action: 'Salary Updated', detail: 'Changed from $100k to $120k', user: 'Admin Sarah', time: '10m ago', type: 'edit' },
  { id: 2, action: 'Job Flagged', detail: 'Reported for unrealistic compensation', user: 'System AI', time: '1h ago', type: 'flag' },
  { id: 3, action: 'Description Edited', detail: 'Added "Remote Work" to keywords', user: 'Recruiter John', time: '2h ago', type: 'edit' },
];

const topSkills = [
  { name: 'React.js', demand: 85, supply: 60 },
  { name: 'Python', demand: 70, supply: 80 },
  { name: 'Node.js', demand: 90, supply: 50 },
  { name: 'Figma', demand: 60, supply: 75 },
];

const trendingJobs = [
  { title: 'Frontend Lead', saves: 342, trend: '+12%' },
  { title: 'Data Scientist', saves: 289, trend: '+5%' },
  { title: 'Cloud Architect', saves: 210, trend: '+22%' },
];

export default function ActiveJobsBreakdown() {
  const [activeTab, setActiveTab] = useState('audit');

  return (
    <div className="flex flex-col gap-6">
      {/* Top Row: Listings & ATS Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Widget 1: Advanced Job Listings */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Live Job Feed</h3>
              <p className="text-sm text-gray-500">Real-time listing metadata</p>
            </div>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1">
              View All <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
          
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {activeJobs.map((job) => (
              <div key={job.id} className="p-4 border border-gray-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900">{job.title}</h4>
                  {job.status === 'Actively Hiring' && (
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap mb-3">
                  <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{job.company}</span>
                  <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md">{job.salary}</span>
                  <span className="text-xs font-semibold bg-purple-50 text-purple-700 px-2 py-1 rounded-md">{job.mode}</span>
                  {job.easyApply && <span className="text-xs font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-md border border-amber-200">Easy Apply</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 2: ATS Pipeline */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full"></div>
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-900">ATS Pipeline Flow</h3>
            <p className="text-gray-500 text-sm">System-wide applicant progression</p>
          </div>
          
          <div className="space-y-4 relative z-10 pl-2">
            {/* Connecting Vertical Line */}
            <div className="absolute left-[33px] top-6 bottom-6 w-0.5 bg-gray-100 z-0"></div>
            
            {atsPipelineData.map((stage, idx) => (
              <div key={idx} className="flex items-center gap-4 relative z-10 group cursor-pointer">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 bg-white shadow-sm transition-transform group-hover:scale-110 ${stage.border} ${stage.color}`}>
                  <span className="material-symbols-outlined text-[28px]">{stage.icon}</span>
                </div>
                <div className="flex-1 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex justify-between items-center transition-all group-hover:border-indigo-200 group-hover:shadow-md">
                  <div>
                    <h4 className="font-bold text-gray-900">{stage.stage}</h4>
                    <p className="text-xs text-gray-400 font-medium">Candidates</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-black ${stage.color}`}>{stage.count.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Row: Anti-Fraud & Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Widget 3: Anti-Fraud & Version Control */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">System Integrity Log</h3>
              <p className="text-sm text-gray-500">Immutable audit trails & moderation</p>
            </div>
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('audit')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${activeTab === 'audit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Audit Trail</button>
              <button onClick={() => setActiveTab('flags')} className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${activeTab === 'flags' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-500'}`}>Flags</button>
            </div>
          </div>
          
          <div className="space-y-4">
            {versionControlLog.filter(log => activeTab === 'audit' || log.type === 'flag').map((log) => (
              <div key={log.id} className="flex gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-gray-200 transition-colors group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${log.type === 'flag' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  <span className="material-symbols-outlined">{log.type === 'flag' ? 'flag' : 'history'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <h4 className="font-bold text-gray-900">{log.action}</h4>
                    <span className="text-xs font-semibold text-gray-400">{log.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{log.detail}</p>
                  <p className="text-xs text-gray-400 mt-2 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">person</span> {log.user}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Widget 4: Semantic Skill Matrix */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-gray-900">Skill Matrix</h3>
          <p className="text-sm text-gray-500 mb-6">Market demand vs candidate supply</p>
          
          <div className="flex-1 flex flex-col justify-center items-center relative min-h-[250px]">
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={topSkills}>
                <PolarGrid stroke="#f3f4f6" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#374151', fontSize: 13, fontWeight: 700 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Radar name="Job Demand" dataKey="demand" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <Radar name="Candidate Supply" dataKey="supply" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
            
            <div className="flex justify-center gap-6 mt-2 text-sm font-bold text-gray-600">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-md bg-blue-500"></span> Job Demand</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-md bg-emerald-400"></span> Candidate Supply</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Engagement & Curation */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Candidate Engagement</h3>
            <p className="text-sm text-gray-500">Most bookmarked roles (passive interest)</p>
          </div>
          <span className="material-symbols-outlined text-amber-500 text-3xl">bookmark_star</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trendingJobs.map((job, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-100 hover:shadow-md transition-shadow">
              <h4 className="font-bold text-gray-900 text-lg mb-4">{job.title}</h4>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-black text-amber-600">{job.saves}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Saves</p>
                </div>
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{job.trend}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
