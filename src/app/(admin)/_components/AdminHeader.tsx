"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LuBell } from "react-icons/lu";
import { FaRegEnvelope } from "react-icons/fa";
import { FaChevronDown } from "react-icons/fa6";
import { FiMenu, FiX } from "react-icons/fi";

export default function AdminHeader() {
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

        {/* Desktop Navigation */}
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex space-x-10 font-medium items-center text-[clamp(0.9rem,1vw,1.125rem)]">
          {[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Employees", href: "/employees" },
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
          <div className="flex items-center space-x-3 cursor-pointer">
            <Link href="/profile" className="w-10 aspect-square relative block">
              <Image
                src="/people/admin-profile.png"
                alt="Profile"
                fill
                className="object-cover rounded-full"
              />
            </Link>
            <span className="text-[#1a1a3b] font-medium text-[clamp(0.9rem,1vw,1rem)]">
              Andry Smith
            </span>
            <FaChevronDown className="text-[#1a1a3b] text-sm" />
          </div>
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
      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 py-6 text-[clamp(0.9rem,2.5vw,1rem)]">
          {/* Profile on Top */}
          <div className="flex items-center justify-center space-x-4 pb-6">
            <Link
              href="/profile"
              className="w-12 aspect-square relative block"
              onClick={() => setMenuOpen(false)}
            >
              <Image
                src="/people/admin-profile.png"
                alt="Profile"
                fill
                className="object-cover rounded-full"
              />
            </Link>
            <span className="text-[#1a1a3b] font-medium text-[clamp(1rem,3vw,1.125rem)]">
              Andry Smith
            </span>
            <FaChevronDown className="text-[#1a1a3b] text-sm" />
          </div>

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
