"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiSearch,
  FiMessageCircle,
  FiUser,
  FiMoreHorizontal,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import Tooltip from "@/components/tooltip/Tooltip";

export default function KindTaoSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const navigationItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: FiHome,
    },
    {
      label: "Find Work",
      href: "/recs",
      icon: FiSearch,
    },
    {
      label: "Messages",
      href: "/kindtao/matches",
      icon: FiMessageCircle,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: FiUser,
    },
    {
      label: "More",
      href: "/kindtao-more",
      icon: FiMoreHorizontal,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href || pathname?.startsWith("/dashboard/");
    }
    if (href === "/recs") {
      return pathname === href || pathname?.startsWith("/recs/");
    }
    if (href === "/kindtao/matches") {
      return pathname === href || pathname?.startsWith("/kindtao/matches/");
    }
    if (href === "/profile") {
      return pathname === href || pathname?.startsWith("/profile/");
    }
    if (href === "/kindtao-more") {
      return pathname === href || pathname?.startsWith("/kindtao-more/");
    }
    return pathname === href;
  };

  return (
    <div
      className={`hidden lg:flex flex-col bg-white border-r border-gray-200 overflow-x-hidden ${
        collapsed ? "w-16 items-center" : "w-64"
      }`}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200 h-[6vh] flex items-center">
        <div className="flex items-center justify-between w-full">
          {!collapsed && (
            <Link href="/dashboard">
              <Image
                src="/kindLogo.png"
                alt="Kind Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 cursor-pointer rounded-xl hover:bg-gray-100 transition-colors"
          >
            {collapsed ? (
              <FiChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <FiChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          const navItem = (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center rounded-lg transition-colors group ${
                collapsed
                  ? "justify-center px-2 py-3"
                  : "justify-start px-3 py-2"
              } ${
                active
                  ? "bg-red-50 text-red-600"
                  : "text-gray-700 hover:bg-gray-50 hover:text-red-600"
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  active
                    ? "text-red-600"
                    : "text-gray-500 group-hover:text-red-600"
                }`}
              />
              {!collapsed && (
                <span className="ml-3 font-medium">{item.label}</span>
              )}
            </Link>
          );

          return collapsed ? (
            <Tooltip key={item.label} content={item.label} position="right">
              {navItem}
            </Tooltip>
          ) : (
            navItem
          );
        })}
      </nav>
    </div>
  );
}
