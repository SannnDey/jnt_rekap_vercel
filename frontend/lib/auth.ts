'use client';

import { AuthUser, UserRole, UserStatus } from '@/types/auth';

const STORAGE_KEY = 'jnt_rekap_current_user';

const normalizeUser = (user: any): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  password: user.password,
  role: user.role?.toLowerCase() === 'developer' ? 'developer' : user.role?.toLowerCase() === 'admin' ? 'admin' : 'driver',
  status: user.status?.toLowerCase() === 'approved' ? 'approved' : user.status?.toLowerCase() === 'rejected' ? 'rejected' : 'pending',
  createdAt: user.createdAt,
});

export const authService = {
  getCurrentUser: (): AuthUser | null => {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  setCurrentUser: (user: AuthUser | null) => {
    if (typeof window === 'undefined') return;
    if (!user) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  },

  login: async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Login gagal');
    const user = normalizeUser(result.data);
    authService.setCurrentUser(user);
    return user;
  },

  register: async (name: string, email: string, password: string, role: UserRole = 'driver') => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Registrasi gagal');
    return normalizeUser(result.data);
  },

  listUsers: async () => {
    const response = await fetch('/api/auth/users');
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Gagal mengambil user');
    return (result.data || []).map(normalizeUser);
  },

  updateUserStatus: async (userId: string, status: UserStatus, role?: UserRole) => {
    const body: any = { userId, status };
    if (role) body.role = role;
    const response = await fetch('/api/auth/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Gagal mengubah status');
    return normalizeUser(result.data);
  },

  deleteUser: async (userId: string) => {
    const response = await fetch(`/api/auth/users?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Gagal menghapus user');
    return result;
  },

  logout: () => {
    authService.setCurrentUser(null);
  },
};
