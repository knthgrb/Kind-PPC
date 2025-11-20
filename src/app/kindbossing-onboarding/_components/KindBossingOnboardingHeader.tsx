"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { LuBell } from "react-icons/lu";
import { FaRegEnvelope } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa6";
import { FiMenu, FiX, FiUser, FiLogOut } from "react-icons/fi";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";

export default function KindBossingOnboardingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, loading, signOut, isAuthenticated } = useAuthStore();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    setMenuOpen(false);
    router.push("/login");
  };

  const userMetadata = (user as { user_metadata?: any })?.user_metadata;

  const getUserDisplayName = () => {
    if (userMetadata?.first_name && userMetadata?.last_name) {
      return `${userMetadata.first_name} ${userMetadata.last_name}`;
    }
    if (userMetadata?.first_name) {
      return userMetadata.first_name;
    }
    if ((user as { name?: string })?.name) {
      return (user as { name?: string }).name as string;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  const getUserInitials = () => {
    const firstInitial = userMetadata?.first_name?.[0]?.toUpperCase();
    const lastInitial = userMetadata?.last_name?.[0]?.toUpperCase();

    if (firstInitial || lastInitial) {
      return `${firstInitial ?? ""}${lastInitial ?? ""}`.trim() || "U";
    }

    if ((user as { name?: string })?.name) {
      const parts = (user as { name?: string }).name?.trim().split(" ") ?? [];
      const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase());
      if (initials.filter(Boolean).length) {
        return initials.join("");
      }
    }

    if (user?.email) {
      const emailInitials = user.email
        .split("@")[0]
        .split(".")
        .map((part) => part[0]?.toUpperCase())
        .filter(Boolean)
        .slice(0, 2);
      if (emailInitials.length) {
        return emailInitials.join("");
      }
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
      <div className="w-full flex justify-between items-center px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/kindLogo.png"
            alt="Kind Logo"
            width={100}
            height={30}
            className="h-8 w-auto"
          />
        </Link>

        {/* Profile */}
        {loading ? (
          <div className="px-4 py-2 text-gray-500">Loading...</div>
        ) : isAuthenticated ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {getUserInitials()}
              </div>
              <span className="hidden sm:inline text-[#1F2A56] font-medium text-sm">
                {getUserDisplayName()}
              </span>
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

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 py-6 text-[clamp(0.9rem,2.5vw,1rem)]">
          {/* Profile on Top */}
          {isAuthenticated ? (
            <div className="flex items-center justify-center space-x-4 pb-6">
              <div className="w-12 aspect-square relative block">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {getUserInitials()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[#1a1a3b] font-medium text-[clamp(1rem,3vw,1.125rem)]">
                  {getUserDisplayName()}
                </div>
                {userMetadata?.role && (
                  <div className="text-xs text-gray-500 capitalize">
                    {userMetadata.role}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center pb-6">
              <Link href="/login">
                <button className="px-6 py-2 bg-red-600 text-white rounded-xl text-lg hover:bg-red-700 cursor-pointer">
                  Sign In
                </button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
