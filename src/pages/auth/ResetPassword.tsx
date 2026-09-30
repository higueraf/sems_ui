import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../api/auth.api';

const schema = z.object({
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme la contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});
type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await authApi.resetPassword(token, data.newPassword);
      setDone(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'El enlace es inválido o ha expirado. Solicite uno nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003918] via-[#005c2a] to-[#003918] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/20">
            <KeyRound className="text-[#7ee8a2]" size={32} />
          </div>
          <h1 className="font-heading font-bold text-3xl text-white mb-1">Restablecer contraseña</h1>
          <p className="text-[#a0d8b3] text-sm">SEMS</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="text-green-600" size={26} />
              </div>
              <h2 className="font-heading font-bold text-lg text-gray-800 mb-2">Contraseña actualizada</h2>
              <p className="text-sm text-gray-500 mb-6">Ya puede iniciar sesión con su nueva contraseña.</p>
              <div className="flex flex-col gap-2">
                <Link to="/portal/login" className="text-[#007F3A] font-semibold hover:underline text-sm">
                  Ir al Portal de Autores
                </Link>
                <Link to="/dashboard/login" className="text-gray-400 hover:text-[#007F3A] text-xs">
                  Ir al panel de administración
                </Link>
              </div>
            </div>
          ) : !token ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-4">
                Este enlace no es válido. Solicite uno nuevo desde la página de inicio de sesión.
              </p>
              <Link to="/dashboard/login" className="text-[#007F3A] font-semibold hover:underline text-sm">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-heading font-bold text-xl text-gray-800 mb-2">Elija una nueva contraseña</h2>
              <p className="text-sm text-gray-500 mb-6">Mínimo 6 caracteres.</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="form-label">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-input pr-10"
                      autoComplete="new-password"
                      autoFocus
                      {...register('newPassword')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPass(!showPass)}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="form-error">{errors.newPassword.message}</p>}
                </div>

                <div>
                  <label className="form-label">Confirmar contraseña</label>
                  <input
                    type={showPass ? 'text' : 'password'}
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
                  {isSubmitting ? 'Guardando...' : 'Restablecer contraseña'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
