"use client";

import React from "react";
import Pagination from "@/components/pagination/Pagination";
import Link from "next/link";
import { Employee } from "@/types/employee";
import { FaUser, FaEye } from "react-icons/fa";

interface MyEmployeesClientProps {
  employees: Employee[];
}

export default function MyEmployeesClient({
  employees,
}: MyEmployeesClientProps) {
  const pageSize = 10;
  const [page, setPage] = React.useState(1);
  const totalPages = Math.ceil(employees.length / pageSize);
  const from = (page - 1) * pageSize;
  const rows = employees.slice(from, from + pageSize);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      {/* Desktop Table */}
      <div className="overflow-x-auto">
        <div className="rounded-2xl border border-gray-200 overflow-hidden">
          <table className="min-w-full bg-white">
            <thead className="bg-white border-b border-gray-200 text-gray-500 text-sm">
              <tr>
                {[
                  "Employee",
                  "Job",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-gray-500 text-sm font-medium px-6 py-4 text-left whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {rows.map((employee, i) => (
                <tr
                  key={`${employee.id}-${from + i}`}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <FaUser className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {employee.kindtao?.user
                            ? `${employee.kindtao.user.first_name || ""} ${employee.kindtao.user.last_name || ""}`.trim() || "Unknown"
                            : "Unknown"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {employee.job_post?.job_title || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        employee.status
                      )}`}
                    >
                      {employee.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/my-employees/${employee.id}`}
                      className="inline-flex items-center space-x-2 bg-[#CC0000] text-white text-xs px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <FaEye className="w-3 h-3" />
                      <span>View Profile</span>
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
        {rows.map((employee, i) => (
          <div
            key={`${employee.id}-${from + i}`}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <FaUser className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {employee.kindtao?.user
                    ? `${employee.kindtao.user.first_name || ""} ${employee.kindtao.user.last_name || ""}`.trim() || "Unknown"
                    : "Unknown"}
                </div>
                <div className="text-sm text-gray-600">
                  {employee.job_post?.job_title || "N/A"}
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  employee.status
                )}`}
              >
                {employee.status === "active" ? "Active" : "Inactive"}
              </span>
            </div>


            <Link
              href={`/my-employees/${employee.id}`}
              className="w-full bg-[#CC0000] text-white text-xs px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-center flex items-center justify-center space-x-2"
            >
              <FaEye className="w-3 h-3" />
              <span>View Profile</span>
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
