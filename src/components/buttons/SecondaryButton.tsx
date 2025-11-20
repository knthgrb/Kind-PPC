import React from "react";

export default function SecondaryButton({
  children,
  className,
  onClick,
  size = "md",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const baseClasses =
    "px-6 py-3 border cursor-pointer border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors";
  const sizeClass = sizeClasses[size];
  const combinedClassName = className
    ? `${baseClasses} ${sizeClass} ${className}`
    : `${baseClasses} ${sizeClass}`;

  return (
    <button className={combinedClassName} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
