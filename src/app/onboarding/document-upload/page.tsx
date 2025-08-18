"use client";

import { useRef, useState } from "react";
import Stepper from "@/components/Stepper";
import StepperFooter from "@/components/StepperFooter";
import { useRouter } from "next/navigation";
import AccountCreatedModal from "@/components/AccountCreatedModal";

const DOC_TYPES = [
  "National ID",
  "Passport",
  "Driver’s License",
  "SSS / UMID",
  "TIN",
];

export default function DocumentUploadPage() {
  const router = useRouter();
  const [docType, setDocType] = useState<string>("National ID");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalProps, setModalProps] = useState<{
    title: string;
    description: string;
    buttonLabel: string;
    icon?: string | null;
    onAction: () => void;
  } | null>(null);

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
          router.push("/profile/complete");
        },
      });
      setModalOpen(true);
    }
  };

  return (
    <main className="min-h-screen px-4 flex items-start justify-center">
      <section className="w-full max-w-3xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 md:p-8 mt-8">
        <Stepper steps={4} activeStep={4} />
        <br />
        <h1 className="mb-4 stepsH1">
          {preview ? "Document Uploaded" : "Document Upload"}
        </h1>

        {/* Select Document Type */}
        <div className="mb-6">
          <label className="block mb-2 stepsLabel">Select Document Type</label>
          <div className="relative">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full h-12 rounded-md border border-[#DFDFDF] px-4 pr-10 outline-none appearance-none bg-white"
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              ▾
            </span>
          </div>
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
          onBack={() => router.push("/kindtao/profile")}
          onNext={handleNext}
        />
      </section>

      {/* Dynamic Modal */}
      {modalProps && (
        <AccountCreatedModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onAction={modalProps.onAction}
          title={modalProps.title}
          description={modalProps.description}
          buttonLabel={modalProps.buttonLabel}
          icon={modalProps.icon}
        />
      )}
    </main>
  );
}
