"use client";

import React from "react";
import { formatMMDDYYYY } from "@/utils/dateFormatter";
import Pagination from "@/components/Pagination";
import Link from "next/link";
import StatCard from "@/app/(admin)/_components/StatCard";
import { attendees, stats } from "@/lib/kindBossing/data";

export default function MyDashboard() {
  const pageSize = 8;
  const [page, setPage] = React.useState(1);
  const totalPages = Math.ceil(attendees.length / pageSize);
  const from = (page - 1) * pageSize;
  const rows = attendees.slice(from, from + pageSize);

  return (
    <div className="px-4 md:px-6 pt-10 pb-16">
      <div className="mx-auto max-w-7xl space-y-8 border border-[#D9E0E8] rounded-2xl p-4 md:p-6 bg-white">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/platform-usage-pipeline">
            <div className="rounded-xl border border-[#D0D0D0] bg-white">
              <StatCard label="Total Employees" value={stats.totalEmployees} />
            </div>
          </Link>
          <Link href="/revenue">
            <div className="rounded-xl border border-[#D0D0D0] bg-white">
              <StatCard
                label="Total Hours Worked"
                value={`₱${stats.totalHours}`}
                unit="/hr"
              />
            </div>
          </Link>
          <Link href="/verified-badge">
            <div className="rounded-xl border border-[#D0D0D0] bg-white">
              <StatCard
                label="Pending Payslips"
                value={stats.pendingPayslips}
              />
            </div>
          </Link>
          <Link href="/support">
            <div className="rounded-xl border border-[#D0D0D0] bg-white">
              <StatCard
                label="Documents Uploaded"
                value={stats.documentsUploaded}
              />
            </div>
          </Link>
        </div>

        {/* Table */}
        <div className="rounded-3xl border border-[#D9E0E8] bg-white p-6 md:p-8">
          <h2 className="text-lg font-medium mb-4">Daily Attendees Summary</h2>

          <div className="overflow-x-auto hidden md:block">
            <div className="rounded-2xl border border-[#E8F1FD] overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50 text-gray-500 text-sm">
                  <tr>
                    {[
                      "Number",
                      "Name",
                      "Date",
                      "Time In",
                      "Time Out",
                      "Total Hours",
                      "Status",
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
                        {formatMMDDYYYY(r.date)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{r.timeIn}</td>
                      <td className="px-6 py-4 text-gray-600">{r.timeOut}</td>
                      <td className="px-6 py-4 text-gray-600">{r.hours}</td>
                      <td
                        className={`px-6 py-4 font-medium ${
                          r.status === "On time"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {r.status}
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
                  Date: {formatMMDDYYYY(r.date)}
                </p>
                <p className="text-sm text-gray-600">Time In: {r.timeIn}</p>
                <p className="text-sm text-gray-600">Time Out: {r.timeOut}</p>
                <p className="text-sm text-gray-600">Hours: {r.hours}</p>
                <p
                  className={`text-sm font-medium ${
                    r.status === "On time" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {r.status}
                </p>
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
    </div>
  );
}
