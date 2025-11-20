"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaEnvelope, FaTrash } from "react-icons/fa";
import { Employee } from "@/types/employee";
import { UserProfile } from "@/types/userProfile";
import { ProfileService } from "@/services/ProfileService";
import { convex } from "@/utils/convex/client";
import Card from "@/components/common/Card";
import Chip from "@/components/common/Chip";
import { capitalizeWords } from "@/utils/capitalize";
import { getOrCreateConversation } from "@/actions/employees/get-or-create-conversation";
import { removeEmployee } from "@/actions/employees/remove-employee";
import { useRouter } from "next/navigation";
import { useToastActions } from "@/stores/useToastStore";
import { logger } from "@/utils/logger";
import JobActionModal from "@/components/modals/JobActionModal";

type EmployeeDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onEmployeeRemoved?: () => void;
};

export default function EmployeeDetailModal({
  isOpen,
  onClose,
  employee,
  onEmployeeRemoved,
}: EmployeeDetailModalProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToastActions();
  const [kindtaoProfile, setKindtaoProfile] = useState<UserProfile | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  useEffect(() => {
    if (isOpen && employee?.kindtao_user_id) {
      loadKindTaoProfile();
    }
  }, [isOpen, employee]);

  const loadKindTaoProfile = async () => {
    if (!employee?.kindtao_user_id) return;

    setLoading(true);
    try {
      const profile = await ProfileService.getKindTaoProfileByUserId(
        employee.kindtao_user_id,
        convex
      );
      setKindtaoProfile(profile);
    } catch (error) {
      logger.error("Error loading KindTao profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !employee) return null;

  const employeeName = employee.kindtao?.user
    ? `${employee.kindtao.user.first_name || ""} ${
        employee.kindtao.user.last_name || ""
      }`.trim() || "Unknown Employee"
    : "Unknown Employee";

  const email = employee.kindtao?.user?.email || "N/A";
  const phone = kindtaoProfile?.phone || "N/A";
  const address = kindtaoProfile
    ? [
        kindtaoProfile.barangay,
        kindtaoProfile.municipality,
        kindtaoProfile.province,
        kindtaoProfile.zip_code
          ? `Philippines ${kindtaoProfile.zip_code}`
          : "Philippines",
      ]
        .filter(Boolean)
        .join(", ")
    : "N/A";

  const skills = employee.kindtao?.skills || [];
  const languages = employee.kindtao?.languages || [];
  const availabilitySchedule = employee.kindtao?.availability_schedule || {};
  const workExperiences = kindtaoProfile?.work_experiences || [];

  // Helper function to get initials
  const getInitials = (firstName: string = "", lastName: string = "") => {
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName.charAt(0).toUpperCase();
    return `${first}${last}` || "U";
  };

  const formatSkill = (skill: string) => {
    return skill
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const firstName = employee.kindtao?.user?.first_name || "";
  const lastName = employee.kindtao?.user?.last_name || "";
  const dateOfBirth = kindtaoProfile?.date_of_birth || null;
  const gender = kindtaoProfile?.gender || null;

  const handleClose = () => {
    onClose();
  };

  const handleMessage = async () => {
    if (!employee?.kindtao_user_id) return;

    setIsLoading(true);
    try {
      const result = await getOrCreateConversation(employee.kindtao_user_id);

      if (result.success && result.conversationId) {
        router.push(`/messages/${result.conversationId}`);
        onClose();
      } else {
        showError(result.error || "Failed to start conversation with employee");
      }
    } catch (error) {
      logger.error("Failed to message employee:", error);
      showError("Failed to start conversation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!employee?.id) return;

    setIsLoading(true);
    try {
      const result = await removeEmployee(employee.id);

      if (result.success) {
        showSuccess("Employee removed successfully");
        setShowRemoveModal(false);
        onClose();
        if (onEmployeeRemoved) {
          onEmployeeRemoved();
        }
      } else {
        showError(result.error || "Failed to remove employee");
      }
    } catch (error) {
      logger.error("Failed to remove employee:", error);
      showError("Failed to remove employee");
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-gray-900">
              Employee Details
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleMessage}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                <FaEnvelope className="w-4 h-4" />
                Message
              </button>
              <button
                onClick={() => setShowRemoveModal(true)}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                <FaTrash className="w-4 h-4" />
                Remove
              </button>
              <button
                onClick={handleClose}
                className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
              >
                <FaTimes className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Profile Header */}
              <Card>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="shrink-0">
                    <div className="w-30 h-30 bg-linear-to-br from-red-600 to-red-800 rounded-full flex items-center justify-center shadow-lg border-4 border-red-600">
                      <span className="text-4xl font-bold text-white">
                        {getInitials(firstName, lastName)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="mb-4">
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {employeeName || "No name provided"}
                      </h1>
                      {employee.kindtao?.is_verified && (
                        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-green-800">
                            Verified
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {email && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Email:
                          </span>
                          <div className="bg-white rounded-lg px-3 py-2 mt-1">
                            <p className="text-gray-900">{email}</p>
                          </div>
                        </div>
                      )}
                      {phone && phone !== "N/A" && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Phone:
                          </span>
                          <div className="bg-white rounded-lg px-3 py-2 mt-1">
                            <p className="text-gray-900">{phone}</p>
                          </div>
                        </div>
                      )}
                      {dateOfBirth && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Date of Birth:
                          </span>
                          <div className="bg-white rounded-lg px-3 py-2 mt-1">
                            <p className="text-gray-900">
                              {formatDate(dateOfBirth)} ({getAge(dateOfBirth)}{" "}
                              years old)
                            </p>
                          </div>
                        </div>
                      )}
                      {gender && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Gender:
                          </span>
                          <div className="bg-white rounded-lg px-3 py-2 mt-1">
                            <p className="text-gray-900">
                              {capitalizeWords(gender)}
                            </p>
                          </div>
                        </div>
                      )}
                      {address && address !== "N/A" && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-700">
                            Address:
                          </span>
                          <div className="bg-white rounded-lg px-3 py-2 mt-1">
                            <p className="text-gray-900">{address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Education & Salary */}
              {(employee.kindtao?.highest_educational_attainment ||
                employee.kindtao?.expected_salary_range) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {employee.kindtao?.highest_educational_attainment && (
                    <Card>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Education
                      </h2>
                      <span className="inline-block bg-white rounded-lg px-3 py-2 text-gray-700">
                        {capitalizeWords(
                          employee.kindtao.highest_educational_attainment
                        )}
                      </span>
                    </Card>
                  )}

                  {employee.kindtao?.expected_salary_range && (
                    <Card>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Expected Salary
                      </h2>
                      <span className="inline-block bg-white rounded-lg px-3 py-2 text-gray-700">
                        {employee.kindtao.expected_salary_range}
                      </span>
                    </Card>
                  )}
                </div>
              )}

              {/* Work History */}
              {workExperiences.length > 0 && (
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Work Experience
                  </h2>
                  <ul className="space-y-4">
                    {workExperiences.map((exp: any) => (
                      <li
                        key={exp.id}
                        className="border-l-4 border-red-600 pl-4 py-2"
                      >
                        <div className="font-semibold text-gray-900">
                          {exp.job_title || "N/A"}
                        </div>
                        {exp.employer && (
                          <div className="text-sm text-gray-600 mt-1">
                            {exp.employer}
                          </div>
                        )}
                        <div className="text-sm text-gray-500 mt-1">
                          {exp.start_date
                            ? new Date(exp.start_date).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "N/A"}
                          {exp.end_date
                            ? ` – ${new Date(exp.end_date).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  year: "numeric",
                                }
                              )}`
                            : exp.is_current_job
                              ? " – Present"
                              : ""}
                        </div>
                        {exp.description && (
                          <div className="text-sm text-gray-700 mt-2">
                            {exp.description}
                          </div>
                        )}
                        {exp.location && (
                          <div className="text-sm text-gray-500 mt-1">
                            📍 {exp.location}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Skills */}
              {skills.length > 0 && (
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <Chip key={index}>{formatSkill(skill)}</Chip>
                    ))}
                  </div>
                </Card>
              )}

              {/* Languages */}
              {languages.length > 0 && (
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Languages
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang, index) => (
                      <Chip key={index}>{capitalizeWords(lang)}</Chip>
                    ))}
                  </div>
                </Card>
              )}

              {/* Availability */}
              {availabilitySchedule &&
                typeof availabilitySchedule === "object" &&
                (availabilitySchedule.days ||
                  availabilitySchedule.start_time ||
                  availabilitySchedule.end_time ||
                  availabilitySchedule.time) && (
                  <Card>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Availability
                    </h2>
                    {availabilitySchedule.days &&
                      Array.isArray(availabilitySchedule.days) &&
                      availabilitySchedule.days.length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-700 block mb-2">
                            Days:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {availabilitySchedule.days.map(
                              (day: string, index: number) => (
                                <Chip key={index}>{day}</Chip>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    {(availabilitySchedule.start_time ||
                      availabilitySchedule.end_time ||
                      availabilitySchedule.time) && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 block mb-2">
                          Time:
                        </span>
                        <div className="text-sm text-gray-700">
                          {availabilitySchedule.start_time &&
                          availabilitySchedule.end_time
                            ? `${availabilitySchedule.start_time} - ${availabilitySchedule.end_time}`
                            : availabilitySchedule.time || "N/A"}
                        </div>
                      </div>
                    )}
                  </Card>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Remove Employee Confirmation Modal */}
      <JobActionModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={handleRemove}
        action="delete"
        jobTitle={
          employee?.kindtao?.user?.first_name &&
          employee?.kindtao?.user?.last_name
            ? `${employee.kindtao.user.first_name} ${employee.kindtao.user.last_name}`
            : employee?.kindtao?.user?.email || "Employee"
        }
        isLoading={isLoading}
      />
    </>,
    document.body
  );
}
