"use client";

import React, { useState, useEffect } from "react";
import {
  HiOutlineBell,
  HiOutlineChat,
  HiOutlineUser,
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
  HiOutlineCreditCard,
  HiOutlineCog,
  HiOutlineClock,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineEyeOff,
} from "react-icons/hi";
import { LuBell } from "react-icons/lu";
import { useAuthStore } from "@/stores/useAuthStore";
import { DatabaseNotification, NotificationType } from "@/types/notification";
import KindBossingHeader from "../(kindbossing)/_components/KindBossingHeader";
import KindBossingSidebar from "../(kindbossing)/_components/KindBossingSidebar";
import KindBossingBottomTabs from "../(kindbossing)/_components/KindBossingBottomTabs";
import KindTaoHeader from "../(kindtao)/_components/KindTaoHeader";
import KindTaoSidebar from "../(kindtao)/_components/KindTaoSidebar";
import KindTaoBottomTabs from "../(kindtao)/_components/KindTaoBottomTabs";
import { getNotifications } from "@/actions/notifications/get-notifications";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/actions/notifications/mark-as-read";
import { deleteNotification } from "@/actions/notifications/delete-notification";

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "message":
      return <HiOutlineChat className="w-5 h-5 text-blue-600" />;
    case "match":
      return <HiOutlineUser className="w-5 h-5 text-green-600" />;
    case "job_posted":
    case "job_accepted":
      return <HiOutlineBriefcase className="w-5 h-5 text-purple-600" />;
    case "profile_verified":
      return <HiOutlineCheckCircle className="w-5 h-5 text-green-600" />;
    case "payment_success":
      return <HiOutlineCreditCard className="w-5 h-5 text-green-600" />;
    case "system_update":
      return <HiOutlineCog className="w-5 h-5 text-blue-600" />;
    case "reminder":
      return <HiOutlineClock className="w-5 h-5 text-orange-600" />;
    default:
      return <HiOutlineBell className="w-5 h-5 text-gray-600" />;
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<DatabaseNotification[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [showAll, setShowAll] = useState(false);
  const { user } = useAuthStore();
  const userMetadata = user?.user_metadata;
  const role = (userMetadata as any)?.role as string | undefined;

  // Determine if user is KindBossing or KindTao
  const isKindBossing = role === "kindbossing";
  const isKindTao = role === "kindtao";

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getNotifications({
        status: filter === "unread" ? "unread" : "all",
      });

      if (result.success && result.data) {
        setNotifications(result.data);
      } else {
        setError(result.error || "Failed to fetch notifications");
      }
    } catch (err) {
      setError("An error occurred while fetching notifications");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (newFilter: "all" | "unread") => {
    setFilter(newFilter);
    setShowAll(false);
    setLoading(true);
    try {
      const result = await getNotifications({
        status: newFilter === "unread" ? "unread" : "all",
      });

      if (result.success && result.data) {
        setNotifications(result.data);
      } else {
        setError(result.error || "Failed to fetch notifications");
      }
    } catch (err) {
      setError("An error occurred while fetching notifications");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") {
      return notification.status === "unread";
    }
    return true;
  });

  const displayedNotifications = showAll
    ? filteredNotifications
    : filteredNotifications.slice(0, 10);

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  const markAsRead = async (id: string) => {
    const result = await markNotificationAsRead(id);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id && notification.status === "unread"
            ? {
                ...notification,
                status: "read" as const,
                read_at: new Date().toISOString(),
              }
            : notification
        )
      );
    } else {
      console.error("Error marking notification as read:", result.error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsRead();
    if (result.success) {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.status === "unread"
            ? {
                ...notification,
                status: "read" as const,
                read_at: new Date().toISOString(),
              }
            : notification
        )
      );
    } else {
      console.error("Error marking all notifications as read:", result.error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const result = await deleteNotification(id);
    if (result.success) {
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
    } else {
      console.error("Error deleting notification:", result.error);
    }
  };

  // Render KindBossing layout
  if (isKindBossing) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <KindBossingSidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <KindBossingHeader />

          {/* Main content */}
          <main className="flex-1 overflow-auto pb-16 lg:pb-0">
            <div className="min-h-screen bg-gray-50">
              {/* Notifications Header */}
              <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 rounded-full">
                        <LuBell className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          Notifications
                        </h1>
                        <p className="text-sm text-gray-600">
                          {unreadCount > 0
                            ? `${unreadCount} unread notifications`
                            : "All caught up!"}
                        </p>
                      </div>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Filter Tabs */}
                  <div className="mt-4 flex space-x-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => handleFilterChange("all")}
                      className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                        filter === "all"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      onClick={() => handleFilterChange("unread")}
                      className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                        filter === "unread"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-w-4xl mx-auto px-4 py-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <HiOutlineBell className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Loading notifications...
                    </h3>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HiOutlineBell className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Error loading notifications
                    </h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                      onClick={fetchNotifications}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                ) : displayedNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HiOutlineBell className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {filter === "unread"
                        ? "No unread notifications"
                        : "No notifications"}
                    </h3>
                    <p className="text-gray-600">
                      {filter === "unread"
                        ? "You're all caught up! Check back later for new updates."
                        : "You haven't received any notifications yet."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 ${
                          notification.status === "unread"
                            ? "border-l-4 border-l-red-500 bg-red-50/30"
                            : "hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3
                                  className={`text-sm font-medium ${
                                    notification.status === "unread"
                                      ? "text-gray-900"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {notification.title}
                                </h3>
                                <p
                                  className={`text-sm mt-1 ${
                                    notification.status === "unread"
                                      ? "text-gray-800"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {notification.message}
                                </p>

                                {/* Additional data display for specific notification types */}
                                {notification.data && (
                                  <div className="mt-2 text-xs text-gray-500">
                                    {notification.type === "message" &&
                                      (notification.data as any).senderName && (
                                        <span>
                                          From:{" "}
                                          {
                                            (notification.data as any)
                                              .senderName
                                          }
                                        </span>
                                      )}
                                    {notification.type === "job_accepted" &&
                                      (notification.data as any)
                                        .employeeName && (
                                        <span>
                                          Employee:{" "}
                                          {
                                            (notification.data as any)
                                              .employeeName
                                          }
                                        </span>
                                      )}
                                    {notification.type === "payment_success" &&
                                      (notification.data as any).amount && (
                                        <span>
                                          Amount: ₱
                                          {(notification.data as any).amount}
                                        </span>
                                      )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                <span className="text-xs text-gray-500">
                                  {formatTimeAgo(notification.created_at)}
                                </span>

                                {notification.status === "unread" && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Mark as read"
                                  >
                                    <HiOutlineEye className="w-4 h-4" />
                                  </button>
                                )}

                                <button
                                  onClick={() =>
                                    handleDeleteNotification(notification.id)
                                  }
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete notification"
                                >
                                  <HiOutlineTrash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredNotifications.length > 10 && (
                      <div className="text-center pt-4">
                        <button
                          onClick={() => setShowAll(!showAll)}
                          className="px-6 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          {showAll
                            ? "Show less"
                            : `Show all ${filteredNotifications.length} notifications`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Bottom tabs for mobile */}
        <KindBossingBottomTabs />
      </div>
    );
  }

  // Render KindTao layout
  if (isKindTao) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <KindTaoSidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <KindTaoHeader />

          {/* Main content */}
          <main className="flex-1 overflow-auto pb-16 lg:pb-0">
            <div className="min-h-screen bg-gray-50">
              {/* Notifications Header */}
              <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 rounded-full">
                        <LuBell className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          Notifications
                        </h1>
                        <p className="text-sm text-gray-600">
                          {unreadCount > 0
                            ? `${unreadCount} unread notifications`
                            : "All caught up!"}
                        </p>
                      </div>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Filter Tabs */}
                  <div className="mt-4 flex space-x-1 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => handleFilterChange("all")}
                      className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                        filter === "all"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      onClick={() => handleFilterChange("unread")}
                      className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                        filter === "unread"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-w-4xl mx-auto px-4 py-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <HiOutlineBell className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Loading notifications...
                    </h3>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HiOutlineBell className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Error loading notifications
                    </h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                      onClick={fetchNotifications}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                ) : displayedNotifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HiOutlineBell className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {filter === "unread"
                        ? "No unread notifications"
                        : "No notifications"}
                    </h3>
                    <p className="text-gray-600">
                      {filter === "unread"
                        ? "You're all caught up! Check back later for new updates."
                        : "You haven't received any notifications yet."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayedNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 ${
                          notification.status === "unread"
                            ? "border-l-4 border-l-red-500 bg-red-50/30"
                            : "hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3
                                  className={`text-sm font-medium ${
                                    notification.status === "unread"
                                      ? "text-gray-900"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {notification.title}
                                </h3>
                                <p
                                  className={`text-sm mt-1 ${
                                    notification.status === "unread"
                                      ? "text-gray-800"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {notification.message}
                                </p>

                                {/* Additional data display for specific notification types */}
                                {notification.data && (
                                  <div className="mt-2 text-xs text-gray-500">
                                    {notification.type === "message" &&
                                      (notification.data as any).senderName && (
                                        <span>
                                          From:{" "}
                                          {
                                            (notification.data as any)
                                              .senderName
                                          }
                                        </span>
                                      )}
                                    {notification.type === "job_accepted" &&
                                      (notification.data as any)
                                        .employeeName && (
                                        <span>
                                          Employee:{" "}
                                          {
                                            (notification.data as any)
                                              .employeeName
                                          }
                                        </span>
                                      )}
                                    {notification.type === "payment_success" &&
                                      (notification.data as any).amount && (
                                        <span>
                                          Amount: ₱
                                          {(notification.data as any).amount}
                                        </span>
                                      )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 ml-4">
                                <span className="text-xs text-gray-500">
                                  {formatTimeAgo(notification.created_at)}
                                </span>

                                {notification.status === "unread" && (
                                  <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Mark as read"
                                  >
                                    <HiOutlineEye className="w-4 h-4" />
                                  </button>
                                )}

                                <button
                                  onClick={() =>
                                    handleDeleteNotification(notification.id)
                                  }
                                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Delete notification"
                                >
                                  <HiOutlineTrash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredNotifications.length > 10 && (
                      <div className="text-center pt-4">
                        <button
                          onClick={() => setShowAll(!showAll)}
                          className="px-6 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          {showAll
                            ? "Show less"
                            : `Show all ${filteredNotifications.length} notifications`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Bottom tabs for mobile */}
        <KindTaoBottomTabs />
      </div>
    );
  }

  // Default layout for users without specific role or other roles
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-full">
                <LuBell className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Notifications
                </h1>
                <p className="text-sm text-gray-600">
                  {unreadCount > 0
                    ? `${unreadCount} unread notifications`
                    : "All caught up!"}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="mt-4 flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                filter === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => handleFilterChange("unread")}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                filter === "unread"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <HiOutlineBell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Loading notifications...
            </h3>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineBell className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error loading notifications
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchNotifications}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : displayedNotifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineBell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === "unread"
                ? "No unread notifications"
                : "No notifications"}
            </h3>
            <p className="text-gray-600">
              {filter === "unread"
                ? "You're all caught up! Check back later for new updates."
                : "You haven't received any notifications yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 ${
                  notification.status === "unread"
                    ? "border-l-4 border-l-red-500 bg-red-50/30"
                    : "hover:border-gray-300"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3
                          className={`text-sm font-medium ${
                            notification.status === "unread"
                              ? "text-gray-900"
                              : "text-gray-700"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <p
                          className={`text-sm mt-1 ${
                            notification.status === "unread"
                              ? "text-gray-800"
                              : "text-gray-600"
                          }`}
                        >
                          {notification.message}
                        </p>

                        {/* Additional data display for specific notification types */}
                        {notification.data && (
                          <div className="mt-2 text-xs text-gray-500">
                            {notification.type === "message" &&
                              (notification.data as any).senderName && (
                                <span>
                                  From: {(notification.data as any).senderName}
                                </span>
                              )}
                            {notification.type === "job_accepted" &&
                              (notification.data as any).employeeName && (
                                <span>
                                  Employee:{" "}
                                  {(notification.data as any).employeeName}
                                </span>
                              )}
                            {notification.type === "payment_success" &&
                              (notification.data as any).amount && (
                                <span>
                                  Amount: ₱{(notification.data as any).amount}
                                </span>
                              )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(notification.created_at)}
                        </span>

                        {notification.status === "unread" && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Mark as read"
                          >
                            <HiOutlineEye className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() =>
                            handleDeleteNotification(notification.id)
                          }
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete notification"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredNotifications.length > 10 && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="px-6 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  {showAll
                    ? "Show less"
                    : `Show all ${filteredNotifications.length} notifications`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
