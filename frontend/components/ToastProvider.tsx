"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type Toast = { id: number; message: string; type?: 'info' | 'success' | 'error' };

type ToastContextValue = {
  toast: (message: string, type?: Toast['type']) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [mounted, setMounted] = useState(false);

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((t) => [...t, { id, message, type }]);
  }, []);

  const remove = (id: number) => setToasts((cur) => cur.filter((t) => t.id !== id));
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted && typeof window !== 'undefined' && createPortal(
        <div aria-live="polite" className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <ToastItem key={t.id} id={t.id} message={t.message} type={t.type} onDismiss={() => remove(t.id)} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};


function ToastItem({ id, message, type, onDismiss }: { id: number; message: string; type?: string; onDismiss: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setExiting(true), 4800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!exiting) return;
    const t = window.setTimeout(() => onDismiss(), 240);
    return () => clearTimeout(t);
  }, [exiting, onDismiss]);

  return (
    <div className={`pointer-events-auto max-w-sm rounded-xl px-4 py-3 shadow-lg transition transform bg-white border ${
      type === 'error' ? 'border-rose-200' : type === 'success' ? 'border-emerald-200' : 'border-slate-200'
    } ${exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
      <div className="text-sm text-slate-800">{message}</div>
    </div>
  );
}

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export default ToastProvider;
