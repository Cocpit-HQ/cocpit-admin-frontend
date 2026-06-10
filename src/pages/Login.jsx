import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  const [roleSelection, setRoleSelection] = useState('Administrator');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // If already logged in, redirect away from login page
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Map the selected display name back to the internal role name
    const roleMap = {
      'Administrator': 'admin',
      'Moderator': 'moderator',
      'Developer': 'developer'
    };
    login(roleMap[roleSelection]);
    navigate('/', { replace: true });
  };

  const roles = [
    {
      id: 'Administrator',
      icon: 'shield',
      title: 'Administrator',
      desc: 'System-wide control & security'
    },
    {
      id: 'Moderator',
      icon: 'gavel',
      title: 'Moderator',
      desc: 'Content review & user management'
    },
    {
      id: 'Developer',
      icon: 'code',
      title: 'Developer',
      desc: 'API access & system logs'
    }
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F8F9FE] relative overflow-hidden font-sans pb-10">
      {/* Background Graphic Elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#E8E8FF] blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#F0E6FF] blur-[100px] rounded-full pointer-events-none"></div>
      
      {/* Top Logo Area */}
      <div className="relative z-10 flex flex-col items-center mb-8">
        <div className="w-[72px] h-[72px] bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center mb-4 relative overflow-hidden">
          {/* Recreate the COCKPIT logo mark */}
          <div className="flex flex-col items-start gap-[2px]">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-black rounded-full"></div>
              <div className="w-6 h-2.5 bg-black rounded-sm transform skew-x-[-20deg]"></div>
            </div>
            <div className="w-3 h-6 bg-black rounded-sm rounded-bl-xl ml-0.5"></div>
            <div className="w-8 h-2.5 bg-black rounded-sm transform skew-x-[-20deg] ml-0.5 mt-[-2px]"></div>
          </div>
        </div>
        <h1 className="text-[#3A22D4] text-[28px] font-black tracking-widest uppercase">Cockpit</h1>
      </div>

      <div className="relative z-10 w-full max-w-[540px] px-4">
        {/* Main Login Card */}
        <div className="bg-white border border-gray-100/50 p-8 sm:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
          <div className="text-center mb-10">
            <h2 className="text-[32px] font-extrabold text-[#0D152E] tracking-tight mb-2">Welcome back</h2>
            <p className="text-[15px] text-gray-500 font-medium">Select your operational environment to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Role Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {roles.map((role) => {
                const isSelected = roleSelection === role.id;
                return (
                  <div 
                    key={role.id}
                    onClick={() => setRoleSelection(role.id)}
                    className={`cursor-pointer border rounded-2xl p-4 flex flex-col items-center text-center transition-all duration-200 ${
                      isSelected 
                        ? 'border-[#3A22D4] bg-[#F8F7FF] shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors ${
                      isSelected ? 'bg-[#3A22D4] text-white' : 'bg-[#F0F2F5] text-gray-600'
                    }`}>
                      <span className="material-symbols-outlined text-[20px]" style={isSelected ? { fontVariationSettings: "'FILL' 1" } : {}}>{role.icon}</span>
                    </div>
                    <h3 className={`text-[13px] font-bold mb-1 ${isSelected ? 'text-[#0D152E]' : 'text-gray-700'}`}>
                      {role.title}
                    </h3>
                    <p className="text-[11px] text-gray-400 leading-tight px-1 font-medium">
                      {role.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-800 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">mail</span>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-[#F8F9FC] border border-gray-200 rounded-xl focus:bg-white focus:border-[#3A22D4] focus:ring-4 focus:ring-[#3A22D4]/10 outline-none transition-all text-[15px] text-[#0D152E] font-medium placeholder:text-gray-400 placeholder:font-normal"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-gray-800 uppercase tracking-wider block">Password</label>
                <button type="button" className="text-[13px] text-[#3A22D4] hover:underline font-semibold">Forgot password?</button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-[20px]">lock</span>
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-[#F8F9FC] border border-gray-200 rounded-xl focus:bg-white focus:border-[#3A22D4] focus:ring-4 focus:ring-[#3A22D4]/10 outline-none transition-all text-[15px] text-[#0D152E] font-medium tracking-widest placeholder:tracking-widest placeholder:text-gray-400"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 focus:outline-none flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-1 pb-2">
              <input 
                type="checkbox" 
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#3A22D4] focus:ring-[#3A22D4] cursor-pointer"
              />
              <label htmlFor="remember" className="text-[13px] text-gray-500 font-medium cursor-pointer select-none">
                Remember this session for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="w-full py-4 bg-[#3A22D4] text-white rounded-xl text-[15px] font-bold hover:bg-[#2C18A8] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(58,34,212,0.25)]"
            >
              Sign In as {roleSelection}
              <span className="material-symbols-outlined text-[20px] font-bold" style={{ fontVariationSettings: "'wght' 600" }}>arrow_forward</span>
            </button>
          </form>

        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[13px] text-gray-500 font-medium">
            Authorized personnel only. <button className="text-[#3A22D4] font-bold hover:underline ml-1">Request access</button>
          </p>
        </div>
      </div>
    </div>
  );
}
