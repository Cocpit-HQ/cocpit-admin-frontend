import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// --- Mock Data ---
const featureData = [
  { name: 'Feed', value: 50000, fill: '#3b82f6' }, // Blue
  { name: 'Messaging', value: 20000, fill: '#8b5cf6' }, // Violet
  { name: 'Job Board', value: 5000, fill: '#10b981' }, // Emerald
  { name: 'Events', value: 3000, fill: '#f59e0b' }, // Amber
  { name: 'AI Features', value: 1500, fill: '#f43f5e' } // Rose
].sort((a, b) => b.value - a.value);

const demographicData = [
  { name: 'Student', value: 65, color: '#0ea5e9' }, // Sky
  { name: 'Professional', value: 25, color: '#6366f1' }, // Indigo
  { name: 'Recruiter', value: 10, color: '#14b8a6' } // Teal
];

const cohortData = [
  { cohort: 'Jan (Week 1)', users: 1200, retention: [100, 45, 30, 25, 20] },
  { cohort: 'Jan (Week 2)', users: 1450, retention: [100, 48, 35, 28, 22] },
  { cohort: 'Jan (Week 3)', users: 1100, retention: [100, 40, 25, 20, 0] },
  { cohort: 'Jan (Week 4)', users: 1800, retention: [100, 50, 40, 0, 0] },
  { cohort: 'Feb (Week 1)', users: 2100, retention: [100, 55, 0, 0, 0] }
];

export default function ActiveUsersBreakdown({ dateRange }) {
  const { accessToken } = useAuth();
  const [actualCohortData, setActualCohortData] = useState(cohortData);
  const [actualFeatureData, setActualFeatureData] = useState(featureData);
  const [actualDemographicData, setActualDemographicData] = useState(demographicData);

  useEffect(() => {
    const loadCohortData = async () => {
      try {
        const res = await fetch('/api/admin/cohort-retention', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.cohortData && data.cohortData.length > 0) {
            setActualCohortData(data.cohortData);
            return;
          }
        }
      } catch (error) {
        console.error('Failed to fetch cohort data', error);
      }
    };
    if (accessToken) {
      loadCohortData();
    }
  }, [accessToken]);

  useEffect(() => {
    const loadFeatureAndDemographicData = async () => {
      try {
        let dateRangeCode = '30d';
        if (dateRange?.rangeLabel === 'Today') dateRangeCode = '24h';
        else if (dateRange?.rangeLabel === 'Last 7 Days') dateRangeCode = '7d';
        else if (dateRange?.rangeLabel === 'Last 90 Days') dateRangeCode = '90d';

        const queryParams = new URLSearchParams({ dateRange: dateRangeCode });
        
        const featRes = await fetch(`/api/admin/feature-adoption?${queryParams.toString()}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (featRes.ok) {
          const data = await featRes.json();
          if (data && data.length > 0) setActualFeatureData(data);
        }

        const demoRes = await fetch(`/api/admin/user-demographics?${queryParams.toString()}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (demoRes.ok) {
          const data = await demoRes.json();
          const formattedDemo = data.map(d => ({ ...d, color: d.fill }));
          if (formattedDemo && formattedDemo.length > 0) setActualDemographicData(formattedDemo);
        }
      } catch (error) {
        console.error('Failed to fetch breakdown data', error);
      }
    };
    if (accessToken) {
      loadFeatureAndDemographicData();
    }
  }, [accessToken, dateRange]);

  const getHeatmapColor = (percentage) => {
    if (percentage === 0) return 'bg-gray-50 text-transparent'; // No data yet
    if (percentage === 100) return 'bg-blue-900 text-white';
    if (percentage >= 50) return 'bg-blue-600 text-white';
    if (percentage >= 35) return 'bg-blue-400 text-white';
    if (percentage >= 20) return 'bg-blue-300 text-blue-900';
    return 'bg-blue-100 text-blue-900';
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Cohort Analysis Table */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900">Retention Cohort Table</h3>
          <p className="text-sm text-gray-500">Percentage of users who remain active weeks after sign-up.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 font-medium">
                <th className="pb-3 pr-4 whitespace-nowrap w-32">Sign-up Cohort</th>
                <th className="pb-3 px-2 text-center">Users</th>
                <th className="pb-3 px-2 text-center w-20">Week 1</th>
                <th className="pb-3 px-2 text-center w-20">Week 2</th>
                <th className="pb-3 px-2 text-center w-20">Week 3</th>
                <th className="pb-3 px-2 text-center w-20">Week 4</th>
                <th className="pb-3 px-2 text-center w-20">Week 5</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {actualCohortData.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4 font-medium text-gray-900">{row.cohort}</td>
                  <td className="py-3 px-2 text-center font-semibold">{row.users.toLocaleString()}</td>
                  {row.retention.map((pct, j) => (
                    <td key={j} className="py-2 px-1">
                      <div className={`h-8 w-full rounded flex items-center justify-center font-medium ${getHeatmapColor(pct)} transition-colors`}>
                        {pct > 0 ? `${pct}%` : ''}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feature Adoption (Horizontal Bar) */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Feature Adoption Breakdown</h3>
            <p className="text-sm text-gray-500">Ranking app sections by usage volume.</p>
          </div>
          <div className="flex-1 min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={actualFeatureData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 13 }} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {actualFeatureData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active User Demographics (Donut) */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Active User Demographics</h3>
            <p className="text-sm text-gray-500">Breakdown of active users by Role.</p>
          </div>
          <div className="flex-1 min-h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={actualDemographicData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {actualDemographicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
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
