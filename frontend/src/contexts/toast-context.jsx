import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastContext = createContext(null);

const TOAST_DURATION_MS = 5000;

const VARIANT_STYLES = {
  error: "border-destructive/40 bg-destructive/10 text-destructive",
  success: "border-ama-cyan/50 bg-ama-light text-ama-blue-dark",
};

function Toaster({ toasts, onDismiss }) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-none fixed top-4 right-4 z-[200] flex w-[min(100vw-2rem,22rem)] flex-col gap-2"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={cn(
            "pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm shadow-lg",
            VARIANT_STYLES[toast.variant],
          )}
        >
          <p className="min-w-0 flex-1 leading-snug">{toast.message}</p>
          <button
            type="button"
            className="shrink-0 rounded p-0.5 opacity-70 transition hover:opacity-100"
            onClick={() => onDismiss(toast.id)}
            aria-label="Fechar aviso"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, variant) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
      return id;
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({
      error: (message) => push(message, "error"),
      success: (message) => push(message, "success"),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de ToastProvider.");
  }
  return context;
}
