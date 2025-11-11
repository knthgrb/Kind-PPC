import React from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[#CB0000] text-white hover:bg-[#A00000] disabled:bg-[#CECECE] disabled:text-[#A2A2A2] disabled:cursor-not-allowed",
  secondary:
    "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed",
  tertiary:
    "bg-transparent text-[#CB0000] hover:text-[#A00000] hover:bg-red-50 disabled:text-gray-400 disabled:cursor-not-allowed",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-6 py-2 text-base rounded-xl",
  lg: "px-8 py-3 text-lg rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  fullWidth = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "cursor-pointer transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const focusRingColor =
    variant === "primary"
      ? "focus:ring-[#CB0000]"
      : variant === "secondary"
      ? "focus:ring-gray-300"
      : "focus:ring-red-200";

  const classes = [
    baseStyles,
    variantStyle,
    sizeStyle,
    focusRingColor,
    fullWidth && "w-full",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

