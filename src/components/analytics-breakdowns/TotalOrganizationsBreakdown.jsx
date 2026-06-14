import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// --- Mock Data ---
const industryData = [
  { name: 'Technology', value: 40, fill: '#4f46e5' }, // Indigo
  { name: 'Education', value: 25, fill: '#0ea5e9' }, // Sky
  { name: 'Finance', value: 20, fill: '#10b981' }, // Emerald
  { name: 'Healthcare', value: 15, fill: '#8b5cf6' } // Violet
].sort((a, b) => b.value - a.value);

const sizeData = [
  { name: '1-10 Employees', value: 35, color: '#6366f1' },
  { name: '11-50 Employees', value: 45, color: '#3b82f6' },
  { name: '50-250 Employees', value: 15, color: '#14b8a6' },
  { name: 'Enterprise', value: 5, color: '#f59e0b' }
];

export default function TotalOrganizationsBreakdown() {
  return (
    <div className="flex flex-col gap-8">
      {/* Average Users per Organization (Stat Badge) */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-8 shadow-sm flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-6">
        <div>
          <p className="text-sm font-semibold text-indigo-800 uppercase tracking-wider mb-2">Internal Spread Metric</p>
          <h4 className="text-4xl font-bold text-indigo-700">14.2 Users / Org</h4>
          <p className="text-base text-indigo-900 mt-2">Average number of registered users per verified organization.</p>
        </div>
        <div className="w-24 h-24 bg-white/60 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-indigo-50">
          <span className="material-symbols-outlined text-indigo-600 text-[48px]">diversity_3</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Industry / Sector Distribution (Horizontal Bar) */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Industry / Sector Distribution</h3>
            <p className="text-sm text-gray-500">Ranking the top sectors adopting the platform.</p>
          </div>
          <div className="flex-1 min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={industryData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" tickFormatter={(v) => `${v}%`} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 13 }} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} formatter={(value) => [`${value}%`, 'Organizations']} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {industryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Organization Size / Tier Breakdown (Donut) */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Organization Size Breakdown</h3>
            <p className="text-sm text-gray-500">Split by registered employee count brackets.</p>
          </div>
          <div className="flex-1 min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sizeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {sizeData.map((entry, index) => (
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
      </div>
    </div>
  );
}
