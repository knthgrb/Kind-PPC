"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import ContinueModal from "@/components/modals/ContinueModal";
import Dropdown from "@/components/dropdown/Dropdown";
import { postJob } from "@/actions/jobs/post-job";
import { updateJob } from "@/actions/jobs/update-job";
import { FaTimes, FaPlus, FaTimes as FaRemove } from "react-icons/fa";
import PrimaryButton from "../buttons/PrimaryButton";
import SecondaryButton from "../buttons/SecondaryButton";
import { ALL_JOB_OPTIONS, JOB_CATEGORIES } from "@/constants/jobCategories";
import { JobType, JobPost } from "@/types/jobPosts";
import {
  getRegionForProvince,
  extractProvinceFromLocation,
  PHILIPPINE_REGIONS,
  getAllRegions,
  getProvincesForRegion,
} from "@/utils/regionMapping";

type PostJobModalProps = {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  onJobPosted?: () => void;
  editingJob?: JobPost | null;
};

// Skills from the onboarding component
const VALID_SKILLS = [
  // Maintenance & Repairs
  "plumbing",
  "painting",
  "masonry",
  "welding",
  "aircon_repair",
  "handyman",
  "pest_control",
  "warehouse_management",

  // Care & Support
  "nanny",
  "yaya",
  "kasambahay",
  "alalay",
  "bantay",
  "nursing",
  "therapy",
  "elderly_care",
  "childcare",
  "babysitting",

  // Household Management
  "laundry",
  "ironing",
  "cleaning",
  "housekeeping",
  "house_management",
  "errands",
  "messenger",

  // Food Services
  "cooking",
  "cooking_filipino",
  "cooking_western",
  "baking",
  "kitchen_helper",
  "grocery_shopping",
  "market_buying",

  // Property & Outdoor
  "gardening",
  "pool_cleaning",
  "house_watching",
  "security",
  "guarding",

  // Specialized
  "tutoring",
  "tutor_math",
  "tutor_english",
  "sewing",
  "tailoring",
  "driving",
  "driving_manual",
  "driving_automatic",
  "massage",
  "manicure",
  "pedicure",

  // Traditional/Additional
  "hilot",
  "caregiver_basic",
  "caregiver_certified",
  "pet_care",
  "pet_sitting",
  "pet_grooming",
];

