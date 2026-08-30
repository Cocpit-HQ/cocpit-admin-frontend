import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTheme } from '../ThemeContext';
import { useEnvironment } from '../EnvironmentContext';
import GlobalSearch from './GlobalSearch';

export default function Header({ toggleSidebar }) {
  const { logout, role, accessToken } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { environment, setEnvironment } = useEnvironment();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const dropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!accessToken) return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/admin/dashboard/notifications', {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'x-environment': environment
          }
        });
        if (res.ok) {
          const data = await res.json();
          const newNotifications = [];
          if (data.appeals > 0) {
            newNotifications.push({
              id: 'appeals',
              type: 'escalation',
              title: `${data.appeals} New Appeal${data.appeals > 1 ? 's' : ''}`,
              description: 'Users have submitted new moderation appeals.',
              time: 'Just now',
              path: '/moderation',
              icon: 'gavel',
              color: 'text-tertiary'
            });
          }
          if (data.reports > 0) {
            newNotifications.push({
              id: 'reports',
              type: 'system',
              title: `${data.reports} Report${data.reports > 1 ? 's' : ''}`,
              description: 'Reports pending review in moderation queue.',
              time: 'Just now',
              path: '/moderation',
              icon: 'report',
              color: 'text-error'
            });
          }
          if (data.organizations > 0) {
            newNotifications.push({
              id: 'orgs',
              type: 'system',
              title: `${data.organizations} Organization${data.organizations > 1 ? 's' : ''} Pending`,
              description: 'Organizations waiting for verification.',
              time: 'Just now',
              path: '/organizations',
              icon: 'business',
              color: 'text-primary'
            });
          }
          setNotifications(newNotifications);
          setHasUnread(newNotifications.length > 0);
        }
      } catch (e) {
        console.error('Failed to fetch notifications', e);
      }
    };
    fetchNotifications();
    
    // Refresh every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [accessToken]);

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
        <GlobalSearch />
      </div>
      <div className="flex items-center gap-2 md:gap-md shrink-0">
        
        {/* Environment Selector */}
        <select
          value={environment}
          onChange={(e) => {
            setEnvironment(e.target.value);
            // Optional: force reload to refetch everything
            window.location.reload();
          }}
          className="bg-surface border border-outline-variant text-on-surface font-label-md rounded-md px-2 py-1 outline-none focus:border-primary capitalize cursor-pointer"
          title="Select Environment"
        >
          <option value="production">Production</option>
          <option value="staging">Staging</option>
          <option value="uat">UAT</option>
        </select>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="material-symbols-outlined p-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-all"
          title="Toggle Theme"
        >
          {theme === 'dark' ? 'light_mode' : 'dark_mode'}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative material-symbols-outlined p-2 rounded-full transition-all ${isNotificationsOpen ? 'bg-primary-container text-on-primary-container' : 'hover:bg-surface-container text-on-surface-variant'
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
