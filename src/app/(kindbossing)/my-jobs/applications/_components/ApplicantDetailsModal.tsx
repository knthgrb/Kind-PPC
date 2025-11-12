"use client";

import { Application } from "@/types/application";
import { UserProfile } from "@/types/userProfile";
import { JobPost } from "@/types/jobPosts";
import {
  FaTimes,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaStar,
  FaCertificate,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import { SlLocationPin } from "react-icons/sl";
import {
  parseAvailabilitySchedule,
  formatAvailabilitySchedule,
} from "./availabilityUtils";

interface ApplicantDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  kindtaoProfile: UserProfile;
  jobDetails: JobPost | null;
}

export default function ApplicantDetailsModal({
  isOpen,
  onClose,
  application,
  kindtaoProfile,
  jobDetails,
}: ApplicantDetailsModalProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
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

  const formatLocation = () => {
    const parts = [];
    if (kindtaoProfile.barangay) parts.push(kindtaoProfile.barangay);
    if (kindtaoProfile.municipality) parts.push(kindtaoProfile.municipality);
    if (kindtaoProfile.province) parts.push(kindtaoProfile.province);
    return parts.join(", ") || "Location not specified";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            Applicant Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 cursor-pointer hover:text-gray-700"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Content - Scrollable */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Header - Basic Info (No Avatar) */}
          <div className="pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-2xl font-bold text-gray-900">
                Applicant Profile
              </h3>
              {kindtaoProfile.kindtao_profile?.is_verified && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  <FaCheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
            <p className="text-gray-600">
              {calculateAge(kindtaoProfile.date_of_birth) &&
                `${calculateAge(kindtaoProfile.date_of_birth)} years old`}
              {kindtaoProfile.gender && ` • ${kindtaoProfile.gender}`}
            </p>
            <div className="flex items-center text-gray-600 text-sm mt-1">
              <FaClock className="w-3 h-3 mr-1" />
              <span>Applied {formatDate(application.applied_at)}</span>
            </div>
          </div>

          {/* Job Details (if provided) */}
          {jobDetails && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Applying for: {jobDetails.job_title}
              </h3>
              <div className="flex items-center text-gray-600 text-sm">
                <SlLocationPin className="w-4 h-4 mr-2" />
                <span>{jobDetails.location}</span>
              </div>
            </div>
          )}

          {/* Location Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Location
            </h3>
            <div className="flex items-center space-x-3">
              <FaMapMarkerAlt className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{formatLocation()}</span>
            </div>
          </div>

          {/* Skills */}
          {kindtaoProfile.kindtao_profile?.skills &&
            kindtaoProfile.kindtao_profile.skills.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {kindtaoProfile.kindtao_profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {skill.charAt(0).toUpperCase() +
                        skill.slice(1).replace("_", " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Languages */}
          {kindtaoProfile.kindtao_profile?.languages &&
            kindtaoProfile.kindtao_profile.languages.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Languages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {kindtaoProfile.kindtao_profile.languages.map(
                    (language, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {language}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Education */}
          {kindtaoProfile.kindtao_profile?.highest_educational_attainment && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Education
              </h3>
              <div className="flex items-center space-x-3">
                <FaGraduationCap className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">
                  {
                    kindtaoProfile.kindtao_profile
                      .highest_educational_attainment
                  }
                </span>
              </div>
            </div>
          )}

          {/* Expected Salary */}
          {kindtaoProfile.kindtao_profile?.expected_salary_range && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Expected Salary
              </h3>
              <div className="bg-yellow-50 rounded-lg p-3">
                <span className="text-gray-700 font-medium">
                  {kindtaoProfile.kindtao_profile.expected_salary_range}
                </span>
              </div>
            </div>
          )}

          {/* Work Experience */}
          {kindtaoProfile.work_experiences &&
            kindtaoProfile.work_experiences.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Work Experience
                </h3>
                <div className="space-y-3">
                  {kindtaoProfile.work_experiences.map((experience, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {experience.job_title}
                          </h4>
                          {experience.location && (
                            <p className="text-sm text-gray-600 flex items-center mt-1">
                              <FaMapMarkerAlt className="w-3 h-3 mr-1" />
                              {experience.location}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-500">
                            {formatDate(experience.start_date)} -{" "}
                            {experience.end_date
                              ? formatDate(experience.end_date)
                              : "Present"}
                          </span>
                          {experience.is_current_job && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Current
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {experience.employer}
                      </p>
                      {experience.description && (
                        <p className="text-sm text-gray-700 mb-2">
                          {experience.description}
                        </p>
                      )}
                      {experience.notes && (
                        <p className="text-sm text-gray-600 italic mb-2">
                          {experience.notes}
                        </p>
                      )}
                      {experience.skills_used &&
                        experience.skills_used.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-1">
                              Skills used:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {experience.skills_used.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                                >
                                  {skill.replace("_", " ")}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      {experience.attachments &&
                        experience.attachments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">
                              Attachments:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {experience.attachments.map((attachment, idx) => (
                                <a
                                  key={idx}
                                  href={attachment.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center"
                                >
                                  <FaCertificate className="w-3 h-3 mr-1" />
                                  {attachment.title}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Cover Message */}
          {application.cover_message && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Cover Message
              </h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-700 italic">
                  "{application.cover_message}"
                </p>
              </div>
            </div>
          )}

          {/* Rating */}
          {kindtaoProfile.kindtao_profile?.rating !== null &&
            kindtaoProfile.kindtao_profile?.rating !== undefined && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Rating
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <FaStar className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="text-xl font-bold text-gray-900 ml-2">
                      {kindtaoProfile.kindtao_profile.rating.toFixed(1)} / 5.0
                    </span>
                  </div>
                  {kindtaoProfile.kindtao_profile.reviews &&
                    kindtaoProfile.kindtao_profile.reviews.length > 0 && (
                      <span className="text-sm text-gray-600">
                        ({kindtaoProfile.kindtao_profile.reviews.length} review
                        {kindtaoProfile.kindtao_profile.reviews.length !== 1
                          ? "s"
                          : ""}
                        )
                      </span>
                    )}
                </div>
              </div>
            )}

          {/* Availability */}
          {kindtaoProfile.kindtao_profile?.availability_schedule && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Availability
              </h3>
              <div className="bg-green-50 rounded-lg p-4">
                {(() => {
                  const schedule = parseAvailabilitySchedule(
                    kindtaoProfile.kindtao_profile!.availability_schedule
                  );
                  const formatted = formatAvailabilitySchedule(schedule);

                  if (!formatted || formatted.timeSlots.length === 0) {
                    return <span className="text-gray-700">Not specified</span>;
                  }

                  return (
                    <div className="space-y-2">
                      {formatted.timeSlots.map((item, idx) => (
                        <div key={idx} className="text-gray-700">
                          <span className="font-medium">{item.day}:</span>{" "}
                          {item.times.join(", ")}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
