import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

export default function SystemHealth() {
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [selectedQuery, setSelectedQuery] = useState(null);

  const [slowQueries, setSlowQueries] = useState([]);
  const [taskQueue, setTaskQueue] = useState({ pendingCount: 0, deadLetterCount: 0, tasks: [] });



  const { role, accessToken } = useAuth();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        if (!accessToken) return;
        const response = await fetch('/api/admin/dashboard/system-alerts', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAlerts(data.alerts || []);
        }
      } catch (error) {
        console.error('Failed to fetch system alerts:', error);
      }
    };
    fetchAlerts();
  }, [accessToken]);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        if (!accessToken) return;
        const response = await fetch('/api/admin/dashboard/system-metrics', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          setSystemMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch system metrics:', error);
      }
    };
    fetchMetrics();
    // Polling every 10 seconds for real-time feel
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, [accessToken]);

  useEffect(() => {
    const fetchDeployments = async () => {
      try {
        if (!accessToken) return;
        const response = await fetch('/api/admin/dashboard/deployments', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          setDeployments(data.deployments || []);
        }
      } catch (error) {
        console.error('Failed to fetch deployments:', error);
      }
    };
    
    const fetchSlowQueries = async () => {
      try {
        if (!accessToken) return;
        const response = await fetch('/api/admin/dashboard/slow-queries', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          setSlowQueries(data.slowQueries || []);
        }
      } catch (error) {
        console.error('Failed to fetch slow queries:', error);
      }
    };

    const fetchBackgroundTasks = async () => {
      try {
        if (!accessToken) return;
        const response = await fetch('/api/admin/dashboard/background-tasks', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (response.ok) {
          const data = await response.json();
          setTaskQueue(data || { pendingCount: 0, deadLetterCount: 0, tasks: [] });
        }
      } catch (error) {
        console.error('Failed to fetch background tasks:', error);
      }
    };

    fetchDeployments();
    fetchSlowQueries();
    fetchBackgroundTasks();
  }, [accessToken]);

  // Format uptime from seconds
  const formatUptime = (seconds) => {
    if (!seconds) return '0d 0h 0m';
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const currentMetrics = systemMetrics || {
    cpu_usage_percent: 0,
    ram_usage_gb: 0,
    ram_total_gb: 8,
    error_rate_percent: 0,
    uptime_seconds: 0,
    rate_limit_triggers_1h: 0,
    failed_logins_24h_data: []
  };

  const cpuUsage = currentMetrics.cpu_usage_percent;


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
            {alerts.length > 0 ? alerts.map(alert => {
              const isSecurity = alert.type === 'security';
              const icon = isSecurity ? 'security' : 'speed';
              const iconColor = isSecurity ? 'text-error' : 'text-orange-500';
              const borderColor = isSecurity ? 'border-error/10' : 'border-orange-500/20';
              
              const date = new Date(alert.created_at);
              const now = new Date();
              const diffMs = now - date;
              const diffMins = Math.floor(diffMs / 60000);
              let timeAgo = 'Just now';
              if (diffMins > 60) timeAgo = `${Math.floor(diffMins / 60)}h ago`;
              else if (diffMins > 0) timeAgo = `${diffMins}m ago`;

              return (
                <div key={alert.id} className={`flex items-start gap-md p-sm bg-surface rounded border ${borderColor}`}>
                  <span className={`material-symbols-outlined mt-0.5 text-[20px] ${iconColor}`}>{icon}</span>
                  <div>
                    <p className="font-label-md text-on-surface">{alert.title}</p>
                    <p className="font-body-sm text-secondary">{alert.message}</p>
                  </div>
                  <span className="ml-auto text-xs font-mono-label text-secondary whitespace-nowrap">{timeAgo}</span>
                </div>
              );
            }) : (
              <p className="text-body-sm text-secondary p-sm">No active alerts at this time.</p>
            )}
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
                <p className="font-headline-sm text-headline-sm text-on-surface">{formatUptime(currentMetrics.uptime_seconds)}</p>
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
                    <path className="text-tertiary stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray={`${Math.round((currentMetrics.ram_usage_gb / currentMetrics.ram_total_gb) * 100) || 0}, 100`} strokeLinecap="round" strokeWidth="3"></path>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-headline-sm text-headline-sm">{Math.round((currentMetrics.ram_usage_gb / currentMetrics.ram_total_gb) * 100) || 0}%</span>
                  </div>
                </div>
                <p className="font-label-md text-label-md text-secondary">RAM ({currentMetrics.ram_usage_gb}GB / {currentMetrics.ram_total_gb}GB)</p>
                <p className="font-mono-label text-mono-label text-secondary flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-xs">horizontal_rule</span> Stable
                </p>
              </div>

              {/* Heap Usage */}
              <div className="flex flex-col items-center justify-center p-md border border-outline-variant rounded bg-surface">
                <div className="relative w-24 h-24 mb-md">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path className="text-surface-container-highest stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3"></path>
                    <path className="text-primary stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray={`${currentMetrics.heap_usage_percent || 0}, 100`} strokeLinecap="round" strokeWidth="3"></path>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-headline-sm text-headline-sm">{currentMetrics.heap_usage_percent || 0}%</span>
                  </div>
                </div>
                <p className="font-label-md text-label-md text-secondary">Node.js Heap Usage</p>
                <p className="font-mono-label text-mono-label text-secondary flex items-center gap-1 mt-1">
                  {currentMetrics.heap_used_mb}MB / {currentMetrics.heap_total_mb}MB
                </p>
              </div>
            </div>
          </div>

          {/* Database Health */}
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded p-lg shadow-sm">
            <h3 className="font-headline-sm text-headline-sm flex items-center gap-sm mb-lg">
              <span className="material-symbols-outlined text-primary">database</span>
              Database Health
            </h3>
            <div className="space-y-md">
              <div className="p-md rounded bg-surface border border-outline-variant flex justify-between items-center">
                <div>
                  <p className="font-label-md text-label-md text-secondary uppercase">Database Storage Size</p>
                  <p className="font-display-lg text-display-lg font-bold">{currentMetrics.db_size || '0 MB'}</p>
                  <p className="font-body-sm text-body-sm text-secondary">Total disk space used</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-primary-container/30 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">storage</span>
                </div>
              </div>
              <div className="p-md rounded bg-surface border border-outline-variant flex justify-between items-center">
                <div>
                  <p className="font-label-md text-label-md text-secondary uppercase">Active Connections</p>
                  <p className="font-display-lg text-display-lg font-bold">{currentMetrics.active_db_connections || 0}</p>
                  <p className="font-body-sm text-body-sm text-secondary">pg_stat_activity count</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <span className="material-symbols-outlined">cable</span>
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
                  {deployments.length > 0 ? deployments.map(dep => {
                    const date = new Date(dep.created_at);
                    const now = new Date();
                    const diffMs = now - date;
                    const diffMins = Math.floor(diffMs / 60000);
                    let timeAgo = 'Just now';
                    if (diffMins > 1440) timeAgo = `${Math.floor(diffMins / 1440)} days ago`;
                    else if (diffMins > 60) timeAgo = `${Math.floor(diffMins / 60)} hours ago`;
                    else if (diffMins > 0) timeAgo = `${diffMins} mins ago`;

                    let statusClass = "bg-emerald-100 text-emerald-800 border-emerald-200";
                    if (dep.status === 'Rollback') statusClass = "bg-orange-100 text-orange-800 border-orange-200";
                    if (dep.status === 'Failed') statusClass = "bg-error-container text-error border-error/30";

                    return (
                      <tr key={dep.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                        <td className="py-md px-md font-mono-label text-primary hover:underline cursor-pointer">{dep.version}</td>
                        <td className="py-md px-md flex items-center gap-xs text-sm">
                          <span className="material-symbols-outlined text-[16px]">{dep.triggered_by.toLowerCase().includes('github') || dep.triggered_by.toLowerCase().includes('bot') ? 'robot_2' : 'person'}</span> 
                          {dep.triggered_by}
                        </td>
                        <td className="py-md px-md text-secondary text-sm">{timeAgo}</td>
                        <td className="py-md px-md"><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusClass}`}>{dep.status}</span></td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="4" className="py-md px-md text-secondary text-center">No deployment history found.</td></tr>
                  )}
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
                  <p className="font-mono-label text-on-surface text-sm">GET /api/content/All/feeds</p>
                  <p className="font-body-sm text-secondary text-[11px]">Main Feed Service</p>
                </div>
                <div className="text-right flex gap-lg">
                  <p className="text-sm flex flex-col"><span className="text-secondary text-[10px] uppercase">p95</span> <span className="font-medium text-emerald-600">85ms</span></p>
                  <p className="text-sm flex flex-col"><span className="text-secondary text-[10px] uppercase">p99</span> <span className="font-medium text-emerald-600">140ms</span></p>
                </div>
              </div>
              <div className="flex justify-between items-center p-sm hover:bg-surface-container-low border border-transparent hover:border-outline-variant rounded transition-all">
                <div>
                  <p className="font-mono-label text-on-surface text-sm">POST /api/content/post</p>
                  <p className="font-body-sm text-secondary text-[11px]">Content Creation</p>
                </div>
                <div className="text-right flex gap-lg">
                  <p className="text-sm flex flex-col"><span className="text-secondary text-[10px] uppercase">p95</span> <span className="font-medium text-orange-500">320ms</span></p>
                  <p className="text-sm flex flex-col"><span className="text-secondary text-[10px] uppercase">p99</span> <span className="font-medium text-error">850ms</span></p>
                </div>
              </div>
              <div className="flex justify-between items-center p-sm hover:bg-surface-container-low border border-transparent hover:border-outline-variant rounded transition-all">
                <div>
                  <p className="font-mono-label text-on-surface text-sm">GET /api/user/search</p>
                  <p className="font-body-sm text-secondary text-[11px]">Search Service</p>
                </div>
                <div className="text-right flex gap-lg">
                  <p className="text-sm flex flex-col"><span className="text-secondary text-[10px] uppercase">p95</span> <span className="font-medium text-emerald-600">180ms</span></p>
                  <p className="text-sm flex flex-col"><span className="text-secondary text-[10px] uppercase">p99</span> <span className="font-medium text-orange-500">500ms</span></p>
                </div>
              </div>
              <div className="flex justify-between items-center p-sm hover:bg-surface-container-low border border-transparent hover:border-outline-variant rounded transition-all">
                <div>
                  <p className="font-mono-label text-on-surface text-sm">POST /api/report/reports</p>
                  <p className="font-body-sm text-secondary text-[11px]">Moderation Service</p>
                </div>
                <div className="text-right flex gap-lg">
                  <p className="text-sm flex flex-col"><span className="text-secondary text-[10px] uppercase">p95</span> <span className="font-medium text-emerald-600">90ms</span></p>
                  <p className="text-sm flex flex-col"><span className="text-secondary text-[10px] uppercase">p99</span> <span className="font-medium text-emerald-600">150ms</span></p>
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
                      <td className="py-sm px-md">{query.duration_ms} ms</td>
                      <td className="py-sm px-md">{query.execution_count}</td>
                      <td className="py-sm px-md"><span className={`px-2 py-0.5 rounded-full text-xs ${query.status_color}`}>{query.status}</span></td>
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
                <p className="font-headline-sm text-headline-sm font-bold">{taskQueue.pendingCount}</p>
              </div>
              <div className="px-md py-sm rounded-lg bg-error-container/20 border border-error text-center min-w-[120px] relative">
                <p className="text-error font-mono-label text-mono-label uppercase">Dead Letter</p>
                <p className="font-headline-sm text-headline-sm font-bold text-error">{taskQueue.deadLetterCount}</p>
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
            {taskQueue.tasks.map(task => (
              <div key={task.id} className="flex flex-col md:flex-row md:items-center justify-between p-md bg-surface border-l-4 border-error rounded-r hover:bg-surface-container-low transition-colors gap-md">
                <div className="flex items-start gap-lg">
                  <span className="material-symbols-outlined text-error">error_outline</span>
                  <div>
                    <p className="font-label-md text-label-md font-bold">{task.task_name}</p>
                    <p className="font-body-sm text-body-sm text-secondary">Target: {task.target} | Last Error: {task.last_error}</p>
                  </div>
                </div>
                <div className="flex items-center gap-xl md:ml-auto">
                  <p className="font-mono-label text-mono-label text-outline">ID: {task.task_id}</p>
                  <p className="font-label-md text-label-md text-secondary">Attempt {task.attempt_count}/{task.max_attempts}</p>
                  {role === 'developer' && (
                    <button className="flex items-center gap-1 text-primary font-label-md text-label-md hover:underline decoration-2">
                      <span className="material-symbols-outlined text-[16px]">replay</span> Retry
                    </button>
                  )}
                </div>
              </div>
            ))}
            {taskQueue.tasks.length === 0 && (
              <div className="p-xl text-center text-secondary border border-dashed border-outline-variant rounded-xl bg-surface">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">check_circle</span>
                <p>No dead letter tasks.</p>
              </div>
            )}
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
                {selectedQuery.full_query}
              </pre>
            </div>
            <div className="p-4 bg-surface flex justify-between items-center rounded-b-xl border-t border-outline-variant">
              <div className="flex gap-lg">
                <p className="text-sm font-label-md text-secondary uppercase tracking-wider">Avg Duration: <span className="font-bold text-on-surface">{selectedQuery.duration_ms} ms</span></p>
                <p className="text-sm font-label-md text-secondary uppercase tracking-wider">Execution Count: <span className="font-bold text-on-surface">{selectedQuery.execution_count}</span></p>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(selectedQuery.full_query); alert("Copied to clipboard!"); }} className="px-md py-sm bg-primary text-on-primary rounded hover:bg-primary/90 transition-colors font-label-md flex items-center gap-2">
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
