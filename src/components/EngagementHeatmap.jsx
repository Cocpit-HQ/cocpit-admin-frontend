import React, { useState, useEffect } from 'react';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}h`);

// Color scale for intensities 0-4
const COLOR_SCALE = [
  'bg-indigo-50',   // 0 - Lowest
  'bg-indigo-200',  // 1
  'bg-indigo-400',  // 2
  'bg-indigo-600',  // 3
  'bg-indigo-800'   // 4 - Highest
];

export default function EngagementHeatmap({ activeMetric = 'users', interval = 'Monthly' }) {
  const [data, setData] = useState({});
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    // Generate mock data for the heatmap
    const mockData = {};
    
    // Vary the base values slightly based on the metric and interval so the graph visibly changes
    const metricModifier = activeMetric.length % 3; 
    const intervalModifier = interval === 'Daily' ? 1 : interval === 'Weekly' ? 0 : -1;

    DAYS.forEach(day => {
      mockData[day] = {};
      HOURS.forEach((hour, i) => {
        // Create realistic patterns (higher engagement during typical day hours)
        let baseChance = 0;
        const h = parseInt(hour);
        if (h >= 9 && h <= 17) baseChance = 2 + metricModifier; // Work hours
        if (h >= 18 && h <= 22) baseChance = 3 - metricModifier; // Evening peak
        if (day === 'SAT' || day === 'SUN') baseChance -= 1; // Weekend dip
        
        let intensity = Math.floor(Math.random() * 3) + baseChance + intervalModifier;
        intensity = Math.max(0, Math.min(4, intensity)); // Clamp 0-4
        
        mockData[day][hour] = intensity;
      });
    });
    setData(mockData);
  }, [activeMetric, interval]);

  return (
    <div className="w-full bg-white rounded-lg p-6 border border-gray-200 shadow-sm relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-base font-semibold text-gray-900">Peak Engagement Hours</h3>
        
        {/* Legend */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <span className="mr-1">Low</span>
          {COLOR_SCALE.map((color, idx) => (
            <div key={idx} className={`w-4 h-4 rounded-sm ${color} border border-gray-100`}></div>
          ))}
          <span className="ml-1">High</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[800px]">
          {/* Header Row (Hours) */}
          <div className="flex mb-2">
            <div className="w-12 shrink-0"></div> {/* Spacer for Day labels */}
            <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
              {HOURS.map(hour => (
                <div key={hour} className="text-[10px] text-gray-500 font-mono text-center">
                  {hour}
                </div>
              ))}
            </div>
          </div>

          {/* Grid Rows (Days) */}
          <div className="flex flex-col gap-1">
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex items-center">
                <div className="w-12 shrink-0 text-xs text-gray-500 font-medium text-right pr-3">
                  {day}
                </div>
                <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
                  {HOURS.map((hour, hourIndex) => {
                    const intensity = data[day]?.[hour] || 0;
                    return (
                      <div 
                        key={`${day}-${hour}`}
                        className={`aspect-square rounded-[3px] transition-all cursor-pointer hover:ring-2 hover:ring-gray-400 hover:ring-offset-1 ${COLOR_SCALE[intensity]}`}
                        onMouseEnter={() => setHoveredCell({ day, hour, intensity })}
                        onMouseLeave={() => setHoveredCell(null)}
                      ></div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="absolute top-4 right-1/2 translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded shadow-lg pointer-events-none animate-in fade-in duration-150">
          <span className="font-semibold">{hoveredCell.day} at {hoveredCell.hour}</span>: 
          <span className="ml-1 opacity-90">
            {hoveredCell.intensity === 0 ? 'Very Low' : 
             hoveredCell.intensity === 1 ? 'Low' : 
             hoveredCell.intensity === 2 ? 'Moderate' : 
             hoveredCell.intensity === 3 ? 'High' : 'Very High'} Activity
          </span>
        </div>
      )}
    </div>
  );
}
