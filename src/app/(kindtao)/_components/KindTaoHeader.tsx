"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiUser, FiLogOut, FiSettings } from "react-icons/fi";
import { FaChevronDown, FaRocket } from "react-icons/fa";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter, usePathname } from "next/navigation";
import { FaRegEnvelope } from "react-icons/fa";
import { LuBell } from "react-icons/lu";
import { createClient } from "@/utils/supabase/client";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, loading, signOut, isAuthenticated } = useAuthStore();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const [userDisplayName, setUserDisplayName] = useState("");
  const [isProfileBoosted, setIsProfileBoosted] = useState(false);

  const getUserInitials = () => {
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const handleSignOut = async () => {
    signOut();
    setUserMenuOpen(false);
    setMenuOpen(false);
    router.push("/login");
  };

  useEffect(() => {
    const getUserDisplayName = () => {
      // Prioritize full name like on profile page
      if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
        setUserDisplayName(
          `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
        );
        return;
      }
      if (user?.user_metadata?.first_name) {
        setUserDisplayName(user.user_metadata.first_name);
        return;
      }

      // Fallback to user email if metadata is still loading
      if (user?.email) {
        setUserDisplayName(user.email.split("@")[0]);
        return;
      }

      setUserDisplayName("User");
    };
    getUserDisplayName();
  }, [user]);

  // Check profile boost status
  useEffect(() => {
    const checkProfileBoostStatus = async () => {
      if (!user?.id) return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("kindtaos")
          .select("is_boosted, boost_expires_at")
          .eq("user_id", user.id)
          .single();

        if (!error && data) {
          const isBoosted =
            data.is_boosted &&
            data.boost_expires_at &&
            new Date(data.boost_expires_at) > new Date();
          setIsProfileBoosted(isBoosted);
        }
      } catch (error) {
        console.error("Error checking profile boost status:", error);
      }
    };

    if (user?.id) {
      checkProfileBoostStatus();
    }
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
    <header className="bg-white sticky top-0 z-50 h-[8vh] border-b border-gray-200 flex items-center">
      <div className="w-full flex justify-between items-center p-4">
        {/* Logo */}
        <Link href="/recs" className="flex items-center">
          <Image
            src="/kindLogo.png"
            alt="Kind Logo"
            width={150}
            height={50}
            className="h-8 w-auto sm:h-10 lg:h-12"
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
                {/* Boost Profile Badge - Only show if not boosted */}
                {!isProfileBoosted && (
                  <Link
                    href="/profile"
                    className="relative flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors bg-white text-[#CC0000] border-2 border-[#CC0000] hover:bg-red-50 shadow-sm">
                      <FaRocket className="w-3 h-3" />
                      <span className="hidden sm:inline">Boost Profile</span>
                    </div>
                  </Link>
                )}

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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
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
                      href="/settings"
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
                {/* Boost Profile Badge - Mobile - Only show if not boosted */}
                {!isProfileBoosted && (
                  <Link
                    href="/profile"
                    className="relative flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors bg-white text-[#CC0000] border-2 border-[#CC0000] hover:bg-red-50 shadow-sm">
                      <FaRocket className="w-3 h-3" />
                    </div>
                  </Link>
                )}

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
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
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
                      href="/settings"
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
