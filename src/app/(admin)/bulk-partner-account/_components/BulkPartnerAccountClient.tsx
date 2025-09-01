"use client";

import React from "react";
import Pagination from "@/components/Pagination";
import ViewProfileModal from "./viewProfileModal";
import RecreateModal from "./recreateModal";
import { bulkPartnerAccountData } from "@/lib/admin/tableData";

export default function BulkPartnerAccountClient() {
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
    <div>
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
