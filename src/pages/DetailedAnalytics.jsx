import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
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
import { subDays, format, addDays, differenceInDays } from 'date-fns';
import DatePickerDropdown from '../components/DatePickerDropdown';
import TotalUsersBreakdown from '../components/analytics-breakdowns/TotalUsersBreakdown';
import ActiveUsersBreakdown from '../components/analytics-breakdowns/ActiveUsersBreakdown';
import UserGrowthBreakdown from '../components/analytics-breakdowns/UserGrowthBreakdown';
import TotalOrganizationsBreakdown from '../components/analytics-breakdowns/TotalOrganizationsBreakdown';
import ActiveOrganizationsBreakdown from '../components/analytics-breakdowns/ActiveOrganizationsBreakdown';
import OrganizationGrowthBreakdown from '../components/analytics-breakdowns/OrganizationGrowthBreakdown';
import ActiveJobsBreakdown from '../components/analytics-breakdowns/ActiveJobsBreakdown';
import UpcomingEventsBreakdown from '../components/analytics-breakdowns/UpcomingEventsBreakdown';
import FeedEngagementBreakdown from '../components/analytics-breakdowns/FeedEngagementBreakdown';
import AIAnalyticsBreakdown from '../components/analytics-breakdowns/AIAnalyticsBreakdown';
import NewConnectionsBreakdown from '../components/analytics-breakdowns/NewConnectionsBreakdown';

const METRICS = [
  { id: 'users', label: 'Total Users', icon: 'group' },
  { id: 'active_users', label: 'Active Users', icon: 'bolt' },
  { id: 'user_growth', label: 'User Growth %', icon: 'show_chart' },
  { id: 'organizations', label: 'Total Organisations', icon: 'domain' },
  { id: 'active_organizations', label: 'Active Organisations', icon: 'domain_verification' },
  { id: 'organization_growth', label: 'Organisation Growth %', icon: 'trending_up' },
  { id: 'feed_engagement', label: 'Feed Engagement', icon: 'feed' },
  { id: 'new_connections', label: 'New Connections', icon: 'people' },
  { id: 'ai_usage', label: 'AI Usage', icon: 'auto_awesome' },
  { id: 'active_jobs', label: 'Active Jobs', icon: 'work' },
  { id: 'upcoming_events', label: 'Upcoming Events', icon: 'event' }
];

const CORE_METRICS = ['users', 'active_users', 'user_growth', 'organizations', 'active_organizations', 'organization_growth'];

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

  // Moderate variance (10% of base) so the graph has gentle but visible curves
  const variance = (metricId === 'user_growth' || metricId === 'organization_growth') ? 1.5 : baseValue * 0.10;

  let currentVal = baseValue - (points * variance * 0.5);

  for (let i = 0; i < points; i++) {
    // Generate much larger swings up and down
    const swing = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * variance);
    currentVal = Math.max(0, currentVal + swing);

    // Trend slightly upwards over time
    currentVal += (baseValue * 0.05);

    data.push({
      date: labels[i],
      value: Math.max(0, Math.round(currentVal * 100) / 100)
    });
  }
  return data;
};

