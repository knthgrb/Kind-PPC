"use client";

import React from "react";
import { formatMMDDYYYY } from "@/utils/dateFormatter";
import Pagination from "@/components/Pagination";
import { LuFilter, LuSearch } from "react-icons/lu";
import Link from "next/link";
import { employees } from "@/lib/kindBossing/employees";

export default function MyEmployees() {
  const pageSize = 8;
  const [page, setPage] = React.useState(1);
  const totalPages = Math.ceil(employees.length / pageSize);
  const from = (page - 1) * pageSize;
  const rows = employees.slice(from, from + pageSize);

  return (
    <div className="px-4 md:px-6 pt-10 pb-16">
      <div className="mx-auto max-w-7xl border border-[#D9E0E8] rounded-3xl p-6 md:p-8 bg-white">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-[1.578rem] font-medium">Employees</h1>

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
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-x-auto hidden lg:block">
          <div className="rounded-2xl border border-[#E8F1FD] overflow-x-auto">
            <table className="min-w-[900px] w-full">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  {[
                    "Number",
                    "Name",
                    "Job",
                    "Joining Date",
                    "Total Hours Work",
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
                {rows.map((r, i) => (
                  <tr key={`${r.name}-${from + i}`}>
                    <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">
                      {String(from + i + 1).padStart(2, "0")}
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {r.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {r.job}
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {formatMMDDYYYY(r.joiningDate)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                      {r.totalHoursWork}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap ${
                        r.status === "Active"
                          ? "text-[#22C03C]"
                          : "text-[#FF0004]"
                      }`}
                    >
                      {r.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/my-employees/${encodeURIComponent(r.name)}`}
                        className="mt-2 w-full bg-red-700 text-white text-xs px-4 py-2 rounded-lg hover:bg-red-800 text-center block"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="mt-6 space-y-4 lg:hidden">
          {rows.map((r, i) => (
            <div
              key={`${r.name}-${from + i}`}
              className="border border-gray-200 rounded-xl p-4"
            >
              <p className="text-sm font-bold text-gray-900">
                #{from + i + 1} - {r.name}
              </p>
              <p className="text-sm text-gray-600">Job: {r.job}</p>
              <p className="text-sm text-gray-600">
                Joining: {formatMMDDYYYY(r.joiningDate)}
              </p>
              <p className="text-sm text-gray-600">
                Total Hours Work: {r.totalHoursWork}
              </p>
              <p
                className={`text-sm font-medium ${
                  r.status === "Active" ? "text-[#22C03C]" : "text-[#FF0004]"
                }`}
              >
                <span className="text-gray-600">Status:</span>
                {r.status}
              </p>
              <Link
                href={`/my-employees/${encodeURIComponent(r.name)}`}
                className="mt-2 w-full bg-red-700 text-white text-xs px-4 py-2 rounded-lg hover:bg-red-800 text-center block"
              >
                View Profile
              </Link>
            </div>
          ))}
        </div>

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
