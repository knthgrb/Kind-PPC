"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiMenu, FiX } from "react-icons/fi";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

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
          <Link href="/register">
            <button className="px-6 py-2 bg-white text-lg cursor-pointer">
              Register
            </button>
          </Link>
          <Link href="/login">
            <button className="px-6 py-2 bg-red-600 text-white rounded-md text-lg hover:bg-red-700 cursor-pointer">
              Sign In
            </button>
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
          </div>
        </div>
      )}
    </header>
  );
}
