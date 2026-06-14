import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const activityData = [
  { name: 'Sourcing Candidates / Profiles', value: 50, color: '#0ea5e9' }, // Sky
  { name: 'Posting Jobs / Projects', value: 30, color: '#8b5cf6' }, // Violet
  { name: 'Publishing Content / Ads', value: 20, color: '#10b981' } // Emerald
];

const powerOrgsData = [
  { id: 1, name: 'Cloudline Inc.', employees: 412, jobs: 45, activity: 'Posting Jobs' },
  { id: 2, name: 'Stark Industries', employees: 850, jobs: 12, activity: 'Sourcing Candidates' },
  { id: 3, name: 'Wayne Enterprises', employees: 320, jobs: 28, activity: 'Publishing Content' },
  { id: 4, name: 'Umbrella Corp', employees: 215, jobs: 54, activity: 'Posting Jobs' },
  { id: 5, name: 'Acme Corp', employees: 140, jobs: 8, activity: 'Sourcing Candidates' }
];

export default function ActiveOrganizationsBreakdown() {
  return (
    <div className="flex flex-col gap-8">
      {/* Seat Utilization Rate */}
      <div className="bg-gradient-to-r from-sky-50 to-indigo-50 border border-indigo-100 rounded-lg p-8 shadow-sm flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-6">
        <div>
          <p className="text-sm font-semibold text-indigo-800 uppercase tracking-wider mb-2">Average Seat Utilization Rate</p>
          <div className="flex items-baseline gap-3 justify-center md:justify-start">
            <h4 className="text-4xl font-bold text-indigo-700">68.4%</h4>
            <span className="flex items-center text-sm font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined text-[16px] mr-1">trending_up</span> +2.1%
            </span>
          </div>
          <p className="text-sm text-indigo-900 mt-2">Active organizations are actively utilizing ~68% of their registered employee accounts.</p>
        </div>
        
        {/* Simple Progress Circle representation */}
        <div className="relative w-32 h-32 shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-indigo-100"
              strokeWidth="4"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-indigo-600"
              strokeDasharray="68.4, 100"
              strokeLinecap="round"
              strokeWidth="4"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-indigo-600 text-[32px]">co_present</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Primary B2B Activity Breakdown (Donut) */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Primary B2B Activity</h3>
            <p className="text-sm text-gray-500">Breakdown of organization actions on the platform.</p>
          </div>
          <div className="flex-1 min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {activityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Organizations']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Hiring/Power Organizations (Data Table) */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Power Organizations Leaderboard</h3>
            <p className="text-sm text-gray-500">Most engaged B2B clients on the platform.</p>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs tracking-wider">
                <tr>
                  <th className="py-3 px-6">Organization Name</th>
                  <th className="py-3 px-6 text-right">Daily Active</th>
                  <th className="py-3 px-6 text-right">Active Jobs</th>
                  <th className="py-3 px-6">Primary Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {powerOrgsData.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6 font-medium text-gray-900">{org.name}</td>
                    <td className="py-3 px-6 text-right font-semibold text-indigo-600">{org.employees}</td>
                    <td className="py-3 px-6 text-right">{org.jobs}</td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        org.activity.includes('Jobs') ? 'bg-violet-100 text-violet-700' :
                        org.activity.includes('Sourcing') ? 'bg-sky-100 text-sky-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {org.activity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