export default function PostJobModal({
  isOpen,
  onClose,
  familyId,
  onJobPosted,
  editingJob,
}: PostJobModalProps) {
  const router = useRouter();

  // form state
  const [title, setTitle] = useState("");
  const [titleSearch, setTitleSearch] = useState("");
  const [barangay, setBarangay] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [province, setProvince] = useState("");
  const [region, setRegion] = useState("");
  const [selectedRegionCode, setSelectedRegionCode] = useState("");
  const [amount, setAmount] = useState("₱550");
  const [unit, setUnit] = useState("Per Day");
  const [description, setDescription] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [jobType, setJobType] = useState<string>("daily");

  // new fields for enhanced matching
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryType, setSalaryType] = useState("daily");
  const [expiresAt, setExpiresAt] = useState("");
  const [locationCoordinates, setLocationCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Get all provinces for dropdown
  const allProvinces = useMemo(() => {
    const provinces: string[] = [];
    PHILIPPINE_REGIONS.forEach((region) => {
      region.provinces.forEach((prov) => {
        provinces.push(prov);
      });
    });
    return provinces.sort((a, b) => a.localeCompare(b));
  }, []);

  // Auto-populate region when province changes
  useEffect(() => {
    if (province) {
      const regionInfo = getRegionForProvince(province);
      if (regionInfo) {
        setRegion(regionInfo.region);
        setSelectedRegionCode(regionInfo.regionCode);
      } else {
        setRegion("");
        setSelectedRegionCode("");
      }
    } else {
      setRegion("");
      setSelectedRegionCode("");
    }
  }, [province]);

  // Populate form when editing
  useEffect(() => {
    if (editingJob) {
      setTitle(editingJob.job_title || "");
      setTitleSearch(editingJob.job_title || "");

      // Parse location string into barangay, municipality, province
      const locationStr = editingJob.location || "";
      const provinceStr = (editingJob as any).province || "";
      const regionStr = (editingJob as any).region || "";

      // Try to parse location string (format: "Barangay, Municipality, Province")
      const parts = locationStr.split(",").map((p) => p.trim());
      if (parts.length >= 3) {
        setBarangay(parts[0] || "");
        setMunicipality(parts[1] || "");
        setProvince(parts[2] || provinceStr);
      } else if (parts.length === 2) {
        setBarangay("");
        setMunicipality(parts[0] || "");
        setProvince(parts[1] || provinceStr);
      } else if (parts.length === 1 && parts[0]) {
        // If only one part, assume it's municipality or province
        if (provinceStr && parts[0] !== provinceStr) {
          setBarangay("");
          setMunicipality(parts[0]);
          setProvince(provinceStr);
        } else {
          setBarangay("");
          setMunicipality("");
          setProvince(provinceStr || parts[0]);
        }
      } else {
        setBarangay("");
        setMunicipality("");
        setProvince(provinceStr);
      }

      setRegion(regionStr);
      if (provinceStr) {
        const regionInfo = getRegionForProvince(provinceStr);
        if (regionInfo) {
          setSelectedRegionCode(regionInfo.regionCode);
        }
      }

      setAmount(editingJob.salary || "₱550");
      setDescription(editingJob.job_description || "");
      setRequiredSkills(editingJob.required_skills || []);
      setJobType(editingJob.job_type || "daily");
      setSalaryMin((editingJob as any).salary_min?.toString() || "");
      setSalaryMax((editingJob as any).salary_max?.toString() || "");
      setSalaryType((editingJob as any).salary_type || "daily");
      setExpiresAt(
        (editingJob as any).expires_at
          ? new Date((editingJob as any).expires_at).toISOString().split("T")[0]
          : ""
      );

      // Parse location coordinates if available
      if ((editingJob as any).location_coordinates) {
        const match = (editingJob as any).location_coordinates.match(
          /\(([^,]+),([^)]+)\)/
        );
        if (match) {
          setLocationCoordinates({
            lng: parseFloat(match[1]),
            lat: parseFloat(match[2]),
          });
        }
      }
    } else {
      // Reset form for new job
      setTitle("");
      setTitleSearch("");
      setBarangay("");
      setMunicipality("");
      setProvince("");
      setRegion("");
      setSelectedRegionCode("");
      setAmount("₱550");
      setDescription("");
      setRequiredSkills([]);
      setJobType("daily");
      setSalaryMin("");
      setSalaryMax("");
      setSalaryType("daily");
      setExpiresAt("");
      setLocationCoordinates(null);
    }
  }, [editingJob]);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProps, setModalProps] = useState<{
    title?: string;
    description?: string;
    buttonLabel?: string;
    icon?: string | null;
    onAction?: () => void;
  }>({});

  const amounts = ["₱350", "₱450", "₱500", "₱550", "₱600", "₱700", "₱800"];
  const units = ["Per Hour", "Per Day", "Per Week", "Per Month"];
  const salaryTypes = ["daily", "monthly", "hourly", "one-time"];
  const jobTypes = [
    "daily",
    "monthly",
    "hourly",
    "contractual",
    "full-time",
    "part-time",
  ];

  // Filter job titles based on search
  const filteredJobTitles = useMemo(() => {
    if (!titleSearch.trim()) return ALL_JOB_OPTIONS;
    return ALL_JOB_OPTIONS.filter((job) =>
      job.toLowerCase().includes(titleSearch.toLowerCase())
    );
  }, [titleSearch]);

  // Filter skills based on input
  const filteredSkills = useMemo(() => {
    if (!skillInput.trim()) return [];
    return VALID_SKILLS.filter(
      (skill) =>
        !requiredSkills.includes(skill) &&
        skill.toLowerCase().includes(skillInput.toLowerCase())
    );
  }, [skillInput, requiredSkills]);

  // Geocoding function
  const geocodeLocation = async (address: string) => {
    if (!address.trim()) return;

    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://api.geocod.io/v1.7/geocode?q=${encodeURIComponent(
          address
        )}&api_key=${process.env.NEXT_PUBLIC_GEOCODIO_API_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].location;
        setLocationCoordinates({ lat, lng });
        console.log("Geocoded location:", { lat, lng });
      } else {
        console.warn("No coordinates found for location:", address);
        setLocationCoordinates(null);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setLocationCoordinates(null);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Auto-geocode when location fields change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Build location string from barangay, municipality, province
      const locationParts = [];
      if (barangay.trim()) locationParts.push(barangay.trim());
      if (municipality.trim()) locationParts.push(municipality.trim());
      if (province.trim()) locationParts.push(province.trim());
      const locationString = locationParts.join(", ");

      if (locationString.trim()) {
        geocodeLocation(locationString);
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [barangay, municipality, province]);

  const addSkill = (skill: string) => {
    if (!skill || requiredSkills.includes(skill)) return;
    setRequiredSkills((prev) => [...prev, skill]);
    setSkillInput("");
    setShowSkillDropdown(false);
  };

  const addCustomSkill = () => {
    const trimmedSkill = skillInput.trim().toLowerCase();
    if (!trimmedSkill || requiredSkills.includes(trimmedSkill)) return;

    // Add the custom skill
    setRequiredSkills((prev) => [...prev, trimmedSkill]);
    setSkillInput("");
    setShowSkillDropdown(false);
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomSkill();
    }
  };

  const removeSkill = (skill: string) => {
    setRequiredSkills((prev) => prev.filter((s) => s !== skill));
  };

  const capitalizeSkill = (skill: string) => {
    return skill.charAt(0).toUpperCase() + skill.slice(1).replace("_", " ");
  };

  const handlePost = async () => {
    // Validate required fields
    if (
      !title.trim() ||
      !municipality.trim() ||
      !province.trim() ||
      !amount ||
      !unit ||
      !description.trim()
    ) {
      setModalProps({
        title: "Missing Information",
        description: "Please complete all required fields before posting.",
        buttonLabel: "OK",
        icon: null,
        onAction: () => setModalOpen(false),
      });
      setModalOpen(true);
      return;
    }

    // Build location string from barangay, municipality, province
    const locationParts = [];
    if (barangay.trim()) locationParts.push(barangay.trim());
    if (municipality.trim()) locationParts.push(municipality.trim());
    if (province.trim()) locationParts.push(province.trim());
    const locationString = locationParts.join(", ");

    // Ensure region is set from province
    let finalRegion = region;
    if (!finalRegion && province) {
      const regionInfo = getRegionForProvince(province);
      finalRegion = regionInfo?.region || "";
    }

    try {
      const numericAmount = parseInt(amount.replace(/[₱,]/g, ""), 10);
      const numericSalaryMin = salaryMin
        ? parseInt(salaryMin.replace(/[₱,]/g, ""), 10)
        : numericAmount;
      const numericSalaryMax = salaryMax
        ? parseInt(salaryMax.replace(/[₱,]/g, ""), 10)
        : numericAmount;

      const jobData = {
        kindbossing_user_id: familyId,
        job_title: title,
        job_description: description,
        location: locationString,
        province: province.trim(),
        region: finalRegion,
        salary: amount,
        job_type: jobType as JobType,
        required_skills: requiredSkills,
        work_schedule: {},
        required_years_of_experience: 0,
        preferred_languages: [],
        is_boosted: false,
        boost_expires_at: null,
        status: editingJob?.status || "active",
        // New fields for enhanced matching
        salary_min: numericSalaryMin,
        salary_max: numericSalaryMax,
        salary_type: salaryType,
        location_coordinates: locationCoordinates
          ? `POINT(${locationCoordinates.lng} ${locationCoordinates.lat})`
          : null,
        expires_at:
          expiresAt ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      };

      let result;
      if (editingJob) {
        result = await updateJob(editingJob.id, jobData);
        if (!result.success) {
          throw new Error(result.error || "Failed to update job");
        }
      } else {
        result = await postJob(jobData);
      }

      setModalProps({
        title: editingJob ? "Job Updated" : "Job Posted",
        description: `Your job "${title}" has been ${
          editingJob ? "updated" : "posted"
        } successfully`,
        buttonLabel: "Continue",
        icon: "/icons/checkCircleOTP.png",
        onAction: () => {
          setModalOpen(false);
          onClose();
          onJobPosted?.();
          router.push(`/kindbossing/my-jobs`);
        },
      });
      setModalOpen(true);
    } catch (err) {
      console.error("Failed to post job:", err);
      setModalProps({
        title: "Error",
        description: "Something went wrong while posting the job.",
        buttonLabel: "OK",
        icon: null,
        onAction: () => setModalOpen(false),
      });
      setModalOpen(true);
    }
  };

  const handleClose = () => {
    // Reset form
    setTitle("");
    setTitleSearch("");
    setBarangay("");
    setMunicipality("");
    setProvince("");
    setRegion("");
    setSelectedRegionCode("");
    setAmount("₱550");
    setUnit("Per Day");
    setDescription("");
    setRequiredSkills([]);
    setSkillInput("");
    setSalaryMin("");
    setSalaryMax("");
    setSalaryType("daily");
    setJobType("daily");
    setExpiresAt("");
    setLocationCoordinates(null);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50" onClick={handleClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#DFDFDF] shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingJob ? "Edit Job" : "Post Job"}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="p-6 pr-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
            {/* Job Title with Search */}
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Job Title *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={titleSearch}
                  onChange={(e) => {
                    setTitleSearch(e.target.value);
                    setShowTitleDropdown(e.target.value.length > 0);
                    if (e.target.value && !title) {
                      setTitle(e.target.value);
                    }
                  }}
                  onFocus={() => {
                    setTitleSearch(title || "");
                    setShowTitleDropdown(true);
                  }}
                  onBlur={() => {
                    // Delay hiding to allow clicking on dropdown items
                    setTimeout(() => setShowTitleDropdown(false), 200);
                  }}
                  placeholder="Search or type job title..."
                  className="w-full h-12 rounded-xl border border-[#DFDFDF] px-4 outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                />
                {showTitleDropdown &&
                  titleSearch &&
                  filteredJobTitles.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg z-10 max-h-60 overflow-y-auto mt-1">
                      {filteredJobTitles.slice(0, 10).map((jobTitle) => (
                        <button
                          key={jobTitle}
                          onClick={() => {
                            setTitle(jobTitle);
                            setTitleSearch(jobTitle);
                            setShowTitleDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-b-0"
                        >
                          {jobTitle}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            </div>

            {/* Location - Barangay, Municipality, Province */}
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Location *
              </label>
              <div className="space-y-3">
                {/* Barangay */}
                <div>
                  <input
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    type="text"
                    placeholder="Barangay (optional)"
                    className="w-full h-12 rounded-xl border border-[#DFDFDF] px-4 outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                  />
                </div>

                {/* Municipality */}
                <div>
                  <input
                    required
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    type="text"
                    placeholder="Municipality/City *"
                    className="w-full h-12 rounded-xl border border-[#DFDFDF] px-4 outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                  />
                </div>

                {/* Province */}
                <div>
                  <Dropdown
                    value={province}
                    onChange={(value) => setProvince(value)}
                    options={allProvinces}
                    placeholder="Select Province *"
                    className="border border-[#DFDFDF] rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* Rate and Job Type */}
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Rate *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Dropdown
                  value={amount}
                  onChange={setAmount}
                  options={amounts}
                  placeholder="Select amount"
                  className="border border-[#DFDFDF] rounded-xl"
                />
                <Dropdown
                  value={unit}
                  onChange={setUnit}
                  options={units}
                  placeholder="Select unit"
                  className="border border-[#DFDFDF] rounded-xl"
                />
              </div>
            </div>

            {/* Job Type */}
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Job Type *
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full h-12 rounded-xl border border-[#DFDFDF] px-4 outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
              >
                {jobTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() +
                      type.slice(1).replace("-", " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Required Skills */}
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Required Skills (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => {
                    setSkillInput(e.target.value);
                    setShowSkillDropdown(e.target.value.length > 0);
                  }}
                  onKeyDown={handleSkillKeyDown}
                  onFocus={() => setShowSkillDropdown(skillInput.length > 0)}
                  onBlur={() => {
                    // Delay hiding to allow clicking on dropdown items
                    setTimeout(() => setShowSkillDropdown(false), 200);
                  }}
                  placeholder="Type to search skills or press Enter to add custom skill..."
                  className="w-full h-12 rounded-xl border border-[#DFDFDF] px-4 outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                />
                {showSkillDropdown && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto mt-1">
                    {filteredSkills.length > 0 ? (
                      filteredSkills.slice(0, 8).map((skill) => (
                        <button
                          key={skill}
                          onClick={() => addSkill(skill)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-b-0"
                        >
                          {capitalizeSkill(skill)}
                        </button>
                      ))
                    ) : skillInput.trim() ? (
                      <button
                        onClick={addCustomSkill}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-blue-600 font-medium"
                      >
                        + Add "{skillInput.trim()}" as custom skill
                      </button>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Selected Skills */}
              {requiredSkills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {capitalizeSkill(skill)}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="hover:text-blue-600"
                      >
                        <FaRemove className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-8">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Description *
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the job requirements, responsibilities, and any specific details..."
                className="w-full min-h-[120px] rounded-xl border border-[#DFDFDF] px-4 py-3 outline-none resize-y focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
              />
            </div>

            {/* Enhanced Matching Fields */}
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Enhanced Matching (Optional)
              </h3>

              {/* Salary Range */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Min Salary (₱)
                  </label>
                  <input
                    type="text"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    placeholder="500"
                    className="w-full h-12 rounded-xl border border-[#DFDFDF] px-4 outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Max Salary (₱)
                  </label>
                  <input
                    type="text"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    placeholder="800"
                    className="w-full h-12 rounded-xl border border-[#DFDFDF] px-4 outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Salary Type
                  </label>
                  <select
                    value={salaryType}
                    onChange={(e) => setSalaryType(e.target.value)}
                    className="w-full h-12 rounded-xl border border-[#DFDFDF] px-4 outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                  >
                    {salaryTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expiration Date */}
              <div className="mb-4">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Job Expires (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full h-12 rounded-xl border border-[#DFDFDF] px-4 outline-none focus:ring-2 focus:ring-[#CC0000] focus:border-transparent"
                />
              </div>

              {/* Location Status */}
              {isGeocoding && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-blue-600 text-sm">
                    📍 Getting location coordinates...
                  </p>
                </div>
              )}

              {locationCoordinates && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-600 text-sm">
                    ✅ Location coordinates:{" "}
                    {locationCoordinates.lat.toFixed(4)},{" "}
                    {locationCoordinates.lng.toFixed(4)}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3">
              <SecondaryButton onClick={handleClose}>Cancel</SecondaryButton>
              <PrimaryButton onClick={handlePost}>
                {editingJob ? "Update Job" : "Post Job"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Error Modal */}
      <ContinueModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAction={modalProps.onAction ?? (() => setModalOpen(false))}
        title={modalProps.title ?? ""}
        description={modalProps.description ?? ""}
        buttonLabel={modalProps.buttonLabel ?? "OK"}
        icon={modalProps.icon ?? undefined}
      />
    </>,
    document.body
  );
}
