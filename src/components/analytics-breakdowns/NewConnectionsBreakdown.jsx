import React, { useState } from 'react';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// --- MOCK DATA ---
const liquidityData = [
  { time: '1', val: 0.6 }, { time: '2', val: 0.62 }, { time: '3', val: 0.61 }, 
  { time: '4', val: 0.75 }, { time: '5', val: 0.8 }, { time: '6', val: 0.72 }, 
  { time: '7', val: 0.842 }, { time: '8', val: 0.65 }, { time: '9', val: 0.7 },
  { time: '10', val: 0.85 }
];

const rejectionData = [
  { name: 'Accepted Requests', value: 46, color: '#008080' }, // Teal
  { name: 'Ignored/Ghosted', value: 39, color: '#6A0DAD' }, // Purple
  { name: 'Active Responses', value: 15, color: '#E0E0E0' } // Gray
];

const watchlist = [
  { id: '1', user: 'User 50912-', detail: '(IP: 192.168.1.1)', headline: 'URGENT - Click here for 500X profit! ICP Coin...', risk: '0.98' },
  { id: '2', user: 'User 88021-', detail: '(IP: 10.14.22.9)', headline: 'DM me for amazing crypto deals. Telegram @scam...', risk: '0.82' },
];

export default function NewConnectionsBreakdown() {
  const [vectors, setVectors] = useState({ company: 0.72, role: 0.45, geo: 0.12 });
  const [toastMessage, setToastMessage] = useState('');
  const [enforcementLevel, setEnforcementLevel] = useState('MED');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="flex flex-col gap-8 pb-12 max-w-6xl mx-auto bg-white p-6 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <span className="material-symbols-outlined text-green-400">check_circle</span>
          <p className="font-bold text-sm tracking-wide">{toastMessage}</p>
        </div>
      )}
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Networking Health</h2>
          <p className="text-xs text-gray-500 mt-1">Real-time connection liquidity and node propagation</p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 border border-purple-100 px-3 py-1 rounded">LIVE 142MS LATENCY</span>
          <span className="text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-100 px-3 py-1 rounded">99.98% UPTIME</span>
        </div>
      </div>

      {/* ROW 1: Health & Alerts */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Col: Liquidity & Latency */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          
          {/* Liquidity Chart Card */}
          <div className="border border-gray-200 rounded p-6 bg-white shadow-sm h-64 flex flex-col relative">
            <div className="flex justify-between items-start mb-2 relative z-10">
              <div>
                <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Connection Liquidity Ratio</p>
                <h3 className="text-4xl font-light text-purple-700 mt-1">0.842</h3>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-teal-600">+12.4% vs prev hour</p>
                <div className="w-8 h-1 bg-teal-500 rounded mt-1 ml-auto"></div>
                <div className="w-8 h-1 bg-purple-500 rounded mt-0.5 ml-auto"></div>
              </div>
            </div>
            <div className="absolute inset-0 pt-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={liquidityData}>
                  <defs>
                    <linearGradient id="colorLiquidity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="val" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorLiquidity)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom Split Cards */}
          <div className="grid grid-cols-2 gap-6 h-40">
            {/* Response Latency Grid */}
            <div className="border border-gray-200 rounded p-4 bg-white shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Response Latency</p>
                <span className="text-gray-400">⋮</span>
              </div>
              <div className="grid grid-cols-8 gap-1 flex-1">
                {Array.from({length: 32}).map((_, i) => (
                  <div key={i} className="bg-purple-500 rounded-sm" style={{ opacity: Math.random() * 0.8 + 0.1 }}></div>
                ))}
              </div>
              <div className="flex justify-between text-[8px] text-gray-400 mt-2 font-bold uppercase">
                <span>0ms</span>
                <span>500ms</span>
              </div>
            </div>

            {/* CTR Performance */}
            <div className="border border-gray-200 rounded p-6 bg-white shadow-sm flex flex-col justify-center">
               <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-4">CTR Performance</p>
               <div className="flex items-end gap-3 mb-2">
                 <span className="text-2xl font-bold text-gray-900">4.82%</span>
               </div>
               <div className="w-full h-2 bg-gray-100 rounded overflow-hidden">
                 <div className="h-full bg-teal-600 w-[48%] rounded"></div>
               </div>
               <p className="text-[9px] text-gray-400 mt-3 font-medium">Target Threshold: 4.5%</p>
            </div>
          </div>

        </div>

        {/* Right Col: Alerts & Nodes */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          
          {/* Integrity Alerts */}
          <div className="border border-gray-200 rounded bg-white shadow-sm flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h4 className="text-xs font-bold text-gray-900">Integrity Alerts</h4>
              <span className="text-red-500 text-xs">▲</span>
            </div>
            <div className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
              
              <div className="border-l-2 border-red-500 pl-3">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 rounded uppercase">Critical Spam Detected</span>
                  <span className="text-[8px] text-gray-400">2m ago</span>
                </div>
                <p className="text-xs text-gray-800 mt-1 font-medium leading-snug">Node ID #58492 exhibiting cyclical request patterns.</p>
                <div className="mt-2 text-[9px] font-bold text-purple-600">RESOLUTION PENDING</div>
              </div>

              <div className="border-l-2 border-orange-400 pl-3">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-gray-600 uppercase">Anomaly</span>
                  <span className="text-[8px] text-gray-400">14m ago</span>
                </div>
                <p className="text-xs text-gray-800 mt-1 font-medium leading-snug">Bulk account creation detected from Proxy IP: 102.x.x.x.</p>
              </div>

              <div className="border-l-2 border-red-500 pl-3">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1 rounded uppercase">Audit Require</span>
                  <span className="text-[8px] text-gray-400">1h ago</span>
                </div>
                <p className="text-xs text-gray-800 mt-1 font-medium leading-snug">Top 100 Employer Profile "TechCore" changed ownership.</p>
              </div>

            </div>
            <div className="border-t border-gray-100 p-3 text-center bg-gray-50 rounded-b">
              <button onClick={() => showToast('Redirecting to full security logs...')} className="text-[10px] font-bold text-gray-600 uppercase tracking-widest hover:text-purple-600 transition-colors">View All Security Logs</button>
            </div>
          </div>

        </div>

      </div>

      {/* ROW 2: Recommendation Vector */}
      <div className="border border-gray-200 rounded p-6 bg-white shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="md:w-1/3">
          <h3 className="text-lg font-bold text-gray-900">Recommendation Vector</h3>
          <p className="text-xs text-gray-500 mt-1">Adjust global weights for the discovery algorithm. Real-time updates affect node propagation across all clusters.</p>
        </div>
        <div className="md:w-2/3 flex justify-between gap-6">
          
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Company Fit</span>
              <span className="text-sm font-bold text-purple-600">0.72</span>
            </div>
            <div className="relative w-full h-1 bg-gray-200 rounded">
               <div className="absolute left-0 top-0 h-1 bg-purple-500 rounded" style={{ width: '72%' }}></div>
               <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-600 rounded-full shadow" style={{ left: '72%' }}></div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Role Align</span>
              <span className="text-sm font-bold text-purple-600">0.45</span>
            </div>
            <div className="relative w-full h-1 bg-gray-200 rounded">
               <div className="absolute left-0 top-0 h-1 bg-purple-500 rounded" style={{ width: '45%' }}></div>
               <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-600 rounded-full shadow" style={{ left: '45%' }}></div>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest">Geo Proximity</span>
              <span className="text-sm font-bold text-purple-600">0.12</span>
            </div>
            <div className="relative w-full h-1 bg-gray-200 rounded">
               <div className="absolute left-0 top-0 h-1 bg-purple-500 rounded" style={{ width: '12%' }}></div>
               <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-600 rounded-full shadow" style={{ left: '12%' }}></div>
            </div>
          </div>

        </div>
      </div>

      {/* ROW 3: Network Integrity & Spam Defense */}
      <div className="flex justify-between items-end border-b border-gray-100 pb-2 pt-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Network Integrity & Spam Defense</h2>
          <p className="text-xs text-gray-500 mt-1">Defense mechanisms for ghosting, link spam, and incomplete profiles</p>
        </div>
        <div className="bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1 rounded border border-red-100">42% REJECTION RATE</div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* Ghosting Donut */}
        <div className="col-span-12 md:col-span-4 border border-gray-200 rounded bg-white shadow-sm p-4 flex flex-col">
           <div className="flex justify-between items-center mb-4">
             <h4 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Ghosting & Rejection</h4>
             <span className="material-symbols-outlined text-gray-400 text-[16px]">refresh</span>
           </div>
           
           <div className="h-40 w-full relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={rejectionData} innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                   {rejectionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                 </Pie>
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-gray-900">25%</span>
                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">Ghosting</span>
             </div>
           </div>

           <div className="mt-4 flex flex-col gap-2">
             {rejectionData.map(item => (
               <div key={item.name} className="flex justify-between items-center text-xs">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                   <span className="text-gray-600 font-medium">{item.name}</span>
                 </div>
                 <span className="font-bold text-gray-900">{item.value}%</span>
               </div>
             ))}
           </div>
        </div>

        {/* Spam Headline Watchlist */}
        <div className="col-span-12 md:col-span-8 border border-gray-200 rounded bg-white shadow-sm flex flex-col">
           <div className="p-4 border-b border-gray-100 flex justify-between items-center">
             <h4 className="text-[12px] font-bold text-gray-900">Spam Headline Watchlist</h4>
             <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">REAL-TIME FEED</span>
           </div>
           <div className="p-0 flex-1 overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-gray-50 border-b border-gray-100 text-[9px] uppercase tracking-widest text-gray-500">
                   <th className="px-4 py-3 font-bold">Account</th>
                   <th className="px-4 py-3 font-bold">Flagged Content</th>
                   <th className="px-4 py-3 font-bold">Risk Score</th>
                   <th className="px-4 py-3 font-bold text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {watchlist.map(item => (
                   <tr key={item.id}>
                     <td className="px-4 py-3">
                       <p className="text-xs font-bold text-gray-900">{item.user}</p>
                       <p className="text-[9px] text-gray-400 mt-0.5">{item.detail}</p>
                     </td>
                     <td className="px-4 py-3">
                       <div className="bg-red-50 text-red-600 text-xs px-3 py-1.5 rounded inline-block">"{item.headline}"</div>
                     </td>
                     <td className="px-4 py-3">
                       <span className="text-sm font-bold text-red-600">{item.risk}</span>
                     </td>
                     <td className="px-4 py-3 text-right">
                       <button onClick={() => showToast(`Action triggered on ${item.user}`)} className="text-gray-400 hover:text-red-600 transition-colors">
                         <span className="material-symbols-outlined text-[18px]">gavel</span>
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>

      </div>

      {/* Placeholder Filter Banner */}
      <div className="border border-teal-200 rounded p-4 bg-teal-50/30 flex justify-between items-center">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-teal-600">account_circle</span>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Placeholder Profile Filter</h4>
            <p className="text-xs text-gray-600 mt-1">Automatically suppress or flag users with missing bios, default avatars, or generic placeholder text. Currently affecting <span className="font-bold text-teal-700">1,203 inactive nodes</span>.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
             <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Enforcement Level</span>
             <div className="flex bg-gray-100 rounded p-0.5 text-[10px] font-bold">
               <button onClick={() => setEnforcementLevel('OFF')} className={`px-3 py-1 ${enforcementLevel === 'OFF' ? 'bg-white text-teal-700 rounded shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>OFF</button>
               <button onClick={() => setEnforcementLevel('LOW')} className={`px-3 py-1 ${enforcementLevel === 'LOW' ? 'bg-white text-teal-700 rounded shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>LOW</button>
               <button onClick={() => setEnforcementLevel('MED')} className={`px-3 py-1 ${enforcementLevel === 'MED' ? 'bg-white text-teal-700 rounded shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>MED</button>
               <button onClick={() => setEnforcementLevel('MAX')} className={`px-3 py-1 ${enforcementLevel === 'MAX' ? 'bg-white text-teal-700 rounded shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>MAX</button>
             </div>
          </div>
          <button onClick={() => showToast(`Applied ${enforcementLevel} Enforcement Filter`)} className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2 rounded shadow-sm transition-colors h-fit">Apply Filter</button>
        </div>
      </div>

    </div>
  );
}
