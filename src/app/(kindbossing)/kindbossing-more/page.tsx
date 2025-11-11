"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiHelpCircle,
  FiFileText,
  FiDollarSign,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import { useAuthStore } from "@/stores/useAuthStore";

export default function KindBossingMorePage() {
  const router = useRouter();
  const { signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <section className="max-w-2xl mx-auto p-4 sm:p-6">
      <h1 className="text-xl font-semibold mb-4">More</h1>

      <div className="bg-white border border-gray-200 rounded-lg divide-y">
        {/* Main Navigation Items from Sidebar */}

        <Link
          href="/my-employees"
          className="flex items-center justify-between px-4 py-4 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <FiUsers className="text-gray-600" />
            <span className="text-gray-800">Employees</span>
          </div>
        </Link>

        <Link
          href="/documents"
          className="flex items-center justify-between px-4 py-4 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <FiFileText className="text-gray-600" />
            <span className="text-gray-800">Documents</span>
          </div>
        </Link>

        {/* <Link
          href="/payslip"
          className="flex items-center justify-between px-4 py-4 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <FiDollarSign className="text-gray-600" />
            <span className="text-gray-800">Payslip</span>
          </div>
        </Link>

        <Link
          href="/government-benefits"
          className="flex items-center justify-between px-4 py-4 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <FiShield className="text-gray-600" />
            <span className="text-gray-800">Government Benefits</span>
          </div>
        </Link> */}

        <Link
          href="/contact-us"
          className="flex items-center justify-between px-4 py-4 hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <FiHelpCircle className="text-gray-600" />
            <span className="text-gray-800">Help & Support</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
