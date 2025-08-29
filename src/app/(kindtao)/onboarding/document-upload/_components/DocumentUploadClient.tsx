"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DOCUMENT_TYPES } from "@/constants/onboarding";
import { DocumentType, ModalProps } from "@/types/onboarding";
import Dropdown from "@/components/dropdown/Dropdown";
import StepperFooter from "@/components/StepperFooter";
import ContinueModal from "@/components/ContinueModal";

export default function DocumentUploadClient() {
  const router = useRouter();
  const [docType, setDocType] = useState<DocumentType>("National ID");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProps, setModalProps] = useState<ModalProps | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const onChooseFile = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleNext = () => {
    if (!preview) {
      // warning modal (no icon)
      setModalProps({
        title: "Upload Required",
        description: `Please upload your ${docType} before continuing.`,
        buttonLabel: "OK",
        icon: null,
        onAction: () => setModalOpen(false),
      });
      setModalOpen(true);
    } else {
      // success modal (with check icon)
      setModalProps({
        title: "Profile Completed",
        description: "Your profile has been completed successfully.",
        buttonLabel: "Continue",
        icon: "/icons/checkCircleOTP.png",
        onAction: () => {
          setModalOpen(false);
          router.push("/profile");
        },
      });
      setModalOpen(true);
    }
  };

  return (
    <>
      {/* Select Document Type */}
      <div className="mb-6">
        <label className="block mb-2 stepsLabel">Select Document Type</label>
        <Dropdown
          value={docType}
          options={[...DOCUMENT_TYPES]}
          onChange={(value) => setDocType(value as DocumentType)}
          placeholder="Select Document Type"
          className="rounded-lg border border-[#DFDFDF]"
        />
      </div>

      {/* Upload button OR preview */}
      {!preview ? (
        <div className="flex justify-center py-4 mb-6">
          <button
            type="button"
            onClick={onChooseFile}
            className="inline-flex items-center gap-3 rounded-md border border-[#CC0000] px-6 h-[48px] text-[#CC0000] bg-white"
          >
            <span className="relative inline-flex items-center justify-center w-5 h-5">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </span>
            <span>{docType}</span>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />
        </div>
      ) : (
        <div className="flex justify-center py-4 mb-6">
          <div className="rounded-xl overflow-hidden border border-[#DFDFDF]">
            <img
              src={preview}
              alt={`${docType} preview`}
              className="max-w-[520px] h-auto block"
            />
          </div>
        </div>
      )}

      <StepperFooter
        onBack={() => router.push("/onboarding/work-history")}
        onNext={handleNext}
      />

      {/* Dynamic Modal */}
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
    </>
  );
}
