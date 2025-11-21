"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiUser, FiLogOut, FiSettings } from "react-icons/fi";
import { FaChevronDown } from "react-icons/fa";
import { useAuthStore, useAuthSync } from "@/stores/useAuthStore";
import { useRouter, usePathname } from "next/navigation";

type UserMetadata = {
  first_name?: string | null;
  last_name?: string | null;
};

export default function Header() {
  useAuthSync();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, loading, signOut, isAuthenticated } = useAuthStore();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [userDisplayName, setUserDisplayName] = useState("");

  const getUserInitials = () => {
    const metadata = (user as { user_metadata?: UserMetadata })?.user_metadata;
    const firstInitial = metadata?.first_name?.[0]?.toUpperCase();
    const lastInitial = metadata?.last_name?.[0]?.toUpperCase();

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

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    router.replace("/login");
  };

  useEffect(() => {
    const metadata = (user as { user_metadata?: UserMetadata })?.user_metadata;
    if (metadata?.first_name && metadata?.last_name) {
      setUserDisplayName(`${metadata.first_name} ${metadata.last_name}`);
      return;
    }
    if (metadata?.first_name) {
      setUserDisplayName(metadata.first_name);
      return;
    }

    if ((user as { name?: string })?.name) {
      setUserDisplayName((user as { name?: string }).name as string);
      return;
    }

    if (user?.email) {
      setUserDisplayName(user.email.split("@")[0]);
      return;
    }

    setUserDisplayName("User");
  }, [user]);

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
      // Use a small delay to allow button clicks to process first
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
      <div className="w-full flex justify-between items-center p-4">
        {/* Logo */}
        <Link href="/recs" className="flex items-center">
          <Image
            src="/kindLogo.png"
            alt="Kind Logo"
            width={100}
            height={30}
            className="h-8 w-auto"
          />
        </Link>

        {/* Desktop Buttons */}
        <div className="hidden lg:flex space-x-6 items-center justify-center">
          <div className="flex space-x-6 items-center"></div>
          {loading ? (
            <div className="flex items-center gap-2">
              {/* Avatar skeleton */}
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              {/* Name skeleton */}
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <div className="flex items-center gap-2">
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
                    {userDisplayName}
                  </span>
                  {/* Dropdown icon */}
                  <FaChevronDown
                    size={14}
                    className={`text-[#1F2A56] transition-transform duration-200 ${
                      userMenuOpen ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>
              </div>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-250">
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <FiUser className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/kindtao/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <FiSettings className="w-4 h-4" />
                      <span>Settings</span>
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
            <>
              <Link href="/signup">
                <button className="px-6 py-2 bg-white text-lg cursor-pointer">
                  Register
                </button>
              </Link>
              <Link href="/login">
                <button className="px-6 py-2 bg-red-600 text-white rounded-xl text-lg hover:bg-red-700 cursor-pointer">
                  Sign In
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Avatar */}
        <div className="lg:hidden">
          {loading ? (
            <div className="flex items-center gap-2">
              {/* Mobile Avatar skeleton */}
              <div className="w-7 h-7 bg-gray-200 rounded-full animate-pulse"></div>
              {/* Mobile dropdown icon skeleton */}
              <div className="w-3 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 cursor-pointer p-1"
                >
                  {/* Mobile Avatar circle with initials - smaller size */}
                  <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    {getUserInitials()}
                  </div>
                  {/* Mobile dropdown icon - smaller */}
                  <FaChevronDown
                    size={12}
                    className={`text-[#1F2A56] transition-transform duration-200 ${
                      userMenuOpen ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>
              </div>

              {/* Mobile User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-200 z-250">
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <FiUser className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/kindtao/settings"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <FiSettings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center space-x-2"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/signup">
                <button className="px-3 py-1.5 bg-white text-sm cursor-pointer text-[#1F2A56]">
                  Register
                </button>
              </Link>
              <Link href="/login">
                <button className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 cursor-pointer">
                  Sign In
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu hidden due to bottom tabs */}
    </header>
  );
}
