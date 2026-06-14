import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// --- MOCK DATA ---

const liveQueries = [
  { id: 1, text: "Can you review my resume for a Senior DevOps role?", tokens: 120, status: "success", time: "Just now" },
  { id: 2, text: "What's the average salary for a Product Manager in NYC?", tokens: 85, status: "success", time: "1m ago" },
  { id: 3, text: "Who is the current President?", tokens: 45, status: "blocked", time: "3m ago" },
  { id: 4, text: "Write a cover letter for me please.", tokens: 250, status: "success", time: "5m ago" },
  { id: 5, text: "Find jobs paying over $500k in my area.", tokens: 110, status: "hallucination_flag", time: "10m ago" },
];

const suggestionChips = [
  { id: 1, label: "Review my resume", ctr: "12.5%", segment: "All Users" },
  { id: 2, label: "Find skill gaps", ctr: "8.2%", segment: "Students" },
  { id: 3, label: "Suggest connections", ctr: "15.4%", segment: "All Users" },
  { id: 4, label: "Career trajectory", ctr: "4.1%", segment: "Mid-Level" },
];

const blockedLogs = [
  { id: 1, policy: "Sensitive Data Redaction", detail: "Phone number scrubbed from prompt.", time: "12m ago" },
  { id: 2, policy: "Intent Guardrail (Political)", detail: "Refused query about recent elections.", time: "45m ago" },
  { id: 3, policy: "Profanity Blocklist", detail: "Blocked abusive query towards AI.", time: "1h ago" },
];

const latencyData = [
  { time: '10:00', ms: 420 },
  { time: '10:05', ms: 450 },
  { time: '10:10', ms: 800 }, // Spike
  { time: '10:15', ms: 410 },
  { time: '10:20', ms: 390 },
  { time: '10:25', ms: 405 },
];

const topicClusters = [
  { name: 'Job Hunting', count: 4200, color: '#3b82f6' },
  { name: 'Resume Help', count: 3150, color: '#8b5cf6' },
  { name: 'Networking', count: 1800, color: '#10b981' },
  { name: 'Salary Info', count: 950, color: '#f59e0b' },
];

export default function AIAnalyticsBreakdown() {
  const [activeModel, setActiveModel] = useState('GPT-4o');
  const [guardrails, setGuardrails] = useState({
    medical: true,
    political: true,
    financial_advice: false,
    profanity: true
  });
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const toggleGuardrail = (key) => {
    setGuardrails(prev => ({ ...prev, [key]: !prev[key] }));
    showToast(`${key} guardrail ${!guardrails[key] ? 'enabled' : 'disabled'}.`);
  };

  const handleModelSwitch = (model) => {
    setActiveModel(model);
    showToast(`Switched active LLM provider to ${model}.`);
  };

  return (
    <div className="flex flex-col gap-6 relative">
      
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-up">
          <span className="material-symbols-outlined text-green-400">check_circle</span>
          <p className="font-medium text-sm">{toastMessage}</p>
        </div>
      )}

      {/* Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Widget 1: Conversation & Query Monitoring */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Live Query Stream</h3>
              <p className="text-sm text-gray-500">Real-time anonymized user prompts</p>
            </div>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {liveQueries.map(q => (
              <div key={q.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-2">"{q.text}"</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-2">
                    {q.status === 'success' && <span className="text-[10px] uppercase font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded">Success</span>}
                    {q.status === 'blocked' && <span className="text-[10px] uppercase font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">Blocked</span>}
                    {q.status === 'hallucination_flag' && <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Flagged</span>}
                    <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded">{q.tokens} Tokens</span>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{q.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Topic Clusters / Token Usage */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm relative overflow-hidden flex flex-col h-[400px]">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full"></div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Intent Clusters</h3>
          <p className="text-gray-500 text-sm mb-6">Categorized by AI analysis</p>
          
          <div className="flex-1 w-full relative flex items-center">
            <div className="w-2/3 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topicClusters}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    stroke="none"
                  >
                    {topicClusters.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [value.toLocaleString(), 'Prompts']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="w-1/3 flex flex-col justify-center gap-4 pl-4">
              {topicClusters.map((cluster, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cluster.color }}></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-700 leading-tight">{cluster.name}</span>
                    <span className="text-xs text-gray-500 font-medium">{cluster.count.toLocaleString()} queries</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Widget 2: Quick-Action Prompt & Suggested Chip Manager */}
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><span className="material-symbols-outlined text-blue-500">smart_button</span> Suggestion Chip Manager</h3>
              <p className="text-sm text-gray-500 mt-1">Manage and A/B test dynamic prompts</p>
            </div>
            <button className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">add</span> Add New
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Chip Label</th>
                  <th className="pb-3 font-semibold">Target Segment</th>
                  <th className="pb-3 font-semibold">CTR</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {suggestionChips.map(chip => (
                  <tr key={chip.id} className="group">
                    <td className="py-3">
                      <div className="inline-flex border border-gray-200 bg-gray-50 text-gray-700 rounded-full px-3 py-1 text-sm font-medium">
                        {chip.label}
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-600 font-medium">{chip.segment}</td>
                    <td className="py-3">
                      <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{chip.ctr}</span>
                    </td>
                    <td className="py-3 text-right">
                      <button className="text-gray-400 hover:text-blue-600 transition-colors p-1" title="A/B Test settings">
                        <span className="material-symbols-outlined text-[20px]">science</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Widget 3: AI Safety, Guardrails & Policy */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><span className="material-symbols-outlined text-red-500">gavel</span> AI Safety Policies</h3>
          <p className="text-sm text-gray-500 mt-1 mb-6">Intent Guardrail Toggles</p>
          
          <div className="space-y-4 mb-6">
            {Object.keys(guardrails).map(key => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700 capitalize">{key.replace('_', ' ')} Block</span>
                <button 
                  onClick={() => toggleGuardrail(key)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${guardrails[key] ? 'bg-green-500' : 'bg-gray-200'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out ${guardrails[key] ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 flex-1">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Intercepts</h4>
            <div className="space-y-3">
              {blockedLogs.map(log => (
                <div key={log.id} className="bg-red-50/50 border border-red-100 p-2.5 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-red-800">{log.policy}</span>
                    <span className="text-[10px] text-gray-500">{log.time}</span>
                  </div>
                  <p className="text-xs text-red-600">{log.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Model Performance */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><span className="material-symbols-outlined text-indigo-500">speed</span> Performance & Cost Control</h3>
            <p className="text-sm text-gray-500 mt-1">Live routing and latency tracking</p>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {['GPT-4o', 'Claude 3.5', 'Llama 3'].map(model => (
              <button 
                key={model}
                onClick={() => handleModelSwitch(model)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeModel === model ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {model}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 flex flex-col justify-center gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Avg Latency</p>
              <p className="text-3xl font-black text-gray-900">420<span className="text-sm text-gray-500 font-medium">ms</span></p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">User Satisfaction</p>
              <p className="text-3xl font-black text-emerald-700">94<span className="text-sm text-emerald-600 font-medium">%</span></p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">Based on 1.2k ratings</p>
            </div>
          </div>

          <div className="md:col-span-3 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="ms" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLatency)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
