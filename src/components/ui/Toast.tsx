import { useEffect } from "react";
import { useAppStore } from "../../store/useAppStore";

export interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

const COLORS = {
  success: "var(--green)",
  error:   "var(--red)",
  info:    "var(--accent)",
};

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  return (
    <div style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 200,
      display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none",
    }}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDone={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDone }: { toast: ToastMessage; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 3500);
    return () => clearTimeout(id);
  }, [onDone]);

  const color = COLORS[toast.type];
  return (
    <div style={{
      background: "var(--card)", border: `1px solid ${color}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 6, padding: "8px 14px",
      fontSize: 12, color: "var(--text)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      animation: "fadeSlideIn 0.15s ease-out",
      pointerEvents: "auto",
      maxWidth: 300,
    }}>
      {toast.message}
    </div>
  );
}
