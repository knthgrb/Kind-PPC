"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  IoMenuOutline,
  IoCloseOutline,
} from "react-icons/io5";

interface TabConfig {
  id: string;
  label: string;
  icon: any;
  description: string;
}

interface SettingsLayoutProps {
  children: React.ReactNode;
  tabs?: TabConfig[];
  title?: string;
  description?: string;
}

export default function SettingsLayout({
  children,
  tabs = [],
  title = "Settings",
  description = "Manage your account preferences and settings",
}: SettingsLayoutProps) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab =
    requestedTab && tabs.some((tab) => tab.id === requestedTab)
      ? requestedTab
      : tabs[0]?.id || "";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!requestedTab) return;
    if (requestedTab === activeTab) return;

    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    window.history.replaceState({}, "", url.toString());
  }, [requestedTab, activeTab]);

  const handleTabChange = (tabId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    window.history.pushState({}, "", url.toString());
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">{title}</h1>
          <p className="text-sm text-gray-600">{description}</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64 shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Mobile menu button */}
              <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Settings
                </h2>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  {isMobileMenuOpen ? (
                    <IoCloseOutline className="w-5 h-5" />
                  ) : (
                    <IoMenuOutline className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Navigation */}
              <nav
                className={`${
                  isMobileMenuOpen ? "block" : "hidden"
                } lg:block p-4`}
              >
                <div className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`w-full cursor-pointer flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                          isActive
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon
                          className={`w-5 h-5 mt-0.5 shrink-0 ${
                            isActive ? "text-red-600" : "text-gray-400"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{tab.label}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {tab.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

