import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

export default function PortalPrivateRoute() {
  const { isAuthenticated, isInitializing, user } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Verificando sesión…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/portal/login" replace />;
  if (user?.role !== 'author' && user?.role !== 'evaluator') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
