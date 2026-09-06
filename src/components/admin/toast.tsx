"use client";

import { useEffect, useState } from "react";

export const TOAST_EVENT = "admin:toast";

export function notify(message: string, ok = true) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, { detail: { message, ok } })
  );
}

type Toast = { id: number; message: string; ok: boolean };

export function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const on = (e: Event) => {
      const { message, ok } = (e as CustomEvent).detail as {
        message: string;
        ok: boolean;
      };
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message, ok }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
    };
    window.addEventListener(TOAST_EVENT, on);
    return () => window.removeEventListener(TOAST_EVENT, on);
  }, []);

  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.ok ? "toast-ok" : "toast-err"}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}