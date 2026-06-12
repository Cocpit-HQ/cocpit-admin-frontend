import React, { useState, useRef, useEffect } from 'react';
import { DateRange } from 'react-date-range';
import { subDays, format, startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import 'react-date-range/dist/styles.css'; 
import 'react-date-range/dist/theme/default.css'; 

export default function FilterModal({ isOpen, onClose, onApply, initialRange }) {
  const [filterType, setFilterType] = useState('Custom'); // Day, Week, Month, Year, Custom
  const [dateRange, setDateRange] = useState([
    {
      startDate: initialRange?.startDate || subDays(new Date(), 30),
      endDate: initialRange?.endDate || new Date(),
      key: 'selection'
    }
  ]);
  
  const modalRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleFilterSelect = (type) => {
    setFilterType(type);
    const today = new Date();
    if (type === 'Day') {
      setDateRange([{ startDate: startOfDay(today), endDate: today, key: 'selection' }]);
    } else if (type === 'Week') {
      setDateRange([{ startDate: startOfWeek(today), endDate: today, key: 'selection' }]);
    } else if (type === 'Month') {
      setDateRange([{ startDate: startOfMonth(today), endDate: today, key: 'selection' }]);
    } else if (type === 'Year') {
      setDateRange([{ startDate: startOfYear(today), endDate: today, key: 'selection' }]);
    }
  };

  const handleApply = () => {
    onApply(dateRange[0]);
    onClose();
  };

  const isCustom = filterType === 'Custom';

  return (
    <div ref={modalRef} className="absolute right-0 top-full mt-2 z-50 bg-white rounded-2xl w-[420px] shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Filter by</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5">
          {/* Pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['Day', 'Week', 'Month', 'Year', 'Custom'].map(type => (
              <button
                key={type}
                onClick={() => handleFilterSelect(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  filterType === type 
                    ? 'bg-primary text-on-primary border-primary shadow-sm' 
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {filterType === type && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
                {filterType !== type && <span className="material-symbols-outlined text-[14px]">radio_button_unchecked</span>}
                {type}
              </button>
            ))}
          </div>

          {/* Custom Date Selection UI */}
          {isCustom && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 mb-1 text-center">Select Start Date*</span>
                  <div className="px-3 py-2 border border-primary/30 bg-primary/5 rounded-lg text-sm font-medium text-primary text-center shadow-inner">
                    {format(dateRange[0].startDate, 'MMM dd, yyyy')}
                  </div>
                </div>
                <div className="flex-1 flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 mb-1 text-center">Select End Date*</span>
                  <div className="px-3 py-2 border border-primary/30 bg-primary/5 rounded-lg text-sm font-medium text-primary text-center shadow-inner">
                    {format(dateRange[0].endDate, 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>

              {/* Calendar */}
              <div className="border border-gray-100 rounded-xl overflow-hidden self-center shadow-sm">
                <DateRange
                  onChange={item => {
                    setDateRange([item.selection]);
                    setFilterType('Custom');
                  }}
                  showSelectionPreview={true}
                  moveRangeOnFirstSelection={false}
                  months={1}
                  ranges={dateRange}
                  direction="horizontal"
                  rangeColors={['#1d4ed8']} // Standard primary blue
                  showMonthAndYearPickers={false}
                  showDateDisplay={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <button 
            onClick={handleApply}
            className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-md shadow-primary/20"
          >
            Apply Filter
          </button>
        </div>
      </div>
  );
}
