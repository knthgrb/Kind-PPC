"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiHelpCircle, FiLogOut } from "react-icons/fi";
import { useAuthStore } from "@/stores/useAuthStore";

const moreItems = [
  {
    label: "Help & Support",
    href: "/contact-us",
    icon: FiHelpCircle,
    description: "Get help and contact support",
    type: "link" as const,
  },
  {
    label: "Sign out",
    icon: FiLogOut,
    description: "Sign out of your account",
    type: "button" as const,
  },
];

export default function KindTaoMorePage() {
  const router = useRouter();
  const { signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">More</h1>
        <p className="text-gray-600 mb-8">Additional options and settings.</p>
        <div className="space-y-4">
          {moreItems.map((item) => {
            const Icon = item.icon;
            const content = (
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
            );

            if (item.type === "link") {
              return (
                <Link
                  key={item.label}
                  href={item.href!}
                  className="block bg-white rounded-2xl border border-gray-200 p-6 hover:border-red-200 hover:bg-red-50 transition-colors"
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                onClick={handleSignOut}
                className="w-full cursor-pointer text-left block bg-white rounded-2xl border border-gray-200 p-6 hover:border-red-200 hover:bg-red-50 transition-colors"
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
