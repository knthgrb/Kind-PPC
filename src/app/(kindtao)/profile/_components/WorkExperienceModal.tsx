"use client";

import React, { useState, useEffect } from "react";
import { WorkExperience, WorkExperienceFormData } from "@/types/workExperience";
import { useToastActions } from "@/stores/useToastStore";
import { IoClose, IoCloudUploadOutline } from "react-icons/io5";
import { saveWorkExperience } from "@/actions/work-experience/save-work-experience";
import { addWorkExperienceAttachment } from "@/actions/work-experience/add-attachment";
import { convex, api } from "@/utils/convex/client";
import { extractStorageIdFromResponse } from "@/utils/convex/storage";

interface WorkExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  experience?: WorkExperience | null;
}

export default function WorkExperienceModal({
  isOpen,
  onClose,
  onSave,
  experience,
}: WorkExperienceModalProps) {
  const [formData, setFormData] = useState<WorkExperienceFormData>({
    employer: "",
    job_title: "",
    is_current_job: false,
    start_date: "",
    end_date: "",
    location: "",
    skills_used: [],
    notes: "",
    description: "",
    attachments: [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const { showSuccess, showError } = useToastActions();

  useEffect(() => {
    if (experience) {
      setFormData({
        employer: experience.employer || "",
        job_title: experience.job_title || "",
        is_current_job: experience.is_current_job || false,
        start_date: experience.start_date
          ? experience.start_date.split("T")[0]
          : "",
        end_date: experience.end_date ? experience.end_date.split("T")[0] : "",
        location: experience.location || "",
        skills_used: experience.skills_used || [],
        notes: experience.notes || "",
        description: experience.description || "",
        attachments: [],
      });
    } else {
      setFormData({
        employer: "",
        job_title: "",
        is_current_job: false,
        start_date: "",
        end_date: "",
        location: "",
        skills_used: [],
        notes: "",
        description: "",
        attachments: [],
      });
    }
  }, [experience, isOpen]);

  const handleInputChange = (
    field: keyof WorkExperienceFormData,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddSkill = () => {
    if (
      skillInput.trim() &&
      !formData.skills_used.includes(skillInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        skills_used: [...prev.skills_used, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills_used: prev.skills_used.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const uploadAttachments = async (experienceId: string) => {
    if (!formData.attachments || formData.attachments.length === 0) {
      return;
    }

    for (const file of formData.attachments) {
      const uploadUrl = await convex.mutation(api.storage.generateUploadUrl);
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResult.ok) {
        throw new Error(`Failed to upload ${file.name}`);
      }

      const storageId = await extractStorageIdFromResponse(uploadResult);
      const fileUrl =
        (await convex.query(api.storage.getFileUrl, {
          storageId: storageId as any,
        })) || storageId;

      const attachmentResult = await addWorkExperienceAttachment({
        kindtao_work_experience_id: experienceId,
        file_url: fileUrl,
        title: file.name,
        size: file.size,
        content_type: file.type,
      });

      if (!attachmentResult.success) {
        throw new Error(attachmentResult.error || "Failed to save attachment");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await saveWorkExperience({
        experienceId:
          (experience as { id?: string })?.id ||
          (experience as { _id?: string })?._id,
        employer: formData.employer,
        job_title: formData.job_title,
        is_current_job: formData.is_current_job,
        start_date: formData.start_date,
        end_date: formData.is_current_job ? undefined : formData.end_date,
        location: formData.location,
        skills_used: formData.skills_used,
        notes: formData.notes,
        description: formData.description,
      });

      if (!result.success || !result.experienceId) {
        throw new Error(result.error || "Failed to save work experience");
      }

      if (formData.attachments && formData.attachments.length > 0) {
        await uploadAttachments(result.experienceId);
      }

      showSuccess(
        experience ? "Work experience updated" : "Work experience added"
      );
      onSave();
    } catch (error) {
      console.error("Error saving work experience:", error);
      showError(
        error instanceof Error
          ? error.message
          : "Failed to save work experience"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {experience ? "Edit Work Experience" : "Add Work Experience"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                value={formData.job_title}
                onChange={(e) => handleInputChange("job_title", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employer *
              </label>
              <input
                type="text"
                value={formData.employer}
                onChange={(e) => handleInputChange("employer", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  handleInputChange("start_date", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange("end_date", e.target.value)}
                disabled={formData.is_current_job}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_current_job"
              checked={formData.is_current_job}
              onChange={(e) =>
                handleInputChange("is_current_job", e.target.checked)
              }
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label
              htmlFor="is_current_job"
              className="ml-2 text-sm text-gray-700"
            >
              This is my current job
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="City, Province"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={3}
              placeholder="Describe your role and responsibilities..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills Used
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddSkill())
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Add a skill and press Enter"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills_used.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attachments
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="attachments"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <label
                htmlFor="attachments"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <IoCloudUploadOutline className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  Click to upload documents (PDF, DOC, JPG, PNG)
                </span>
              </label>
            </div>
            {formData.attachments.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Selected files:</p>
                <div className="space-y-1">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="text-sm text-gray-700">
                      📎 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={2}
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isLoading
                ? "Saving..."
                : experience
                  ? "Update"
                  : "Add Experience"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
