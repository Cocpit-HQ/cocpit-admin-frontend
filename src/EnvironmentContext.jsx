import React, { createContext, useContext, useState, useEffect } from 'react';

const EnvironmentContext = createContext();

export const useEnvironment = () => {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
};

export const EnvironmentProvider = ({ children }) => {
  // Default to staging as requested
  const [environment, setEnvironment] = useState(() => {
    return localStorage.getItem('admin_environment') || 'staging';
  });

  useEffect(() => {
    localStorage.setItem('admin_environment', environment);
  }, [environment]);

  return (
    <EnvironmentContext.Provider value={{ environment, setEnvironment }}>
      {children}
    </EnvironmentContext.Provider>
  );
};
