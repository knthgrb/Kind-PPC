"use client";

import React from "react";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { HiOutlinePencil } from "react-icons/hi2";
import { PiTrash } from "react-icons/pi";
import Pagination from "@/components/Pagination";

import { Payslip } from "@/lib/kindBossing/data";

interface PayslipClientProps {
  payslips: Payslip[];
}

export default function PayslipClient({ payslips }: PayslipClientProps) {
  const pageSize = 8;
  const [page, setPage] = React.useState(1);
  const totalPages = Math.ceil(payslips.length / pageSize);
  const from = (page - 1) * pageSize;
  const rows = payslips.slice(from, from + pageSize);

  return (
    <>
      {/* Desktop Table */}
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
                      p.status === "Paid" ? "text-[#22C03C]" : "text-[#FF0004]"
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

      {/* Mobile Card View */}
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
    </>
  );
}
