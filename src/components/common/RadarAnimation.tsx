"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface RadarAnimationProps {
  isVisible: boolean;
  userProfileImage?: string;
  className?: string;
}

export default function RadarAnimation({
  isVisible,
  userProfileImage,
  className = "",
}: RadarAnimationProps) {
  const [animationKey, setAnimationKey] = useState(0);

  // Reset animation when visibility changes
  useEffect(() => {
    if (isVisible) {
      setAnimationKey((prev) => prev + 1);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer pulsing circle - Red theme */}
      <div
        key={`outer-${animationKey}`}
        className="absolute w-40 h-40 rounded-full bg-linear-to-r from-red-200 to-red-300 opacity-20 animate-ping"
        style={{
          animationDuration: "2.5s",
          animationIterationCount: "infinite",
        }}
      />

      {/* Middle pulsing circle */}
      <div
        key={`middle-${animationKey}`}
        className="absolute w-32 h-32 rounded-full bg-red-300 opacity-30 animate-ping"
        style={{
          animationDuration: "2s",
          animationIterationCount: "infinite",
          animationDelay: "0.5s",
        }}
      />

      {/* Inner pulsing circle */}
      <div
        key={`inner-${animationKey}`}
        className="absolute w-24 h-24 rounded-full bg-red-400 opacity-50 animate-ping"
        style={{
          animationDuration: "1.5s",
          animationIterationCount: "infinite",
          animationDelay: "1s",
        }}
      />

      {/* Center pulsing circle */}
      <div
        key={`center-${animationKey}`}
        className="absolute w-16 h-16 rounded-full bg-red-500 opacity-60 animate-ping"
        style={{
          animationDuration: "1s",
          animationIterationCount: "infinite",
          animationDelay: "1.5s",
        }}
      />

      {/* Center profile image with red styling */}
      <div className="relative z-10 w-16 h-16 rounded-full overflow-hidden bg-white border-4 border-red-500 shadow-xl ring-4 ring-red-200 ring-opacity-50">
        {userProfileImage ? (
          <Image
            src={userProfileImage}
            alt="User profile"
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-red-400 to-red-600 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Radar sweep rings - Red theme */}
      <div
        key={`radar-1-${animationKey}`}
        className="absolute w-48 h-48 rounded-full border-2 border-red-200 opacity-10"
        style={{
          animation: "radar-sweep 4s linear infinite",
        }}
      />

      <div
        key={`radar-2-${animationKey}`}
        className="absolute w-44 h-44 rounded-full border-2 border-red-300 opacity-20"
        style={{
          animation: "radar-sweep 4s linear infinite",
          animationDelay: "1.3s",
        }}
      />

      <div
        key={`radar-3-${animationKey}`}
        className="absolute w-36 h-36 rounded-full border-2 border-red-400 opacity-30"
        style={{
          animation: "radar-sweep 4s linear infinite",
          animationDelay: "2.6s",
        }}
      />

      <div
        key={`radar-4-${animationKey}`}
        className="absolute w-28 h-28 rounded-full border-2 border-red-500 opacity-40"
        style={{
          animation: "radar-sweep 4s linear infinite",
          animationDelay: "3.9s",
        }}
      />
    </div>
  );
}

// Add custom CSS for radar sweep animation
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes radar-sweep {
      0% {
        transform: scale(0.5);
        opacity: 0.8;
      }
      25% {
        transform: scale(0.8);
        opacity: 0.6;
      }
      50% {
        transform: scale(1.2);
        opacity: 0.3;
      }
      75% {
        transform: scale(1.5);
        opacity: 0.1;
      }
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
