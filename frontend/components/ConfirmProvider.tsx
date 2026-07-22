"use client";

import React, { createContext, useCallback, useContext, useState } from 'react';

type ConfirmOptions = { title?: string; description?: string };

type ConfirmContextValue = (message: string, opts?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export const ConfirmProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<{
    open: boolean;
    message: string;
    resolve?: (value: boolean) => void;
  }>({ open: false, message: '' });

  const confirm = useCallback((message: string) => {
    return new Promise<boolean>((resolve) => {
      setState({ open: true, message, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    if (state.resolve) state.resolve(result);
    setState({ open: false, message: '', resolve: undefined });
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {state.open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
          <div className="max-w-lg w-full rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 text-slate-900 text-lg font-semibold">Konfirmasi</div>
            <div className="mb-6 text-slate-700">{state.message}</div>
            <div className="flex justify-end gap-3">
              <button
                className="rounded-md px-4 py-2 bg-slate-100 text-slate-700"
                onClick={() => handleClose(false)}
              >
                Batal
              </button>
              <button
                className="rounded-md px-4 py-2 bg-rose-600 text-white"
                onClick={() => handleClose(true)}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmContextValue => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
};

export default ConfirmProvider;
