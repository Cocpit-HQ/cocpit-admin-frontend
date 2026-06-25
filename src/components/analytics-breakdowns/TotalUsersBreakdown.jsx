import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

// --- Mock Data ---

const deviceData = [
  { name: 'iOS App', value: 45, color: '#0ea5e9' }, // Sky
  { name: 'Android App', value: 35, color: '#8b5cf6' }, // Violet
  { name: 'Web Browser', value: 20, color: '#f59e0b' } // Amber
];

const acquisitionData = [
  { name: 'Organic Search', value: 40, color: '#10b981' }, // Emerald
  { name: 'App Stores', value: 30, color: '#3b82f6' }, // Blue
  { name: 'Referrals', value: 20, color: '#6366f1' }, // Indigo
  { name: 'Paid Ads', value: 10, color: '#f43f5e' } // Rose
];



export default function TotalUsersBreakdown({ metrics }) {
  const { totalUsers = 0, activeUsers = 0, suspendedUsers = 0 } = metrics || {};
  const inactiveUsers = Math.max(0, totalUsers - activeUsers);

  const activePercent = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : '0.0';
  const inactivePercent = totalUsers > 0 ? ((inactiveUsers / totalUsers) * 100).toFixed(1) : '0.0';
  const suspendedPercent = totalUsers > 0 ? ((suspendedUsers / totalUsers) * 100).toFixed(1) : '0.0';

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Section 2: Account Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Users */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-green-600 text-[24px]">person_check</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Users</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-bold text-gray-900">{formatNumber(activeUsers)}</h4>
              <span className="text-sm font-medium text-green-600">{activePercent}%</span>
            </div>
          </div>
        </div>

        {/* Inactive */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-orange-500 text-[24px]">bedtime</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Inactive Users</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-bold text-gray-900">{formatNumber(inactiveUsers)}</h4>
              <span className="text-sm font-medium text-orange-500">{inactivePercent}%</span>
            </div>
          </div>
        </div>

        {/* Suspended */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-red-600 text-[24px]">block</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Suspended Users</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-bold text-gray-900">{formatNumber(suspendedUsers)}</h4>
              <span className="text-sm font-medium text-red-600">{suspendedPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Section 1: Demographics (Device Breakdown) */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">User Demographics: Device</h3>
            <p className="text-sm text-gray-500">Platform preference across user base.</p>
          </div>
          <div className="flex-1 min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value) => [`${value}%`, 'Users']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 4: Acquisition Sources (Donut) */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Acquisition Sources</h3>
            <p className="text-sm text-gray-500">How your total users found the platform.</p>
          </div>
          <div className="flex-1 min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={acquisitionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {acquisitionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value) => [`${value}%`, 'Users']}
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
