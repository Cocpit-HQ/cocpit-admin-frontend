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
import DetailedAnalytics from './pages/DetailedAnalytics';
import AppealsQueue from './pages/AppealsQueue';
import Thoughts from './pages/Thoughts';
import AiAnalytics from './pages/AiAnalytics';
import ContactSupport from './pages/ContactSupport';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './ThemeContext';
import RoleGuard from './components/RoleGuard';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route element={<RoleGuard><Layout /></RoleGuard>}>
        <Route index element={<Dashboard />} />
        <Route path="detailed-analytics" element={<RoleGuard allowedRoles={['admin', 'developer']}><DetailedAnalytics /></RoleGuard>} />
        
        {/* Admin & Developer only */}
        <Route path="users" element={<RoleGuard allowedRoles={['admin', 'developer']}><UserManagement /></RoleGuard>} />
        <Route path="organizations" element={<RoleGuard allowedRoles={['admin', 'developer']}><Organizations /></RoleGuard>} />
        <Route path="ai-analytics" element={<RoleGuard allowedRoles={['admin', 'developer']}><AiAnalytics /></RoleGuard>} />

        {/* Developer only */}
        <Route path="controls" element={<RoleGuard allowedRoles={['developer']}><SystemControls /></RoleGuard>} />
        
        {/* Admin & Moderator only */}
        <Route path="moderation" element={<RoleGuard allowedRoles={['admin', 'moderator']}><ModerationQueue /></RoleGuard>} />
        <Route path="appeals" element={<RoleGuard allowedRoles={['admin', 'moderator']}><AppealsQueue /></RoleGuard>} />
        <Route path="review-history" element={<RoleGuard allowedRoles={['admin', 'moderator']}><ReviewHistory /></RoleGuard>} />
        
        {/* All roles */}
        <Route path="thoughts" element={<Thoughts />} />
        <Route path="support" element={<ContactSupport />} />
        <Route path="health" element={<SystemHealth />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile/:id" element={<UserProfile />} />
        <Route path="org-profile/:id" element={<OrganizationProfile />} />
        <Route path="organizations/:id" element={<OrganizationProfile />} />
      </Route>
      {/* Catch-all route for non-existent paths */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
