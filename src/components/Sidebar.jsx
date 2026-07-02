import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { logout, role } = useAuth();
  const location = useLocation();

  const allNavItems = [
    { name: 'Dashboard', path: '/', icon: 'dashboard', roles: ['admin', 'moderator', 'developer'], section: 'System' },
    { name: 'Users', path: '/users', icon: 'group', roles: ['admin', 'developer'], section: 'System' },
    { name: 'Moderation', path: '/moderation', icon: 'gavel', roles: ['admin', 'moderator'], section: 'System' },
    { name: 'Organizations', path: '/organizations', icon: 'corporate_fare', roles: ['admin', 'developer'], section: 'System' },
    { name: 'System Health', path: '/health', icon: 'analytics', roles: ['admin', 'moderator', 'developer'], section: 'System' },
    { name: 'System Controls', path: '/controls', icon: 'toggle_on', roles: ['developer'], section: 'System' },
    { name: 'Feed', path: '/detailed-analytics?metric=feed_engagement', icon: 'feed', roles: ['admin', 'developer'], section: 'Core' },
    { name: 'Connection', path: '/detailed-analytics?metric=new_connections', icon: 'people', roles: ['admin', 'developer'], section: 'Core' },
    { name: 'Jobs', path: '/detailed-analytics?metric=active_jobs', icon: 'work', roles: ['admin', 'developer'], section: 'Work' },
    // { name: 'Events', path: '/detailed-analytics?metric=upcoming_events', icon: 'event', roles: ['admin', 'developer'], section: 'Work' }
  ];

  const sections = ['System', 'Core', 'Work'];
  const groupedItems = sections.map(section => ({
    title: section,
    items: allNavItems.filter(item => item.roles.includes(role || 'admin') && item.section === section)
  })).filter(group => group.items.length > 0);

  return (
    <aside className={`group fixed left-0 top-0 h-full bg-surface border-r border-outline-variant flex flex-col z-50 transform transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-[280px] md:w-[80px] md:hover:w-[280px] overflow-hidden`}>
      <div className="h-20 flex items-center px-6 shrink-0 border-b border-outline-variant/50 mb-2">
        <span className="material-symbols-outlined text-primary text-[28px] shrink-0">admin_panel_settings</span>
        <div className="ml-4 flex flex-col whitespace-nowrap transition-opacity duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100">
          <h1 className="font-headline-md text-headline-md font-bold text-primary">AdminConsole</h1>
          <p className="text-on-surface-variant font-label-md text-[11px] uppercase tracking-wider mt-0.5">Platform Control</p>
        </div>
      </div>
      <nav className="flex-1 mt-md overflow-y-auto overflow-x-hidden pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {groupedItems.map(group => (
          <div key={group.title} className="mb-4 md:mb-0 md:group-hover:mb-4 transition-all duration-300">
            <div className="px-6 py-2 md:py-0 md:group-hover:py-2 transition-all duration-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 h-8 md:h-0 md:group-hover:h-8 overflow-hidden flex items-center">
              <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider whitespace-nowrap">{group.title}</h3>
            </div>
            <ul className="space-y-xs">
              {group.items.map((item) => {
                const isActive = item.path === '/' 
                  ? location.pathname === '/' 
                  : (location.pathname + location.search) === item.path || (location.pathname === item.path && !item.path.includes('?'));

                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center px-6 py-4 transition-all active:scale-95 border-l-4 ${isActive
                        ? 'bg-primary-container text-on-primary-container border-primary'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined shrink-0 text-[24px]">{item.icon}</span>
                      <span className="font-body-md text-body-md whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 ml-4">{item.name}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="p-6 border-t border-outline-variant flex flex-col gap-6 shrink-0 overflow-hidden">
        <button
          onClick={logout}
          className="w-full flex items-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined shrink-0 text-[24px]">logout</span>
          <span className="font-body-md text-body-md whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 ml-4">Logout</span>
        </button>
        <div className="flex items-center">
          <img
            alt="Admin Avatar"
            className="w-[32px] h-[32px] rounded-full object-cover border border-outline-variant shrink-0"
            src="https://ui-avatars.com/api/?name=Alex+Rivera&background=3525cd&color=fff"
          />
          <div className="ml-4 whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
            <p className="font-label-md text-label-md font-bold capitalize">{role || 'Admin'} User</p>
            <p className="text-body-sm text-on-surface-variant capitalize">{role || 'Super Admin'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
