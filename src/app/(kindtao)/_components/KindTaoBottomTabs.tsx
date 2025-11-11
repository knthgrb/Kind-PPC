"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FiHome,
  FiSearch,
  FiMessageCircle,
  FiUser,
  FiMoreHorizontal,
  FiBell,
} from "react-icons/fi";

export default function KindTaoBottomTabs() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/recs")
      return pathname === href || pathname?.startsWith("/recs/");
    if (href === "/matches")
      return pathname === href || pathname?.startsWith("/matches/");
    if (href === "/kindtao-more")
      return pathname === href || pathname?.startsWith("/kindtao-more/");
    return pathname === href;
  };

  return (
    <ul className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white grid grid-cols-3 border-t border-gray-200">
      <li>
        <Link
          href="/recs"
          className="flex flex-col items-center justify-center py-2 text-xs"
        >
          <FiMessageCircle
            className={`h-5 w-5 ${
              isActive("/recs") ? "text-red-600" : "text-gray-500"
            }`}
          />
          <span
            className={`${
              isActive("/recs") ? "text-red-600" : "text-gray-600"
            }`}
          >
            Find Work
          </span>
        </Link>
      </li>
      <li>
        <Link
          href="/matches"
          className="flex flex-col items-center justify-center py-2 text-xs"
        >
          <FiMessageCircle
            className={`h-5 w-5 ${
              isActive("/matches") ? "text-red-600" : "text-gray-500"
            }`}
          />
          <span
            className={`${
              isActive("/matches") ? "text-red-600" : "text-gray-600"
            }`}
          >
            Messages
          </span>
        </Link>
      </li>
      <li>
        <Link
          href="/kindtao-more"
          className="flex flex-col items-center justify-center py-2 text-xs"
        >
          <FiMoreHorizontal
            className={`h-5 w-5 ${
              isActive("/kindtao-more") ? "text-red-600" : "text-gray-500"
            }`}
          />
          <span
            className={`${
              isActive("/kindtao-more") ? "text-red-600" : "text-gray-600"
            }`}
          >
            More
          </span>
        </Link>
      </li>
    </ul>
  );
}
