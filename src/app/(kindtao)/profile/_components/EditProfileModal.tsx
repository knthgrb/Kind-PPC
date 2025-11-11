"use client";

import { useState } from "react";
import { IoClose } from "react-icons/io5";
import type { UserProfile } from "@/types/userProfile";
import { updateProfile } from "@/actions/user/updateProfile";

interface EditProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({
  user,
  isOpen,
  onClose,
}: EditProfileModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Safety check for user object
  if (!user) {
    return null;
  }

  const [formData, setFormData] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    phone: user.phone || "",
    date_of_birth: user.date_of_birth || "",
    gender: user.gender || "",
    barangay: user.barangay || "",
    municipality: user.municipality || "",
    province: user.province || "",
    zip_code: user.zip_code || "",
    // KindTao profile fields
    skills: Array.isArray(user.kindtao_profile?.skills)
      ? user.kindtao_profile.skills
      : [],
    languages: Array.isArray(user.kindtao_profile?.languages)
      ? user.kindtao_profile.languages
      : [],
    expected_salary_range: user.kindtao_profile?.expected_salary_range || "",
    highest_educational_attainment:
      user.kindtao_profile?.highest_educational_attainment || "",
    // Availability schedule
    availability_schedule: user.kindtao_profile?.availability_schedule || {},
  });

  const [newSkill, setNewSkill] = useState("");
  const [newLanguage, setNewLanguage] = useState("");

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((skill) => skill !== skillToRemove),
    });
  };

  const handleAddLanguage = () => {
    if (
      newLanguage.trim() &&
      !formData.languages.includes(newLanguage.trim())
    ) {
      setFormData({
        ...formData,
        languages: [...formData.languages, newLanguage.trim()],
      });
      setNewLanguage("");
    }
  };

  const handleRemoveLanguage = (languageToRemove: string) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter((lang) => lang !== languageToRemove),
    });
  };

  const handleAvailabilityChange = (
    day: string,
    available: boolean,
    hours?: [string, string]
  ) => {
    // Ensure hours is always a valid array
    const safeHours =
      Array.isArray(hours) && hours.length >= 2 ? hours : ["", ""];

    setFormData({
      ...formData,
      availability_schedule: {
        ...formData.availability_schedule,
        [day]: { available, hours: safeHours },
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);

    try {
      const result = await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        barangay: formData.barangay,
        municipality: formData.municipality,
        province: formData.province,
        zip_code: String(formData.zip_code),
        skills: formData.skills,
        languages: formData.languages,
        expected_salary_range: formData.expected_salary_range,
        highest_educational_attainment: formData.highest_educational_attainment,
        availability_schedule: formData.availability_schedule,
      });

      if (result.success) {
        // Close modal on successful save
        onClose();
        // Optionally refresh the page or update parent component
        window.location.reload();
      } else {
        setSaveError(result.error || "Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveError("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
          >
            <IoClose className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto modal-scrollbar-hide">
          <form onSubmit={handleSubmit} className="p-6 space-y-6 min-h-[700px]">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Read-only)
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gender: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000]"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Address Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Barangay
                </label>
                <input
                  type="text"
                  value={formData.barangay}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      barangay: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Province
                  </label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        province: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zip Code
                </label>
                <input
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      zip_code: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000]"
                />
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Skills</h3>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000]"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleAddSkill())
                  }
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-[#CC0000] text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Languages</h3>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="Add a language"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000]"
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleAddLanguage())
                  }
                />
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  className="px-4 py-2 bg-[#CC0000] text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.languages.map((language, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{language}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(language)}
                      className="text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Education & Salary */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Education & Salary
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Highest Educational Attainment
                </label>
                <select
                  value={formData.highest_educational_attainment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      highest_educational_attainment: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000]"
                >
                  <option value="">Select Education Level</option>
                  <option value="elementary">Elementary</option>
                  <option value="high_school">High School</option>
                  <option value="vocational">Vocational</option>
                  <option value="college">College</option>
                  <option value="bachelor">Bachelor's Degree</option>
                  <option value="master">Master's Degree</option>
                  <option value="doctorate">Doctorate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Salary Range
                </label>
                <input
                  type="text"
                  value={formData.expected_salary_range}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expected_salary_range: e.target.value,
                    })
                  }
                  placeholder="e.g., ₱15,000 - ₱25,000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CC0000] focus:border-[#CC0000]"
                />
              </div>
            </div>

            {/* Availability Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Availability Schedule
              </h3>

              <div className="space-y-3">
                {daysOfWeek.map((day) => {
                  const dayData = formData.availability_schedule[day] || {
                    available: false,
                    hours: ["", ""],
                  };

                  // Ensure hours is always an array with at least 2 elements
                  const safeHours =
                    Array.isArray(dayData.hours) && dayData.hours.length >= 2
                      ? dayData.hours
                      : ["", ""];

                  return (
                    <div
                      key={day}
                      className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={dayData.available || false}
                          onChange={(e) =>
                            handleAvailabilityChange(
                              day,
                              e.target.checked,
                              safeHours
                            )
                          }
                          className="w-4 h-4 accent-[#CC0000] border-gray-300 rounded focus:ring-[#CC0000]"
                        />
                        <span className="font-medium text-gray-900 capitalize min-w-[100px]">
                          {day}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">From:</span>
                        <input
                          type="time"
                          value={safeHours[0] || ""}
                          onChange={(e) =>
                            handleAvailabilityChange(day, true, [
                              e.target.value,
                              safeHours[1] || "",
                            ])
                          }
                          disabled={!dayData.available}
                          className={`px-2 py-1 border border-gray-300 rounded text-sm ${
                            dayData.available
                              ? "accent-[#CC0000] focus:ring-[#CC0000] focus:border-[#CC0000]"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        />
                        <span className="text-sm text-gray-600">To:</span>
                        <input
                          type="time"
                          value={safeHours[1] || ""}
                          onChange={(e) =>
                            handleAvailabilityChange(day, true, [
                              safeHours[0] || "",
                              e.target.value,
                            ])
                          }
                          disabled={!dayData.available}
                          className={`px-2 py-1 border border-gray-300 rounded text-sm ${
                            dayData.available
                              ? "accent-[#CC0000] focus:ring-[#CC0000] focus:border-[#CC0000]"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error Display */}
            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error saving profile
                    </h3>
                    <div className="mt-2 text-sm text-red-700">{saveError}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 cursor-pointer py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 cursor-pointer py-2 px-4 bg-[#CC0000] text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
