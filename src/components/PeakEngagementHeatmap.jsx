import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';

export default function PeakEngagementHeatmap() {
  const { accessToken } = useAuth();
  const [heatmapData, setHeatmapData] = useState([]);
  const [maxVal, setMaxVal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmap = async () => {
      if (!accessToken) return;
      try {
        const res = await fetch('/api/admin/engagement-heatmap', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setHeatmapData(data.heatmap);
          setMaxVal(data.maxVal || 1);
        }
      } catch (err) {
        console.error('Failed to fetch heatmap:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHeatmap();
  }, [accessToken]);

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getOpacityClass = (value, max) => {
    if (value === 0) return 'bg-blue-100 opacity-20'; // Base empty
    const ratio = value / max;
    if (ratio > 0.8) return 'bg-blue-800';
    if (ratio > 0.6) return 'bg-blue-600';
    if (ratio > 0.4) return 'bg-blue-500';
    if (ratio > 0.2) return 'bg-blue-400';
    return 'bg-blue-300';
  };

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm overflow-hidden flex flex-col w-full overflow-x-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Peak Engagement Hours</h3>
          <p className="text-sm text-gray-500">Average weekly activity over the last 30 days.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
          <span>Low</span>
          <div className="w-4 h-4 rounded-sm bg-blue-100 opacity-20"></div>
          <div className="w-4 h-4 rounded-sm bg-blue-300"></div>
          <div className="w-4 h-4 rounded-sm bg-blue-500"></div>
          <div className="w-4 h-4 rounded-sm bg-blue-800"></div>
          <span>High</span>
        </div>
      </div>

      {loading ? (
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="min-w-[700px]">
          {/* Header Row (Hours) */}
          <div className="flex mb-2 ml-12">
            {hours.map(h => (
              <div key={`h-${h}`} className="flex-1 text-center text-xs text-gray-400 font-medium">
                {h}h
              </div>
            ))}
          </div>

          {/* Grid Rows (Days) */}
          <div className="flex flex-col gap-1">
            {days.map((dayLabel, dayIndex) => {
              const dayNum = dayIndex + 1; // 1 = Mon, 7 = Sun
              return (
                <div key={dayLabel} className="flex items-center">
                  <div className="w-12 text-xs font-semibold text-gray-500">
                    {dayLabel}
                  </div>
                  <div className="flex flex-1 gap-1">
                    {hours.map(h => {
                      const cell = heatmapData.find(c => c.day === dayNum && c.hour === h);
                      const val = cell ? cell.value : 0;
                      return (
                        <div
                          key={`${dayLabel}-${h}`}
                          title={`${val} events on ${dayLabel} at ${h}:00`}
                          className={`flex-1 aspect-square rounded-sm transition-colors hover:ring-2 hover:ring-blue-400 hover:z-10 cursor-crosshair ${getOpacityClass(val, maxVal)}`}
                        ></div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
