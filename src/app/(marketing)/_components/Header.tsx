"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiMenu, FiX, FiUser, FiLogOut } from "react-icons/fi";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, loading, signOut, isAuthenticated } = useAuthStore();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [userDisplayName, setUserDisplayName] = useState("");

  const handleSignOut = async () => {
    await signOut();
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
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
    <header className="bg-white sticky top-0 z-50">
      <div className="w-full max-w-7xl mx-auto flex justify-between items-center p-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/kindLogo.png"
            alt="Kind Logo"
            width={150}
            height={50}
            className="h-8 w-auto sm:h-10 lg:h-12"
          />
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden lg:flex space-x-10 text-lg font-medium">
          <Link href="/" className="hover:text-red-600">
            Home
          </Link>
          <Link href="/find-help" className="hover:text-red-600">
            Find Help
          </Link>
          <Link href="/find-work" className="hover:text-red-600">
            Find Work
          </Link>
          <Link href="/about" className="hover:text-red-600">
            About
          </Link>
          <Link href="/pricing" className="hover:text-red-600">
            Pricing
          </Link>
          <Link href="/contact-us" className="hover:text-red-600">
            Contact Us
          </Link>
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden lg:flex space-x-4">
          {loading ? (
            <div className="px-6 py-2 text-gray-500">Loading...</div>
          ) : isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <FiUser className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  {userDisplayName && (
                    <div className="text-lg font-semibold text-gray-900 leading-tight">
                      {userDisplayName}
                    </div>
                  )}
                  {user?.user_metadata?.role && (
                    <div className="text-xs text-gray-500 capitalize">
                      {user.user_metadata.role}
                    </div>
                  )}
                </div>
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Dashboard
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
                <button className="px-6 py-2 bg-red-600 text-white rounded-md text-lg hover:bg-red-700 cursor-pointer">
                  Sign In
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="lg:hidden text-md bg-white border-t border-gray-200 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 justify-items-center sm:justify-items-center lg:justify-items-start text-center sm:text-center lg:text-left">
            <Link
              href="/"
              className="hover:text-red-600"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/find-help"
              className="hover:text-red-600"
              onClick={() => setMenuOpen(false)}
            >
              Find Help
            </Link>
            <Link
              href="/find-work"
              className="hover:text-red-600"
              onClick={() => setMenuOpen(false)}
            >
              Find Work
            </Link>
            <Link
              href="/about"
              className="hover:text-red-600"
              onClick={() => setMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/pricing"
              className="hover:text-red-600"
              onClick={() => setMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/contact-us"
              className="hover:text-red-600"
              onClick={() => setMenuOpen(false)}
            >
              Contact Us
            </Link>
          </div>

          {/* Buttons row */}
          <div className="flex flex-col sm:flex-row items-center sm:justify-center gap-4 mt-6">
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : isAuthenticated ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center space-x-3">
                  <FiUser className="w-6 h-6 text-gray-600" />
                  <div className="text-center">
                    {userDisplayName && (
                      <div className="text-xl font-semibold text-gray-900 leading-tight">
                        {userDisplayName}
                      </div>
                    )}
                    {user?.user_metadata?.role && (
                      <div className="text-sm text-gray-500 capitalize">
                        {user.user_metadata.role}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/profile" onClick={() => setMenuOpen(false)}>
                    <button className="w-40 px-6 py-2 bg-white text-lg border border-gray-300 hover:bg-gray-50 cursor-pointer">
                      Profile
                    </button>
                  </Link>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                    <button className="w-40 px-6 py-2 bg-gray-100 text-lg border border-gray-300 hover:bg-gray-200 cursor-pointer">
                      Dashboard
                    </button>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-40 px-6 py-2 bg-red-600 text-white rounded-md text-lg hover:bg-red-700 cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Link href="/register" onClick={() => setMenuOpen(false)}>
                  <button className="w-40 px-6 py-2 bg-white text-lg border border-gray-300">
                    Register
                  </button>
                </Link>
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  <button className="w-40 px-6 py-2 bg-red-600 text-white rounded-md text-lg hover:bg-red-700">
                    Sign In
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
