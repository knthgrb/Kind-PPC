import React from "react";
import { LuFilter, LuSearch } from "react-icons/lu";
import { govBenefits } from "@/lib/kindBossing/data";

export default function GovernmentBenefits() {
  return (
    <div className="px-4 md:px-6 pt-10 pb-16">
      <div className="mx-auto max-w-7xl border border-[#D9E0E8] rounded-4xl p-4 md:p-6 bg-white">
        <div className="border border-[#D9E0E8] rounded-3xl p-6 md:p-8 bg-white">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h1 className="text-[1.578rem] font-medium">Gov&apos;t Benefits</h1>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-11 w-full md:w-auto">
              <label className="relative w-full md:w-auto">
                <LuSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full lg:w-110 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                />
              </label>
            </div>
          </div>

          {/* Tables for each category */}
          <div className="mt-6 space-y-10">
            {govBenefits.map((category) => (
              <div key={category.name}>
                <div
                  key={category.name}
                  className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4"
                >
                  <h2 className="text-lg font-semibold">{category.name}</h2>

                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-6 w-full md:w-auto">
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

                {/* Desktop Table */}
                <div className="overflow-x-auto hidden md:block">
                  <div className="rounded-2xl border border-[#E8F1FD] overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 text-gray-500 text-sm">
                        <tr>
                          {[
                            "Number",
                            "Last Payment Date",
                            "Amount",
                            "Next Due Date",
                            "Status",
                            "Notes",
                          ].map((h) => (
                            <th
                              key={h}
                              className={`text-gray-500 text-[0.806rem] font-medium px-6 py-3 text-left ${
                                h === "Notes" ? "max-w-[200px] w-[200px]" : ""
                              }`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8F1FD] text-[15px]">
                        {category.records.map((r) => (
                          <tr key={`${category.name}-${r.number}`}>
                            <td className="px-6 py-4 font-bold text-gray-900">
                              {r.number}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {r.lastPaymentDate}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {r.amount}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {r.nextDueDate}
                            </td>
                            <td
                              className={`px-6 py-4 font-medium ${
                                r.status === "Paid"
                                  ? "text-[#22C03C]"
                                  : "text-[#FF0004]"
                              }`}
                            >
                              {r.status}
                            </td>
                            <td className="px-6 py-4 text-gray-600 text-xs max-w-[200px] whitespace-normal break-words overflow-hidden text-ellipsis line-clamp-2">
                              {r.notes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Card View */}
                <div className="space-y-4 md:hidden">
                  {category.records.map((r) => (
                    <div
                      key={`${category.name}-${r.number}`}
                      className="border border-gray-200 rounded-xl p-4"
                    >
                      <p className="text-sm font-bold text-gray-900">
                        #{r.number} - {category.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Last Payment: {r.lastPaymentDate}
                      </p>
                      <p className="text-sm text-gray-600">
                        Amount: {r.amount}
                      </p>
                      <p className="text-sm text-gray-600">
                        Next Due: {r.nextDueDate}
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          r.status === "Paid"
                            ? "text-[#22C03C]"
                            : "text-[#FF0004]"
                        }`}
                      >
                        {r.status}
                      </p>
                      <p className="!text-xs text-gray-600 mt-2 line-clamp-2">
                        {r.notes}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
