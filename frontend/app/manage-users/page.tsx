'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { authService } from '@/lib/auth';
import { useToast } from '@/components/ToastProvider';
import { AuthUser, UserStatus } from '@/types/auth';

export default function ManageUsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || !['admin', 'developer'].includes(currentUser.role)) {
      router.replace('/login');
      return;
    }
    const loadUsers = async () => {
      try {
        const data = await authService.listUsers();
        setUsers(data);
      } catch (error) {
        toast(error instanceof Error ? error.message : 'Gagal memuat user', 'error');
      }
    };
    loadUsers();
  }, [router, toast]);

  const refreshUsers = async () => {
    try {
      const data = await authService.listUsers();
      setUsers(data);
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Gagal memuat user', 'error');
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u)));
  };

  const handleApprove = async (userId: string) => {
    try {
      const user = users.find((u) => u.id === userId);
      const role = user?.role ?? 'driver';
      await authService.updateUserStatus(userId, 'approved', role as any);
      toast('User berhasil disetujui.', 'success');
      refreshUsers();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Gagal mengubah status', 'error');
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await authService.updateUserStatus(userId, 'rejected');
      toast('User berhasil ditolak.', 'success');
      refreshUsers();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Gagal mengubah status', 'error');
    }
  };

  const handleDelete = async (userId: string) => {
    const confirmed = window.confirm('Hapus akun user ini?');
    if (!confirmed) return;
    try {
      await authService.deleteUser(userId);
      toast('User berhasil dihapus.', 'success');
      refreshUsers();
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Gagal menghapus user', 'error');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Header
        title="Manage User"
        subtitle="Persetujuan Akun"
        description="Kelola pendaftaran user dan tentukan status akun mereka."
        right={
          <div className="flex items-center gap-3">
            <Link href="/" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Beranda</Link>
            <button
              type="button"
              onClick={() => {
                authService.logout();
                toast('Anda telah keluar.', 'success');
                router.push('/login');
              }}
              className="inline-flex items-center justify-center rounded-full border border-rose-300 bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Logout
            </button>
          </div>
        }
      />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/40">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Daftar User</h2>
              <p className="mt-2 text-sm text-slate-600">User yang mendaftar akan muncul di sini sampai disetujui admin.</p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Nama</th>
                  <th className="px-4 py-3 text-left font-semibold">Email</th>
                  <th className="px-4 py-3 text-left font-semibold">Role</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-slate-900">{user.name}</td>
                    <td className="px-4 py-3 text-slate-700">{user.email}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700"
                      >
                        <option value="driver">driver</option>
                        <option value="admin">admin</option>
                        <option value="developer">developer</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{user.status}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {user.status !== 'approved' && (
                          <button onClick={() => handleApprove(user.id)} className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Approve</button>
                        )}
                        {user.status !== 'rejected' && (
                          <button onClick={() => handleReject(user.id)} className="rounded-full bg-amber-600 px-3 py-2 text-sm font-semibold text-white">Reject</button>
                        )}
                        <button onClick={() => handleDelete(user.id)} className="rounded-full bg-rose-600 px-3 py-2 text-sm font-semibold text-white">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
