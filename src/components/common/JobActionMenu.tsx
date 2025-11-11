"use client";

import { useState, useRef, useEffect } from "react";
import {
  FaEllipsisH,
  FaPause,
  FaPlay,
  FaStop,
  FaTrash,
  FaEdit,
  FaLock,
  FaUnlock,
} from "react-icons/fa";
import { JobPost } from "@/types/jobPosts";

type JobActionMenuProps = {
  job: JobPost;
  onAction: (job: JobPost, action: string) => void;
  isLoading?: boolean;
};

export default function JobActionMenu({
  job,
  onAction,
  isLoading,
}: JobActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const currentStatus = job.status || "active";

  const getMenuItems = () => {
    const items = [];

    // Status-based actions
    switch (currentStatus) {
      case "active":
        items.push(
          {
            icon: FaPause,
            label: "Pause Job",
            action: "pause",
            color: "text-gray-700 hover:bg-gray-50",
          },
          {
            icon: FaStop,
            label: "Close Job",
            action: "close",
            color: "text-gray-700 hover:bg-gray-50",
          }
        );
        break;
      case "paused":
        items.push(
          {
            icon: FaPlay,
            label: "Activate Job",
            action: "activate",
            color: "text-gray-700 hover:bg-gray-50",
          },
          {
            icon: FaStop,
            label: "Close Job",
            action: "close",
            color: "text-gray-700 hover:bg-gray-50",
          }
        );
        break;
      case "closed":
        items.push({
          icon: FaUnlock,
          label: "Reopen Job",
          action: "reopen",
          color: "text-gray-700 hover:bg-gray-50",
        });
        break;
    }

    // Common actions
    items.push(
      {
        icon: FaEdit,
        label: "Edit Job",
        action: "edit",
        color: "text-gray-700 hover:bg-gray-50",
      },
      {
        icon: FaTrash,
        label: "Delete Job",
        action: "delete",
        color: "text-gray-700 hover:bg-gray-50",
      }
    );

    return items;
  };

  const handleAction = (action: string) => {
    console.log("JobActionMenu handleAction called with:", action);
    setIsOpen(false);
    onAction(job, action);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="p-2 cursor-pointer text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
        title="Job actions"
      >
        <FaEllipsisH className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="py-1">
            {getMenuItems().map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={() => handleAction(item.action)}
                  disabled={isLoading}
                  className={`w-full cursor-pointer flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${item.color} disabled:opacity-50`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
