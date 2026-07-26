import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../AuthContext';
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const MODEL_COLORS = [
  '#4F8CFF', // Primary
  '#22C55E', // Success
  '#F59E0B', // Warning
  '#8B5CF6', // Secondary
  '#EF4444', // Error
  '#38BDF8', // Info
];

const formatK = (val) => {
  if (!val && val !== 0) return '0';
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toString();
};

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#111827', border: '1px solid #2C364B', borderRadius: 12, padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.45)' }}>
        <p style={{ fontWeight: 600, color: '#CBD5E1', marginBottom: 8, fontSize: 13 }}>{label}</p>
        {payload.map((entry, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 13 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, flexShrink: 0 }} />
            <span style={{ color: '#94A3B8' }}>{entry.name}:</span>
            <span style={{ fontWeight: 600, color: '#F8FAFC' }}>
              {currency ? `₹${parseFloat(entry.value).toFixed(4)}` : formatK(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CustomSelect = ({ value, onChange, options, style }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div style={{ position: 'relative' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 140, userSelect: 'none' }}
      >
        <span>{selectedOption.label}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </div>
      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setIsOpen(false)} />
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: '#111827',
            border: '1px solid #2C364B',
            borderRadius: 8,
            overflow: 'hidden',
            zIndex: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)'
          }}>
            {options.map(opt => (
              <div 
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                onMouseEnter={e => e.currentTarget.style.background = '#172033'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                style={{
                  padding: '10px 16px',
                  fontSize: 13,
                  color: opt.value === value ? '#F8FAFC' : '#CBD5E1',
                  cursor: 'pointer',
                  fontWeight: opt.value === value ? 600 : 500,
                  transition: 'background 0.1s',
                  background: opt.value === value ? '#172033' : 'transparent'
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function AiAnalytics() {
  const { accessToken } = useAuth();
  const [timeRange, setTimeRange] = useState('30d');
  const [feature, setFeature] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [featureData, setFeatureData] = useState([]);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/dashboard/ai-analytics?timeRange=${timeRange}&feature=${feature}&model=${modelFilter}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const result = await res.json();
          setFeatureData(result.featureData || []);
          setTimeSeriesData(result.timeSeriesData || []);
          setSummary(result.summary || null);
        }
      } catch (err) {
        console.error('Error fetching AI analytics', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (accessToken) fetchAnalytics();
  }, [accessToken, timeRange, feature, modelFilter]);

  // Get all unique models
  const models = useMemo(() => {
    return [...new Set(timeSeriesData.map(d => d.model))];
  }, [timeSeriesData]);

  // Get all unique dates
  const dates = useMemo(() => {
    return [...new Set(timeSeriesData.map(d => d.date))].sort();
  }, [timeSeriesData]);

  // Pivot time-series data: [{ date, 'gemini-2.5-flash': 5, ... }]
  const requestsByDate = useMemo(() => dates.map(date => {
    const point = { date };
    models.forEach(model => {
      const row = timeSeriesData.find(d => d.date === date && d.model === model);
      point[model] = row ? row.totalRequests : 0;
    });
    return point;
  }), [dates, models, timeSeriesData]);

  const inputTokensByDate = useMemo(() => dates.map(date => {
    const point = { date };
    models.forEach(model => {
      const row = timeSeriesData.find(d => d.date === date && d.model === model);
      point[model] = row ? row.inputTokens : 0;
    });
    return point;
  }), [dates, models, timeSeriesData]);

  const outputTokensByDate = useMemo(() => dates.map(date => {
    const point = { date };
    models.forEach(model => {
      const row = timeSeriesData.find(d => d.date === date && d.model === model);
      point[model] = row ? row.outputTokens : 0;
    });
    return point;
  }), [dates, models, timeSeriesData]);

  const costByDate = useMemo(() => dates.map(date => {
    const point = { date };
    models.forEach(model => {
      const row = timeSeriesData.find(d => d.date === date && d.model === model);
      point[model] = row ? row.totalCostInr : 0;
    });
    return point;
  }), [dates, models, timeSeriesData]);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
  };

  const selectStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #334155',
    background: '#0F172A',
    color: '#F8FAFC',
    fontSize: '13px',
    fontWeight: 500,
    outline: 'none',
    cursor: 'pointer'
  };

  const cardStyle = {
    background: '#111827',
    border: '1px solid #2C364B',
    borderRadius: '14px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.45)'
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, background: 'transparent' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '4px solid #4F8CFF', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 48, background: 'transparent' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>AI Usage Analytics</h3>
          <p style={{ color: '#94A3B8', margin: '6px 0 0', fontSize: 14 }}>
            Costs in Indian Rupees (₹) · 1 USD = ₹83.5
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <CustomSelect 
            value={feature} 
            onChange={setFeature} 
            style={selectStyle}
            options={[
              { value: 'all', label: 'All Features' },
              { value: 'jd_generate', label: 'JD Generation' },
              { value: 'resume_parse', label: 'Resume Parsing' },
              { value: 'resume_match', label: 'Resume Matching' },
              { value: 'analytics', label: 'Analytics' },
              { value: 'enhance_ai', label: 'Enhance with AI' },
            ]}
          />
          <CustomSelect 
            value={modelFilter} 
            onChange={setModelFilter} 
            style={selectStyle}
            options={[
              { value: 'all', label: 'All Models' },
              { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
              { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
            ]}
          />
          <CustomSelect 
            value={timeRange} 
            onChange={setTimeRange} 
            style={selectStyle}
            options={[
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
              { value: 'this_month', label: 'This Month' },
              { value: 'last_month', label: 'Last Month' },
              { value: 'overall', label: 'Overall' },
            ]}
          />
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total API Requests', value: summary.totalRequests.toLocaleString(), icon: 'api', color: '#4F8CFF', bgLight: 'rgba(79,140,255,0.12)' },
            { label: 'Total Tokens Used', value: formatK(summary.totalTokens), icon: 'memory', color: '#22C55E', bgLight: 'rgba(34,197,94,0.12)' },
            { label: 'Total Cost (USD)', value: `$${summary.totalCostUsd.toFixed(6)}`, icon: 'payments', color: '#F59E0B', bgLight: 'rgba(245,158,11,0.12)' },
            { label: 'Total Cost (₹)', value: `₹${summary.totalCostInr.toFixed(2)}`, icon: 'currency_rupee', color: '#EF4444', bgLight: 'rgba(239,68,68,0.12)' },
          ].map((card) => (
            <div key={card.label} style={{ ...cardStyle, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: card.bgLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ color: card.color, fontSize: 22 }}>{card.icon}</span>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{card.label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 700, color: '#F8FAFC' }}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Time-Series Section Header */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
          Generate Content &amp; Live API
        </h4>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>Per-model breakdown over time</p>
      </div>

      {timeSeriesData.length === 0 ? (
        <div style={{ background: '#0F172A', border: '1px dashed #374151', borderRadius: 14, padding: 32, textAlign: 'center', color: '#64748B', marginBottom: 32, fontSize: 14 }}>
          No time-series data yet. AI usage logs will appear here once features are used.
        </div>
      ) : (
        <>
          {/* Three line charts in a row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            {[
              { title: 'Input Tokens per model', data: inputTokensByDate, key: 'inputTokens' },
              { title: 'Output Tokens per model', data: outputTokensByDate, key: 'outputTokens' },
              { title: 'Requests per model', data: requestsByDate, key: 'requests' },
            ].map(({ title, data }) => (
              <div key={title} style={{ ...cardStyle, padding: '20px 16px 12px' }}>
                <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 600, color: '#CBD5E1' }}>{title}</p>
                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                      <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} minTickGap={20} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} tickFormatter={formatK} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2C364B', strokeWidth: 1, strokeDasharray: '3 3' }} />
                      {models.map((model, i) => (
                        <Line key={model} type="monotone" dataKey={model} stroke={MODEL_COLORS[i % MODEL_COLORS.length]} strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: '#111827' }} activeDot={{ r: 5, stroke: '#111827', strokeWidth: 2 }} name={model} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 10 }}>
                  {models.map((model, i) => (
                    <div key={model} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: MODEL_COLORS[i % MODEL_COLORS.length] }} />
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>{model}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Daily Cost Bar Chart */}
          <div style={{ ...cardStyle, padding: '20px 20px 16px', marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>Your Total Cost</p>
                {dates.length > 0 && (
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#94A3B8' }}>
                    {formatDate(dates[0])} – {formatDate(dates[dates.length - 1])}, 2026
                  </p>
                )}
              </div>
              {summary && (
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#F8FAFC' }}>₹{summary.totalCostInr.toFixed(2)}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#94A3B8' }}>= ${summary.totalCostUsd.toFixed(6)} USD</p>
                </div>
              )}
            </div>
            <div style={{ height: 220, marginTop: 12 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costByDate} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                  <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} minTickGap={20} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} tickFormatter={(v) => `₹${v.toFixed(2)}`} />
                  <Tooltip content={<CustomTooltip currency />} cursor={{ fill: '#172033' }} />
                  <Legend
                    formatter={(val) => <span style={{ fontSize: 12, color: '#94A3B8' }}>{val}</span>}
                  />
                  {models.map((model, i) => (
                    <Bar key={model} dataKey={model} name={model} fill={MODEL_COLORS[i % MODEL_COLORS.length]} radius={[4, 4, 0, 0]} stackId="cost" />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p style={{ margin: '10px 0 0', fontSize: 11, color: '#64748B' }}>Cost information uses approximate pricing. 1 USD = ₹83.5</p>
          </div>
        </>
      )}

      {/* ── FEATURE BREAKDOWN TABLE ── */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #2C364B' }}>
          <h5 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>Feature Breakdown</h5>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>Grouped by AI feature</p>
        </div>
        {featureData.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>No feature data found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0F172A' }}>
                  {['Feature', 'API Hits', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Est. Cost (₹)', 'Est. Cost (USD)', 'Avg Latency'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#94A3B8', whiteSpace: 'nowrap', borderBottom: '1px solid #2C364B' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureData.map((row, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #1F2937' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#172033'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#4F8CFF' }}>smart_toy</span>
                        {row.feature}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#CBD5E1' }}>{row.totalApiHits.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#CBD5E1' }}>{formatK(row.inputTokens)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#CBD5E1' }}>{formatK(row.outputTokens)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#CBD5E1' }}>{formatK(row.totalTokens)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: '#EF4444' }}>₹{row.totalCostInr.toFixed(4)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#94A3B8' }}>${row.totalCostUsd.toFixed(6)}</td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: '#94A3B8' }}>{row.avgLatency}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
