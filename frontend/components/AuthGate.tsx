'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';

interface AuthGateProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: Array<'admin' | 'driver' | 'developer'>;
  allowAdminOnly?: boolean;
  allowDriverOnly?: boolean;
}

const publicRoutes = ['/login', '/register'];

export default function AuthGate({ children, requireAuth = true, allowedRoles, allowAdminOnly = false, allowDriverOnly = false }: AuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    const isPublicRoute = publicRoutes.includes(pathname);

    if (isPublicRoute) {
      setReady(true);
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    const role = user.role;
    if (role === 'developer') {
      if (pathname !== '/manage-users') {
        router.replace('/manage-users');
        return;
      }
      setReady(true);
      return;
    }
    if (allowAdminOnly && role !== 'admin') {
      router.replace('/');
      return;
    }
    if (allowDriverOnly && role !== 'driver') {
      router.replace('/');
      return;
    }
    if (allowedRoles && !allowedRoles.includes(role)) {
      router.replace('/');
      return;
    }

    setReady(true);
  }, [allowAdminOnly, allowDriverOnly, allowedRoles, pathname, requireAuth, router]);

  if (!ready) return null;

  return <>{children}</>;
}
