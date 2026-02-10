import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { Role } from '../types';
import { useAuth } from '../store/AuthContext';

interface PermissionGuardProps {
  children: JSX.Element;
  allowRoles?: Role[];
}

export const PermissionGuard = ({ children, allowRoles }: PermissionGuardProps): JSX.Element => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowRoles && !allowRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
