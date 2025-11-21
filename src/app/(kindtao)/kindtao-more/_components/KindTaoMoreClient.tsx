"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

export default function KindTaoMoreClient() {
  const router = useRouter();
  const { signOut } = useAuthStore();

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Link
          href="/recs"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to jobs
        </Link>

        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">More</h1>
          <p className="text-sm text-gray-600">
            Access support resources and account actions
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm divide-y divide-gray-100">
          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Support
            </h2>
            <div className="space-y-3">
              <Link
                href="/help-center"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Help Center
                  </p>
                  <p className="text-xs text-gray-500">
                    Browse FAQs and guides
                  </p>
                </div>
                <span className="text-gray-400 text-lg">›</span>
              </Link>
              <Link
                href="mailto:support@kind.com"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Contact Support
                  </p>
                  <p className="text-xs text-gray-500">support@kind.com</p>
                </div>
                <span className="text-gray-400 text-lg">›</span>
              </Link>
            </div>
          </div>

          <div className="p-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Account
            </h2>
            <div className="space-y-3">
              <Link
                href="/profile"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition"
              >
                <span className="text-sm font-medium text-gray-900">
                  Profile
                </span>
                <span className="text-gray-400 text-lg">›</span>
              </Link>
              <Link
                href="/kindtao/settings"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition"
              >
                <span className="text-sm font-medium text-gray-900">
                  Account Settings
                </span>
                <span className="text-gray-400 text-lg">›</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-3 rounded-xl text-left text-sm font-medium text-red-600 hover:bg-rose-50 transition"
              >
                <span>Log out</span>
                <span className="text-red-400 text-lg">›</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
