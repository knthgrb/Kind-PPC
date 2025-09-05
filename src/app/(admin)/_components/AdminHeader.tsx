"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { LuBell } from "react-icons/lu";
import { FaRegEnvelope } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa6";
import { FiMenu, FiX, FiUser, FiLogOut } from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";

export default function AdminHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, userMetadata, loading, signOut, isAuthenticated } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    setMenuOpen(false);
  };

  const getUserDisplayName = () => {
    if (userMetadata?.first_name && userMetadata?.last_name) {
      return `${userMetadata.first_name} ${userMetadata.last_name}`;
    }
    if (userMetadata?.first_name) {
      return userMetadata.first_name;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
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
    <header className="bg-white">
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

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex space-x-10 font-medium items-center text-[clamp(0.9rem,1vw,1.125rem)]">
          {[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Employees", href: "/profile-verification" },
            { label: "Payslip", href: "/error" },
            { label: "Gov't Benefits", href: "/error" },
            { label: "Documents", href: "/error" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="hover:text-red-600"
            >
              {item.label}
            </Link>
          ))}

          {/* Messages & Notifications */}
          <Link href="/messages">
            <FaRegEnvelope className="text-[#636363] hover:text-red-600 cursor-pointer text-[clamp(1rem,1.2vw,1.25rem)]" />
          </Link>
          <Link href="/notifications">
            <LuBell className="text-[#636363] hover:text-red-600 cursor-pointer text-[clamp(1rem,1.2vw,1.25rem)]" />
          </Link>

          {/* Profile */}
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
                  <div className="text-lg font-semibold text-gray-900 leading-tight">
                    {getUserDisplayName()}
                  </div>
                  {userMetadata?.role && (
                    <div className="text-xs text-gray-500 capitalize">
                      {userMetadata.role}
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
            <Link href="/login">
              <button className="px-6 py-2 bg-red-600 text-white rounded-md text-lg hover:bg-red-700 cursor-pointer">
                Sign In
              </button>
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center space-x-5">
          <Link href="/messages" onClick={() => setMenuOpen(false)}>
            <FaRegEnvelope className="text-[#636363] hover:text-red-600 text-xl" />
          </Link>
          <Link href="/notifications" onClick={() => setMenuOpen(false)}>
            <LuBell className="text-[#636363] hover:text-red-600 text-xl" />
          </Link>
          <button className="text-2xl" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 py-6 text-[clamp(0.9rem,2.5vw,1rem)]">
          {/* Profile on Top */}
          {isAuthenticated ? (
            <div className="flex items-center justify-center space-x-4 pb-6">
              <div className="w-12 aspect-square relative block">
                <FiUser className="w-8 h-8 text-gray-600" />
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
                <button className="px-6 py-2 bg-red-600 text-white rounded-md text-lg hover:bg-red-700 cursor-pointer">
                  Sign In
                </button>
              </Link>
            </div>
          )}

          {/* Menu Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 justify-items-center text-center">
            {[
              "Dashboard",
              "Employees",
              "Payslip",
              "Gov't Benefits",
              "Documents",
            ].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase().replace(/ /g, "-")}`}
                className="hover:text-red-600"
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
