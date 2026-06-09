import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

export default function SystemHealth() {
  const [cpuUsage, setCpuUsage] = useState(65);
  const [selectedQuery, setSelectedQuery] = useState(null);

  const slowQueries = [
    {
      id: 1,
      preview: "SELECT * FROM app_logs WHERE...",
      fullQuery: `SELECT l.*, u.email \nFROM app_logs l \nLEFT JOIN users u ON l.user_id = u.id \nWHERE l.created_at >= NOW() - INTERVAL '24 HOURS' \n  AND l.level IN ('ERROR', 'FATAL') \nORDER BY l.created_at DESC;`,
      duration: "1,420 ms",
      count: "12,402",
      status: "Optimizing",
      statusColor: "bg-amber-100 text-amber-800"
    },
    {
      id: 2,
      preview: "UPDATE user_profiles SET last_seen...",
      fullQuery: `UPDATE user_profiles \nSET last_seen_at = NOW(), \n    session_count = session_count + 1 \nWHERE user_id IN (\n  SELECT id FROM users WHERE status = 'active'\n);`,
      duration: "840 ms",
      count: "45,102",
      status: "Stable",
      statusColor: "bg-emerald-100 text-emerald-800"
    },
    {
      id: 3,
      preview: "JOIN organizations ON users.org_id...",
      fullQuery: `SELECT o.name, COUNT(u.id) as user_count \nFROM organizations o \nJOIN users u ON o.id = u.org_id \nWHERE o.subscription_status = 'active' \nGROUP BY o.name \nHAVING COUNT(u.id) > 100;`,
      duration: "3,105 ms",
      count: "2,104",
      status: "Review Required",
      statusColor: "bg-red-100 text-red-800"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(prev => {
        const variation = Math.floor(Math.random() * 3) - 1;
        return Math.min(Math.max(prev + variation, 60), 75);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const { role } = useAuth();

  if (role === 'moderator') {
    return (
      <div className="pt-8 pb-12 w-full max-w-max-width mx-auto flex justify-center">
        <div className="bg-surface border border-outline-variant rounded-xl p-xl w-full max-w-2xl text-center shadow-sm">
          <span className="material-symbols-outlined text-green-500 text-[48px] mb-md">check_circle</span>
          <h2 className="font-headline-md text-headline-md text-on-surface">System Status: Operational</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-sm">All services are functioning normally. No degraded services at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-12 w-full max-w-max-width mx-auto">
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[40%] h-[40%] bg-tertiary-container/5 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative z-10 space-y-lg">
        {/* Breadcrumbs & Actions */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-md">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-sm">
              System Health & Infrastructure
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                Operational
              </span>
            </h2>
            <p className="font-body-sm text-body-sm text-secondary mt-1">Real-time status monitoring for Core Command cluster nodes and database shards.</p>
          </div>
          <div className="flex gap-sm">
            <button className="flex items-center gap-2 px-md py-sm bg-surface border border-outline-variant rounded font-label-md text-label-md hover:bg-surface-container-high transition-colors active:scale-95">
              <span className="material-symbols-outlined text-[18px]">download</span> Export Report
            </button>
            {role === 'developer' && (
              <button className="flex items-center gap-2 px-md py-sm bg-primary text-on-primary rounded font-label-md text-label-md hover:opacity-90 transition-opacity active:scale-95">
                <span className="material-symbols-outlined text-[18px]">refresh</span> Force Sync
              </button>
            )}
          </div>
        </div>

        {/* Active Alerts Panel */}
        <div className="bg-error-container/10 border border-error/20 rounded-lg p-md">
          <h3 className="font-headline-sm text-error flex items-center gap-sm mb-sm">
            <span className="material-symbols-outlined">warning</span>
            Active System Alerts
          </h3>
          <div className="space-y-sm">
            <div className="flex items-start gap-md p-sm bg-surface rounded border border-error/10">
              <span className="material-symbols-outlined text-error mt-0.5 text-[20px]">security</span>
              <div>
                <p className="font-label-md text-on-surface">Failed Logins Spike Detected</p>
                <p className="font-body-sm text-secondary">Authentication API is receiving an unusually high number of 401s from IP range 192.168.x.x</p>
              </div>
              <span className="ml-auto text-xs font-mono-label text-secondary">Just now</span>
            </div>
            <div className="flex items-start gap-md p-sm bg-surface rounded border border-orange-500/20">
              <span className="material-symbols-outlined text-orange-500 mt-0.5 text-[20px]">speed</span>
              <div>
                <p className="font-label-md text-on-surface">Elevated Database Latency</p>
                <p className="font-body-sm text-secondary">PostgreSQL primary node showing p95 latency &gt; 1000ms for last 5 minutes</p>
              </div>
              <span className="ml-auto text-xs font-mono-label text-secondary">4m ago</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-lg">
          {/* Server Infrastructure */}
          <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded p-lg shadow-sm">
            <div className="flex justify-between items-center mb-lg">
              <h3 className="font-headline-sm text-headline-sm flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">dns</span>
                Node.js Server Cluster
              </h3>
              <div className="text-right">
                <p className="text-secondary font-mono-label text-mono-label uppercase tracking-wider">Server Uptime</p>
                <p className="font-headline-sm text-headline-sm text-on-surface">14d 6h 22m</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
              {/* CPU Gauge */}
              <div className="flex flex-col items-center justify-center p-md border border-outline-variant rounded bg-surface">
                <div className="relative w-24 h-24 mb-md">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-surface-container-highest stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3"></path>
                    <path className="text-primary stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray={`${cpuUsage}, 100`} strokeLinecap="round" strokeWidth="3"></path>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-headline-sm text-headline-sm">{cpuUsage}%</span>
                  </div>
                </div>
                <p className="font-label-md text-label-md text-secondary">CPU Utilization</p>
                <p className="font-mono-label text-mono-label text-emerald-600 flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-xs">trending_down</span> -2.4%
                </p>
              </div>

              {/* RAM Gauge */}
              <div className="flex flex-col items-center justify-center p-md border border-outline-variant rounded bg-surface">
                <div className="relative w-24 h-24 mb-md">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-surface-container-highest stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3"></path>
                    <path className="text-tertiary stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="52, 100" strokeLinecap="round" strokeWidth="3"></path>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-headline-sm text-headline-sm">52%</span>
                  </div>
                </div>
                <p className="font-label-md text-label-md text-secondary">RAM (4.2GB / 8GB)</p>
                <p className="font-mono-label text-mono-label text-secondary flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-xs">horizontal_rule</span> Stable
                </p>
              </div>

              {/* Error Rate */}
              <div className="flex flex-col items-center justify-center p-md border border-outline-variant rounded bg-surface">
                <div className="w-full h-24 flex items-end justify-between gap-1 mb-md">
                  <div className="w-full bg-primary/20 h-8 rounded-sm"></div>
                  <div className="w-full bg-primary/20 h-10 rounded-sm"></div>
                  <div className="w-full bg-primary/20 h-12 rounded-sm"></div>
                  <div className="w-full bg-primary/20 h-16 rounded-sm"></div>
                  <div className="w-full bg-error h-4 rounded-sm"></div>
                  <div className="w-full bg-primary/20 h-14 rounded-sm"></div>
                  <div className="w-full bg-primary/20 h-10 rounded-sm"></div>
                </div>
                <p className="font-label-md text-label-md text-secondary">Error Rate (5xx)</p>
                <p className="font-headline-sm text-headline-sm text-on-surface">0.04%</p>
              </div>
            </div>
          </div>

          {/* Security & Traffic */}
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded p-lg shadow-sm">
            <h3 className="font-headline-sm text-headline-sm flex items-center gap-sm mb-lg">
              <span className="material-symbols-outlined text-primary">shield</span>
              Security & Limits
            </h3>
            <div className="space-y-md">
              <div className="p-md rounded bg-surface border border-outline-variant">
                <div className="flex justify-between items-center mb-sm">
                  <span className="font-label-md text-label-md text-secondary">Failed Logins (24h)</span>
                  <span className="text-error font-bold text-xs uppercase">Spike Detected</span>
                </div>
                <div className="h-20 w-full overflow-hidden">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                    <polyline fill="none" points="0,35 10,32 20,38 30,30 40,32 50,5 60,8 70,30 80,33 90,35 100,32" stroke="#ba1a1a" strokeWidth="2"></polyline>
                    <path d="M0,35 L10,32 L20,38 L30,30 L40,32 L50,5 L60,8 L70,30 L80,33 L90,35 L100,32 V40 H0 Z" fill="rgba(186, 26, 26, 0.1)"></path>
                  </svg>
                </div>
              </div>
              <div className="p-md rounded bg-surface border border-outline-variant flex justify-between items-center">
                <div>
                  <p className="font-label-md text-label-md text-secondary uppercase">Rate Limit (429)</p>
                  <p className="font-display-lg text-display-lg font-bold">1.2k</p>
                  <p className="font-body-sm text-body-sm text-secondary">triggers / last hour</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-tertiary-container/10 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined">block</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-lg">
          {/* Deployment History */}
          <div className="col-span-12 lg:col-span-7 bg-surface-container-lowest border border-outline-variant rounded p-lg shadow-sm">
            <h3 className="font-headline-sm text-headline-sm flex items-center gap-sm mb-lg">
              <span className="material-symbols-outlined text-primary">update</span>
              Deployment History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-secondary border-b border-outline-variant">
                    <th className="py-sm px-md font-label-md uppercase tracking-wider">Version</th>
                    <th className="py-sm px-md font-label-md uppercase tracking-wider">Triggered By</th>
                    <th className="py-sm px-md font-label-md uppercase tracking-wider">Time</th>
                    <th className="py-sm px-md font-label-md uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                    <td className="py-md px-md font-mono-label text-primary hover:underline cursor-pointer">v1.4.2-b8f9e</td>
                    <td className="py-md px-md flex items-center gap-xs text-sm"><span className="material-symbols-outlined text-[16px]">robot_2</span> GitHub Actions</td>
                    <td className="py-md px-md text-secondary text-sm">2 hours ago</td>
                    <td className="py-md px-md"><span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800 font-medium border border-emerald-200">Success</span></td>
                  </tr>
                  <tr className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                    <td className="py-md px-md font-mono-label text-primary hover:underline cursor-pointer">v1.4.1-c72a1</td>
                    <td className="py-md px-md flex items-center gap-xs text-sm"><span className="material-symbols-outlined text-[16px]">person</span> @dev_team</td>
                    <td className="py-md px-md text-secondary text-sm">Yesterday</td>
                    <td className="py-md px-md"><span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800 font-medium border border-orange-200">Rollback</span></td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="py-md px-md font-mono-label text-primary hover:underline cursor-pointer">v1.4.1-f112x</td>
                    <td className="py-md px-md flex items-center gap-xs text-sm"><span className="material-symbols-outlined text-[16px]">robot_2</span> GitHub Actions</td>
                    <td className="py-md px-md text-secondary text-sm">Yesterday</td>
                    <td className="py-md px-md"><span className="px-2 py-0.5 rounded-full text-xs bg-error-container text-error font-medium border border-error/30">Failed</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* API Endpoint Performance */}
          <div className="col-span-12 lg:col-span-5 bg-surface-container-lowest border border-outline-variant rounded p-lg shadow-sm">
            <h3 className="font-headline-sm text-headline-sm flex items-center gap-sm mb-lg">
              <span className="material-symbols-outlined text-primary">api</span>
              API Performance (Latency)
            </h3>
            <div className="space-y-sm">
              <div className="flex justify-between items-center p-sm hover:bg-surface-container-low border border-transparent hover:border-outline-variant rounded transition-all">
                <div>
                  <p className="font-mono-label text-on-surface text-sm">POST /api/auth/login</p>
                  <p className="font-body-sm text-secondary text-[11px]">Authentication Service</p>
                </div>
                <div className="text-right flex gap-lg">
                  <p className="text-sm flex flex-col"><span className="text-secondary text-[10px] uppercase">p95</span> <span className="font-medium text-emerald-600">120ms</span></p>
                  <p className="text-sm flex flex-col"><span className="text-secondary text-[10px] uppercase">p99</span> <span className="font-medium text-orange-500">450ms</span></p>
                </div>
              </div>
              <div className="flex justify-between items-center p-sm hover:bg-surface-container-low border border-transparent hover:border-outline-variant rounded transition-all">
                <div>
                  <p className="font-mono-label text-on-surface text-sm">GET /api/reports</p>
                  <p className="font-body-sm text-secondary text-[11px]">Core Analytics</p>
                </div>
                <div className="text-right flex gap-lg">
                  <p className="text-sm flex flex-col"><span className="text-secondary text-[10px] uppercase">p95</span> <span className="font-medium text-emerald-600">85ms</span></p>
                  <p className="text-sm flex flex-col"><span className="text-secondary text-[10px] uppercase">p99</span> <span className="font-medium text-emerald-600">140ms</span></p>
                </div>
              </div>
              <div className="flex justify-between items-center p-sm hover:bg-surface-container-low border border-transparent hover:border-outline-variant rounded transition-all">
                <div>
                  <p className="font-mono-label text-on-surface text-sm">POST /api/users/sync</p>
                  <p className="font-body-sm text-secondary text-[11px]">Background Worker</p>
                </div>
                <div className="text-right flex gap-lg">
                  <p className="text-sm flex flex-col"><span className="text-secondary text-[10px] uppercase">p95</span> <span className="font-medium text-error">1450ms</span></p>
                  <p className="text-sm flex flex-col"><span className="text-secondary text-[10px] uppercase">p99</span> <span className="font-medium text-error">2100ms</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PostgreSQL Health */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden shadow-sm">
          <div className="p-lg border-b border-outline-variant flex flex-col md:flex-row md:justify-between md:items-center gap-md">
            <h3 className="font-headline-sm text-headline-sm flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">database</span>
              PostgreSQL Health
            </h3>
            <div className="flex gap-xl">
              <div className="flex items-center gap-3">
                <p className="font-label-md text-label-md text-secondary">Active Connections</p>
                <p className="font-headline-sm text-headline-sm">84 <span className="text-outline text-body-sm">/ 150</span></p>
              </div>
              <div className="w-48">
                <p className="font-label-md text-label-md text-secondary mb-1">Database Size (45GB / 100GB)</p>
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '45%' }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="p-lg">
            <p className="font-label-md text-label-md text-secondary mb-md">Slowest Queries (Last 24h)</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-md border-collapse">
                <thead>
                  <tr className="text-secondary border-b border-outline-variant">
                    <th className="py-sm px-md font-label-md text-label-md font-medium uppercase tracking-wider">Query Hash</th>
                    <th className="py-sm px-md font-label-md text-label-md font-medium uppercase tracking-wider">Avg Duration</th>
                    <th className="py-sm px-md font-label-md text-label-md font-medium uppercase tracking-wider">Count</th>
                    <th className="py-sm px-md font-label-md text-label-md font-medium uppercase tracking-wider">Status</th>
                    <th className="py-sm px-md font-label-md text-label-md font-medium uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slowQueries.map(query => (
                    <tr key={query.id} className="hover:bg-surface-container-low transition-colors border-b border-outline-variant/50">
                      <td className="py-sm px-md font-mono-label text-mono-label text-primary">{query.preview}</td>
                      <td className="py-sm px-md">{query.duration}</td>
                      <td className="py-sm px-md">{query.count}</td>
                      <td className="py-sm px-md"><span className={`px-2 py-0.5 rounded-full text-xs ${query.statusColor}`}>{query.status}</span></td>
                      <td className="py-sm px-md text-right">
                        <button onClick={() => setSelectedQuery(query)} className="p-1 text-secondary hover:text-primary transition-colors"><span className="material-symbols-outlined text-[18px]">visibility</span></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Background Task Queue */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-lg shadow-sm">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-md mb-lg">
            <h3 className="font-headline-sm text-headline-sm flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary">schedule_send</span>
              Background Task Queue
            </h3>
            <div className="flex flex-wrap items-center gap-md">
              <div className="px-md py-sm rounded-lg bg-surface border border-outline-variant text-center min-w-[120px]">
                <p className="text-secondary font-mono-label text-mono-label uppercase">Pending</p>
                <p className="font-headline-sm text-headline-sm font-bold">4,129</p>
              </div>
              <div className="px-md py-sm rounded-lg bg-error-container/20 border border-error text-center min-w-[120px] relative">
                <p className="text-error font-mono-label text-mono-label uppercase">Dead Letter</p>
                <p className="font-headline-sm text-headline-sm font-bold text-error">42</p>
                <span className="absolute -top-2 -right-2 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
                </span>
              </div>
              {role === 'developer' && (
                <button className="px-md py-sm bg-error text-on-error rounded font-label-md text-label-md hover:bg-red-700 transition-colors">
                  Retry All Failed Jobs
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-md bg-surface border-l-4 border-error rounded-r hover:bg-surface-container-low transition-colors gap-md">
              <div className="flex items-start gap-lg">
                <span className="material-symbols-outlined text-error">error_outline</span>
                <div>
                  <p className="font-label-md text-label-md font-bold">WEBHOOK_PAYMENT_FAILURE</p>
                  <p className="font-body-sm text-body-sm text-secondary">Target: stripe.api.v3 | Last Error: Connection Timeout (E_TIMEOUT)</p>
                </div>
              </div>
              <div className="flex items-center gap-xl md:ml-auto">
                <p className="font-mono-label text-mono-label text-outline">ID: 0xf832...a4</p>
                <p className="font-label-md text-label-md text-secondary">Attempt 3/3</p>
                {role === 'developer' && (
                  <button className="flex items-center gap-1 text-primary font-label-md text-label-md hover:underline decoration-2">
                    <span className="material-symbols-outlined text-[16px]">replay</span> Retry
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between p-md bg-surface border-l-4 border-error rounded-r hover:bg-surface-container-low transition-colors gap-md">
              <div className="flex items-start gap-lg">
                <span className="material-symbols-outlined text-error">error_outline</span>
                <div>
                  <p className="font-label-md text-label-md font-bold">EMAIL_BULK_SEND_QUEUE</p>
                  <p className="font-body-sm text-body-sm text-secondary">Target: sendgrid.v3 | Last Error: Invalid API Key (Unauthorized)</p>
                </div>
              </div>
              <div className="flex items-center gap-xl md:ml-auto">
                <p className="font-mono-label text-mono-label text-outline">ID: 0x{Math.random().toString(16).slice(2, 6)}...{Math.random().toString(16).slice(2, 4)}</p>
                <p className="font-label-md text-label-md text-secondary">Attempt 1/3</p>
                {role === 'developer' && (
                  <button className="flex items-center gap-1 text-primary font-label-md text-label-md hover:underline decoration-2">
                    <span className="material-symbols-outlined text-[16px]">replay</span> Retry
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between p-md bg-surface border-l-4 border-error rounded-r hover:bg-surface-container-low transition-colors gap-md">
              <div className="flex items-start gap-lg">
                <span className="material-symbols-outlined text-error">error_outline</span>
                <div>
                  <p className="font-label-md text-label-md font-bold">USER_CACHE_INVALIDATION</p>
                  <p className="font-body-sm text-body-sm text-secondary">Target: redis.cluster.node_1 | Last Error: Node Unreachable</p>
                </div>
              </div>
              <div className="flex items-center gap-xl md:ml-auto">
                <p className="font-mono-label text-mono-label text-outline">ID: 0x21c4...ff</p>
                <p className="font-label-md text-label-md text-secondary">Attempt 2/3</p>
                {role === 'developer' && (
                  <button className="flex items-center gap-1 text-primary font-label-md text-label-md hover:underline decoration-2">
                    <span className="material-symbols-outlined text-[16px]">replay</span> Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SQL Query Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col border border-outline-variant">
            <div className="flex justify-between items-center p-md border-b border-outline-variant">
              <h3 className="font-headline-sm text-on-surface flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">database</span>
                Raw SQL Query
              </h3>
              <button onClick={() => setSelectedQuery(null)} className="text-secondary hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-lg bg-[#1e1e1e] overflow-x-auto">
              <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                {selectedQuery.fullQuery}
              </pre>
            </div>
            <div className="p-md border-t border-outline-variant bg-surface-container-lowest flex justify-between items-center">
              <div className="flex gap-xl">
                <span className="text-xs text-secondary font-mono-label uppercase tracking-wide">Avg Duration: <span className="text-on-surface font-medium">{selectedQuery.duration}</span></span>
                <span className="text-xs text-secondary font-mono-label uppercase tracking-wide">Execution Count: <span className="text-on-surface font-medium">{selectedQuery.count}</span></span>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(selectedQuery.fullQuery); alert("Copied to clipboard!"); }} className="px-md py-sm bg-primary text-on-primary rounded hover:bg-primary/90 transition-colors font-label-md flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                Copy Query
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
