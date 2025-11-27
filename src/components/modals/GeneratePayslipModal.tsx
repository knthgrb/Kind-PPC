"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import ContinueModal from "@/components/modals/ContinueModal";
import Dropdown from "@/components/dropdown/Dropdown";
import { employeeOptions, deductionOptions } from "@/lib/kindBossing/data";
import { FaTimes } from "react-icons/fa";
import PrimaryButton from "../buttons/PrimaryButton";
import SecondaryButton from "../buttons/SecondaryButton";

type GeneratePayslipModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onPayslipGenerated?: () => void;
};

export default function GeneratePayslipModal({
  isOpen,
  onClose,
  onPayslipGenerated,
}: GeneratePayslipModalProps) {
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
          onClose();
          onPayslipGenerated?.();
        },
      });
      setModalOpen(true);
    }
  };

  const handleClose = () => {
    // Reset form
    setForm({
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
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-9999" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#DFDFDF] shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Generate Payslip
            </h2>
            <button
              onClick={handleClose}
              className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee Name
                </label>
                <Dropdown
                  className="border border-[#DFDFDF] rounded-xl"
                  value={form.employeeName}
                  options={employeeOptions}
                  placeholder="Select Employee"
                  onChange={(val) => setForm({ ...form, employeeName: val })}
                />
              </div>

              {/* Month & Year */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month & Year
                </label>
                <input
                  type="month"
                  value={form.monthYear}
                  onChange={(e) =>
                    setForm({ ...form, monthYear: e.target.value })
                  }
                  className="w-full h-12 border border-[#DFDFDF] rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                />
              </div>

              {/* Basic Salary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Basic Salary
                </label>
                <input
                  type="text"
                  placeholder="₱500"
                  value={form.basicSalary}
                  onChange={(e) =>
                    setForm({ ...form, basicSalary: e.target.value })
                  }
                  className="w-full h-12 border border-[#DFDFDF] rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                />
              </div>

              {/* Overtime Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overtime Hours
                </label>
                <input
                  type="text"
                  placeholder="Overtime Hours"
                  value={form.overtimeHours}
                  onChange={(e) =>
                    setForm({ ...form, overtimeHours: e.target.value })
                  }
                  className="w-full h-12 border border-[#DFDFDF] rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                />
              </div>

              {/* Overtime Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overtime Rate
                </label>
                <input
                  type="text"
                  placeholder="₱50"
                  value={form.overtimeRate}
                  onChange={(e) =>
                    setForm({ ...form, overtimeRate: e.target.value })
                  }
                  className="w-full h-12 border border-[#DFDFDF] rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                />
              </div>

              {/* Bonuses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bonuses
                </label>
                <input
                  type="text"
                  placeholder="Bonuses"
                  value={form.bonuses}
                  onChange={(e) =>
                    setForm({ ...form, bonuses: e.target.value })
                  }
                  className="w-full h-12 border border-[#DFDFDF] rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                />
              </div>

              {/* Deductions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deductions
                </label>
                <Dropdown
                  value={form.deductions}
                  options={deductionOptions}
                  placeholder="Select Deduction"
                  onChange={(val) => setForm({ ...form, deductions: val })}
                  className="border border-[#DFDFDF] rounded-xl"
                />
              </div>

              {/* Total Net Pay */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Net Pay
                </label>
                <input
                  type="text"
                  placeholder="₱550"
                  value={form.netPay}
                  onChange={(e) => setForm({ ...form, netPay: e.target.value })}
                  className="w-full h-12 border border-[#DFDFDF] rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                />
              </div>
            </form>

            {/* Mark as Paid / Unpaid */}
            <div className="mt-6">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Mark as:
              </label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="Paid"
                    checked={form.status === "Paid"}
                    onChange={() => setForm({ ...form, status: "Paid" })}
                    className="text-[#CC0000] focus:ring-[#CC0000]"
                  />
                  <span className="text-sm text-gray-700">Paid</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    value="Unpaid"
                    checked={form.status === "Unpaid"}
                    onChange={() => setForm({ ...form, status: "Unpaid" })}
                    className="text-[#CC0000] focus:ring-[#CC0000]"
                  />
                  <span className="text-sm text-gray-700">Unpaid</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
              <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
              <PrimaryButton onClick={handleSave}>Save Payslip</PrimaryButton>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Modal */}
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
    </>,
    document.body
  );
}
