import { Navigate, Route, Routes } from 'react-router-dom';
import { PermissionGuard } from '../components/PermissionGuard';
import { AdminLayout } from '../layouts/AdminLayout';
import { DashboardPage } from '../pages/Dashboard';
import { LoginPage } from '../pages/Login';
import { NotFoundPage } from '../pages/NotFound';
import { SystemSettingsPage } from '../pages/SystemSettings';
import { UserManagementPage } from '../pages/UserManagement';

export const AppRouter = (): JSX.Element => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PermissionGuard>
            <AdminLayout />
          </PermissionGuard>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route
          path="users"
          element={
            <PermissionGuard allowRoles={['admin']}>
              <UserManagementPage />
            </PermissionGuard>
          }
        />
        <Route
          path="settings"
          element={
            <PermissionGuard allowRoles={['admin']}>
              <SystemSettingsPage />
            </PermissionGuard>
          }
        />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
