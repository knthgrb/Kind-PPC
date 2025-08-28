"use client";

import React from "react";
import { formatMMDDYYYY } from "@/utils/dateFormatter";
import Pagination from "@/components/Pagination";
import { LuFilter, LuSearch } from "react-icons/lu";
import { fraudData } from "@/lib/admin/tableData";

export default function FraudActivity() {
  const pageSize = 8;
  const [page, setPage] = React.useState(1);
  const totalPages = Math.ceil(fraudData.length / pageSize);
  const from = (page - 1) * pageSize;
  const rows = fraudData.slice(from, from + pageSize);

  return (
    <div className="px-4 md:px-6 pt-10 pb-16">
      <div className="mx-auto max-w-7xl border border-[#D9E0E8] rounded-3xl p-6 md:p-8 bg-white">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-[1.578rem] font-medium">Fraud Activity</h1>

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
        <div className="mt-6 overflow-x-auto hidden md:block">
          <div className="rounded-2xl border border-[#E8F1FD] overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  {[
                    "Number",
                    "Name",
                    "Activity Type",
                    "Joining Date",
                    "Time",
                    "Status",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-gray-500 text-[0.806rem] font-medium px-6 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8F1FD] text-[15px]">
                {rows.map((r, i) => (
                  <tr key={`${r.name}-${from + i}`}>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {String(from + i + 1).padStart(2, "0")}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{r.name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {r.activityType}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatMMDDYYYY(r.joiningDate)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{r.time}</td>
                    <td
                      className={`px-6 py-4 ${
                        r.status === "Resolved"
                          ? "text-[#22C03C]"
                          : "text-[#FF0004]"
                      }`}
                    >
                      {r.status}
                    </td>
                    <td className="px-6 py-4">
                      <button className="inline-block rounded-xl bg-red-700 px-4 py-2 text-white text-[0.64rem] font-semibold hover:bg-red-800">
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="mt-6 space-y-4 md:hidden">
          {rows.map((r, i) => (
            <div
              key={`${r.name}-${from + i}`}
              className="border border-gray-200 rounded-xl p-4"
            >
              <p className="text-sm font-bold text-gray-900">
                #{from + i + 1} - {r.name}
              </p>
              <p className="text-sm text-gray-600">
                Activity: {r.activityType}
              </p>
              <p className="text-sm text-gray-600">
                Joining: {formatMMDDYYYY(r.joiningDate)}
              </p>
              <p className="text-sm text-gray-600">Time: {r.time}</p>
              <p
                className={`text-sm font-medium ${
                  r.status === "Resolved" ? "text-[#22C03C]" : "text-[#FF0004]"
                }`}
              >
                {r.status}
              </p>
              <button className="mt-2 w-full bg-red-700 text-white text-xs px-4 py-2 rounded-lg hover:bg-red-800">
                View Profile
              </button>
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
