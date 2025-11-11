"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiMenu, FiX, FiUser, FiLogOut, FiBarChart2 } from "react-icons/fi";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/buttons";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, loading, signOut, isAuthenticated } = useAuthStore();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [userDisplayName, setUserDisplayName] = useState("");
  const pathname = usePathname();

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
          <Link href="/" className={getLinkClasses("/")}>
            Home
          </Link>
          <Link href="/about" className={getLinkClasses("/about")}>
            About
          </Link>
          <Link href="/pricing" className={getLinkClasses("/pricing")}>
            Pricing
          </Link>
          <Link href="/contact-us" className={getLinkClasses("/contact-us")}>
            Contact Us
          </Link>
        </nav>

        <div className="hidden lg:flex space-x-4">
          <Link href="/signup">
            <Button variant="secondary" size="md" className="w-30">
              Sign Up
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="primary" size="md" className="w-30">
              Login
            </Button>
          </Link>
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
        </div>
      </div>
    </header>
  );
}
