import React from "react";
import Link from "next/link";
import { FiUsers, FiBell, FiFileText } from "react-icons/fi";

const moreItems = [
  {
    label: "Employees",
    href: "/employees",
    icon: FiUsers,
    description: "View and manage your employees",
  },
  {
    label: "Documents",
    href: "/documents",
    icon: FiFileText,
    description: "Manage your business documents",
  },
];

export default function KindBossingMorePage() {
  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">More</h1>
        <p className="text-gray-600 mb-8">Additional options and settings.</p>
        <div className="space-y-4">
          {moreItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="block bg-white rounded-2xl border border-gray-200 p-6 hover:border-red-200 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {item.label}
                    </h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
