import Link from "next/link";
import React from "react";
import { LuFilter, LuSearch } from "react-icons/lu";

export default function VerifiedBadge() {
  const verifiedBadgeData = [
    {
      id: 5461,
      name: "Darlene Robertson",
      email: "abc@gmail.com",
      status: "Pending",
    },
  ];

  return (
    <div className="px-4 md:px-6 pt-10 pb-16">
      <div className="mx-auto max-w-7xl border border-[#D9E0E8] rounded-3xl p-6 md:p-8 bg-white">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-[1.578rem] font-medium">Verified Badge</h1>

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
            <Link href="/verified-badge-upload">
              <button className="mt-2 md:mt-0 w-full md:w-auto flex items-center justify-center px-6 py-2 bg-[#CC0000] hover:bg-red-800 text-sm text-white rounded-lg">
                + Create Accounts
              </button>{" "}
            </Link>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="mt-6 overflow-x-auto hidden md:block">
          <div className="rounded-2xl border border-[#E8F1FD] overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  {["Number", "Name", "Email", "Status"].map((h) => (
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
                {verifiedBadgeData.map((r, i) => (
                  <tr key={`${r.id}-${i}`}>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      #{r.id}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="mt-6 space-y-4 md:hidden">
          {verifiedBadgeData.map((r, i) => (
            <div
              key={`${r.id}-${i}`}
              className="border border-gray-200 rounded-xl p-4"
            >
              <p className="text-sm font-bold text-gray-900">
                #{r.id} - {r.name}
              </p>
              <p className="text-sm text-gray-600">Email: {r.email}</p>
              <p
                className={`text-sm font-medium ${
                  r.status === "Created" ? "text-[#22C03C]" : "text-[#FF0004]"
                }`}
              >
                Status: {r.status}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
