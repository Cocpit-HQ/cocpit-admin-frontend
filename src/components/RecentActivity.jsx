import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function RecentActivity() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  useEffect(() => {
    const fetchLogs = async () => {
      if (!accessToken) return;
      try {
        const response = await fetch('/api/admin/audit-logs/recent', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [accessToken]);

  const getIconForRole = (role) => {
    switch (role) {
      case 'Admin': return { icon: 'manage_accounts', bg: 'bg-[#4f46e5]', text: 'text-white' };
      case 'Developer': return { icon: 'code', bg: 'bg-[#10b981]', text: 'text-white' };
      case 'Moderator': return { icon: 'shield_person', bg: 'bg-[#f59e0b]', text: 'text-white' };
      default: return { icon: 'person', bg: 'bg-blue-100', text: 'text-[#4f46e5]' };
    }
  };

  const formatActionText = (actionType) => {
    switch (actionType) {
      case 'LOGIN': return 'logged in securely';
      case 'LOGOUT': return 'logged out';
      case 'UPDATE_RULES': return 'updated moderation rules';
      case 'SUSPEND_USER': return 'suspended a user';
      case 'UNSUSPEND_USER': return 'unsuspended a user';
      case 'DATA_EXPORT': return 'exported system data';
      case 'RESOLVE_TICKET': return 'resolved a support ticket';
      default: return actionType.toLowerCase().replace(/_/g, ' ');
    }
  };

  return (
    <div className="col-span-12 lg:col-span-4 bg-surface border border-outline-variant rounded-xl flex flex-col h-[500px]">
      <div className="p-lg border-b border-outline-variant">
        <h5 className="font-headline-sm text-headline-sm font-bold text-on-surface">Recent Activity</h5>
        <p className="text-body-sm text-on-surface-variant">Critical system and moderator events</p>
      </div>
      
      <div className="p-lg flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-[#4f46e5] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <span className="material-symbols-outlined text-4xl mb-2">history</span>
            <p className="text-sm font-medium">No recent activity</p>
          </div>
        ) : (
          <div className="relative pl-2">
            <div className="absolute left-[34px] top-8 bottom-8 w-px bg-dashed bg-gray-300"></div>
            <div className="space-y-6">
              {logs.map((log, index) => {
                const { bg, text, icon } = getIconForRole(log.adminRole);
                return (
                  <div key={log.id} className="relative flex gap-4 items-start group">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 z-10 ${bg} ${text} shadow-sm ring-4 ring-surface transition-transform group-hover:scale-105`}>
                      <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    </div>
                    <div className="flex-1 pt-1 pb-4 border-b border-gray-100 last:border-0">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h6 className="font-semibold text-gray-800 text-[15px] leading-tight">
                          {log.adminRole === 'System' ? 'System' : log.adminName} {formatActionText(log.actionType)}
                        </h6>
                        <span className="text-[12px] font-medium text-gray-400 whitespace-nowrap">
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-[14px] text-gray-600 leading-snug">
                        {log.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl text-center">
        <button 
          onClick={() => navigate('/notifications')}
          className="text-[#4f46e5] hover:text-[#3730a3] text-sm font-semibold tracking-wide transition-colors"
        >
          View All Notifications
        </button>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .bg-dashed {
          background-image: linear-gradient(to bottom, transparent 50%, #e2e8f0 50%);
          background-size: 100% 8px;
        }
      `}} />
    </div>
  );
}
