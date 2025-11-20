"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useToastActions } from "@/stores/useToastStore";
import { FaTimes } from "react-icons/fa";
import PrimaryButton from "../buttons/PrimaryButton";
import SecondaryButton from "../buttons/SecondaryButton";
import { logger } from "@/utils/logger";
import { updateProfile } from "@/actions/info/update-profile";

type EditKindBossingProfileModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: () => void;
  userData: any;
  kindbossingData: any;
};

export default function EditKindBossingProfileModal({
  isOpen,
  onClose,
  onProfileUpdated,
  userData,
  kindbossingData,
}: EditKindBossingProfileModalProps) {
  const { showSuccess, showError } = useToastActions();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    barangay: "",
    municipality: "",
    province: "",
    zip_code: "",
    business_name: "",
  });

  // Initialize form data when modal opens or data changes
  useEffect(() => {
    if (isOpen && userData) {
      setFormData({
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        phone: userData.phone || "",
        date_of_birth: userData.date_of_birth || "",
        gender: userData.gender || "",
        barangay: userData.barangay || "",
        municipality: userData.municipality || "",
        province: userData.province || "",
        zip_code: userData.zip_code?.toString() || "",
        business_name: kindbossingData?.business_name || "",
      });
    }
  }, [isOpen, userData, kindbossingData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSaving(true);
    try {
      const result = await updateProfile({
        first_name: formData.first_name.trim() || undefined,
        last_name: formData.last_name.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        date_of_birth: formData.date_of_birth.trim() || undefined,
        gender: formData.gender.trim() || undefined,
        barangay: formData.barangay.trim() || undefined,
        municipality: formData.municipality.trim() || undefined,
        province: formData.province.trim() || undefined,
        zip_code: formData.zip_code ? Number(formData.zip_code) : undefined,
        business_name: formData.business_name.trim() || undefined,
      });

      if (result.success) {
        showSuccess("Profile updated successfully");
        onClose();
        onProfileUpdated?.();
      } else {
        showError(result.error || "Failed to update profile");
      }
    } catch (error) {
      logger.error("Failed to update profile:", error);
      showError("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-100" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#DFDFDF] shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
            <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
            <button
              onClick={handleClose}
              disabled={isSaving}
              className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            first_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-[#DFDFDF] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            last_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-[#DFDFDF] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-[#DFDFDF] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            date_of_birth: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-[#DFDFDF] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) =>
                          setFormData({ ...formData, gender: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-[#DFDFDF] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        disabled={isSaving}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">
                          Prefer not to say
                        </option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Business Information
                  </h3>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={formData.business_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          business_name: e.target.value,
                        })
                      }
                      placeholder="Enter business name"
                      className="w-full px-4 py-2 border border-[#DFDFDF] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Location Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Barangay
                      </label>
                      <input
                        type="text"
                        value={formData.barangay}
                        onChange={(e) =>
                          setFormData({ ...formData, barangay: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-[#DFDFDF] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Municipality
                      </label>
                      <input
                        type="text"
                        value={formData.municipality}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            municipality: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-[#DFDFDF] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Province
                      </label>
                      <input
                        type="text"
                        value={formData.province}
                        onChange={(e) =>
                          setFormData({ ...formData, province: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-[#DFDFDF] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Zip Code
                      </label>
                      <input
                        type="number"
                        value={formData.zip_code}
                        onChange={(e) =>
                          setFormData({ ...formData, zip_code: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-[#DFDFDF] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <SecondaryButton onClick={handleClose} disabled={isSaving}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
