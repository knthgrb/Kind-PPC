/**
 * Chat utility functions
 */

export type TimestampFormat = "sidebar" | "chat";

/**
 * Format timestamp for sidebar or chat display
 * @param dateString - ISO date string
 * @param format - 'sidebar' or 'chat' format
 * @returns Formatted timestamp string
 */
export const formatTimestamp = (
  dateString: string,
  format: TimestampFormat
): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffYears = Math.floor(diffDays / 365);

  // Common time formatting
  const formatTime = () => {
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  // Common date formatting
  const formatDate = () => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${monthNames[date.getMonth()]} ${date.getDate()}`;
  };

  // Sidebar format (no "ago" for recent times)
  if (format === "sidebar") {
    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 2) return "1 min";
    if (diffMinutes < 60) return `${diffMinutes} mins`;
    if (diffHours < 1) return formatTime();
    if (diffHours < 24) return formatTime();
    if (diffYears < 1) return formatDate();
    if (diffYears < 2) return "1 year";
    return `${diffYears} years`;
  }

  // Chat format (with "ago" for recent times)
  if (format === "chat") {
    if (diffMinutes < 1) return "just now";
    if (diffMinutes < 2) return "1 min ago";
    if (diffMinutes < 60) return `${diffMinutes} mins ago`;
    if (diffHours < 1) return formatTime();
    if (diffHours < 24) return formatTime();
    if (diffYears < 1) return formatDate();
    if (diffYears < 2) return "1 year ago";
    return `${diffYears} years ago`;
  }

  return "";
};

/**
 * Get status color for online/offline indicator
 * @param isOnline - Whether user is online
 * @returns CSS class for status color
 */
export const getStatusColor = (isOnline: boolean): string => {
  return isOnline ? "bg-green-500" : "bg-gray-400";
};
