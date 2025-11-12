"use client";

import { Application } from "@/types/application";
import { UserProfile } from "@/types/userProfile";
import { JobPost } from "@/types/jobPosts";
import Image from "next/image";
import {
  SlLocationPin,
  SlPhone,
  SlGraduation,
  SlStar,
  SlBadge,
} from "react-icons/sl";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
  FaGraduationCap,
  FaStar,
  FaCertificate,
  FaEye,
  FaUser,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import {
  parseAvailabilitySchedule,
  getAvailabilitySummary,
} from "./availabilityUtils";

interface KindTaoProfileCardProps {
  application: Application;
  kindtaoProfile: UserProfile;
  jobDetails: JobPost | null;
  onSeeFullProfile?: () => void;
  isProcessing: boolean;
  applicantName?: string;
}

export default function KindTaoProfileCard({
  application,
  kindtaoProfile,
  jobDetails,
  isProcessing,
  onSeeFullProfile,
  applicantName,
}: KindTaoProfileCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateAge = (dateOfBirth: string | null) => {
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

  const getLocationString = () => {
    const parts = [];
    if (kindtaoProfile.barangay) parts.push(kindtaoProfile.barangay);
    if (kindtaoProfile.municipality) parts.push(kindtaoProfile.municipality);
    if (kindtaoProfile.province) parts.push(kindtaoProfile.province);
    return parts.join(", ") || "Location not specified";
  };

  const inferredName = [kindtaoProfile.first_name, kindtaoProfile.last_name]
    .filter(Boolean)
    .join(" ");
  const displayName =
    applicantName?.trim() || inferredName || application.applicant_name || "Applicant";

  const expectedSalary =
    kindtaoProfile.kindtao_profile?.expected_salary_range || "N/A";

  return (
    <div className="bg-white rounded-xl border border-[#E0E6F7] shadow-lg overflow-hidden cursor-grab active:cursor-grabbing select-none relative w-full max-w-sm md:max-w-lg max-h-[70vh] md:h-[600px] flex flex-col mx-auto z-10">
      {/* Header with Profile */}
      <div className="p-4 md:p-6 border-b border-gray-100 shrink-0">
        <div className="flex items-start gap-3 md:gap-4">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Anonymous Applicant Title and Expected Salary Row */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">
                    {displayName}
                  </h2>
                  {kindtaoProfile.kindtao_profile?.is_verified && (
                    <FaCheckCircle
                      className="w-4 h-4 text-blue-500 shrink-0"
                      title="Verified"
                    />
                  )}
                </div>
              </div>
              <div className="text-right ml-3 md:ml-4">
                <div className="text-xl md:text-2xl font-bold text-[#CC0000] leading-none">
                  ₱{expectedSalary}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  expected salary
                </div>
              </div>
            </div>

            {/* Applied Date */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <FaClock className="w-3 h-3" />
                <span>Applied {formatDate(application.applied_at)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="flex-1 p-4 md:p-6 flex flex-col min-h-0 overflow-y-auto">
        {/* Key Skills Preview */}
        <div className="mb-4">
          <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2">
            Key Skills
          </h3>
          <ul className="space-y-1 text-gray-700">
            {kindtaoProfile.kindtao_profile?.skills &&
            kindtaoProfile.kindtao_profile.skills.length > 0 ? (
              kindtaoProfile.kindtao_profile.skills
                .slice(0, 3)
                .map((skill, index) => (
                  <li
                    key={index}
                    className="flex items-start text-xs md:text-sm"
                  >
                    <span className="w-1.5 h-1.5 bg-[#CC0000] rounded-full mt-1.5 md:mt-2 mr-2 md:mr-3 shrink-0"></span>
                    <span className="capitalize">
                      {skill.replace("_", " ")}
                    </span>
                  </li>
                ))
            ) : (
              <li className="flex items-start text-xs md:text-sm">
                <span className="w-1.5 h-1.5 bg-[#CC0000] rounded-full mt-1.5 md:mt-2 mr-2 md:mr-3 shrink-0"></span>
                <span>Skills not specified</span>
              </li>
            )}
            {kindtaoProfile.kindtao_profile?.highest_educational_attainment && (
              <li className="flex items-start text-xs md:text-sm">
                <span className="w-1.5 h-1.5 bg-[#CC0000] rounded-full mt-1.5 md:mt-2 mr-2 md:mr-3 shrink-0"></span>
                <span>
                  {
                    kindtaoProfile.kindtao_profile
                      .highest_educational_attainment
                  }
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* Work Schedule */}
        {kindtaoProfile.kindtao_profile?.availability_schedule && (
          <div className="mb-4">
            <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2">
              Availability
            </h3>
            <p className="text-gray-700 text-xs md:text-sm">
              {getAvailabilitySummary(
                parseAvailabilitySchedule(
                  kindtaoProfile.kindtao_profile.availability_schedule
                )
              )}
            </p>
          </div>
        )}

        {/* Additional Details (helps balance height when content is short) */}
        <div className="mt-2">
          <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2">
            Additional Details
          </h3>
          <ul className="space-y-1 text-gray-700 text-xs md:text-sm">
            <li>
              <span className="font-medium">Location:</span> {getLocationString()}
            </li>
            {kindtaoProfile.kindtao_profile?.highest_educational_attainment && (
              <li>
                <span className="font-medium">Education:</span> {kindtaoProfile.kindtao_profile.highest_educational_attainment}
              </li>
            )}
          </ul>
        </div>

        {/* Spacer to push button to bottom */}
        <div className="flex-1 min-h-0"></div>

        {/* See Full Details Button - Always visible at bottom */}
        <div className="mt-4 md:mt-6 shrink-0">
          <button
            onClick={onSeeFullProfile}
            className="w-full cursor-pointer py-2 md:py-3 px-3 md:px-4 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-xs md:text-sm font-medium border border-gray-200"
          >
            <FaEye className="w-3 h-3 md:w-4 md:h-4" />
            See Full Profile
          </button>
        </div>
      </div>
    </div>
  );
}
