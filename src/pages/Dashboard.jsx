import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState('Last 30 Days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const datePickerRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsDatePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRangeSelect = (range) => {
    setSelectedRange(range);
    setIsDatePickerOpen(false);
  };

  const today = new Date().toISOString().split('T')[0];

  const handleCustomApply = () => {
    if (!startDate || !endDate) {
      setDateError('Please select both dates.');
      return;
    }
    if (startDate > today || endDate > today) {
      setDateError('Future dates are not allowed.');
      return;
    }
    if (startDate > endDate) {
      setDateError('Start date must be before end date.');
      return;
    }
    setDateError('');
    setSelectedRange('Custom');
    setIsDatePickerOpen(false);
  };

  const handleExport = () => {
    setIsExporting(true);
    // Simulate network request and file generation
    setTimeout(() => {
      const csvContent = "data:text/csv;charset=utf-8,Metric,Value,Growth\nTotal Users,2400000,12%\nActive Users,850000,4%\nPlatform Growth,4.2%,-\n";
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `dashboard_report_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
      setIsExportModalOpen(false);
    }, 800);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-lg flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-10">
        <div>
          <h3 className="font-display-lg text-display-lg text-on-background">System Overview</h3>
          <p className="text-body-lg text-on-surface-variant">Real-time performance metrics and ecosystem health.</p>
        </div>
        <div className="flex flex-wrap items-center gap-sm md:gap-md w-full md:w-auto">
          {/* Date Picker Dropdown */}
          <div className="relative" ref={datePickerRef}>
            <button 
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className={`bg-surface border ${isDatePickerOpen ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant'} px-md py-sm rounded-lg flex items-center gap-sm font-label-md text-label-md hover:bg-surface-container transition-all`}
            >
              <span className="material-symbols-outlined text-body-md">calendar_today</span>
              {selectedRange === 'Custom' ? `${startDate || 'Start'} - ${endDate || 'End'}` : selectedRange}
              <span className="material-symbols-outlined text-body-md ml-xs">{isDatePickerOpen ? 'expand_less' : 'expand_more'}</span>
            </button>

            {isDatePickerOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-surface border border-outline-variant rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-sm">
                  {['Today', 'Last 7 Days', 'Last 30 Days', 'This Year'].map((range) => (
                    <button
                      key={range}
                      onClick={() => handleRangeSelect(range)}
                      className={`w-full text-left px-md py-sm rounded-xl text-body-md transition-all duration-200 flex items-center justify-between ${selectedRange === range ? 'bg-primary-container text-on-primary-container font-semibold' : 'hover:bg-surface-container text-on-surface'}`}
                    >
                      {range}
                      {selectedRange === range && <span className="material-symbols-outlined text-[18px]">check</span>}
                    </button>
                  ))}
                </div>
                <div className="border-t border-outline-variant p-md bg-surface-container-lowest">
                  <p className="text-[11px] font-mono-label text-on-surface-variant mb-md uppercase tracking-wider">Custom Range</p>
                  <div className="flex flex-col gap-md">
                    <div>
                      <label className="block text-[11px] font-mono-label text-on-surface-variant mb-xs ml-1">START DATE</label>
                      <input 
                        type="date" 
                        value={startDate}
                        max={today}
                        onChange={(e) => { setStartDate(e.target.value); setDateError(''); }}
                        className="w-full bg-surface border border-outline-variant rounded-xl px-md py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono-label text-on-surface-variant mb-xs ml-1">END DATE</label>
                      <input 
                        type="date" 
                        value={endDate}
                        max={today}
                        onChange={(e) => { setEndDate(e.target.value); setDateError(''); }}
                        className="w-full bg-surface border border-outline-variant rounded-xl px-md py-2 text-body-sm text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                      />
                    </div>
                    {dateError && <p className="text-error text-[11px] font-medium">{dateError}</p>}
                    <button 
                      onClick={handleCustomApply}
                      className="w-full bg-primary text-on-primary py-2 rounded-xl text-label-md font-semibold hover:bg-primary/90 transition-all active:scale-95"
                    >
                      Apply Range
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {role === 'admin' && (
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className={`relative overflow-hidden bg-primary text-on-primary px-lg py-2.5 rounded-xl flex items-center gap-sm font-label-md text-label-md shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:scale-95`}
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export Report
            </button>
          )}
        </div>
      </div>
      
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg mb-lg">
        <div className="bg-surface p-lg rounded-xl border border-outline-variant hover:border-primary transition-all group">
          <div className="flex justify-between items-start mb-md">
            <div className="p-sm bg-primary-fixed rounded-lg text-on-primary-fixed">
              <span className="material-symbols-outlined">group</span>
            </div>
            <span className="text-tertiary font-label-md text-label-md flex items-center gap-xs">
              <span className="material-symbols-outlined text-body-sm">trending_up</span>
              +12%
            </span>
          </div>
          <p className="text-on-surface-variant font-label-md text-label-md">Total Users</p>
          <h4 className="font-headline-md text-headline-md font-bold mt-xs">2.4M</h4>
          <div className="mt-md w-full bg-surface-variant h-1 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-[70%] group-hover:w-[75%] transition-all duration-700"></div>
          </div>
        </div>
        <div className="bg-surface p-lg rounded-xl border border-outline-variant hover:border-primary transition-all group">
          <div className="flex justify-between items-start mb-md">
            <div className="p-sm bg-secondary-container rounded-lg text-on-secondary-container">
              <span className="material-symbols-outlined">bolt</span>
            </div>
            <span className="text-on-surface-variant font-label-md text-label-md flex items-center gap-xs">
              <span className="material-symbols-outlined text-body-sm">check_circle</span>
              Healthy
            </span>
          </div>
          <p className="text-on-surface-variant font-label-md text-label-md">Active Users</p>
          <h4 className="font-headline-md text-headline-md font-bold mt-xs">850k</h4>
          <div className="mt-md w-full bg-surface-variant h-1 rounded-full overflow-hidden">
            <div className="bg-secondary h-full w-[45%] group-hover:w-[48%] transition-all duration-700"></div>
          </div>
        </div>
        <div className="bg-surface p-lg rounded-xl border border-outline-variant hover:border-primary transition-all group">
          <div className="flex justify-between items-start mb-md">
            <div className="p-sm bg-tertiary-fixed rounded-lg text-on-tertiary-fixed">
              <span className="material-symbols-outlined">show_chart</span>
            </div>
            <span className="text-tertiary font-label-md text-label-md flex items-center gap-xs">
              <span className="material-symbols-outlined text-body-sm">trending_up</span>
              Strong
            </span>
          </div>
          <p className="text-on-surface-variant font-label-md text-label-md">User Growth %</p>
          <h4 className="font-headline-md text-headline-md font-bold mt-xs">4.2%</h4>
          <div className="mt-md w-full bg-surface-variant h-1 rounded-full overflow-hidden">
            <div className="bg-tertiary h-full w-[60%] group-hover:w-[65%] transition-all duration-700"></div>
          </div>
        </div>
        <div className="bg-surface p-lg rounded-xl border border-outline-variant hover:border-primary transition-all group">
          <div className="flex justify-between items-start mb-md">
            <div className="p-sm bg-primary-fixed rounded-lg text-on-primary-fixed">
              <span className="material-symbols-outlined">domain</span>
            </div>
            <span className="text-tertiary font-label-md text-label-md flex items-center gap-xs">
              <span className="material-symbols-outlined text-body-sm">trending_up</span>
              +5%
            </span>
          </div>
          <p className="text-on-surface-variant font-label-md text-label-md">Total Organisations</p>
          <h4 className="font-headline-md text-headline-md font-bold mt-xs">1.2k</h4>
          <div className="mt-md w-full bg-surface-variant h-1 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-[60%] group-hover:w-[65%] transition-all duration-700"></div>
          </div>
        </div>
        <div className="bg-surface p-lg rounded-xl border border-outline-variant hover:border-primary transition-all group">
          <div className="flex justify-between items-start mb-md">
            <div className="p-sm bg-secondary-container rounded-lg text-on-secondary-container">
              <span className="material-symbols-outlined">domain_verification</span>
            </div>
            <span className="text-on-surface-variant font-label-md text-label-md flex items-center gap-xs">
              <span className="material-symbols-outlined text-body-sm">check_circle</span>
              Healthy
            </span>
          </div>
          <p className="text-on-surface-variant font-label-md text-label-md">Active Organisations</p>
          <h4 className="font-headline-md text-headline-md font-bold mt-xs">950</h4>
          <div className="mt-md w-full bg-surface-variant h-1 rounded-full overflow-hidden">
            <div className="bg-secondary h-full w-[80%] group-hover:w-[85%] transition-all duration-700"></div>
          </div>
        </div>
        <div className="bg-surface p-lg rounded-xl border border-outline-variant hover:border-primary transition-all group">
          <div className="flex justify-between items-start mb-md">
            <div className="p-sm bg-tertiary-fixed rounded-lg text-on-tertiary-fixed">
              <span className="material-symbols-outlined">show_chart</span>
            </div>
            <span className="text-tertiary font-label-md text-label-md flex items-center gap-xs">
              <span className="material-symbols-outlined text-body-sm">trending_up</span>
              Steady
            </span>
          </div>
          <p className="text-on-surface-variant font-label-md text-label-md">Organisation Growth %</p>
          <h4 className="font-headline-md text-headline-md font-bold mt-xs">2.8%</h4>
          <div className="mt-md w-full bg-surface-variant h-1 rounded-full overflow-hidden">
            <div className="bg-tertiary h-full w-[40%] group-hover:w-[45%] transition-all duration-700"></div>
          </div>
        </div>
      </div>

      {/* Bento Layout Main */}
      <div className="grid grid-cols-12 gap-lg pb-xl">
        {/* Platform Growth Chart */}
        <div className="col-span-12 lg:col-span-8 bg-surface border border-outline-variant rounded-xl p-lg flex flex-col">
          <div className="flex justify-between items-center mb-xl">
            <div>
              <h5 className="font-headline-sm text-headline-sm font-bold">Platform Growth</h5>
              <p className="text-body-sm text-on-surface-variant">User vs Organisation acquisition</p>
            </div>
            <div className="flex gap-md">
              <div className="flex items-center gap-xs">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="text-body-sm">New Users</span>
              </div>
              <div className="flex items-center gap-xs">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }}></span>
                <span className="text-body-sm">New Organisations</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-[320px] relative mt-auto">
            <div className="absolute inset-0 flex flex-col justify-between text-on-surface-variant text-[10px] font-mono-label opacity-50">
              <div className="border-t border-outline-variant/30 pt-1 w-full">250k</div>
              <div className="border-t border-outline-variant/30 pt-1 w-full">200k</div>
              <div className="border-t border-outline-variant/30 pt-1 w-full">150k</div>
              <div className="border-t border-outline-variant/30 pt-1 w-full">100k</div>
              <div className="border-t border-outline-variant/30 pt-1 w-full">50k</div>
              <div className="border-b border-outline-variant/30 pb-1 w-full">0</div>
            </div>
            <div className="absolute inset-0 pt-2 pb-6 flex items-end">
              <svg className="w-full h-full preserve-3d transition-transform duration-300 ease-out hover:scale-[1.01]" viewBox="0 0 1000 300">
                {/* User Growth Line */}
                <path d="M0,280 Q100,240 200,260 T400,180 T600,150 T800,80 T1000,40 L1000,300 L0,300 Z" fill="url(#chartFill)"></path>
                <path d="M0,280 Q100,240 200,260 T400,180 T600,150 T800,80 T1000,40" fill="none" stroke="#3525cd" strokeWidth="4"></path>
                
                {/* Organisation Growth Line */}
                <path d="M0,290 Q100,285 200,270 T400,250 T600,220 T800,190 T1000,160 L1000,300 L0,300 Z" fill="url(#orgChartFill)"></path>
                <path d="M0,290 Q100,285 200,270 T400,250 T600,220 T800,190 T1000,160" fill="none" stroke="#10b981" strokeWidth="4"></path>
                
                <defs>
                  <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3525cd" stopOpacity="0.15"></stop>
                    <stop offset="100%" stopColor="#3525cd" stopOpacity="0"></stop>
                  </linearGradient>
                  <linearGradient id="orgChartFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.15"></stop>
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                <circle cx="800" cy="80" fill="#3525cd" r="6" stroke="#fff" strokeWidth="2"></circle>
                <circle cx="800" cy="190" fill="#10b981" r="6" stroke="#fff" strokeWidth="2"></circle>
              </svg>
            </div>
          </div>
          <div className="flex justify-between px-md text-body-sm text-on-surface-variant mt-md">
            <span>Oct 01</span>
            <span>Oct 07</span>
            <span>Oct 14</span>
            <span>Oct 21</span>
            <span>Oct 28</span>
            <span>Today</span>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="col-span-12 lg:col-span-4 bg-surface border border-outline-variant rounded-xl flex flex-col overflow-hidden">
          <div className="p-lg border-b border-outline-variant">
            <h5 className="font-headline-sm text-headline-sm font-bold">Recent Activity</h5>
            <p className="text-body-sm text-on-surface-variant">Critical system and moderator events</p>
          </div>
          <div className="flex-1 overflow-y-auto p-md space-y-md">
            <div className="flex gap-md group cursor-pointer">
              <div className="mt-1 relative">
                <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                </div>
                <div className="absolute top-8 bottom-[-24px] left-4 border-l border-dashed border-outline-variant group-last:hidden"></div>
              </div>
              <div className="flex-1 pb-md border-b border-outline-variant group-last:border-none">
                <div className="flex justify-between items-start">
                  <p className="font-body-md text-body-md font-semibold">{role === 'moderator' ? 'You reviewed 15 cases' : 'Admin updated moderation rules'}</p>
                  <span className="text-[10px] text-on-surface-variant font-mono-label">12m ago</span>
                </div>
                <p className="text-body-sm text-on-surface-variant mt-xs">{role === 'moderator' ? 'Completed your queue for the morning shift.' : 'System-wide moderation guidelines were refreshed by Alex Rivera for better compliance.'}</p>
              </div>
            </div>
            <div className="flex gap-md group cursor-pointer">
              <div className="mt-1 relative">
                <div className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                </div>
                <div className="absolute top-8 bottom-[-24px] left-4 border-l border-dashed border-outline-variant group-last:hidden"></div>
              </div>
              <div className="flex-1 pb-md border-b border-outline-variant group-last:border-none">
                <div className="flex justify-between items-start">
                  <p className="font-body-md text-body-md font-semibold">{role === 'moderator' ? 'You escalated 2 high severity cases' : 'Admin suspended user #402'}</p>
                  <span className="text-[10px] text-on-surface-variant font-mono-label">45m ago</span>
                </div>
                <p className="text-body-sm text-on-surface-variant mt-xs">{role === 'moderator' ? 'Sent 2 Tier 3 cases to the admin team for review.' : 'User account suspended for repeated violations of platform community standards.'}</p>
              </div>
            </div>
          </div>
          <div className="p-md bg-surface-container-low text-center">
            <button onClick={() => navigate('/notifications')} className="text-primary font-label-md text-label-md hover:underline">View All Notifications</button>
          </div>
        </div>

      </div>

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="bg-surface border border-outline-variant w-[400px] max-w-[90vw] rounded-xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-on-surface">Export Data</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</button>
            </div>
            
            <p className="text-sm text-on-surface-variant mb-6">Select format to download the dashboard metrics.</p>
            
            <div className="flex flex-col gap-3 mb-6">
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors">
                <input type="radio" name="format" value="csv" checked={exportFormat === 'csv'} onChange={() => setExportFormat('csv')} className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">CSV Format</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors">
                <input type="radio" name="format" value="pdf" checked={exportFormat === 'pdf'} onChange={() => setExportFormat('pdf')} className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">PDF Format</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-surface-container transition-colors">Cancel</button>
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center gap-2"
              >
                {isExporting ? <span className="material-symbols-outlined text-[16px] animate-spin">sync</span> : null}
                {isExporting ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
