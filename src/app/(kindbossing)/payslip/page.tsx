"use client";

import { useState } from "react";
import { payslips } from "@/lib/kindBossing/data";
import PayslipClient from "./_components/PayslipClient";
import GeneratePayslipModal from "@/components/modals/GeneratePayslipModal";
import { LuFilter, LuSearch, LuPlus } from "react-icons/lu";
import { FaFileInvoice } from "react-icons/fa";
import PrimaryButton from "@/components/buttons/PrimaryButton";

export default function Payslip() {
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isGeneratePayslipModalOpen, setIsGeneratePayslipModalOpen] =
    useState(false);

  const filteredPayslips = payslips.filter((payslip) => {
    const matchesFilter =
      filter === "all" || payslip.status.toLowerCase() === filter;
    const matchesSearch =
      payslip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payslip.month.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payslips</h1>
            <p className="text-gray-600">
              Manage employee payslips and track payment status
            </p>
          </div>
          <PrimaryButton
            onClick={() => setIsGeneratePayslipModalOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <LuPlus className="w-4 h-4" />
            <span className="text-sm font-medium">Create New</span>
          </PrimaryButton>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { key: "all", label: "All Payslips", count: payslips.length },
            {
              key: "paid",
              label: "Paid",
              count: payslips.filter((p) => p.status === "Paid").length,
            },
            {
              key: "unpaid",
              label: "Unpaid",
              count: payslips.filter((p) => p.status === "Unpaid").length,
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
            placeholder="Search payslips..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
          />
        </label>
      </div>

      {/* Payslips Content */}
      {filteredPayslips.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaFileInvoice className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === "all" ? "No payslips yet" : `No ${filter} payslips`}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === "all"
              ? "You don't have any payslips generated yet."
              : `You don't have any ${filter} payslips at the moment.`}
          </p>
        </div>
      ) : (
        <PayslipClient payslips={filteredPayslips} />
      )}

      {/* Generate Payslip Modal */}
      <GeneratePayslipModal
        isOpen={isGeneratePayslipModalOpen}
        onClose={() => setIsGeneratePayslipModalOpen(false)}
        onPayslipGenerated={() => {
          // In a real app, this would refresh the payslips list
          console.log("Payslip generated successfully");
        }}
      />
    </div>
  );
}
