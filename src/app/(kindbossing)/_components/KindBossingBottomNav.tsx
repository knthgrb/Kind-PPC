"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiBriefcase, FiMessageCircle, FiMoreHorizontal } from "react-icons/fi";

const mobileNavItems = [
  {
    label: "Job Posts",
    href: "/my-job-posts",
    icon: FiBriefcase,
  },
  {
    label: "Matches",
    href: "/kindbossing/matches",
    icon: FiMessageCircle,
  },
  {
    label: "More",
    href: "/kindbossing-more",
    icon: FiMoreHorizontal,
  },
];

export default function KindBossingBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/my-job-posts") {
      return pathname === href || pathname?.startsWith("/my-job-posts/");
    }
    if (href === "/kindbossing/matches" || href === "/kindbossing/messages") {
      return (
        pathname === href ||
        pathname?.startsWith("/kindbossing/matches/") ||
        pathname?.startsWith("/kindbossing/messages/")
      );
    }
    if (href === "/kindbossing-more") {
      return pathname === href || pathname?.startsWith("/kindbossing-more/");
    }
    return pathname === href;
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around h-16">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active ? "text-red-600" : "text-gray-500"
              }`}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
