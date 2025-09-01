"use client";

import React from "react";
import { formatMMDDYYYY } from "@/utils/dateFormatter";
import Pagination from "@/components/Pagination";
import { LuFilter, LuSearch } from "react-icons/lu";
import Link from "next/link";
import { Employee } from "@/lib/kindBossing/employees";

interface MyEmployeesClientProps {
  employees: Employee[];
}

export default function MyEmployeesClient({
  employees,
}: MyEmployeesClientProps) {
  const pageSize = 8;
  const [page, setPage] = React.useState(1);
  const totalPages = Math.ceil(employees.length / pageSize);
  const from = (page - 1) * pageSize;
  const rows = employees.slice(from, from + pageSize);

  return (
    <div>
      {/* Desktop Table */}
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
  );
}