export default function DetailedAnalytics() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialMetric = searchParams.get('metric') || 'users';

  const { accessToken } = useAuth();
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    rangeLabel: 'Last 30 Days'
  });
  const [activeMetric, setActiveMetric] = useState(initialMetric);
  const [interval, setInterval] = useState('Monthly');
  const [chartData, setChartData] = useState([]);
  const [metricsSummary, setMetricsSummary] = useState({ totalUsers: 0, activeUsers: 0, suspendedUsers: 0 });
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (CORE_METRICS.includes(activeMetric) && accessToken) {
        try {
          const queryParams = new URLSearchParams({
            startDate: dateRange.startDate.toISOString(),
            endDate: dateRange.endDate.toISOString(),
            isCustom: dateRange.rangeLabel === 'Custom'
          });
          const res = await fetch(`/api/admin/dashboard/metrics?${queryParams.toString()}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            let cumulativeData = [];
            
            if (activeMetric === 'users') {
              const totalNew = data.chartData.reduce((sum, item) => sum + (item.newUsers || 0), 0);
              let currentTotal = data.totalUsers - totalNew;
              
              cumulativeData = data.chartData.map(item => {
                currentTotal += (item.newUsers || 0);
                return {
                  date: item.date,
                  value: currentTotal
                };
              });
            } else if (activeMetric === 'organizations') {
              const totalNew = data.chartData.reduce((sum, item) => sum + (item.newOrganizations || 0), 0);
              let currentTotal = data.totalOrgs - totalNew;
              
              cumulativeData = data.chartData.map(item => {
                currentTotal += (item.newOrganizations || 0);
                return {
                  date: item.date,
                  value: currentTotal
                };
              });
            } else if (activeMetric === 'active_organizations') {
              cumulativeData = data.chartData.map(item => ({
                date: item.date,
                value: item.activeOrganizations || 0
              }));
            } else if (activeMetric === 'active_users') {
              cumulativeData = data.chartData.map(item => ({
                date: item.date,
                value: item.activeUsers || 0
              }));
            } else if (activeMetric === 'user_growth') {
              const totalNew = data.chartData.reduce((sum, item) => sum + (item.newUsers || 0), 0);
              let startTotal = data.totalUsers - totalNew;
              if (startTotal <= 0) startTotal = 1; // Prevent division by zero
              let currentTotal = startTotal;

              cumulativeData = data.chartData.map(item => {
                currentTotal += (item.newUsers || 0);
                const growthPct = ((currentTotal - startTotal) / startTotal) * 100;
                return {
                  date: item.date,
                  value: parseFloat(growthPct.toFixed(2))
                };
              });
            } else if (activeMetric === 'organization_growth') {
              const totalNew = data.chartData.reduce((sum, item) => sum + (item.newOrganizations || 0), 0);
              let startTotal = data.totalOrgs - totalNew;
              if (startTotal <= 0) startTotal = 1; // Prevent division by zero
              let currentTotal = startTotal;

              cumulativeData = data.chartData.map(item => {
                currentTotal += (item.newOrganizations || 0);
                const growthPct = ((currentTotal - startTotal) / startTotal) * 100;
                return {
                  date: item.date,
                  value: parseFloat(growthPct.toFixed(2))
                };
              });
            }
            setMetricsSummary({
              totalUsers: data.totalUsers || 0,
              activeUsers: data.activeUsers || 0,
              suspendedUsers: data.suspendedUsers || 0
            });
            setChartData(cumulativeData);
            return; // exit early
          }
        } catch (error) {
          console.error("Failed to fetch metric data", error);
        }
      }
      
      // Fallback for other metrics or API failure
      const diff = differenceInDays(dateRange.endDate, dateRange.startDate);
      let newInterval = 'Monthly';
      if (diff <= 1) newInterval = 'Daily';
      else if (diff <= 31) newInterval = 'Weekly';
      else if (diff <= 365) newInterval = 'Monthly';
      else newInterval = 'Yearly';
      
      if (newInterval !== interval) {
        setInterval(newInterval);
      }
      setChartData(generateMockData(activeMetric, newInterval));
    };

    loadData();
  }, [activeMetric, dateRange.startDate, dateRange.endDate, accessToken]);

  useEffect(() => {
    const metricFromUrl = searchParams.get('metric');
    if (metricFromUrl && metricFromUrl !== activeMetric) {
      setActiveMetric(metricFromUrl);
    }
  }, [searchParams]);

  const isCoreMetric = CORE_METRICS.includes(activeMetric);

  const currentMetricObj = METRICS.find(m => m.id === activeMetric) || METRICS[0];

  const COLORS = {
    users: '#1d4ed8', // Blue 700
    active_users: '#0f172a', // Slate 900
    user_growth: '#047857', // Emerald 700
    organizations: '#4338ca', // Indigo 700
    active_organizations: '#0e7490', // Cyan 700
    organization_growth: '#b45309' // Amber 700
  };

  const chartColor = COLORS[activeMetric] || '#1d4ed8';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 shadow-sm rounded-md p-3 min-w-[120px]">
          <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-sm font-semibold text-gray-900">
            {payload[0].value.toLocaleString()} {activeMetric.includes('growth') ? '%' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-full overflow-hidden bg-background">
      {/* Sidebar Switcher */}
      {isCoreMetric && (
      <div className="w-[68px] shrink-0 z-20 relative h-full">
        <div className="group absolute top-0 left-0 h-full w-[68px] hover:w-64 transition-all duration-300 bg-surface border-r border-outline-variant p-3 flex flex-col gap-1 overflow-hidden hover:shadow-xl">
          <div className="mb-4 mt-2 px-3 flex items-center h-4 shrink-0">
            <h3 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Metrics</h3>
          </div>

          {METRICS.filter(metric => CORE_METRICS.includes(metric.id)).map(metric => (
            <button
              key={metric.id}
              onClick={() => setActiveMetric(metric.id)}
              className={`flex items-center px-3 py-2.5 rounded-md transition-colors text-left shrink-0 whitespace-nowrap w-[230px] ${activeMetric === metric.id
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <span className="material-symbols-outlined text-[18px] shrink-0">{metric.icon}</span>
              <span className="text-sm flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-3">{metric.label}</span>
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {isCoreMetric && (
          <>
            {/* Top Header */}
            <div className="px-8 py-6 border-b border-gray-200 flex justify-between items-center bg-white">
              <div>
                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  {currentMetricObj.label}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Historical performance and trends.
                </p>
              </div>

              <div className="flex items-center relative z-20">
                <DatePickerDropdown
                  onRangeChange={(range) => setDateRange(range)}
                  initialRangeLabel="Last 30 Days"
                />
              </div>
            </div>
          </>
        )}

        {/* Content Area */}
        <div className={`flex-1 overflow-y-auto ${isCoreMetric ? 'p-8' : 'p-8 pt-6'}`}>
          <div className="flex flex-col gap-8">
            
            {isCoreMetric && (
              <div className="bg-white border border-gray-100 rounded-2xl p-6 h-[450px] shrink-0 flex flex-col shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500"></div>
                <div className="mb-8 flex justify-between items-center relative z-10">
                  <h2 className="text-base font-semibold text-gray-900">Performance Over Time</h2>
                </div>

                <div className="flex-1 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.1} />
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        dy={10}
                        minTickGap={20}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                        allowDecimals={activeMetric.includes('growth')}
                        tickFormatter={(val) => {
                          if (activeMetric.includes('growth')) return `${val}%`;
                          if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                          if (val >= 1000) return `${(val / 1000).toFixed(1)}k`;
                          return val;
                        }}
                        domain={
                          activeMetric === 'users' || activeMetric === 'organizations' ? ['dataMin', 'dataMax'] :
                          activeMetric.includes('growth') ? ['auto', 'auto'] :
                          [0, 'auto']
                        }
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }} />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={chartColor}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: chartColor }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Dynamic Breakdowns based on selected metric */}
            {activeMetric === 'users' && <TotalUsersBreakdown metrics={metricsSummary} />}
            {activeMetric === 'active_users' && <ActiveUsersBreakdown dateRange={dateRange} />}
            {activeMetric === 'user_growth' && <UserGrowthBreakdown dateRange={dateRange} />}
            {activeMetric === 'organizations' && <TotalOrganizationsBreakdown dateRange={dateRange} />}
            {activeMetric === 'active_organizations' && <ActiveOrganizationsBreakdown dateRange={dateRange} />}
            {activeMetric === 'organization_growth' && <OrganizationGrowthBreakdown dateRange={dateRange} />}
            {activeMetric === 'active_jobs' && <ActiveJobsBreakdown />}
            {activeMetric === 'upcoming_events' && <UpcomingEventsBreakdown />}
            {activeMetric === 'feed_engagement' && <FeedEngagementBreakdown />}
            {activeMetric === 'ai_usage' && <AIAnalyticsBreakdown />}
            {activeMetric === 'new_connections' && <NewConnectionsBreakdown />}

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
