import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../../AuthContext';

export default function OrganizationGrowthBreakdown({ dateRange }) {
  const { accessToken } = useAuth();
  const [funnelData, setFunnelData] = useState([]);
  const [industryGrowthData, setIndustryGrowthData] = useState([]);
  const [ttv, setTtv] = useState('3.2 Days'); // Kept static per user request

  useEffect(() => {
    const fetchData = async () => {
      if (!accessToken || !dateRange) return;
      try {
        const isCustom = dateRange.rangeLabel === 'Custom';
        let end = dateRange.endDate;
        let start = dateRange.startDate;
        
        if (!isCustom) {
           end = new Date();
           const durationMs = dateRange.endDate.getTime() - dateRange.startDate.getTime();
           start = new Date(end.getTime() - durationMs);
        }

        const queryParams = new URLSearchParams({
          startDate: start.toISOString(),
          endDate: end.toISOString()
        });
        
        const res = await fetch(`/api/admin/dashboard/organization-growth?${queryParams.toString()}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFunnelData(data.funnelData || []);
          setIndustryGrowthData(data.industryGrowthData || []);
          setTtv(data.ttv || '0 Days');
        }
      } catch (error) {
        console.error('Failed to fetch organization growth data', error);
      }
    };

    fetchData(); // Initial fetch
    
    // Set up real-time polling
    const intervalId = setInterval(fetchData, 5000); // 5 seconds
    
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [accessToken, dateRange]);

  return (
    <div className="flex flex-col gap-8">
      {/* Time to Value / Onboarding Velocity (Stat Badge) */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-lg p-8 shadow-sm flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-6">
        <div>
          <p className="text-sm font-semibold text-emerald-800 uppercase tracking-wider mb-2">Time to Value (TTV)</p>
          <div className="flex items-baseline gap-3 justify-center md:justify-start">
            <h4 className="text-4xl font-bold text-emerald-700">{ttv}</h4>
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
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 13 }} width={110} />
                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32} minPointSize={5}>
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
                margin={{ top: 5, right: 10, left: -20, bottom: 45 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4B5563', fontSize: 12 }} 
                  dy={15}
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
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40} minPointSize={5}>
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
