"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiHelpCircle, FiLogOut } from "react-icons/fi";
import { useAuthStore } from "@/stores/useAuthStore";

export default function KindTaoMorePage() {
  const router = useRouter();
  const { signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <section className="max-w-2xl mx-auto p-4 sm:p-6">
      <h1 className="text-xl font-semibold mb-4">More</h1>

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
        <Link
          href="/contact-us"
          className="flex items-center justify-between px-4 py-4 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <FiHelpCircle className="text-gray-600" />
            <span className="text-gray-800">Help & Support</span>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full cursor-pointer flex items-center justify-between px-4 py-4 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <FiLogOut className="text-gray-600" />
            <span className="text-gray-800">Sign out</span>
          </div>
        </button>
      </div>
    </section>
  );
}
