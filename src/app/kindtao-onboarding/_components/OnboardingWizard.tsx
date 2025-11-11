"use client";

import { useState, Suspense, lazy } from "react";
import Stepper from "@/components/common/Stepper";

const PersonalInfoForm = lazy(
  () => import("@/app/kindtao-onboarding/_components/PersonalInfoForm")
);
const SkillsAvailabilityClient = lazy(
  () => import("@/app/kindtao-onboarding/_components/SkillsAvailabilityClient")
);
const WorkHistoryClient = lazy(
  () => import("@/app/kindtao-onboarding/_components/WorkHistoryClient")
);
const JobPreferencesClient = lazy(
  () => import("@/app/kindtao-onboarding/_components/JobPreferencesClient")
);
const DocumentUploadClient = lazy(
  () => import("@/app/kindtao-onboarding/_components/DocumentUploadClient")
);

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <section className="w-full max-w-3xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 md:p-8 bg-white mx-auto">
      <Stepper steps={5} activeStep={step} />

      <Suspense
        fallback={
          <div className="space-y-6">
            {/* Form fields skeleton */}
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-12 bg-gray-200 rounded-lg"></div>
            </div>

            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="h-12 bg-gray-200 rounded-lg"></div>
                <div className="h-12 bg-gray-200 rounded-lg"></div>
                <div className="h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-12 bg-gray-200 rounded-lg"></div>
            </div>

            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-12 bg-gray-200 rounded-lg"></div>
            </div>

            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-10 bg-gray-200 rounded-lg"></div>
                <div className="h-10 bg-gray-200 rounded-lg"></div>
                <div className="h-10 bg-gray-200 rounded-lg"></div>
                <div className="h-10 bg-gray-200 rounded-lg"></div>
              </div>
            </div>

            {/* Footer skeleton */}
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="h-[43px] bg-gray-200 rounded-xl w-[160px]"></div>
              <div className="h-[43px] bg-gray-200 rounded-xl w-[188px]"></div>
            </div>
          </div>
        }
      >
        {step === 1 && <PersonalInfoForm onNext={handleNext} />}
        {step === 2 && (
          <SkillsAvailabilityClient onNext={handleNext} onBack={handleBack} />
        )}
        {step === 3 && (
          <JobPreferencesClient onNext={handleNext} onBack={handleBack} />
        )}
        {step === 4 && (
          <WorkHistoryClient onNext={handleNext} onBack={handleBack} />
        )}
        {step === 5 && <DocumentUploadClient onBack={handleBack} />}
      </Suspense>
    </section>
  );
}
