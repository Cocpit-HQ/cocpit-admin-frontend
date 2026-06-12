import React, { useState, useRef, useEffect } from 'react';
import { format, subDays, startOfYear, startOfDay } from 'date-fns';

export default function DatePickerDropdown({ onRangeChange, initialRangeLabel = 'Last 30 Days' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(initialRangeLabel);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRangeSelect = (rangeLabel) => {
    setSelectedRange(rangeLabel);
    setIsOpen(false);
    setDateError('');

    const today = new Date();
    let start = today;
    let end = today;

    if (rangeLabel === 'Today') {
      start = startOfDay(today);
    } else if (rangeLabel === 'Last 7 Days') {
      start = subDays(today, 6);
    } else if (rangeLabel === 'Last 30 Days') {
      start = subDays(today, 29);
    } else if (rangeLabel === 'This Year') {
      start = startOfYear(today);
    }

    onRangeChange({ startDate: start, endDate: end });
  };

  const handleCustomApply = () => {
    if (!startDate || !endDate) {
      setDateError('Please select both dates.');
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    if (start > today || end > today) {
      setDateError('Future dates are not allowed.');
      return;
    }
    if (start > end) {
      setDateError('Start date must be before end date.');
      return;
    }

    setDateError('');
    setSelectedRange('Custom');
    setIsOpen(false);
    onRangeChange({ startDate: start, endDate: end });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-surface border ${isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-outline-variant'} px-md py-sm rounded-lg flex items-center gap-sm font-label-md text-label-md hover:bg-surface-container transition-all`}
      >
        <span className="material-symbols-outlined text-body-md">calendar_today</span>
        {selectedRange === 'Custom' && startDate && endDate 
          ? `${format(new Date(startDate), 'MMM d, yyyy')} - ${format(new Date(endDate), 'MMM d, yyyy')}` 
          : selectedRange}
        <span className="material-symbols-outlined text-body-md ml-xs">{isOpen ? 'expand_less' : 'expand_more'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Quick Selects */}
          <div className="p-2 flex flex-col gap-1">
            {['Today', 'Last 7 Days', 'Last 30 Days', 'This Year'].map((range) => (
              <button
                key={range}
                onClick={() => handleRangeSelect(range)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-between ${
                  selectedRange === range 
                    ? 'bg-[#4f46e5] text-white font-medium shadow-sm' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {range}
                {selectedRange === range && <span className="material-symbols-outlined text-[18px]">check</span>}
              </button>
            ))}
          </div>

          {/* Custom Range */}
          <div className="border-t border-gray-100 p-5 bg-slate-50/50">
            <p className="text-[11px] font-semibold text-gray-500 mb-4 uppercase tracking-wider">Custom Range</p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Start Date</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={startDate}
                    max={todayStr}
                    onChange={(e) => { setStartDate(e.target.value); setDateError(''); }}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-all cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">End Date</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={endDate}
                    max={todayStr}
                    onChange={(e) => { setEndDate(e.target.value); setDateError(''); }}
                    className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5] transition-all cursor-pointer"
                  />
                </div>
              </div>
              {dateError && <p className="text-red-500 text-[11px] font-medium">{dateError}</p>}
              
              <button 
                onClick={handleCustomApply}
                className="w-full mt-2 bg-[#312e81] hover:bg-[#3730a3] text-white py-2.5 rounded-lg text-sm font-semibold transition-all active:scale-95 shadow-sm"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
