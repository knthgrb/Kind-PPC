"use client";

import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaTimes } from "react-icons/fa";
import type { PendingApplication } from "./applicationTypes";

type ApplicationDetailsModalProps = {
  application: PendingApplication | null;
  isOpen: boolean;
  onClose: () => void;
};

const formatDate = (value?: number) => {
  if (!value) return "N/A";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "N/A";
  }
};

const getApplicantName = (application?: PendingApplication | null) => {
  const user = application?.user || application?.kindtao?.user;
  if (!user) return "Unknown Applicant";
  if (user.first_name || user.last_name) {
    return [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  }
  return user.email || "Unknown Applicant";
};

const getLocation = (application?: PendingApplication | null) => {
  return (
    application?.location ||
    application?.kindtao?.current_location ||
    application?.user?.location ||
    "Location not provided"
  );
};

const normalizeSkillName = (skill: string): string => {
  return skill
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export default function ApplicationDetailsModal({
  application,
  isOpen,
  onClose,
}: ApplicationDetailsModalProps) {
  if (!isOpen || !application) return null;

  const applicantName = getApplicantName(application);
  const experiences = application.experiences || [];
  const skills = application.kindtao?.skills || [];
  const languages = application.kindtao?.languages || [];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500">
              Applicant Details
            </p>
            <h2 className="text-2xl font-semibold text-gray-900">
              {applicantName}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="inline-flex items-center gap-2">
                <FaMapMarkerAlt className="h-4 w-4 text-gray-500" />
                {getLocation(application)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full cursor-pointer p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close details"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Contact
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <FaEnvelope className="h-4 w-4 text-gray-500" />
                <span>{application.user?.email || "No email provided"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaPhone className="h-4 w-4 text-gray-500" />
                <span>{application.user?.phone || "No phone provided"}</span>
              </div>
            </div>
          </section>

          {skills.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                  >
                    {normalizeSkillName(skill)}
                  </span>
                ))}
              </div>
            </section>
          )}

          {languages.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Languages
              </h3>
              <div className="flex flex-wrap gap-2 text-xs text-gray-700">
                {languages.map((language) => (
                  <span
                    key={language}
                    className="rounded-full bg-gray-50 px-3 py-1 font-medium text-gray-700"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </section>
          )}

          {experiences.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Work Experience
              </h3>
              <div className="space-y-4">
                {experiences.map((experience) => (
                  <div
                    key={experience._id}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-base font-semibold text-gray-900">
                        {experience.job_title || "Role not specified"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(experience.start_date)} –{" "}
                        {experience.is_current_job
                          ? "Present"
                          : formatDate(experience.end_date)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700">
                      {experience.employer || "Employer not specified"}
                    </p>
                    {experience.location && (
                      <p className="text-xs text-gray-500 mt-1">
                        {experience.location}
                      </p>
                    )}
                    {experience.description && (
                      <p className="mt-2 text-sm text-gray-600">
                        {experience.description}
                      </p>
                    )}
                    {experience.skills_used &&
                      experience.skills_used.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {experience.skills_used.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-gray-100 px-2 py-1 text-gray-700"
                            >
                              {normalizeSkillName(skill)}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {application.cover_message && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Cover Message
              </h3>
              <p className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">
                {application.cover_message}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
