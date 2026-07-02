import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Header({ toggleSidebar }) {
  const { logout, role } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  const notifications = [
    {
      id: 1,
      type: 'alert',
      title: 'Dead Letter Queue Spike',
      description: '42 jobs failed in WEBHOOK_PAYMENT_FAILURE.',
      time: 'Just now',
      path: '/health',
      icon: 'error',
      color: 'text-error'
    },
    {
      id: 2,
      type: 'escalation',
      title: 'High-Risk Organization Flagged',
      description: 'Automated review flagged "Global Tech Corp".',
      time: '5m ago',
      path: '/moderation',
      icon: 'gavel',
      color: 'text-tertiary'
    },
    {
      id: 3,
      type: 'system',
      title: 'Database Load Warning',
      description: 'PostgreSQL active connections at 84/150.',
      time: '1h ago',
      path: '/health',
      icon: 'database',
      color: 'text-secondary'
    }
  ];

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef, profileDropdownRef]);

  const handleNotificationClick = (path) => {
    setIsNotificationsOpen(false);
    navigate(path);
  };

  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-80px)] h-16 bg-surface-container-lowest flex justify-between items-center px-4 md:px-margin-desktop z-30 transition-all duration-300">
      <div className="flex items-center gap-2 md:gap-xl flex-1 min-w-0">
        <button 
          className="md:hidden material-symbols-outlined text-on-surface p-1 rounded hover:bg-surface-container transition-colors shrink-0" 
          onClick={toggleSidebar}
        >
          menu
        </button>
        <h2 className="hidden sm:block font-headline-sm text-headline-sm font-black text-on-surface shrink-0">AdminConsole</h2>
        <div className="relative w-full max-w-[448px] focus-within:ring-2 focus-within:ring-primary rounded-full transition-all min-w-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input 
            type="text" 
            placeholder="Search users..." 
            className="w-full bg-surface-container-low border border-outline-variant rounded-full py-2 pl-10 pr-4 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none min-w-0 truncate"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-md shrink-0">
        
        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative material-symbols-outlined p-2 rounded-full transition-all ${
              isNotificationsOpen ? 'bg-primary-container text-on-primary-container' : 'hover:bg-surface-container text-on-surface-variant'
            }`}
          >
            notifications
            {/* Unread badge indicator */}
            {hasUnread && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface-container-lowest"></span>}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-surface border border-outline-variant rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
                <h3 className="font-headline-sm text-headline-sm text-on-surface">Notifications</h3>
                {hasUnread && (
                  <button onClick={() => setHasUnread(false)} className="text-primary font-label-md hover:underline">Mark all read</button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notif) => (
                  <button 
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif.path)}
                    className="w-full text-left p-md border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors flex gap-md items-start"
                  >
                    <div className={`w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 ${notif.color}`}>
                      <span className="material-symbols-outlined text-[20px]">{notif.icon}</span>
                    </div>
                    <div>
                      <p className="font-label-md text-label-md text-on-surface">{notif.title}</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs line-clamp-2">{notif.description}</p>
                      <p className="font-mono-label text-xs text-outline mt-sm">{notif.time}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="p-sm text-center bg-surface-container-lowest border-t border-outline-variant">
                <button onClick={() => handleNotificationClick('/notifications')} className="text-secondary font-label-md hover:text-on-surface">View all alerts</button>
              </div>
            </div>
          )}
        </div>

        <button className="material-symbols-outlined hover:bg-surface-container p-2 rounded-full transition-all text-on-surface-variant hidden md:block">help</button>
        <div className="w-px h-6 bg-outline-variant mx-1 md:mx-2"></div>
        {/* Profile Dropdown */}
        <div className="relative" ref={profileDropdownRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center focus:outline-none cursor-pointer"
          >
            <img
              alt="Administrator Profile"
              className="w-8 h-8 rounded-full border border-outline-variant shrink-0"
              src="https://ui-avatars.com/api/?name=Alex+Rivera&background=3525cd&color=fff"
            />
          </button>
          
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-outline-variant rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
                <p className="font-label-md text-label-md font-bold capitalize">{role || 'Admin'} User</p>
                <p className="text-body-sm text-on-surface-variant capitalize">{role || 'Super Admin'}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-error hover:bg-error-container/30 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  <span className="font-label-md">Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
