"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Dropdown from "@/components/dropdown/Dropdown";
import { FaTimes } from "react-icons/fa";
import PrimaryButton from "../buttons/PrimaryButton";
import SecondaryButton from "../buttons/SecondaryButton";
import dynamic from "next/dynamic";
const ContinueModal = dynamic(
  () => import("@/components/modals/ContinueModal"),
  {
    ssr: false,
  }
);
type AddBenefitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onBenefitAdded?: () => void;
};

export default function AddBenefitModal({
  isOpen,
  onClose,
  onBenefitAdded,
}: AddBenefitModalProps) {
  const [form, setForm] = useState({
    category: "",
    number: "",
    lastPaymentDate: "",
    amount: "",
    nextDueDate: "",
    status: "Paid",
    notes: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalProps, setModalProps] = useState<{
    title: string;
    description: string;
    buttonLabel: string;
    icon?: string | null;
    onAction: () => void;
  } | null>(null);

  const categoryOptions = ["SSS", "PhilHealth", "Pag-IBIG"];
  const statusOptions = ["Paid", "Unpaid"];

  const handleAddBenefit = async () => {
    if (
      !form.category.trim() ||
      !form.number.trim() ||
      !form.amount.trim() ||
      !form.lastPaymentDate.trim() ||
      !form.nextDueDate.trim()
    ) {
      setModalProps({
        title: "Missing Required Fields",
        description:
          "Please complete all required fields before adding the benefit.",
        buttonLabel: "OK",
        icon: null,
        onAction: () => setModalOpen(false),
      });
      setModalOpen(true);
      return;
    }

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setModalProps({
        title: "Benefit Added",
        description: `${form.category} benefit has been added successfully`,
        buttonLabel: "Continue",
        icon: "/icons/checkCircleOTP.png",
        onAction: () => {
          setModalOpen(false);
          onClose();
          onBenefitAdded?.();
        },
      });
      setModalOpen(true);
    } catch (err) {
      console.error("Failed to add benefit:", err);
      setModalProps({
        title: "Error",
        description: "Something went wrong while adding the benefit.",
        buttonLabel: "OK",
        icon: null,
        onAction: () => setModalOpen(false),
      });
      setModalOpen(true);
    }
  };

  const handleClose = () => {
    // Reset form
    setForm({
      category: "",
      number: "",
      lastPaymentDate: "",
      amount: "",
      nextDueDate: "",
      status: "Paid",
      notes: "",
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
        <div className="bg-white rounded-2xl border border-[#DFDFDF] shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Add Government Benefit
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
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <Dropdown
                  className="border border-[#DFDFDF] rounded-xl"
                  value={form.category}
                  options={categoryOptions}
                  placeholder="Select Category"
                  onChange={(val) => setForm({ ...form, category: val })}
                />
              </div>

              {/* Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number
                </label>
                <input
                  type="text"
                  placeholder="Enter number"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  className="w-full h-12 border border-[#DFDFDF] rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                />
              </div>

              {/* Last Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Payment Date
                </label>
                <input
                  type="date"
                  value={form.lastPaymentDate}
                  onChange={(e) =>
                    setForm({ ...form, lastPaymentDate: e.target.value })
                  }
                  className="w-full h-12 border border-[#DFDFDF] rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="text"
                  placeholder="₱550"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full h-12 border border-[#DFDFDF] rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                />
              </div>

              {/* Next Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Due Date
                </label>
                <input
                  type="date"
                  value={form.nextDueDate}
                  onChange={(e) =>
                    setForm({ ...form, nextDueDate: e.target.value })
                  }
                  className="w-full h-12 border border-[#DFDFDF] rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <Dropdown
                  value={form.status}
                  options={statusOptions}
                  placeholder="Select Status"
                  onChange={(val) => setForm({ ...form, status: val })}
                  className="border border-[#DFDFDF] rounded-xl"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  placeholder="Enter notes..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full min-h-[100px] border border-[#DFDFDF] rounded-xl px-4 py-3 text-sm outline-none resize-y focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-8">
              <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
              <PrimaryButton onClick={handleAddBenefit}>
                Add Benefit
              </PrimaryButton>
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
