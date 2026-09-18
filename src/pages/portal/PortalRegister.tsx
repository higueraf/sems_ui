import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, EyeOff, BookOpen } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { eventsApi } from '../../api/events.api';
import { useAuthStore } from '../../store/auth.store';
import { formatEventDateRange } from '../../utils';

const schema = z.object({
  firstName: z.string().min(2, 'Nombre requerido'),
  lastName: z.string().min(2, 'Apellido requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});
type FormValues = z.infer<typeof schema>;

export default function PortalRegister() {
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/portal';
  const setAuth = useAuthStore((s) => s.setAuth);

  const { data: event } = useQuery({ queryKey: ['event-active'], queryFn: eventsApi.getActive });
  const eventName = event?.name || 'III Simposio Internacional de Ciencia Abierta 2026';
  const eventDateRange = formatEventDateRange(event?.startDate, event?.endDate);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const { accessToken, user } = await authApi.register(data.firstName, data.lastName, data.email, data.password);
      setAuth(user, accessToken);
      toast.success(`Bienvenido/a, ${user.firstName}`);
      navigate(redirect);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'No se pudo crear la cuenta');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003918] via-[#005c2a] to-[#003918] flex items-center justify-center px-4 py-10">
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
          <h2 className="font-heading font-bold text-xl text-gray-800 mb-2">Crear cuenta</h2>
          <p className="text-sm text-gray-500 mb-6">
            Regístrate para postular tu trabajo científico y gestionar tu participación.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Nombres</label>
                <input className="form-input" autoComplete="given-name" {...register('firstName')} />
                {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="form-label">Apellidos</label>
                <input className="form-input" autoComplete="family-name" {...register('lastName')} />
                {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
              </div>
            </div>

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
                  autoComplete="new-password"
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

            <div>
              <label className="form-label">Confirmar contraseña</label>
              <input
                type="password"
                className="form-input"
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#007F3A] hover:bg-[#005c2a] text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-500">
              ¿Ya tienes cuenta?{' '}
              <Link
                to={`/portal/login${redirect !== '/portal' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
                className="text-[#007F3A] font-semibold hover:underline"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
