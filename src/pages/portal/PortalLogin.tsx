import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, EyeOff, BookOpen } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { eventsApi } from '../../api/events.api';
import { useAuthStore } from '../../store/auth.store';
import { formatEventDateRange } from '../../utils';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});
type FormValues = z.infer<typeof schema>;

export default function PortalLogin() {
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const eventName = event?.name || 'Simposio Internacional de Ciencia Abierta';
  const eventDateRange = formatEventDateRange(event?.startDate, event?.endDate);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const { accessToken, user } = await authApi.login(data.email, data.password);
      if (user.role !== 'author') {
        toast.error('Esta área es exclusiva para autores. Use el panel de administración.');
        return;
      }
      setAuth(user, accessToken);
      toast.success(`Bienvenido/a, ${user.firstName}`);
      navigate('/portal');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003918] via-[#005c2a] to-[#003918] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/20">
            <BookOpen className="text-[#7ee8a2]" size={32} />
          </div>
          <h1 className="font-heading font-bold text-3xl text-white mb-1">Portal de Autores</h1>
          <p className="text-[#a0d8b3] text-sm">{eventName}{eventDateRange ? ` ${eventDateRange.year}` : ''}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="font-heading font-bold text-xl text-gray-800 mb-2">Iniciar Sesión</h2>
          <p className="text-sm text-gray-500 mb-6">
            Accede con las credenciales que llegaron a tu correo al postularte.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="form-label">Correo Electrónico</label>
              <input
                type="email"
                className="form-input"
                placeholder="autor@ejemplo.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="form-label">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input pr-10"
                  placeholder="Contraseña temporal recibida por correo"
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#007F3A] hover:bg-[#005c2a] text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Ingresando...' : 'Acceder al portal'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              ¿Eres administrador o evaluador?{' '}
              <Link to="/dashboard/login" className="text-[#007F3A] font-medium hover:underline">
                Accede aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
