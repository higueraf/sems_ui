import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye, EyeOff, User, KeyRound } from 'lucide-react';
import { portalApi } from '../../api/portal.api';
import { useAuthStore } from '../../store/auth.store';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Nombre requerido'),
  lastName: z.string().min(2, 'Apellido requerido'),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});
type PasswordValues = z.infer<typeof passwordSchema>;

export default function PortalAccount() {
  const qc = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const { data: account, isLoading } = useQuery({
    queryKey: ['portal-account'],
    queryFn: portalApi.getAccount,
  });

  const profileForm = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    if (account) {
      profileForm.reset({ firstName: account.firstName, lastName: account.lastName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const profileMutation = useMutation({
    mutationFn: (data: ProfileValues) => portalApi.updateAccount(data),
    onSuccess: (updated) => {
      toast.success('Datos actualizados');
      qc.invalidateQueries({ queryKey: ['portal-account'] });
      // Mantener el store de auth sincronizado con el nombre mostrado en el sidebar
      const current = useAuthStore.getState().user;
      if (current && token) {
        setAuth({ ...current, firstName: updated.firstName, lastName: updated.lastName }, token);
      }
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Error al actualizar los datos'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordValues) => portalApi.changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    }),
    onSuccess: () => {
      toast.success('Contraseña actualizada');
      passwordForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'La contraseña actual es incorrecta'),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Mi cuenta</h1>
        <p className="text-sm text-gray-500 mt-1">Gestiona tus datos personales y tu contraseña.</p>
      </div>

      <div className="space-y-6 max-w-xl">
        {/* Datos de perfil */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-[#007F3A]" />
            <h2 className="text-sm font-bold text-gray-700">Datos personales</h2>
          </div>

          {isLoading ? (
            <p className="text-sm text-gray-400">Cargando…</p>
          ) : (
            <form onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Nombres</label>
                  <input className="form-input" {...profileForm.register('firstName')} />
                  {profileForm.formState.errors.firstName && (
                    <p className="form-error">{profileForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="form-label">Apellidos</label>
                  <input className="form-input" {...profileForm.register('lastName')} />
                  {profileForm.formState.errors.lastName && (
                    <p className="form-error">{profileForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="form-label">Correo electrónico</label>
                <input className="form-input bg-gray-50 text-gray-400" value={account?.email ?? ''} disabled />
                <p className="text-xs text-gray-400 mt-1">El correo no se puede modificar desde aquí.</p>
              </div>
              <button
                type="submit"
                disabled={profileMutation.isPending}
                className="py-2.5 px-5 bg-[#007F3A] hover:bg-[#005c2a] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {profileMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          )}
        </div>

        {/* Cambiar contraseña */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={16} className="text-[#007F3A]" />
            <h2 className="text-sm font-bold text-gray-700">Cambiar contraseña</h2>
          </div>

          <form onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))} className="space-y-4">
            <div>
              <label className="form-label">Contraseña actual</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="form-input pr-10"
                  {...passwordForm.register('currentPassword')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowCurrent((v) => !v)}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordForm.formState.errors.currentPassword && (
                <p className="form-error">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Nueva contraseña</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="form-input pr-10"
                    {...passwordForm.register('newPassword')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowNew((v) => !v)}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="form-error">{passwordForm.formState.errors.newPassword.message}</p>
                )}
              </div>
              <div>
                <label className="form-label">Confirmar contraseña</label>
                <input type="password" className="form-input" {...passwordForm.register('confirmPassword')} />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="form-error">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordMutation.isPending}
              className="py-2.5 px-5 bg-[#007F3A] hover:bg-[#005c2a] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {passwordMutation.isPending ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
