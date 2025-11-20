"use client";

import React from "react";
import { useToasts } from "@/stores/useToastStore";
import ToastItem from "./ToastItem";

const ToastContainer = () => {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 flex flex-col items-end sm:right-6 sm:top-6">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
