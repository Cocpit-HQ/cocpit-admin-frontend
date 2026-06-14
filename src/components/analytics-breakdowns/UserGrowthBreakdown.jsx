import React from 'react';

const demographicData = [
  { name: 'Students', value: 45, trend: '+12%', color: 'bg-indigo-500' },
  { name: 'Professionals', value: 35, trend: '+8%', color: 'bg-blue-500' },
  { name: 'Organizations', value: 15, trend: '+5%', color: 'bg-emerald-500' },
  { name: 'Freelancers', value: 5, trend: '-2%', color: 'bg-rose-500' }
];

const recentSignups = [
  { id: 1, name: 'Alex Johnson', role: 'Student', time: '2 mins ago', avatar: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=e0e7ff&color=3730a3' },
  { id: 2, name: 'TechNova Solutions', role: 'Organization', time: '15 mins ago', avatar: 'https://ui-avatars.com/api/?name=TechNova&background=d1fae5&color=065f46' },
  { id: 3, name: 'Sarah Chen', role: 'Professional', time: '1 hour ago', avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=dbeafe&color=1e40af' },
  { id: 4, name: 'Marcus Wright', role: 'Freelancer', time: '3 hours ago', avatar: 'https://ui-avatars.com/api/?name=Marcus+Wright&background=ffe4e6&color=9f1239' },
  { id: 5, name: 'Elena Rodriguez', role: 'Student', time: '4 hours ago', avatar: 'https://ui-avatars.com/api/?name=Elena+Rodriguez&background=e0e7ff&color=3730a3' },
];

const regionalData = [
  { region: 'North America', users: '1.2M', growth: '+14.5%', status: 'Accelerating' },
  { region: 'Europe', users: '850K', growth: '+8.2%', status: 'Stable' },
  { region: 'Asia Pacific', users: '620K', growth: '+22.4%', status: 'Hyper-growth' },
  { region: 'Latin America', users: '150K', growth: '+4.1%', status: 'Emerging' },
];

export default function UserGrowthBreakdown() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Gross Acquisition</p>
              <h4 className="text-4xl font-black text-gray-900 tracking-tight">+14,500</h4>
              <div className="flex items-center gap-2 mt-3">
                <span className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                  <span className="material-symbols-outlined text-[14px] mr-1">trending_up</span> 12% vs last mo
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
              <h4 className="text-4xl font-black text-gray-900 tracking-tight">-3,200</h4>
              <div className="flex items-center gap-2 mt-3">
                <span className="flex items-center text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-md">
                  <span className="material-symbols-outlined text-[14px] mr-1">trending_down</span> Improved by 4%
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
              <h4 className="text-4xl font-black text-white tracking-tight">+11,300</h4>
              <div className="flex items-center gap-2 mt-3">
                <span className="flex items-center text-xs font-bold text-white bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm border border-white/10">
                  <span className="material-symbols-outlined text-[14px] mr-1">rocket_launch</span> Strong Growth
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
            <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
              View Detail Report
            </button>
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-6">
            {demographicData.map((item, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{item.name}</span>
                  <div className="flex gap-3">
                    <span className="text-gray-500 font-medium">{item.value}% of total</span>
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
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Signups
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {recentSignups.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-gray-200 group-hover:border-indigo-300 transition-colors" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap">{user.time}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg transition-colors border border-gray-200">
            View All Activity
          </button>
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
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md">{row.growth}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                      row.status === 'Hyper-growth' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                      row.status === 'Accelerating' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      row.status === 'Stable' ? 'bg-gray-100 text-gray-600 border-gray-200' :
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

