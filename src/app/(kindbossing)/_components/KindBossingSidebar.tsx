"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  FiHome,
  FiBriefcase,
  FiUsers,
  FiFileText,
  FiShield,
  FiFolder,
  FiChevronLeft,
  FiChevronRight,
  FiMessageCircle,
  FiBell,
} from "react-icons/fi";
import Tooltip from "@/components/tooltip/Tooltip";
import { usePendingApplications } from "@/hooks/usePendingApplications";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { useMemo } from "react";

export default function KindBossingSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { pendingCount } = usePendingApplications();
  const { unreadCounts } = useUnreadCounts();

  // Auto-collapse sidebar when on applications page
  useEffect(() => {
    if (
      pathname?.includes("/my-jobs/applications") ||
      pathname?.includes("/kindbossing/messages") ||
      pathname?.includes("/notifications")
    ) {
      setCollapsed(true);
    }
  }, [pathname]);

  const navigationItems = useMemo(
    () => [
      {
        label: "My Jobs",
        href: "/my-jobs",
        icon: FiBriefcase,
        badge: pendingCount > 0 ? pendingCount.toString() : undefined,
      },
      {
        label: "Employees",
        href: "/my-employees",
        icon: FiUsers,
      },
      {
        label: "Messages",
        href: "/kindbossing/messages",
        icon: FiMessageCircle,
        badge:
          unreadCounts.unreadMessages > 0
            ? unreadCounts.unreadMessages.toString()
            : undefined,
      },
      {
        label: "Notifications",
        href: "/notifications",
        icon: FiBell,
        badge:
          unreadCounts.unreadNotifications > 0
            ? unreadCounts.unreadNotifications.toString()
            : undefined,
      },
      // {
      //   label: "Payslip",
      //   href: "/payslip",
      //   icon: FiFileText,
      // },
      // {
      //   label: "Gov't Benefits",
      //   href: "/government-benefits",
      //   icon: FiShield,
      // },
      {
        label: "Documents",
        href: "/documents",
        icon: FiFolder,
      },
    ],
    [pendingCount, unreadCounts]
  );

  const isActive = (href: string) => {
    if (href === "/my-jobs") {
      return pathname === href || pathname?.startsWith("/my-jobs/");
    }
    if (href === "/my-employees") {
      return pathname === href || pathname?.startsWith("/my-employees/");
    }
    // if (href === "/payslip") {
    //   return pathname === href || pathname?.startsWith("/payslip/");
    // }
    // if (href === "/government-benefits") {
    //   return pathname === href || pathname?.startsWith("/government-benefits/");
    // }
    if (href === "/documents") {
      return pathname === href || pathname?.startsWith("/documents/");
    }
    if (href === "/kindbossing/messages") {
      return (
        pathname === href || pathname?.startsWith("/kindbossing/messages/")
      );
    }
    return pathname === href;
  };

  return (
    <div
      className={`hidden lg:flex flex-col  bg-white border-r border-gray-200 ${
        collapsed ? "w-16 items-center" : "w-56"
      }`}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-gray-200 h-[8vh] flex items-center">
        <div className="flex items-center justify-between w-full">
          {!collapsed && (
            <Link href="/my-jobs">
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
              className={`relative flex items-center rounded-lg transition-colors group ${
                collapsed
                  ? "justify-center px-2 py-3"
                  : "justify-between px-3 py-2"
              } ${
                active
                  ? "bg-red-50 text-red-600 "
                  : "text-gray-700 hover:bg-gray-50 hover:text-red-600"
              }`}
            >
              <div
                className={`flex items-center ${
                  collapsed ? "w-full justify-center" : ""
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
              </div>
              {!collapsed && item.badge && (
                <span className="bg-red-600 text-white text-xs rounded-full h-5 min-w-[20px] px-2 flex items-center justify-center font-semibold">
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-semibold">
                  {item.badge}
                </span>
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
