import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { ThemeProvider } from './contexts/ThemeContext';
import { useKeepAlive } from './hooks/useKeepAlive';
import { useAuthInit } from './hooks/useAuthInit';
import './styles/navbar-fix.css';
import './styles/mobile-fix.css';

// Public pages
import PublicLayout from './components/public/PublicLayout';
import Home from './pages/public/Home';
import Guidelines from './pages/public/Guidelines';
import OrganizersPage from './pages/public/OrganizersPage';
import Submit from './pages/public/Submit';
import AgendaPublic from './pages/public/AgendaPublic';
import CheckStatus from './pages/public/CheckStatus';
import PreviousEvents from './pages/public/PreviousEvents';
import Workshops from './pages/public/Workshops';

// Dashboard pages
import DashboardLayout from './components/dashboard/DashboardLayout';
import Login from './pages/dashboard/Login';
import DashboardHome from './pages/dashboard/DashboardHome';
import Submissions from './pages/dashboard/Submissions';
import SubmissionDetail from './pages/dashboard/SubmissionDetail';
import AgendaBuilder from './pages/dashboard/AgendaBuilder';
import EventsAdmin from './pages/dashboard/EventsAdmin';
import CountriesAdmin from './pages/dashboard/CountriesAdmin';
import OrganizersAdmin from './pages/dashboard/OrganizersAdmin';
import GuidelinesAdmin from './pages/dashboard/GuidelinesAdmin';
import ThematicAxesAdmin from './pages/dashboard/ThematicAxesAdmin';
import ProductTypesAdmin from './pages/dashboard/ProductTypesAdmin';
import PageSectionsAdmin from './pages/dashboard/PageSectionsAdmin';
import UsersAdmin from './pages/dashboard/UsersAdmin';

/**
 * Ruta protegida.
 * Mientras isInitializing=true mostramos un splash neutro para evitar
 * el flash de redirección al login antes de que se valide el token.
 */
function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, isInitializing, user } = useAuthStore();

  // Esperar validación del token antes de tomar decisiones de navegación
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Verificando sesión…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/dashboard/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/**
 * Componente interior que inicializa auth y keep-alive.
 * Debe estar dentro de BrowserRouter para que useNavigate funcione.
 */
function AppInner() {
  useAuthInit();
  useKeepAlive();
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppInner />
        <Routes>
          {/* Public */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/pautas" element={<Guidelines />} />
            <Route path="/organizadores" element={<OrganizersPage />} />
            <Route path="/postular" element={<Submit />} />
            <Route path="/agenda" element={<AgendaPublic />} />
            <Route path="/simposios" element={<PreviousEvents />} />
            <Route path="/talleres" element={<Workshops />} />
            <Route path="/verificar" element={<CheckStatus />} />
          </Route>

          {/* Dashboard */}
          <Route path="/dashboard/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="postulaciones" element={<Submissions />} />
            <Route path="postulaciones/:id" element={<SubmissionDetail />} />
            <Route path="agenda" element={<AgendaBuilder />} />
            <Route
              path="eventos"
              element={
                <PrivateRoute adminOnly>
                  <EventsAdmin />
                </PrivateRoute>
              }
            />
            <Route
              path="paises"
              element={
                <PrivateRoute adminOnly>
                  <CountriesAdmin />
                </PrivateRoute>
              }
            />
            <Route
              path="organizadores"
              element={
                <PrivateRoute adminOnly>
                  <OrganizersAdmin />
                </PrivateRoute>
              }
            />
            <Route
              path="pautas"
              element={
                <PrivateRoute adminOnly>
                  <GuidelinesAdmin />
                </PrivateRoute>
              }
            />
            <Route
              path="ejes-tematicos"
              element={
                <PrivateRoute adminOnly>
                  <ThematicAxesAdmin />
                </PrivateRoute>
              }
            />
            <Route
              path="tipos-producto"
              element={
                <PrivateRoute adminOnly>
                  <ProductTypesAdmin />
                </PrivateRoute>
              }
            />
            <Route
              path="contenido"
              element={
                <PrivateRoute adminOnly>
                  <PageSectionsAdmin />
                </PrivateRoute>
              }
            />
            <Route
              path="usuarios"
              element={
                <PrivateRoute adminOnly>
                  <UsersAdmin />
                </PrivateRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
