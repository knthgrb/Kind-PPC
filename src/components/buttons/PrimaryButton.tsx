import React from "react";

export default function PrimaryButton({
  children,
  className,
  size = "md",
  onClick,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const baseClasses =
    "cursor-pointer bg-[#CC0000] text-white rounded-xl hover:bg-red-700 transition-colors";
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
