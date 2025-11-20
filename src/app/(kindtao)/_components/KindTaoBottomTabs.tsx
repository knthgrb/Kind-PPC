"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMessageCircle, FiMoreHorizontal } from "react-icons/fi";

export default function KindTaoBottomTabs() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/recs") {
      return pathname === href || pathname?.startsWith("/recs/");
    }
    if (href === "/kindtao/matches" || href === "/kindtao/messages") {
      return (
        pathname === href ||
        pathname?.startsWith("/kindtao/matches/") ||
        pathname?.startsWith("/kindtao/messages/")
      );
    }
    if (href === "/kindtao-more") {
      return pathname === href || pathname?.startsWith("/kindtao-more/");
    }
    return pathname === href;
  };

  return (
    <ul className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white grid grid-cols-3 border-t border-gray-200 h-16">
      <li>
        <Link
          href="/recs"
          className="flex flex-col h-full items-center justify-center text-xs"
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
          href="/kindtao/matches"
          className="flex flex-col h-full items-center justify-center text-xs"
        >
          <FiMessageCircle
            className={`h-5 w-5 ${
              isActive("/kindtao/matches") ? "text-red-600" : "text-gray-500"
            }`}
          />
          <span
            className={`${
              isActive("/kindtao/matches") ? "text-red-600" : "text-gray-600"
            }`}
          >
            Messages
          </span>
        </Link>
      </li>
      <li>
        <Link
          href="/kindtao-more"
          className="flex flex-col h-full items-center justify-center text-xs"
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
