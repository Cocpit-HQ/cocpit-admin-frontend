import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import ModerationQueue from './pages/ModerationQueue';
import Organizations from './pages/Organizations';
import SystemHealth from './pages/SystemHealth';
import SystemControls from './pages/SystemControls';
import UserProfile from './pages/UserProfile';
import OrganizationProfile from './pages/OrganizationProfile';
import Notifications from './pages/Notifications';
import Login from './pages/Login';
import ReviewHistory from './pages/ReviewHistory';
import { AuthProvider } from './AuthContext';
import RoleGuard from './components/RoleGuard';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route element={<RoleGuard><Layout /></RoleGuard>}>
        <Route index element={<Dashboard />} />
        
        {/* Admin & Developer only */}
        <Route path="users" element={<RoleGuard allowedRoles={['admin', 'developer']}><UserManagement /></RoleGuard>} />
        <Route path="organizations" element={<RoleGuard allowedRoles={['admin', 'developer']}><Organizations /></RoleGuard>} />

        {/* Developer only */}
        <Route path="controls" element={<RoleGuard allowedRoles={['developer']}><SystemControls /></RoleGuard>} />
        
        {/* Admin & Moderator only */}
        <Route path="moderation" element={<RoleGuard allowedRoles={['admin', 'moderator']}><ModerationQueue /></RoleGuard>} />
        <Route path="review-history" element={<RoleGuard allowedRoles={['admin', 'moderator']}><ReviewHistory /></RoleGuard>} />
        
        {/* All roles */}
        <Route path="health" element={<SystemHealth />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="org-profile" element={<OrganizationProfile />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
