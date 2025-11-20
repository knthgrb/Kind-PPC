"use client";

import React, { useState } from "react";
import { WorkExperience } from "@/types/workExperience";
import Card from "@/components/common/Card";
import Chip from "@/components/common/Chip";
import { IoAdd, IoCreateOutline, IoTrashOutline } from "react-icons/io5";
import { capitalizeWords } from "@/utils/capitalize";
import dynamic from "next/dynamic";
const WorkExperienceModal = dynamic(() => import("./WorkExperienceModal"), {
  ssr: false,
});
interface WorkExperienceSectionProps {
  workExperiences: WorkExperience[];
  onUpdate: () => void;
}

export default function WorkExperienceSection({
  workExperiences,
  onUpdate,
}: WorkExperienceSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] =
    useState<WorkExperience | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  const formatDateRange = (
    startDate: string,
    endDate: string | null,
    isCurrent: boolean
  ) => {
    const start = formatDate(startDate);
    if (isCurrent) {
      return `${start} - Present`;
    }
    if (endDate) {
      const end = formatDate(endDate);
      return `${start} - ${end}`;
    }
    return start;
  };

  const handleEdit = (experience: WorkExperience) => {
    setEditingExperience(experience);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingExperience(null);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingExperience(null);
  };

  const handleSave = () => {
    onUpdate();
    handleClose();
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Work Experience
          </h2>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-900 hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            <IoAdd className="w-4 h-4" />
            Add Experience
          </button>
        </div>

        {workExperiences.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No work experience added yet</p>
            <p className="text-sm">
              Add your work experience to showcase your background
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {workExperiences.map((experience) => (
              <div
                key={experience.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {experience.job_title}
                      </h3>
                      {experience.is_current_job && (
                        <Chip className="bg-green-100 text-green-800">
                          Current
                        </Chip>
                      )}
                    </div>

                    <p className="text-gray-700 font-medium mb-1">
                      {experience.employer}
                    </p>

                    <p className="text-sm text-gray-600 mb-2">
                      {formatDateRange(
                        experience.start_date,
                        experience.end_date,
                        experience.is_current_job || false
                      )}
                    </p>

                    {experience.location && (
                      <p className="text-sm text-gray-600 mb-2">
                        📍 {experience.location}
                      </p>
                    )}

                    {experience.description && (
                      <p className="text-sm text-gray-700 mb-3">
                        {experience.description}
                      </p>
                    )}

                    {experience.skills_used &&
                      experience.skills_used.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-600 mb-1">
                            Skills Used:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {experience.skills_used.map((skill, index) => (
                              <Chip key={index} className="text-xs">
                                {capitalizeWords(skill)}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      )}

                    {experience.attachments &&
                      experience.attachments.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-600 mb-1">
                            Attachments:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {experience.attachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={attachment.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                              >
                                📎 {attachment.title}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                    {experience.notes && (
                      <p className="text-xs text-gray-600 italic">
                        Note: {experience.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(experience)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Edit experience"
                    >
                      <IoCreateOutline className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <WorkExperienceModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onSave={handleSave}
        experience={editingExperience}
      />
    </>
  );
}
