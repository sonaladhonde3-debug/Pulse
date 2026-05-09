import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookie from 'js-cookie';
import { api } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  profile_picture?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.auth.login(username, password);
          
          Cookie.set('access_token', response.data.access);
          Cookie.set('refresh_token', response.data.refresh);
          
          // Fetch user profile
          const userResponse = await api.users.getProfile();
          
          set({
            user: userResponse.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      signup: async (data: any) => {
        set({ isLoading: true, error: null });
        try {
          await api.auth.signup(data);
          
          // Auto-login after signup
          await get().login(data.username, data.password);
        } catch (error: any) {
          set({
            error: error.response?.data?.detail || 'Signup failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        Cookie.remove('access_token');
        Cookie.remove('refresh_token');
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      checkAuth: async () => {
        const token = Cookie.get('access_token');
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          const response = await api.users.getProfile();
          set({
            user: response.data,
            isAuthenticated: true,
          });
        } catch (error) {
          set({ isAuthenticated: false });
          Cookie.remove('access_token');
          Cookie.remove('refresh_token');
        }
      },

      updateUser: (data: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-store',
    }
  )
);
