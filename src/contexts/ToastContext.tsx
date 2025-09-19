"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: ToastAction;
  customContent?: ReactNode;
  persistent?: boolean; // If true, won't auto-dismiss
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => string; // Returns toast ID
  showSuccess: (
    title: string,
    message?: string,
    options?: Partial<Omit<Toast, "id" | "type" | "title" | "message">>
  ) => string;
  showError: (
    title: string,
    message?: string,
    options?: Partial<Omit<Toast, "id" | "type" | "title" | "message">>
  ) => string;
  showInfo: (
    title: string,
    message?: string,
    options?: Partial<Omit<Toast, "id" | "type" | "title" | "message">>
  ) => string;
  showWarning: (
    title: string,
    message?: string,
    options?: Partial<Omit<Toast, "id" | "type" | "title" | "message">>
  ) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, "id">): string => {
      const id = generateId();
      const newToast: Toast = { ...toast, id };

      setToasts((prev) => [...prev, newToast]);

      // Auto remove after duration (unless persistent)
      if (!toast.persistent && toast.duration !== 0) {
        setTimeout(() => {
          removeToast(id);
        }, toast.duration || 10000);
      }

      return id;
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<Omit<Toast, "id" | "type" | "title" | "message">>
    ) => {
      return showToast({ type: "success", title, message, ...options });
    },
    [showToast]
  );

  const showError = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<Omit<Toast, "id" | "type" | "title" | "message">>
    ) => {
      return showToast({ type: "error", title, message, ...options });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<Omit<Toast, "id" | "type" | "title" | "message">>
    ) => {
      return showToast({ type: "info", title, message, ...options });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (
      title: string,
      message?: string,
      options?: Partial<Omit<Toast, "id" | "type" | "title" | "message">>
    ) => {
      return showToast({ type: "warning", title, message, ...options });
    },
    [showToast]
  );

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        removeToast,
        clearAll,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}
