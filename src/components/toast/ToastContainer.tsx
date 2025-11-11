"use client";

import React from "react";
import { useToasts } from "@/stores/useToastStore";
import ToastItem from "./ToastItem";

const ToastContainer = () => {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-9999 space-y-2 flex flex-col items-center">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
