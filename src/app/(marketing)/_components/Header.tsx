"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMenu, FiX } from "react-icons/fi";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/buttons";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const userRole = user?.role;

  // Helper function to check if a path is active
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  // Helper function to get link classes with active state
  const getLinkClasses = (
    path: string,
    baseClasses: string = "hover:text-red-600"
  ) => {
    return `${baseClasses} ${isActive(path) ? "text-red-600" : ""}`;
  };

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

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
          <Link href="/" className={getLinkClasses("/")}>
            Home
          </Link>
          <Link href="/about" className={getLinkClasses("/about")}>
            About
          </Link>
          <Link href="/pricing" className={getLinkClasses("/pricing")}>
            Pricing
          </Link>
          <Link href="/support" className={getLinkClasses("/support")}>
            Support
          </Link>
        </nav>

        <div className="hidden lg:flex items-center space-x-4">
          {isAuthenticated && userRole ? (
            <Link
              href={userRole === "kindbossing" ? "/my-job-posts" : "/recs"}
              className="w-40"
            >
              <Button variant="primary" size="md" className="w-full">
                {userRole === "kindbossing" ? "Go to Job Posts" : "Find Jobs"}
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/signup" className="inline-block">
                <Button variant="secondary" size="md" className="w-32">
                  Sign Up
                </Button>
              </Link>
              <Link href="/login" className="inline-block">
                <Button variant="primary" size="md" className="w-32">
                  Login
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-2xl text-gray-700 hover:text-gray-900 transition-colors p-2 -mr-2 cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile Slide-over Menu */}
      {/* Overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      />
      {/* Drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-50 w-full h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
            <Link
              href="/"
              className="flex items-center"
              onClick={() => setMenuOpen(false)}
            >
              <Image
                src="/kindLogo.png"
                alt="Kind Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <button
              className="text-2xl text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
              onClick={() => setMenuOpen(false)}
            >
              <FiX />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <nav className="flex flex-col gap-1 p-5">
              <Link
                href="/"
                className={`px-4 py-3 rounded-xl text-lg font-medium transition-colors ${getLinkClasses(
                  "/",
                  "text-gray-700 hover:bg-gray-50"
                )}`}
                onClick={() => setMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className={`px-4 py-3 rounded-xl text-lg font-medium transition-colors ${getLinkClasses(
                  "/about",
                  "text-gray-700 hover:bg-gray-50"
                )}`}
                onClick={() => setMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/pricing"
                className={`px-4 py-3 rounded-xl text-lg font-medium transition-colors ${getLinkClasses(
                  "/pricing",
                  "text-gray-700 hover:bg-gray-50"
                )}`}
                onClick={() => setMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/support"
                className={`px-4 py-3 rounded-xl text-lg font-medium transition-colors ${getLinkClasses(
                  "/support",
                  "text-gray-700 hover:bg-gray-50"
                )}`}
                onClick={() => setMenuOpen(false)}
              >
                Support
              </Link>
            </nav>
          </div>

          {/* Footer with Buttons */}
          <div className="p-5 border-t border-gray-200 bg-gray-50 shrink-0">
            {isAuthenticated && userRole ? (
              <Link
                href={userRole === "kindbossing" ? "/my-job-posts" : "/recs"}
                onClick={() => setMenuOpen(false)}
                className="block"
              >
                <Button variant="primary" size="lg" fullWidth>
                  {userRole === "kindbossing" ? "Go to Job Posts" : "Find Jobs"}
                </Button>
              </Link>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="block"
                >
                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    className="border-2 border-gray-300 hover:border-gray-400"
                  >
                    Sign Up
                  </Button>
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block"
                >
                  <Button variant="primary" size="lg" fullWidth>
                    Login
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
