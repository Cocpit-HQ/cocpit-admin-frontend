import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const funnelData = [
  { name: 'Signups', value: 500, fill: '#6366f1' }, // Indigo
  { name: 'Verified', value: 300, fill: '#3b82f6' }, // Blue
  { name: 'Profile Complete', value: 210, fill: '#0ea5e9' }, // Sky
  { name: 'First Action', value: 150, fill: '#10b981' } // Emerald
];

const industryGrowthData = [
  { name: 'Education', value: 12, fill: '#10b981' }, // Green
  { name: 'Technology', value: 4, fill: '#10b981' },
  { name: 'Finance', value: 2, fill: '#10b981' },
  { name: 'Retail', value: -0.5, fill: '#ef4444' }, // Red
  { name: 'Healthcare', value: -1, fill: '#ef4444' }
].sort((a, b) => b.value - a.value);

export default function OrganizationGrowthBreakdown() {
  return (
    <div className="flex flex-col gap-8">
      {/* Time to Value / Onboarding Velocity (Stat Badge) */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-lg p-8 shadow-sm flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-6">
        <div>
          <p className="text-sm font-semibold text-emerald-800 uppercase tracking-wider mb-2">Time to Value (TTV)</p>
          <div className="flex items-baseline gap-3 justify-center md:justify-start">
            <h4 className="text-4xl font-bold text-emerald-700">3.2 Days</h4>
            <span className="flex items-center text-sm font-semibold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-full">
              Average Onboarding Velocity
            </span>
          </div>
          <p className="text-base text-emerald-900 mt-2">Time elapsed from registration to first significant action (e.g., job post).</p>
        </div>
        <div className="w-24 h-24 bg-white/60 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-emerald-50">
          <span className="material-symbols-outlined text-emerald-600 text-[48px]">timer</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* B2B Acquisition Funnel */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">B2B Acquisition Funnel</h3>
            <p className="text-sm text-gray-500">Conversion drop-offs from signup to active usage.</p>
          </div>
          <div className="flex-1 min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 13 }} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth by Industry / Sector (Vertical Bar) */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Growth by Industry</h3>
            <p className="text-sm text-gray-500">Growth velocity separated by sector.</p>
          </div>
          <div className="flex-1 min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={industryGrowthData}
                margin={{ top: 5, right: 10, left: -20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4B5563', fontSize: 12 }} 
                  dy={10}
                  angle={-35}
                  textAnchor="end"
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4B5563', fontSize: 12 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip cursor={{ fill: '#F3F4F6' }} formatter={(value) => [`${value}%`, 'Growth']} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {industryGrowthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
