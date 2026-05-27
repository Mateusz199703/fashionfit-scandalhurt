import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getToken } from '../api/client';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { client, loading } = useAuth();
  const location = useLocation();

  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
      </div>
    );
  }

  if (!client) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
