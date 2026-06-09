import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const navigate = useNavigate();
  
  const notifications = [
    {
      id: 1,
      type: 'policy',
      title: 'Admin updated moderation rules',
      description: 'System-wide moderation guidelines were refreshed by Alan Rivera for better compliance.',
      time: 'Just now',
      icon: 'security',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      id: 2,
      type: 'moderation',
      title: 'Admin suspended user #402',
      description: 'User account suspended for repeated violations of platform community standards.',
      time: '15m ago',
      icon: 'gavel',
      color: 'text-error',
      bgColor: 'bg-error/10'
    },
    {
      id: 3,
      type: 'alert',
      title: 'Dead Letter Queue Spike',
      description: '42 jobs failed in WEBHOOK_PAYMENT_FAILURE. Automated retry initiated.',
      time: '1h ago',
      icon: 'error',
      color: 'text-error',
      bgColor: 'bg-error/10'
    },
    {
      id: 4,
      type: 'system',
      title: 'Database Load Warning',
      description: 'PostgreSQL active connections at 84/150. Monitor for potential bottleneck.',
      time: '2h ago',
      icon: 'database',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      id: 5,
      type: 'system',
      title: 'System backup completed',
      description: 'Daily snapshot of user and organization databases successfully archived to cold storage.',
      time: 'Yesterday',
      icon: 'cloud_done',
      color: 'text-tertiary',
      bgColor: 'bg-tertiary/10'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-xl">
      {/* Header Section */}
      <div className="mb-lg flex items-center gap-md">
        <button 
          onClick={() => navigate(-1)} 
          className="p-sm hover:bg-surface-container rounded-full transition-colors flex items-center justify-center" 
          aria-label="Go back"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div>
          <h3 className="font-display-lg text-display-lg text-on-background">All Notifications</h3>
          <p className="text-body-lg text-on-surface-variant">Comprehensive log of system activities, moderation events, and alerts.</p>
        </div>
      </div>

      {/* Toolbar Section */}
      <div className="flex flex-col md:flex-row gap-md mb-lg justify-between items-center">
        <div className="relative w-full md:w-[400px]">
          <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">search</span>
          <input 
            type="text" 
            placeholder="Search notifications..." 
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-full py-sm pl-xl pr-md text-body-md focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        
        <div className="flex gap-sm w-full md:w-auto overflow-x-auto pb-xs md:pb-0">
          <button className="flex items-center gap-xs px-md py-sm bg-surface border border-outline-variant rounded-full text-body-sm font-medium hover:bg-surface-container transition-colors whitespace-nowrap">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Type: All
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
          <button className="flex items-center gap-xs px-md py-sm bg-surface border border-outline-variant rounded-full text-body-sm font-medium hover:bg-surface-container transition-colors whitespace-nowrap">
            <span className="material-symbols-outlined text-[18px]">person</span>
            User: Any
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
          <button className="flex items-center gap-xs px-md py-sm bg-surface border border-outline-variant rounded-full text-body-sm font-medium hover:bg-surface-container transition-colors whitespace-nowrap">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            Date: Last 7 Days
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden mb-lg">
        {notifications.map((notif, index) => (
          <div key={notif.id} className={`p-lg flex gap-md items-center hover:bg-surface-container transition-colors cursor-pointer ${index !== notifications.length - 1 ? 'border-b border-outline-variant' : ''}`}>
            <div className={`w-12 h-12 rounded-full ${notif.bgColor} flex items-center justify-center shrink-0 ${notif.color}`}>
              <span className="material-symbols-outlined text-[24px]">{notif.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-headline-sm text-headline-sm text-on-surface mb-xs truncate">{notif.title}</p>
              <p className="font-body-md text-body-md text-on-surface-variant truncate">{notif.description}</p>
            </div>
            <div className="shrink-0 text-right ml-md">
              <p className="font-mono-label text-xs text-outline">{notif.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-md text-body-sm text-on-surface-variant px-sm">
        <div>Showing 1-10 of 142 reports</div>
        <div className="flex items-center gap-xs">
          <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-surface-container disabled:opacity-50">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded bg-primary text-on-primary font-medium">1</button>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container">2</button>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container">3</button>
          <span className="px-xs">...</span>
          <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container">15</button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant hover:bg-surface-container">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
