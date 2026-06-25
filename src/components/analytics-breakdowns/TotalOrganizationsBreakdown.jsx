import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

// Dynamic data fetched from backend

export default function TotalOrganizationsBreakdown({ dateRange }) {
  const { accessToken } = useAuth();
  const [spreadMetric, setSpreadMetric] = useState(0);
  const [industryData, setIndustryData] = useState([]);
  const [sizeData, setSizeData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken || !dateRange) return;
      
      try {
        const queryParams = new URLSearchParams({
          endDate: dateRange.endDate.toISOString()
        });
        
        // Fetch Spread Metric
        const spreadRes = await fetch(`/api/admin/dashboard/internal-spread-metric?${queryParams.toString()}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (spreadRes.ok) {
          const spreadData = await spreadRes.json();
          setSpreadMetric(spreadData.value);
        }

        // Fetch Demographics
        const demoRes = await fetch(`/api/admin/dashboard/organization-demographics?${queryParams.toString()}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (demoRes.ok) {
          const demoData = await demoRes.json();
          setIndustryData(demoData.industryData);
          setSizeData(demoData.sizeData);
        }

      } catch (error) {
        console.error('Failed to fetch organization data:', error);
      }
    };

    fetchData();
  }, [accessToken, dateRange]);

  return (
    <div className="flex flex-col gap-8">
      {/* Average Users per Organization (Stat Badge) */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-8 shadow-sm flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-6">
        <div>
          <p className="text-sm font-semibold text-indigo-800 uppercase tracking-wider mb-2">Internal Spread Metric</p>
          <h4 className="text-4xl font-bold text-indigo-700">{spreadMetric.toFixed(1)} Users / Org</h4>
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
