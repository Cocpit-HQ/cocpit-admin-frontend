import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PlatformGrowthChart({ data, onDateSelect }) {
  const formatYAxis = (tickItem) => {
    if (tickItem >= 1000) {
      return (tickItem / 1000) + 'k';
    }
    return tickItem;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-100 shadow-lg rounded-xl">
          <p className="text-sm font-semibold text-gray-600 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-500">{entry.name}:</span>
              <span className="font-semibold text-gray-800">{entry.value}</span>
            </div>
          ))}
          {onDateSelect && (
            <div className="mt-2 pt-2 border-t border-gray-100 text-xs font-medium text-indigo-600 flex items-center gap-1">
              <span>Click to view joined users</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const handleClick = (state) => {
    if (state && state.activePayload && state.activePayload.length > 0 && onDateSelect) {
      const selectedData = state.activePayload[0].payload;
      onDateSelect(selectedData);
    }
  };

  return (
    <div className="w-full h-full min-h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          onClick={handleClick}
          className={onDateSelect ? "cursor-pointer" : ""}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >

          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorOrgs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12 }}
            dy={10}
            minTickGap={30}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            tickFormatter={formatYAxis}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="newUsers" 
            name="New Users"
            stroke="#4f46e5" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorUsers)" 
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          <Area 
            type="monotone" 
            dataKey="newOrganizations" 
            name="New Organisations"
            stroke="#10b981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorOrgs)" 
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
