"use client";

import { useRef, useEffect, useState } from "react";

type SegmentedToggleProps = {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
  className?: string;
};

export default function SegmentedToggle({
  options,
  selected,
  onSelect,
  className = "",
}: SegmentedToggleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const selectedIndex = options.findIndex((opt) => opt.value === selected);

  useEffect(() => {
    const updateIndicator = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const buttons = container.querySelectorAll("button");
        const selectedButton = buttons[selectedIndex];

        if (selectedButton) {
          const containerRect = container.getBoundingClientRect();
          const buttonRect = selectedButton.getBoundingClientRect();

          setIndicatorStyle({
            left: buttonRect.left - containerRect.left,
            width: buttonRect.width,
          });
        }
      }
    };

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      updateIndicator();
    });

    // Recalculate on window resize
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [selected, selectedIndex]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex rounded-full border border-gray-300 bg-gray-100 p-1 ${className}`}
      role="tablist"
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-1 bottom-1 bg-white border-2 border-[#CC0000] rounded-full transition-all duration-300 ease-in-out z-0"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
        }}
      />

      {options.map((option, index) => {
        const isSelected = selected === option.value;

        return (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            role="tab"
            aria-selected={isSelected}
            className={`relative cursor-pointer z-10 px-6 py-2.5 text-sm font-medium transition-all duration-300 ${
              isSelected ? "text-gray-900 font-semibold" : "text-gray-900"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
