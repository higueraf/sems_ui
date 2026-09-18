import { Link, Navigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useScrollToTop } from '../../hooks/useScrollToTop';

export default function Submit() {
  useScrollToTop();
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#007F3A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // El autor ya tiene sesión: la creación de postulaciones vive en su dashboard.
  if (isAuthenticated) {
    return <Navigate to="/portal" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <LogIn size={28} className="text-primary-600" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-gray-900 mb-2">
          Inicia sesión para postular
        </h1>
        <p className="text-gray-500 mb-8">
          Para enviar tu trabajo científico necesitas una cuenta de autor. Desde tu
          panel podrás dar seguimiento a tu postulación, subir documentos actualizados
          y descargar tus certificados.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to="/portal/login?redirect=/postular"
            className="w-full py-3 px-4 bg-[#007F3A] hover:bg-[#005c2a] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <LogIn size={18} /> Iniciar sesión
          </Link>
          <Link
            to="/portal/registro?redirect=/postular"
            className="w-full py-3 px-4 border-2 border-[#007F3A] text-[#007F3A] hover:bg-[#007F3A]/5 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus size={18} /> Crear cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
