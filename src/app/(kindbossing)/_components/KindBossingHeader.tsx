"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiUser, FiLogOut, FiSettings } from "react-icons/fi";
import { FaChevronDown } from "react-icons/fa";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

export default function KindBossingHeader() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session, isPending: loading } = useSession();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { signOut } = useAuthStore();
  const getUserInitials = () => {
    if (session?.user?.name) {
      const nameParts = session.user.name.split(" ");
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    if (session?.user?.email) {
      return session.user.email[0].toUpperCase();
    }
    return "U";
  };

  const getUserDisplayName = () => {
    if (session?.user?.name) {
      return session.user.name;
    }
    if (session?.user?.email) {
      return session.user.email.split("@")[0];
    }
    return "User";
  };

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    router.replace("/login");
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      const timeoutId = setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("click", handleClickOutside);
      };
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
    <header className="bg-white sticky top-0 z-50 lg:z-160 h-[8vh] border-b border-gray-200 flex items-center">
      <div className="w-full flex justify-between items-center px-4">
        {/* Logo - Left */}
        <Link href="/my-job-posts" className="flex items-center">
          <Image
            src="/kindLogo.png"
            alt="Kind Logo"
            width={100}
            height={30}
            className="h-8 w-auto"
          />
        </Link>

        {/* User Avatar - Right */}
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse hidden sm:block"></div>
          </div>
        ) : session?.user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            >
              {/* Avatar circle with initials or profile image */}
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={getUserDisplayName()}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                  {getUserInitials()}
                </div>
              )}
              {/* Name - hidden on mobile */}
              <span className="hidden sm:inline text-[#1F2A56] font-medium text-sm">
                {getUserDisplayName()}
              </span>
              {/* Dropdown icon */}
              <FaChevronDown
                size={14}
                className={`text-[#1F2A56] transition-transform duration-200 ${
                  userMenuOpen ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>

            {/* User Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-250">
                <div className="py-1">
                  <Link
                    href="/my-info"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <FiUser className="w-4 h-4" />
                    <span>My Info</span>
                  </Link>
                  <Link
                    href="/kindbossing/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <FiSettings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Link href="/login">
              <button className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 cursor-pointer">
                Sign In
              </button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
