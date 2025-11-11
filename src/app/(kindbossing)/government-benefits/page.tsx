"use client";

import { useState } from "react";
import { LuFilter, LuSearch, LuPlus } from "react-icons/lu";
import { FaShieldAlt } from "react-icons/fa";
import { govBenefits } from "@/lib/kindBossing/data";
import AddBenefitModal from "@/components/modals/AddBenefitModal";
import PrimaryButton from "@/components/buttons/PrimaryButton";

export default function GovernmentBenefits() {
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddBenefitModalOpen, setIsAddBenefitModalOpen] = useState(false);

  // Flatten all records for filtering
  const allRecords = govBenefits.flatMap((category) =>
    category.records.map((record) => ({ ...record, category: category.name }))
  );

  const filteredRecords = allRecords.filter((record) => {
    const matchesFilter =
      filter === "all" || record.status.toLowerCase() === filter;
    const matchesSearch =
      record.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.notes.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Government Benefits
            </h1>
            <p className="text-gray-600">
              Manage government benefits and track payment status
            </p>
          </div>
          <PrimaryButton
            onClick={() => setIsAddBenefitModalOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <LuPlus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Benefit</span>
          </PrimaryButton>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { key: "all", label: "All Benefits", count: allRecords.length },
            {
              key: "paid",
              label: "Paid",
              count: allRecords.filter((r) => r.status === "Paid").length,
            },
            {
              key: "unpaid",
              label: "Unpaid",
              count: allRecords.filter((r) => r.status === "Unpaid").length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === tab.key
                  ? "bg-white text-[#CC0000] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
        <button
          type="button"
          className="inline-flex cursor-pointer bg-white items-center justify-center gap-2 rounded-lg border border-gray-400 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 w-full md:w-auto"
        >
          <LuFilter className="text-base" />
          <span>Filter</span>
        </button>

        <label className="relative w-full md:w-52">
          <LuSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search benefits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
          />
        </label>
      </div>

      {/* Benefits Content */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaShieldAlt className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === "all" ? "No benefits yet" : `No ${filter} benefits`}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === "all"
              ? "You don't have any government benefits recorded yet."
              : `You don't have any ${filter} benefits at the moment.`}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {govBenefits.map((category) => {
            const categoryRecords = filteredRecords.filter(
              (r) => r.category === category.name
            );
            if (categoryRecords.length === 0) return null;

            return (
              <div key={category.name}>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {category.name}
                </h2>
                <div className="overflow-x-auto">
                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <table className="min-w-full bg-white">
                      <thead className="bg-white border-b border-gray-200 text-gray-500 text-sm">
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
                              className="text-gray-500 text-sm font-medium px-6 py-4 text-left whitespace-nowrap"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-sm">
                        {categoryRecords.map((record, i) => (
                          <tr
                            key={`${category.name}-${record.number}-${i}`}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 font-semibold text-gray-900">
                              {record.number}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {record.lastPaymentDate}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {record.amount}
                            </td>
                            <td className="px-6 py-4 text-gray-600">
                              {record.nextDueDate}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  record.status === "Paid"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {record.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-600 max-w-[200px]">
                              <div className="truncate" title={record.notes}>
                                {record.notes}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Benefit Modal */}
      <AddBenefitModal
        isOpen={isAddBenefitModalOpen}
        onClose={() => setIsAddBenefitModalOpen(false)}
        onBenefitAdded={() => {
          // In a real app, this would refresh the benefits list
          console.log("Benefit added successfully");
        }}
      />
    </div>
  );
}
