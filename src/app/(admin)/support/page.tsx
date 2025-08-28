"use client";

import React from "react";
import { formatMMDDYYYY } from "@/utils/dateFormatter";
import Pagination from "@/components/Pagination";
import { LuFilter, LuSearch } from "react-icons/lu";
import SupportTicketDialog from "./_components/supportTicketModal";
import { ticketData } from "@/lib/admin/tableData";

export default function SupportTickets() {
  const pageSize = 8;
  const [page, setPage] = React.useState(1);
  const totalPages = Math.ceil(ticketData.length / pageSize);
  const from = (page - 1) * pageSize;
  const rows = ticketData.slice(from, from + pageSize);

  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<
    (typeof ticketData)[number] | null
  >(null);

  const handleOpen = (row: (typeof ticketData)[number]) => {
    setSelected(row);
    setOpen(true);
  };

  return (
    <div className="px-4 md:px-6 pt-6 pb-16">
      <div className="mx-auto max-w-7xl border border-[#D9E0E8] rounded-3xl p-4 md:p-8 bg-white">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-xl md:text-[1.578rem] font-medium">
            Support Tickets
          </h1>

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

        {/* Table (Desktop) */}
        <div className="mt-6 overflow-x-auto hidden md:block">
          <div className="rounded-2xl border border-[#E8F1FD] overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  {[
                    "Ticket ID",
                    "User Name",
                    "User Type",
                    "Issue Type",
                    "Submitted Date",
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
                  <tr key={`${r.id}-${from + i}`}>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      #{r.id}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{r.userName}</td>
                    <td className="px-6 py-4 text-gray-600">{r.userType}</td>
                    <td className="px-6 py-4 text-gray-600">{r.issueType}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {formatMMDDYYYY(r.submittedDate)}
                    </td>
                    <td
                      className={`px-6 py-4 ${
                        r.status === "Resolved"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {r.status}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleOpen(r)}
                        className="bg-red-700 text-white text-xs px-4 py-2 rounded-lg hover:bg-red-800"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card View (Mobile) */}
        <div className="mt-6 space-y-4 md:hidden">
          {rows.map((r, i) => (
            <div
              key={`${r.id}-${from + i}`}
              className="border border-gray-200 rounded-xl p-4"
            >
              <p className="text-sm font-semibold text-gray-900">
                #{r.id} - {r.userName}
              </p>
              <p className="text-sm text-gray-600">Type: {r.userType}</p>
              <p className="text-sm text-gray-600">Issue: {r.issueType}</p>
              <p className="text-sm text-gray-600">
                Date: {formatMMDDYYYY(r.submittedDate)}
              </p>
              <p
                className={`text-sm font-medium ${
                  r.status === "Resolved" ? "text-green-600" : "text-red-600"
                }`}
              >
                {r.status}
              </p>
              <button
                onClick={() => handleOpen(r)}
                className="mt-3 w-full bg-red-700 text-white text-xs px-4 py-2 rounded-lg hover:bg-red-800"
              >
                View Details
              </button>
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

      <SupportTicketDialog
        open={open}
        onClose={() => setOpen(false)}
        ticket={selected}
      />
    </div>
  );
}
