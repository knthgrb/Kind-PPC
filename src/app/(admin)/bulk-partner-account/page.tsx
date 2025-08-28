"use client";

import React from "react";
import { formatMMDDYYYY } from "@/utils/dateFormatter";
import Pagination from "@/components/Pagination";
import { LuFilter, LuSearch } from "react-icons/lu";
import ViewProfileModal from "./_components/viewProfileModal";
import RecreateModal from "./_components/recreateModal";
import { bulkPartnerAccountData } from "@/lib/admin/tableData";

export default function BulkPartnerAccount() {
  const pageSize = 8;
  const [page, setPage] = React.useState(1);
  const totalPages = Math.ceil(bulkPartnerAccountData.length / pageSize);
  const from = (page - 1) * pageSize;
  const rows = bulkPartnerAccountData.slice(from, from + pageSize);

  const [openViewProfile, setOpenViewProfile] = React.useState(false);
  const [openRecreate, setOpenRecreate] = React.useState(false);
  const [selected, setSelected] = React.useState<
    (typeof bulkPartnerAccountData)[number] | null
  >(null);

  const handleOpen = (row: (typeof bulkPartnerAccountData)[number]) => {
    setSelected(row);
    if (row.status === "Created") {
      setOpenViewProfile(true);
    } else {
      setOpenRecreate(true);
    }
  };

  return (
    <div className="px-4 md:px-6 pt-10 pb-16">
      <div className="mx-auto max-w-7xl border border-[#D9E0E8] rounded-3xl p-6 md:p-8 bg-white">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-[1.578rem] font-medium">Bulk Partner Accounts</h1>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-11 w-full md:w-auto">
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-400 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 w-full md:w-auto">
              <LuFilter className="text-base" />
              <span>Filter</span>
            </button>

            <label className="relative w-full md:w-52">
              <LuSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
              />
            </label>

            <button className="mt-2 md:mt-0 w-full md:w-auto flex items-center justify-center px-6 py-2 bg-[#CC0000] hover:bg-red-800 text-sm text-white rounded-lg">
              + Create Accounts
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="mt-6 overflow-x-auto hidden md:block">
          <div className="rounded-2xl border border-[#E8F1FD] overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  {["Number", "Name", "Email", "Status", "Action"].map((h) => (
                    <th
                      key={h}
                      className="text-gray-500 text-[0.806rem] font-medium px-6 py-3 text-left"
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
                    <td className="px-6 py-4 text-gray-600">{r.email}</td>
                    <td
                      className={`px-6 py-4 ${
                        r.status === "Created"
                          ? "text-[#22C03C]"
                          : "text-[#FF0004]"
                      }`}
                    >
                      {r.status}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleOpen(r)}
                        className="inline-flex items-center justify-center w-28 rounded-xl bg-red-700 px-4 py-2 text-white text-xs font-semibold hover:bg-red-800"
                      >
                        {r.status === "Created" ? "View Profile" : "Recreate"}
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
              <p className="text-sm text-gray-600">Email: {r.email}</p>
              <p
                className={`text-sm font-medium ${
                  r.status === "Created" ? "text-[#22C03C]" : "text-[#FF0004]"
                }`}
              >
                Status: {r.status}
              </p>
              <button
                onClick={() => handleOpen(r)}
                className="mt-2 w-full bg-red-700 text-white text-xs px-4 py-2 rounded-lg hover:bg-red-800"
              >
                {r.status === "Created" ? "View Profile" : "Recreate"}
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

      <ViewProfileModal
        open={openViewProfile}
        onClose={() => setOpenViewProfile(false)}
        bulkPartnerAccount={selected}
      />

      <RecreateModal
        open={openRecreate}
        onClose={() => setOpenRecreate(false)}
      />
    </div>
  );
}
