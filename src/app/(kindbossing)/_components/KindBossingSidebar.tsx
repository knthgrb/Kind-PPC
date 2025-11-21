"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiBriefcase,
  FiUsers,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiMessageCircle,
} from "react-icons/fi";
import { useSidebarStore } from "@/stores/useSidebarStore";
import { useQuery } from "convex/react";
import { api } from "@/utils/convex/client";
import { useOptionalCurrentUser } from "@/hooks/useOptionalCurrentUser";

const navigationItems = [
  {
    label: "Job Posts",
    href: "/my-job-posts",
    icon: FiBriefcase,
  },
  {
    label: "Employees",
    href: "/employees",
    icon: FiUsers,
  },
  {
    label: "Matches",
    href: "/kindbossing/matches",
    icon: FiMessageCircle,
  },
  {
    label: "Documents",
    href: "/documents",
    icon: FiFileText,
  },
];

interface NavItemWithTooltipProps {
  item: (typeof navigationItems)[0];
  Icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  isCollapsed: boolean;
  hasPendingApplications: boolean;
  showMatchesBadge: boolean;
}

function NavItemWithTooltip({
  item,
  Icon,
  active,
  isCollapsed,
  hasPendingApplications,
  showMatchesBadge,
}: NavItemWithTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Position tooltip using fixed positioning to prevent overflow
  useEffect(() => {
    if (isHovered && isCollapsed && tooltipRef.current && triggerRef.current) {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;
      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();

      // Calculate position to the right of the trigger
      const padding = 12;
      let left = triggerRect.right + padding;
      let top =
        triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;

      // Constrain to viewport
      const viewportPadding = 8;
      left = Math.max(
        viewportPadding,
        Math.min(left, window.innerWidth - tooltipRect.width - viewportPadding)
      );
      top = Math.max(
        viewportPadding,
        Math.min(top, window.innerHeight - tooltipRect.height - viewportPadding)
      );

      // Apply fixed positioning
      tooltip.style.position = "fixed";
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.style.transform = "none";
      tooltip.style.margin = "0";
      tooltip.style.zIndex = "50";
    }
  }, [isHovered, isCollapsed]);

  return (
    <div className="relative group">
      <Link
        ref={triggerRef}
        href={item.href}
        className={`relative flex items-center rounded-xl transition-colors group ${
          isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"
        } ${
          active
            ? "bg-red-50 text-red-600 font-medium"
            : "text-gray-700 hover:bg-gray-50"
        }`}
        aria-label={isCollapsed ? item.label : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {!isCollapsed && (
          <span className="text-sm whitespace-nowrap">{item.label}</span>
        )}
        {hasPendingApplications && (
          <span
            className={`absolute rounded-full bg-red-500 ${
              isCollapsed
                ? "top-2 right-2 h-2 w-2"
                : "top-3 right-4 h-2.5 w-2.5"
            }`}
          />
        )}
        {showMatchesBadge && (
          <span
            className={`absolute rounded-full bg-red-500 ${
              isCollapsed
                ? "top-2 right-2 h-2 w-2"
                : "top-3 right-4 h-2.5 w-2.5"
            }`}
          />
        )}
      </Link>
      {isCollapsed && (
        <div
          ref={tooltipRef}
          className={`pointer-events-none whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1 text-xs font-medium text-white shadow-lg transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
          style={{ position: "fixed", pointerEvents: "none" }}
        >
          {item.label}
        </div>
      )}
    </div>
  );
}

export default function KindBossingSidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const { currentUser } = useOptionalCurrentUser();

  const kindbossingUserId = useMemo(() => {
    if (!currentUser) return null;
    return (
      (currentUser as { userId?: string | null })?.userId ??
      (currentUser as { id?: string | null })?.id ??
      (currentUser as { _id?: string | null })?._id ??
      null
    );
  }, [currentUser]);

  const pendingApplications = useQuery(
    api.applications.getPendingApplicationsForKindBossing,
    kindbossingUserId
      ? {
          kindbossingUserId,
        }
      : "skip"
  );

  const hasPendingApplications = (pendingApplications?.length ?? 0) > 0;
  const matchesData = useQuery(
    api.matches.getMatchesByKindBossing,
    kindbossingUserId
      ? { userId: kindbossingUserId, filterOpenedWithConversation: true }
      : "skip"
  );

  const hasPendingMatches = useMemo(() => {
    if (!Array.isArray(matchesData)) return false;
    return matchesData.some(
      (match) => match?.is_opened_by_kindbossing !== true
    );
  }, [matchesData]);

  const unreadMetaRaw = useQuery(
    api.messages.getUnreadConversationsCount,
    kindbossingUserId ? { userId: kindbossingUserId } : "skip"
  ) as { count?: number } | number | null | undefined;

  const unreadCount = useMemo(() => {
    if (typeof unreadMetaRaw === "number") {
      return unreadMetaRaw;
    }
    if (
      unreadMetaRaw &&
      typeof unreadMetaRaw === "object" &&
      "count" in unreadMetaRaw
    ) {
      return unreadMetaRaw.count ?? 0;
    }
    return 0;
  }, [unreadMetaRaw]);

  const hasUnreadMessages = unreadCount > 0;
  const showMatchesBadge = hasPendingMatches || hasUnreadMessages;

  const isActive = (href: string) => {
    if (href === "/my-job-posts") {
      return pathname === href || pathname?.startsWith("/my-job-posts/");
    }
    if (href === "/employees") {
      return pathname === href || pathname?.startsWith("/employees/");
    }
    if (href === "/kindbossing/matches" || href === "/kindbossing/messages") {
      return (
        pathname === href ||
        pathname?.startsWith("/kindbossing/matches/") ||
        pathname?.startsWith("/kindbossing/messages/")
      );
    }
    if (href === "/documents") {
      return pathname === href || pathname?.startsWith("/documents/");
    }
    return pathname === href;
  };

  return (
    <aside
      className={`hidden lg:flex border-r border-gray-200 bg-white flex-col transition-all duration-300 ease-in-out overflow-x-hidden ${
        isCollapsed ? "w-16" : "w-64"
      }`}
      style={{ height: "calc(100vh - 8vh)" }}
    >
      <nav
        className={`flex-1 py-6 space-y-2 min-h-0 overflow-y-auto overflow-x-hidden ${
          isCollapsed ? "px-2" : "px-4"
        }`}
      >
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <NavItemWithTooltip
              key={item.href}
              item={item}
              Icon={Icon}
              active={active}
              isCollapsed={isCollapsed}
              hasPendingApplications={
                item.label === "Job Posts" ? hasPendingApplications : false
              }
              showMatchesBadge={
                item.label === "Matches" ? showMatchesBadge : false
              }
            />
          );
        })}
      </nav>

      {/* Toggle Button - Bottom */}
      <div
        className={`flex items-center border-t border-gray-200 mt-auto p-2 ${
          isCollapsed ? "justify-center" : "justify-end"
        }`}
      >
        <button
          onClick={toggleSidebar}
          className="p-2 cursor-pointer rounded-lg hover:bg-gray-100 transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <FiChevronRight className="w-5 h-5 text-gray-600" />
          ) : (
            <FiChevronLeft className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>
    </aside>
  );
}
