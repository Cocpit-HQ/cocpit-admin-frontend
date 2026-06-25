import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';

const recentSignups = [
  { id: 1, name: 'Alex Johnson', role: 'Student', time: '2 mins ago', avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=e0e7ff&color=3730a3' },
  { id: 2, name: 'TechNova Solutions', role: 'Organization', time: '15 mins ago', avatar: 'https://ui-avatars.com/api/?name=TechNova&background=d1fae5&color=065f46' },
  { id: 3, name: 'Sarah Chen', role: 'Professional', time: '1 hour ago', avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=dbeafe&color=1e40af' },
  { id: 4, name: 'Marcus Wright', role: 'Freelancer', time: '3 hours ago', avatar: 'https://ui-avatars.com/api/?name=Marcus+Wright&background=ffe4e6&color=9f1239' },
  { id: 5, name: 'Elena Rodriguez', role: 'Student', time: '4 hours ago', avatar: 'https://ui-avatars.com/api/?name=Elena+Rodriguez&background=e0e7ff&color=3730a3' },
];

export default function UserGrowthBreakdown({ dateRange }) {
  const [regionalData, setRegionalData] = useState([]);
  const { accessToken } = useAuth();
  const [velocityData, setVelocityData] = useState({
    gross: { value: 0, trend: 0 },
    churn: { value: 0, trend: 0 },
    net: { value: 0, trend: 0 }
  });
  
  const [demographicMomentum, setDemographicMomentum] = useState([
    { name: 'Students', value: 0, trend: '+0%', color: 'bg-indigo-500' },
    { name: 'Professionals', value: 0, trend: '+0%', color: 'bg-blue-500' },
    { name: 'Recruiters', value: 0, trend: '+0%', color: 'bg-emerald-500' },
    { name: 'Freelancers', value: 0, trend: '+0%', color: 'bg-rose-500' }
  ]);

  const [liveSignups, setLiveSignups] = useState([]);

  useEffect(() => {
    const fetchVelocity = async () => {
      try {
        const queryParams = new URLSearchParams({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString()
        });
        const res = await fetch(`/api/admin/dashboard/user-velocity?${queryParams.toString()}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setVelocityData(data);
        }
        
        const demoRes = await fetch(`/api/admin/dashboard/demographic-momentum?${queryParams.toString()}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (demoRes.ok) {
          const demoData = await demoRes.json();
          if (demoData && demoData.length > 0) {
            setDemographicMomentum(demoData);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data', error);
      }
    };

    const fetchRegionalData = async () => {
      try {
        const queryParams = new URLSearchParams({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString()
        });
        const res = await fetch(`/api/admin/dashboard/regional-hotspots?${queryParams.toString()}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRegionalData(data);
        }
      } catch (error) {
        console.error('Failed to fetch regional data', error);
      }
    };

    const fetchLiveSignups = async () => {
      try {
        const res = await fetch('/api/admin/dashboard/live-signups', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLiveSignups(data);
        }
      } catch (error) {
        console.error('Failed to fetch live signups', error);
      }
    };

    if (accessToken && dateRange) {
      fetchVelocity();
      fetchRegionalData();
      fetchLiveSignups();

      // Poll live signups every 30 seconds
      const intervalId = setInterval(fetchLiveSignups, 30000);
      return () => clearInterval(intervalId);
    }
  }, [accessToken, dateRange]);

  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
  };

  const getTrendIcon = (trend, isChurn = false) => {
    if (trend > 0) return isChurn ? 'trending_up' : 'trending_up';
    if (trend < 0) return isChurn ? 'trending_down' : 'trending_down';
    return 'trending_flat';
  };

  const getTrendText = (trend, isChurn = false) => {
    if (trend === 0) return 'No change vs last period';
    const absTrend = Math.abs(trend);
    if (isChurn) {
      return trend < 0 ? `Improved by ${absTrend}%` : `Worsened by ${absTrend}%`;
    }
    return `${trend > 0 ? '+' : '-'}${absTrend}% vs last period`;
  };

  const getTrendColorClass = (trend, isChurn = false) => {
    if (trend === 0) return 'text-gray-700 bg-gray-50';
    if (isChurn) {
      return trend < 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50';
    }
    return trend > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50';
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Gross Acquisition</p>
              <h4 className="text-4xl font-black text-gray-900 tracking-tight">+{formatNumber(velocityData.gross.value)}</h4>
              <div className="flex items-center gap-2 mt-3">
                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${getTrendColorClass(velocityData.gross.trend)}`}>
                  <span className="material-symbols-outlined text-[14px] mr-1">{getTrendIcon(velocityData.gross.trend)}</span> 
                  {getTrendText(velocityData.gross.trend)}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-[28px]">person_add</span>
            </div>
          </div>
        </div>

        <div className="group relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Churn Velocity</p>
              <h4 className="text-4xl font-black text-gray-900 tracking-tight">-{formatNumber(velocityData.churn.value)}</h4>
              <div className="flex items-center gap-2 mt-3">
                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-md ${getTrendColorClass(velocityData.churn.trend, true)}`}>
                  <span className="material-symbols-outlined text-[14px] mr-1">{getTrendIcon(velocityData.churn.trend, true)}</span> 
                  {getTrendText(velocityData.churn.trend, true)}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <span className="material-symbols-outlined text-[28px]">person_remove</span>
            </div>
          </div>
        </div>

        <div className="group relative bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 shadow-md hover:shadow-indigo-500/30 transition-all duration-300 overflow-hidden cursor-pointer text-white">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1">Net Velocity</p>
              <h4 className="text-4xl font-black text-white tracking-tight">{velocityData.net.value > 0 ? '+' : ''}{formatNumber(velocityData.net.value)}</h4>
              <div className="flex items-center gap-2 mt-3">
                <span className="flex items-center text-xs font-bold text-white bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm border border-white/10">
                  <span className="material-symbols-outlined text-[14px] mr-1">{velocityData.net.trend > 0 ? 'rocket_launch' : 'trending_flat'}</span> 
                  {velocityData.net.trend > 0 ? 'Strong Growth' : velocityData.net.trend < 0 ? 'Declining' : 'Stable'}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/10 text-white flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
              <span className="material-symbols-outlined text-[28px]">monitoring</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Box Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Demographics Progress Bars */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Demographic Momentum</h3>
              <p className="text-sm text-gray-500 mt-1">Acquisition breakdown by core user segments.</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-6">
            {demographicMomentum.map((item, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{item.name}</span>
                  <div className="flex gap-3">
                    <span className="text-gray-500 font-medium">
                      <span className="text-gray-800 font-bold mr-1">{item.count}</span>
                      ({item.value}% of total)
                    </span>
                    <span className={`font-bold ${item.trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {item.trend}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out relative`}
                    style={{ width: `${item.value}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full h-full transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Signup Feed */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Signups
            </h3>
          </div>
          
          <div className="space-y-5">
            {liveSignups.length > 0 ? (
              liveSignups.map((user) => (
                <div key={user.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors cursor-pointer">{user.name}</h4>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-400">{user.time}</span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">person_off</span>
                <p className="text-sm font-medium text-gray-500">No recent signups</p>
                <p className="text-xs text-gray-400 mt-1">New users will appear here automatically.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Regional Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Regional Hotspots</h3>
            <p className="text-sm text-gray-500 mt-1">Geographic distribution of user growth.</p>
          </div>
          <span className="material-symbols-outlined text-gray-400">public</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                <th className="py-4 px-6">Region</th>
                <th className="py-4 px-6">Total Users</th>
                <th className="py-4 px-6">MoM Growth</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {regionalData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="py-4 px-6">
                    <span className="font-semibold text-gray-900">{row.region}</span>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600 font-medium">{row.users}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`font-bold px-2 py-1 rounded-md ${
                      row.growth.startsWith('-') ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'
                    }`}>
                      {row.growth}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      row.status === 'Hyper-growth' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      row.status === 'Accelerating' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      row.status === 'Stable' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                      row.status === 'Declining' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

