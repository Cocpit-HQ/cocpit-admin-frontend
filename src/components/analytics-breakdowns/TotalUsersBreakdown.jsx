import React, { useState } from 'react';
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

const mockVerifiedUsers = [
  { id: 1, name: 'Sarah Chen', email: 'sarah.c@cloudline.com', joinDate: '2026-05-10', role: 'Working Professional' },
  { id: 2, name: 'Marcus Wright', email: 'm.wright@design.io', joinDate: '2026-05-11', role: 'Student' },
  { id: 3, name: 'Jameson Kwoh', email: 'jkwoh@enterprise.net', joinDate: '2026-05-15', role: 'Freelancer' },
  { id: 4, name: 'Omar Al-Fayed', email: 'omar.f@techhub.org', joinDate: '2026-05-16', role: 'Working Professional' },
  { id: 5, name: 'Sienna Miller', email: 'smiller@studio.ca', joinDate: '2026-05-18', role: 'Student' },
  { id: 6, name: 'David Brooks', email: 'd.brooks@fintech.co', joinDate: '2026-05-20', role: 'Freelancer' },
  { id: 7, name: 'Alex Morgan', email: 'amorgan@startup.io', joinDate: '2026-05-22', role: 'Working Professional' },
  { id: 8, name: 'Rahul Jain', email: 'rjain@university.edu', joinDate: '2026-05-25', role: 'Student' }
];

export default function TotalUsersBreakdown() {
  const [showVerifiedUsers, setShowVerifiedUsers] = useState(false);
  return (
    <div className="flex flex-col gap-8">
      {/* Section 2: Account Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Verified */}
        <div 
          onClick={() => setShowVerifiedUsers(true)}
          className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex items-center gap-4 cursor-pointer hover:border-green-300 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
            <span className="material-symbols-outlined text-green-600 text-[24px]">verified_user</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Verified Users</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-bold text-gray-900">2.1M</h4>
              <span className="text-sm font-medium text-green-600">87.5%</span>
            </div>
          </div>
        </div>

        {/* Inactive */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-orange-500 text-[24px]">bedtime</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Inactive (90d+)</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-bold text-gray-900">264K</h4>
              <span className="text-sm font-medium text-orange-500">11.0%</span>
            </div>
          </div>
        </div>

        {/* Suspended */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-red-600 text-[24px]">block</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Suspended</p>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-bold text-gray-900">36K</h4>
              <span className="text-sm font-medium text-red-600">1.5%</span>
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

      {/* Verified Users Modal */}
      {showVerifiedUsers && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 w-[800px] max-w-[90vw] max-h-[85vh] rounded-xl shadow-xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600">verified_user</span>
                Verified Users List
              </h3>
              <button onClick={() => setShowVerifiedUsers(false)} className="material-symbols-outlined text-gray-500 hover:text-gray-900 transition-colors">close</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="pb-3 px-4">User</th>
                    <th className="pb-3 px-4">Role</th>
                    <th className="pb-3 px-4">Join Date</th>
                    <th className="pb-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockVerifiedUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{user.name}</span>
                          <span className="text-sm text-gray-500">{user.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{user.joinDate}</td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-sm font-medium text-blue-600 hover:text-blue-800">View Profile</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-between items-center">
              <span className="text-sm text-gray-500">Showing top 8 verified users</span>
              <button 
                onClick={() => setShowVerifiedUsers(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
