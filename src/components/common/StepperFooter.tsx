// components/StepperFooter.tsx
"use client";

import Image from "next/image";

type StepperFooterProps = {
  onBack?: () => void; // if undefined ⇒ Back button disabled
  onNext?: () => void; // if undefined ⇒ Next button disabled
  backLabel?: string;
  nextLabel?: string;
  showBack?: boolean;
  showNext?: boolean;
  isSubmit?: boolean; // if true, Next button becomes submit button
};

export default function StepperFooter({
  onBack,
  onNext,
  backLabel = "Back",
  nextLabel = "Next",
  showBack = true,
  showNext = true,
  isSubmit = false,
}: StepperFooterProps) {
  const disabledCls = "opacity-50 cursor-not-allowed";

  return (
    <div className="mt-6 flex items-center justify-center gap-4">
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={!onBack}
          aria-disabled={!onBack}
          className={[
            "w-[160px] h-[43px] cursor-pointer rounded-xl border border-[#CFCFCF] flex items-center justify-center gap-2",
            !onBack ? disabledCls : "",
          ].join(" ")}
        >
          <Image src="/icons/prev.png" alt="Previous" width={16} height={16} />
          <span>{backLabel}</span>
        </button>
      )}

      {showNext && (
        <button
          type={isSubmit ? "submit" : "button"}
          onClick={isSubmit ? undefined : onNext}
          disabled={isSubmit ? false : !onNext}
          aria-disabled={isSubmit ? false : !onNext}
          className={[
            "w-[188px] h-[43px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-xl bg-[#CB0000] text-white flex items-center justify-center gap-2",
            !isSubmit && !onNext ? disabledCls : "",
          ].join(" ")}
        >
          <span>{nextLabel}</span>
          <Image src="/icons/next.png" alt="Next" width={16} height={16} />
        </button>
      )}
    </div>
  );
}
