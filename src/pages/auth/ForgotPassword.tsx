import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound, Mail, ArrowLeft } from 'lucide-react';
import { authApi } from '../../api/auth.api';

const schema = z.object({
  email: z.string().email('Email inválido'),
});
type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
    } catch {
      // El backend siempre responde éxito para no filtrar qué correos existen;
      // solo mostramos error ante una falla real de red/servidor.
      toast.error('Ocurrió un error. Intente de nuevo más tarde.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003918] via-[#005c2a] to-[#003918] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/20">
            <KeyRound className="text-[#7ee8a2]" size={32} />
          </div>
          <h1 className="font-heading font-bold text-3xl text-white mb-1">Recuperar contraseña</h1>
          <p className="text-[#a0d8b3] text-sm">SEMS</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-primary-600" size={26} />
              </div>
              <h2 className="font-heading font-bold text-lg text-gray-800 mb-2">Revise su correo</h2>
              <p className="text-sm text-gray-500 mb-6">
                Si existe una cuenta con ese correo, le enviamos un enlace para restablecer su contraseña.
                El enlace expira en 1 hora.
              </p>
              <Link to="/dashboard/login" className="text-[#007F3A] font-semibold hover:underline text-sm">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-heading font-bold text-xl text-gray-800 mb-2">¿Olvidó su contraseña?</h2>
              <p className="text-sm text-gray-500 mb-6">
                Ingrese su correo electrónico y le enviaremos un enlace para restablecerla.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="correo@ejemplo.com"
                    autoComplete="email"
                    autoFocus
                    {...register('email')}
                  />
                  {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-[#007F3A] hover:bg-[#005c2a] text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-2">
                <Link to="/dashboard/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#007F3A]">
                  <ArrowLeft size={14} /> Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
