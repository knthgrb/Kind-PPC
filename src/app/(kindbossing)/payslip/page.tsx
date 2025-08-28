"use client";

import React from "react";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { HiOutlinePencil } from "react-icons/hi2";
import { PiTrash } from "react-icons/pi";
import Pagination from "@/components/Pagination";
import { LuFilter, LuSearch } from "react-icons/lu";
import Link from "next/link";
import { payslips } from "@/lib/kindBossing/data";

export default function Payslip() {
  const pageSize = 8;
  const [page, setPage] = React.useState(1);
  const totalPages = Math.ceil(payslips.length / pageSize);
  const from = (page - 1) * pageSize;
  const rows = payslips.slice(from, from + pageSize);

  return (
    <div className="px-4 md:px-6 pt-10 pb-16">
      <div className="mx-auto max-w-7xl border border-[#D9E0E8] rounded-3xl p-6 md:p-8 bg-white">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-[1.578rem] font-medium">Payslip</h1>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-11 w-full md:w-auto">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-400 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 w-full md:w-auto"
            >
              <LuFilter className="text-base" />
              <span>Filter</span>
            </button>

            <label className="relative w-full md:w-auto">
              <LuSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full md:w-52 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
              />
            </label>
            <Link
              href="/payslip/generate"
              className="mt-2 md:mt-0 w-full md:w-auto flex items-center justify-center px-6 py-2 bg-[#CC0000] hover:bg-red-800 text-sm text-white rounded-lg"
            >
              + Create New
            </Link>
          </div>
        </div>

        {/* Table (Desktop) */}
        <div className="mt-6 overflow-x-auto hidden md:block">
          <div className="rounded-2xl border border-[#E8F1FD] overflow-x-auto">
            <table className="min-w-[900px] w-full">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  {[
                    "Employee Name",
                    "Month",
                    "Total Net Pay",
                    "Hours Work",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-gray-500 text-[0.806rem] font-medium px-6 py-3 text-left whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8F1FD] text-[15px]">
                {rows.map((p, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {p.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {p.month}
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {p.netPay}
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {p.hours}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap font-medium ${
                        p.status === "Paid"
                          ? "text-[#22C03C]"
                          : "text-[#FF0004]"
                      }`}
                    >
                      {p.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button className="p-2 rounded-full bg-red-700 text-white hover:bg-red-800">
                          <MdOutlineRemoveRedEye />
                        </button>
                        <button className="p-2 rounded-full bg-red-700 text-white hover:bg-red-800">
                          <HiOutlinePencil />
                        </button>
                        <button className="p-2 rounded-full bg-red-700 text-white hover:bg-red-800">
                          <PiTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile & Tablet Card View */}
        <div className="mt-6 space-y-4 lg:hidden">
          {rows.map((p, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-xl p-4 bg-white"
            >
              <p className="text-sm font-bold text-gray-900">{p.name}</p>
              <p className="text-sm text-gray-600">Month: {p.month}</p>
              <p className="text-sm text-gray-600">Total Net Pay: {p.netPay}</p>
              <p className="text-sm text-gray-600">Hours: {p.hours}</p>
              <p
                className={`text-sm font-medium ${
                  p.status === "Paid" ? "text-[#22C03C]" : "text-[#FF0004]"
                }`}
              >
                Status: {p.status}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <button className="flex-1 flex justify-center p-2 rounded-lg bg-red-700 text-white hover:bg-red-800">
                  <MdOutlineRemoveRedEye />
                </button>
                <button className="flex-1 flex justify-center p-2 rounded-lg bg-red-700 text-white hover:bg-red-800">
                  <HiOutlinePencil />
                </button>
                <button className="flex-1 flex justify-center p-2 rounded-lg bg-red-700 text-white hover:bg-red-800">
                  <PiTrash />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={(p) => setPage(p)}
          className="mt-6"
        />
      </div>
    </div>
  );
}
