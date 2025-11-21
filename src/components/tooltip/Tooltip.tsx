"use client";
import React, { useState, useRef, useEffect } from "react";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
  disabled?: boolean;
  className?: string;
}

export default function Tooltip({
  children,
  content,
  position = "top",
  delay = 200,
  disabled = false,
  className = "",
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  // Adjust position if tooltip would go off screen and constrain to viewport
  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltip = tooltipRef.current;
      const trigger = triggerRef.current;
      const rect = trigger.getBoundingClientRect();
      
      // First render to get tooltip dimensions
      const tooltipRect = tooltip.getBoundingClientRect();
      let newPosition = position;

      // Check if tooltip goes off screen and adjust position
      if (position === "top" && rect.top - tooltipRect.height < 0) {
        newPosition = "bottom";
      } else if (
        position === "bottom" &&
        rect.bottom + tooltipRect.height > window.innerHeight
      ) {
        newPosition = "top";
      } else if (position === "left" && rect.left - tooltipRect.width < 0) {
        newPosition = "right";
      } else if (
        position === "right" &&
        rect.right + tooltipRect.width > window.innerWidth
      ) {
        newPosition = "left";
      }

      setActualPosition(newPosition);

      // Use fixed positioning to prevent overflow and ensure tooltip stays within viewport
      requestAnimationFrame(() => {
        if (!tooltip || !trigger) return;
        
        const triggerRect = trigger.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const padding = 8;
        let left = 0;
        let top = 0;

        switch (newPosition) {
          case "top":
            left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
            top = triggerRect.top - tooltipRect.height - padding;
            break;
          case "bottom":
            left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
            top = triggerRect.bottom + padding;
            break;
          case "left":
            left = triggerRect.left - tooltipRect.width - padding;
            top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
            break;
          case "right":
            left = triggerRect.right + padding;
            top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
            break;
        }

        // Constrain to viewport bounds
        left = Math.max(
          padding,
          Math.min(left, window.innerWidth - tooltipRect.width - padding)
        );
        top = Math.max(
          padding,
          Math.min(top, window.innerHeight - tooltipRect.height - padding)
        );

        // Apply fixed positioning to prevent overflow
        tooltip.style.position = "fixed";
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        tooltip.style.transform = "none";
        tooltip.style.margin = "0";
        tooltip.style.maxWidth = `${window.innerWidth - padding * 2}px`;
      });
    }
  }, [isVisible, position]);

  const getPositionClasses = () => {
    switch (actualPosition) {
      case "top":
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 mt-2";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 mr-2";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 ml-2";
      default:
        return "bottom-full left-1/2 transform -translate-x-1/2 mb-2";
    }
  };

  const getArrowClasses = () => {
    switch (actualPosition) {
      case "top":
        return "top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900";
      case "bottom":
        return "bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900";
      case "left":
        return "left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900";
      case "right":
        return "right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900";
      default:
        return "top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900";
    }
  };

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-xl shadow-lg whitespace-nowrap pointer-events-none ${getPositionClasses()}`}
          role="tooltip"
        >
          {content}
          <div className={`absolute w-0 h-0 border-4 ${getArrowClasses()}`} />
        </div>
      )}
    </div>
  );
}
