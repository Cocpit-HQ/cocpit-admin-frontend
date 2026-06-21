import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null); // 'Admin', 'Moderator', 'Developer'
  const [accessToken, setAccessToken] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  React.useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await fetch('/api/auth/refresh', { method: 'POST' });
        if (response.ok) {
          const data = await response.json();
          setAccessToken(data.accessToken);
          setIsLoggedIn(true);
          const userRoles = data.roles || [];
          const primaryRole = userRoles.find(r => ['Admin', 'Moderator', 'Developer'].includes(r)) || 'Admin';
          setRole(primaryRole.toLowerCase());
        }
      } catch (err) {
        console.error('Session restore failed:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, []);

  if (isInitializing) {
    return <div className="flex h-screen items-center justify-center bg-surface text-on-surface font-body-md">Loading session...</div>;
  }

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error('Server returned an invalid response (is the backend running?)');
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setAccessToken(data.accessToken);
      setIsLoggedIn(true);
      // Assuming user.roles is an array, take the highest priority role or a specific one
      const userRoles = data.user.roles || [];
      const primaryRole = userRoles.find(r => ['Admin', 'Moderator', 'Developer'].includes(r)) || 'Admin';
      setRole(primaryRole.toLowerCase());
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
  
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setIsLoggedIn(false);
      setRole(null);
      setAccessToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, role, accessToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
