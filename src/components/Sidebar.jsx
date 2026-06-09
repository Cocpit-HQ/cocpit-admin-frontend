import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { logout, role } = useAuth();
  const allNavItems = [
    { name: 'Dashboard', path: '/', icon: 'dashboard', roles: ['admin', 'moderator', 'developer'] },
    { name: 'Users', path: '/users', icon: 'group', roles: ['admin', 'developer'] },
    { name: 'Moderation', path: '/moderation', icon: 'gavel', roles: ['admin', 'moderator'] },
    { name: 'Organizations', path: '/organizations', icon: 'corporate_fare', roles: ['admin', 'developer'] },
    { name: 'System Health', path: '/health', icon: 'analytics', roles: ['admin', 'moderator', 'developer'] },
    { name: 'System Controls', path: '/controls', icon: 'toggle_on', roles: ['developer'] },
  ];
  const navItems = allNavItems.filter(item => item.roles.includes(role || 'admin'));

  return (
    <aside className={`fixed left-0 top-0 h-full w-[280px] bg-surface border-r border-outline-variant flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="p-lg">
        <h1 className="font-headline-md text-headline-md font-bold text-primary">AdminConsole</h1>
        <p className="text-on-surface-variant font-label-md text-label-md">Platform Control</p>
      </div>
      <nav className="flex-1 mt-md">
        <ul className="space-y-xs">
          {navItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-md px-lg py-md transition-all active:scale-95 border-l-4 ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container border-primary'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border-transparent'
                  }`
                }
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="font-body-md text-body-md">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-lg border-t border-outline-variant space-y-xs">
        <button 
          onClick={logout} 
          className="w-full flex items-center gap-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high px-md py-sm rounded transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-body-md text-body-md">Logout</span>
        </button>
        <div className="mt-lg flex items-center gap-md">
          <img
            alt="Admin Avatar"
            className="w-10 h-10 rounded-full object-cover border border-outline-variant"
            src="https://ui-avatars.com/api/?name=Alex+Rivera&background=3525cd&color=fff"
          />
          <div>
            <p className="font-label-md text-label-md font-bold capitalize">{role || 'Admin'} User</p>
            <p className="text-body-sm text-on-surface-variant capitalize">{role || 'Super Admin'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
