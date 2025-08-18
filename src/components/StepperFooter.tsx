// components/StepperFooter.tsx
"use client";

import Image from "next/image";

type StepperFooterProps = {
  onBack?: () => void;        // if undefined ⇒ Back button disabled
  onNext?: () => void;        // if undefined ⇒ Next button disabled
  backLabel?: string;
  nextLabel?: string;
  showBack?: boolean;
  showNext?: boolean;
};

export default function StepperFooter({
  onBack,
  onNext,
  backLabel = "Back",
  nextLabel = "Next",
  showBack = true,
  showNext = true,
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
            "w-[160px] h-[43px] rounded-md border border-[#CFCFCF] flex items-center justify-center gap-2",
            !onBack ? disabledCls : "",
          ].join(" ")}
        >
          <Image src="/icons/prev.png" alt="Previous" width={16} height={16} />
          <span>{backLabel}</span>
        </button>
      )}

      {showNext && (
        <button
          type="button"
          onClick={onNext}
          disabled={!onNext}
          aria-disabled={!onNext}
          className={[
            "w-[188px] h-[43px] rounded-md bg-[#CB0000] text-white flex items-center justify-center gap-2",
            !onNext ? disabledCls : "",
          ].join(" ")}
        >
          <span>{nextLabel}</span>
          <Image src="/icons/next.png" alt="Next" width={16} height={16} />
        </button>
      )}
    </div>
  );
}
