import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** true mientras se verifica el token al arranque */
  isInitializing: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setInitializing: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitializing: true,
      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true, isInitializing: false });
      },
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, isInitializing: false });
      },
      setInitializing: (value) => set({ isInitializing: value }),
    }),
    {
      name: 'sems_auth',
      // Persistimos user, token e isAuthenticated para rehidratar correctamente
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
