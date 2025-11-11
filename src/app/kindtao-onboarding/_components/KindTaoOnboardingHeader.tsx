"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaChevronDown } from "react-icons/fa6";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";

export default function Header() {
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
      <div className="w-full flex justify-between items-center px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/kindLogo.png"
            alt="Kind Logo"
            width={150}
            height={50}
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

      {/* Mobile Dropdown Menu (not used for KindTao onboarding header) */}
      {menuOpen && null}
    </header>
  );
}
