import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [roleSelection, setRoleSelection] = useState('admin');

  // If already logged in, redirect away from login page
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(roleSelection);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface-container-lowest relative overflow-hidden">
      {/* Background Graphic Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-container/20 blur-[100px] rounded-full"></div>
      
      <div className="relative z-10 w-full max-w-[448px]">
        {/* Card */}
        <div className="bg-surface/80 backdrop-blur-xl border border-outline-variant p-xl rounded-2xl shadow-xl">
          <div className="text-center mb-xl">
            <div className="w-16 h-16 bg-primary-container text-primary rounded-xl flex items-center justify-center mx-auto mb-md shadow-sm">
              <span className="material-symbols-outlined text-4xl">admin_panel_settings</span>
            </div>
            <h1 className="font-display-lg text-display-lg font-bold text-on-surface">AdminConsole</h1>
            <p className="font-body-md text-on-surface-variant mt-xs">Secure Platform Access</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-lg">
            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface-variant block">Select Role</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">person</span>
                <select 
                  value={roleSelection}
                  onChange={(e) => setRoleSelection(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                >
                  <option value="admin">Administrator</option>
                  <option value="moderator">Moderator</option>
                  <option value="developer">Developer</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">arrow_drop_down</span>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-primary text-on-primary rounded-xl font-label-md text-label-md hover:opacity-90 transition-opacity active:scale-95 shadow-md shadow-primary/20 flex items-center justify-center gap-2"
            >
              Authenticate
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </form>

          <div className="mt-xl text-center">
            <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center justify-center gap-1">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Protected by Enterprise SSO
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
