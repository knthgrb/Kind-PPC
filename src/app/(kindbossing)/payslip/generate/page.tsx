"use client";

import ContinueModal from "@/components/ContinueModal";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Dropdown from "@/components/dropdown/Dropdown";
import { employeeOptions, deductionOptions } from "@/lib/kindBossing/data";

export default function GeneratePayslip() {
  const router = useRouter();

  const [form, setForm] = useState({
    employeeName: "",
    monthYear: "",
    basicSalary: "",
    overtimeHours: "",
    overtimeRate: "",
    bonuses: "",
    deductions: "",
    netPay: "",
    status: "Paid",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalProps, setModalProps] = useState<{
    title: string;
    description: string;
    buttonLabel: string;
    icon?: string | null;
    onAction: () => void;
  } | null>(null);

  const handleSave = () => {
    if (!form.employeeName || !form.monthYear || !form.netPay) {
      // warning modal
      setModalProps({
        title: "Missing Required Fields",
        description:
          "Please select an employee, month & year, and enter total net pay before saving.",
        buttonLabel: "OK",
        icon: null,
        onAction: () => setModalOpen(false),
      });
      setModalOpen(true);
    } else {
      // success modal
      setModalProps({
        title: "Payslip Generated",
        description: "Your payslip has been generated successfully.",
        buttonLabel: "Continue",
        icon: "/icons/checkCircleOTP.png",
        onAction: () => {
          setModalOpen(false);
          router.push("/payslip");
        },
      });
      setModalOpen(true);
    }
  };

  return (
    <div className="px-4 md:px-6 pt-10 pb-16">
      <div className="mx-auto max-w-4xl border border-[#DFDFDF] rounded-2xl p-6 md:p-10 bg-white">
        <h1 className="text-xl font-semibold text-center mb-8">
          Generate Payslip
        </h1>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employee Name */}
          <div>
            <label className="block text-sm mb-2">Employee Name</label>
            <Dropdown
              className="border border-gray-300 rounded-md"
              value={form.employeeName}
              options={employeeOptions}
              placeholder="Select Employee"
              onChange={(val) => setForm({ ...form, employeeName: val })}
            />
          </div>

          {/* Month & Year */}
          <div>
            <label className="block text-sm mb-2">Month & Year</label>
            <input
              type="month"
              value={form.monthYear}
              onChange={(e) => setForm({ ...form, monthYear: e.target.value })}
              className="w-full h-12 border border-gray-300 rounded-md px-3 text-sm"
            />
          </div>

          {/* Basic Salary */}
          <div>
            <label className="block text-sm mb-2">Basic Salary</label>
            <input
              type="text"
              placeholder="₱500"
              value={form.basicSalary}
              onChange={(e) =>
                setForm({ ...form, basicSalary: e.target.value })
              }
              className="w-full h-12 border border-gray-300 rounded-md px-3 text-sm"
            />
          </div>

          {/* Overtime Hours */}
          <div>
            <label className="block text-sm mb-2">Overtime Hours</label>
            <input
              type="text"
              placeholder="Overtime Hours"
              value={form.overtimeHours}
              onChange={(e) =>
                setForm({ ...form, overtimeHours: e.target.value })
              }
              className="w-full h-12 border border-gray-300 rounded-md px-3 text-sm"
            />
          </div>

          {/* Overtime Rate */}
          <div>
            <label className="block text-sm mb-2">Overtime Rate</label>
            <input
              type="text"
              placeholder="₱50"
              value={form.overtimeRate}
              onChange={(e) =>
                setForm({ ...form, overtimeRate: e.target.value })
              }
              className="w-full h-12 border border-gray-300 rounded-md px-3 text-sm"
            />
          </div>

          {/* Bonuses */}
          <div>
            <label className="block text-sm mb-2">Bonuses</label>
            <input
              type="text"
              placeholder="Bonuses"
              value={form.bonuses}
              onChange={(e) => setForm({ ...form, bonuses: e.target.value })}
              className="w-full h-12 border border-gray-300 rounded-md px-3 text-sm"
            />
          </div>

          {/* Deductions */}
          <div>
            <label className="block text-sm mb-2">Deductions</label>
            <Dropdown
              value={form.deductions}
              options={deductionOptions}
              placeholder="Select Deduction"
              onChange={(val) => setForm({ ...form, deductions: val })}
            />
          </div>

          {/* Total Net Pay */}
          <div>
            <label className="block text-sm mb-2">Total Net Pay</label>
            <input
              type="text"
              placeholder="₱550"
              value={form.netPay}
              onChange={(e) => setForm({ ...form, netPay: e.target.value })}
              className="w-full h-12 border border-gray-300 rounded-md px-3 text-sm"
            />
          </div>
        </form>

        {/* Mark as Paid / Unpaid */}
        <div className="mt-6">
          <label className="block mb-2 text-sm">Mark as:</label>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="status"
                value="Paid"
                checked={form.status === "Paid"}
                onChange={() => setForm({ ...form, status: "Paid" })}
                className="text-red-600 focus:ring-red-500"
              />
              Paid
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="status"
                value="Unpaid"
                checked={form.status === "Unpaid"}
                onChange={() => setForm({ ...form, status: "Unpaid" })}
                className="text-red-600 focus:ring-red-500"
              />
              Unpaid
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <button
            type="button"
            className="px-6 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg"
          >
            Save Payslip
          </button>
          <button
            type="button"
            className="px-6 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg"
          >
            Preview
          </button>
        </div>
      </div>

      {/* Dynamic Modal */}
      {modalProps && (
        <ContinueModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onAction={modalProps.onAction}
          title={modalProps.title}
          description={modalProps.description}
          buttonLabel={modalProps.buttonLabel}
          icon={modalProps.icon}
        />
      )}
    </div>
  );
}
