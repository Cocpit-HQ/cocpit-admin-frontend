import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const METRICS = [
  { id: 'users', label: 'Total Users', icon: 'group' },
  { id: 'active_users', label: 'Active Users', icon: 'bolt' },
  { id: 'user_growth', label: 'User Growth %', icon: 'show_chart' },
  { id: 'organizations', label: 'Total Organisations', icon: 'domain' },
  { id: 'active_organizations', label: 'Active Organisations', icon: 'domain_verification' },
  { id: 'organization_growth', label: 'Organisation Growth %', icon: 'trending_up' }
];

const TIME_INTERVALS = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

// Mock data generator based on interval
const generateMockData = (metricId, interval) => {
  let labels = [];
  if (interval === 'Daily') {
    labels = ['12 AM', '2 AM', '4 AM', '6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'];
  } else if (interval === 'Weekly') {
    labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  } else if (interval === 'Monthly') {
    labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  } else {
    labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  }
  
  const points = labels.length;
  const data = [];
  const baseValue = metricId === 'users' ? 2400000 
                  : metricId === 'active_users' ? 850000 
                  : metricId === 'user_growth' ? 4.2 
                  : metricId === 'organizations' ? 1200 
                  : metricId === 'active_organizations' ? 950 
                  : metricId === 'organization_growth' ? 2.8 : 100;
  const variance = (metricId === 'user_growth' || metricId === 'organization_growth') ? 0.5 : baseValue * 0.05;

  let currentVal = baseValue - (points * variance);

  for (let i = 0; i < points; i++) {
    currentVal += (Math.random() * variance * 2) - (variance * 0.5);
    data.push({
      date: labels[i],
      value: Math.max(0, Math.round(currentVal * 100) / 100) // Keep it positive, round to 2 decimals
    });
  }
  return data;
};

export default function DetailedAnalytics() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialMetric = searchParams.get('metric') || 'users';

  const [activeMetric, setActiveMetric] = useState(initialMetric);
  const [interval, setInterval] = useState('Monthly');
  const [chartData, setChartData] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // Whenever metric or interval changes, regenerate mock data
    setChartData(generateMockData(activeMetric, interval));
  }, [activeMetric, interval]);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setToastMessage('Report downloaded successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    }, 800);
  };

  const currentMetricObj = METRICS.find(m => m.id === activeMetric) || METRICS[0];

  return (
    <div className="flex h-[calc(100vh-100px)] overflow-hidden bg-background">
      {/* Sidebar Switcher */}
      <div className="w-64 bg-surface border-r border-outline-variant p-4 flex flex-col gap-2 overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-body-md font-bold text-on-surface uppercase tracking-wider">Switcher</h3>
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">expand_more</span>
        </div>
        
        {METRICS.map(metric => (
          <button
            key={metric.id}
            onClick={() => setActiveMetric(metric.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
              activeMetric === metric.id 
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm' 
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{metric.icon}</span>
            <span className="text-body-md flex-1">{metric.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Top Header */}
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface">
          <div>
            <h1 className="text-display-sm font-bold text-on-surface flex items-center gap-2">
              {currentMetricObj.label}
              <span className="text-xs font-medium px-2 py-1 bg-tertiary-container text-on-tertiary-container rounded-full uppercase tracking-widest ml-2">
                Medium
              </span>
            </h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              Detailed breakdown of {currentMetricObj.label.toLowerCase()} over time.
            </p>
          </div>
          
          <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-xl border border-outline-variant">
            {TIME_INTERVALS.map(t => (
              <button
                key={t}
                onClick={() => setInterval(t)}
                className={`px-4 py-1.5 rounded-lg text-label-md transition-all ${
                  interval === t 
                    ? 'bg-surface text-primary font-bold shadow-sm ring-1 ring-outline-variant/50' 
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-surface border border-outline-variant rounded-2xl p-6 h-full min-h-[400px] flex flex-col shadow-sm">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-headline-sm font-bold text-on-surface">Trend Analysis</h2>
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="relative overflow-hidden bg-primary text-on-primary px-lg py-2.5 rounded-xl flex items-center gap-sm font-label-md text-label-md shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70"
              >
                {isExporting ? <span className="material-symbols-outlined text-[16px] animate-spin">sync</span> : <span className="material-symbols-outlined text-[18px]">download</span>}
                {isExporting ? 'Downloading...' : 'Export CSV'}
              </button>
            </div>
            
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3A22D4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3A22D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#3A22D4', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3A22D4" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#3A22D4' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-surface-container-highest text-on-surface px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 z-50 border border-outline-variant">
          <span className="material-symbols-outlined text-primary">check_circle</span>
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
