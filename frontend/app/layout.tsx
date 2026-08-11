'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './globals.css';
import { ToastProvider } from '@/components/ToastProvider';
import { ConfirmProvider } from '@/components/ConfirmProvider';
import AuthGate from '@/components/AuthGate';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>JNT Rekap - Sistem Rekapan Outgoing Barang</title>
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <ConfirmProvider>
              <AuthGate>{children}</AuthGate>
            </ConfirmProvider>
          </ToastProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
