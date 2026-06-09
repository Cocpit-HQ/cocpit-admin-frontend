import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function RoleGuard({ allowedRoles, children, fallback = null }) {
  const { role, isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return fallback ? <>{fallback}</> : (
      <div className="flex-1 flex items-center justify-center p-xl">
        <div className="text-center space-y-md bg-surface-container-low p-xl rounded-xl border border-outline-variant max-w-md w-full">
          <span className="material-symbols-outlined text-error text-[48px]">block</span>
          <h2 className="font-headline-md text-on-surface">Access Denied</h2>
          <p className="font-body-md text-on-surface-variant">Your current role ({role}) does not have permission to view this content.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
