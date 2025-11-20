"use client";

import Image from "next/image";
import { useState } from "react";
import { getPublicUrl } from "@/utils/supabaseStorage";

interface SupabaseImageProps {
  filePath: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackSrc?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onLoad?: () => void;
  clickable?: boolean;
  enlargedWidth?: number;
  enlargedHeight?: number;
}

export default function SupabaseImage({
  filePath,
  alt,
  width,
  height,
  className,
  fallbackSrc = "/profile/id_placeholder_one.png",
  onError,
  onLoad,
  clickable = false,
  enlargedWidth = 800,
  enlargedHeight = 600,
}: SupabaseImageProps) {
  const [isEnlarged, setIsEnlarged] = useState(false);
  // If no filePath or it's a placeholder path, use fallback
  if (!filePath || filePath.startsWith("/")) {
    return (
      <Image
        src={fallbackSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={onError}
        onLoad={onLoad}
      />
    );
  }

  // Generate public URL for file storage
  const imageUrl = getPublicUrl(filePath);

  // Temporarily use regular img tag to bypass Next.js Image optimization
  // TODO: Switch back to Next.js Image once the configuration is working
  return (
    <>
      <img
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${clickable ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
        onClick={clickable ? () => setIsEnlarged(true) : undefined}
        onError={(e) => {
          onError?.(e);
        }}
        onLoad={() => {
          onLoad?.();
        }}
      />

      {/* Enlarged Image Modal */}
      {isEnlarged && clickable && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setIsEnlarged(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={imageUrl}
              alt={alt}
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{ width: enlargedWidth, height: enlargedHeight }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setIsEnlarged(false)}
              className="absolute top-4 right-4 text-white text-2xl font-bold bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-all"
              aria-label="Close enlarged image"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
