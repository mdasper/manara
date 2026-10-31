import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import DashboardLayout from '@/layouts/DashboardLayout';

// Auth & Dedicated Portals
import LoginPage from '@/pages/LoginPage';
import TenantPortalPage from '@/pages/TenantPortalPage';

// Admin Dashboard Pages
import DashboardPage from '@/pages/DashboardPage';
import PropertiesPage from '@/pages/PropertiesPage';
import NewPropertyPage from '@/pages/NewPropertyPage';
import PropertyDetailPage from '@/pages/PropertyDetailPage';
import UnitsPage from '@/pages/UnitsPage';
import TenantsPage from '@/pages/TenantsPage';
import NewTenantPage from '@/pages/NewTenantPage';
import TenantDetailPage from '@/pages/TenantDetailPage';
import LeasesPage from '@/pages/LeasesPage';
import PaymentsPage from '@/pages/PaymentsPage';
import MaintenancePage from '@/pages/MaintenancePage';
import ReportsPage from '@/pages/ReportsPage';
import CalendarPage from '@/pages/CalendarPage';
import AIAssistantPage from '@/pages/AIAssistantPage';
import AIDashboardPage from '@/pages/AIDashboardPage';
import NotificationsPage from '@/pages/NotificationsPage';

export default function App() {
  return (
    <Routes>
      {/* Public / Entry routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/tenant-portal" element={<TenantPortalPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Admin Shell Routes */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/new" element={<NewPropertyPage />} />
        <Route path="/properties/:id" element={<PropertyDetailPage />} />
        <Route path="/units" element={<UnitsPage />} />
        <Route path="/tenants" element={<TenantsPage />} />
        <Route path="/tenants/new" element={<NewTenantPage />} />
        <Route path="/tenants/:id" element={<TenantDetailPage />} />
        <Route path="/leases" element={<LeasesPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/ai-assistant" element={<Navigate to="/dashboard" replace />} />
        <Route path="/ai-dashboard" element={<AIDashboardPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

