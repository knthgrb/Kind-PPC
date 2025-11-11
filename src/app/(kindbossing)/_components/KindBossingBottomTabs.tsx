"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiMessageCircle,
  FiMoreHorizontal,
  FiBell,
  FiBriefcase,
  FiUsers,
} from "react-icons/fi";

export default function KindBossingBottomTabs() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/my-jobs")
      return pathname === href || pathname?.startsWith("/my-jobs/");
    if (href === "/kindbossing/messages")
      return (
        pathname === href || pathname?.startsWith("/kindbossing/messages/")
      );
    if (href === "/notifications")
      return pathname === href || pathname?.startsWith("/notifications/");
    if (href === "/kindbossing-more")
      return pathname === href || pathname?.startsWith("/kindbossing-more/");
    return pathname === href;
  };

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white shadow-lg border-t border-gray-200">
      <div className="mx-auto max-w-7xl px-4">
        <ul className="grid grid-cols-4 h-16">
          <li className="flex">
            <Link
              href="/my-jobs"
              className="flex flex-col items-center justify-center w-full py-3 text-xs transition-colors"
            >
              <div className="flex flex-col items-center space-y-1">
                <FiBriefcase
                  className={`h-5 w-5 ${
                    isActive("/my-jobs") ? "text-red-600" : "text-gray-500"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    isActive("/my-jobs") ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  My Jobs
                </span>
              </div>
            </Link>
          </li>
          <li className="flex">
            <Link
              href="/kindbossing/messages"
              className="flex flex-col items-center justify-center w-full py-3 text-xs transition-colors"
            >
              <div className="flex flex-col items-center space-y-1">
                <FiMessageCircle
                  className={`h-5 w-5 ${
                    isActive("/kindbossing/messages")
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    isActive("/kindbossing/messages")
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  Messages
                </span>
              </div>
            </Link>
          </li>
          <li className="flex">
            <Link
              href="/notifications"
              className="flex flex-col items-center justify-center w-full py-3 text-xs transition-colors"
            >
              <div className="flex flex-col items-center space-y-1">
                <FiBell
                  className={`h-5 w-5 ${
                    isActive("/notifications")
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    isActive("/notifications")
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  Notifications
                </span>
              </div>
            </Link>
          </li>
          <li className="flex">
            <Link
              href="/kindbossing-more"
              className="flex flex-col items-center justify-center w-full py-3 text-xs transition-colors"
            >
              <div className="flex flex-col items-center space-y-1">
                <FiMoreHorizontal
                  className={`h-5 w-5 ${
                    isActive("/kindbossing-more")
                      ? "text-red-600"
                      : "text-gray-500"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    isActive("/kindbossing-more")
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  More
                </span>
              </div>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
