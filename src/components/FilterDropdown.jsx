import React, { useState, useRef, useEffect } from 'react';

export default function FilterDropdown({ label, options, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 border border-outline rounded-full bg-surface text-on-surface hover:bg-surface-variant transition-colors"
      >
        <span className="material-symbols-outlined text-[20px] text-on-surface-variant">filter_list</span>
        <span className="text-label-md font-medium">{label}: {value}</span>
        <span className="material-symbols-outlined text-[20px] text-on-surface-variant">arrow_drop_down</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface-container-high rounded-xl shadow-lg border border-outline py-2 z-10">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-body-md hover:bg-surface-variant transition-colors ${
                value === option.value ? 'bg-primary-container text-on-primary-container font-medium' : 'text-on-surface'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
