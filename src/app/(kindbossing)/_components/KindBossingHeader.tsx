"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { LuBell } from "react-icons/lu";
import { FaRegEnvelope } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa6";
import {
  FiX,
  FiUser,
  FiLogOut,
  FiBarChart2,
  FiSettings,
  FiMinus,
  FiMaximize,
} from "react-icons/fi";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePathname, useRouter } from "next/navigation";

export default function KindBossingHeader() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, loading, signOut, isAuthenticated } = useAuthStore();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    router.push("/login");
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`.toUpperCase();
    }
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

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
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-200 h-[8vh] flex items-center">
      <div className="w-full flex justify-between items-center p-2">
        {/* Logo - Mobile only */}
        <div className="visible lg:invisible">
          <Link href="/my-jobs">
            <Image
              src="/kindLogo.png"
              alt="Kind Logo"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </Link>
        </div>

        {/* Profile */}
        {loading ? (
          <div className="relative mr-2 z-40" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="hidden sm:block h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="hidden sm:block h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
            </button>

            {/* User Dropdown Menu for loading state */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  {/* <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 cursor-not-allowed">
                    <FiUser className="w-4 h-4" />
                    Profile
                  </div> */}
                  <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 cursor-not-allowed">
                    <FiSettings className="w-4 h-4" />
                    Settings
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 cursor-not-allowed">
                    <FiLogOut className="w-4 h-4" />
                    Sign Out
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : isAuthenticated ? (
          <div className="relative mr-2 z-40" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 cursor-pointer"
            >
              {/* Avatar circle with initials */}
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {getUserInitials()}
              </div>
              {/* Name */}
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
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  {/* <Link
                    href="/my-profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <FiUser className="w-4 h-4" />
                    Profile
                  </Link> */}
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <FiSettings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login">
            <button className="px-6 py-2 bg-red-600 text-white rounded-xl text-lg hover:bg-red-700 cursor-pointer">
              Sign In
            </button>
          </Link>
        )}
      </div>
    </header>
  );
}
