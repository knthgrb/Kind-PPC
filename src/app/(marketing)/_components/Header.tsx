"use client";
import { useState } from "react";
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
          className="lg:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Mobile Slide-over Menu */}
      {/* Overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
      />
      {/* Drawer */}
      <div
        className={`lg:hidden fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-xl transform transition-transform duration-300 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
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
          <button className="text-2xl" onClick={() => setMenuOpen(false)}>
            <FiX />
          </button>
        </div>
        <nav className="flex flex-col gap-4 p-6 text-lg">
          <Link
            href="/"
            className={getLinkClasses("/")}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            href="/recs"
            className={getLinkClasses("/recs")}
            onClick={() => setMenuOpen(false)}
          >
            Find Work
          </Link>
          <Link
            href="/about"
            className={getLinkClasses("/about")}
            onClick={() => setMenuOpen(false)}
          >
            About
          </Link>
          <Link
            href="/pricing"
            className={getLinkClasses("/pricing")}
            onClick={() => setMenuOpen(false)}
          >
            Pricing
          </Link>
          <Link
            href="/contact-us"
            className={getLinkClasses("/contact-us")}
            onClick={() => setMenuOpen(false)}
          >
            Contact Us
          </Link>
        </nav>
        <div className="bg-red-600 mt-auto p-6 border-t border-gray-200 flex flex-col gap-3">
          {isAuthenticated && userRole ? (
            <Link
              href={userRole === "kindbossing" ? "/my-job-posts" : "/recs"}
              onClick={() => setMenuOpen(false)}
              className="w-full"
            >
              <Button variant="primary" size="lg" fullWidth>
                {userRole === "kindbossing" ? "Go to Job Posts" : "Find Jobs"}
              </Button>
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                onClick={() => setMenuOpen(false)}
                className="w-full"
              >
                <Button variant="secondary" size="lg" fullWidth>
                  Sign Up
                </Button>
              </Link>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="w-full"
              >
                <Button variant="primary" size="lg" fullWidth>
                  Login
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
