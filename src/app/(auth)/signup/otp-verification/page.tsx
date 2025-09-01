// app/register/otp-verification/page.tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ContinueModal from "@/components/ContinueModal"; // adjust path

export default function OtpVerificationPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-start justify-center px-4 mt-6">
      <section className="w-[419px] h-[351px] rounded-2xl border border-[#DFDFDF] shadow-sm p-8 md:p-10 mt-8 flex flex-col">
        <h1 className="text-center mb-2 otpH1">OTP Verification</h1>
        <p className="text-center mb-8 otpP">
          Enter the verification code we just sent on your email address.
        </p>

        <OtpInput length={4} />

        <div className="flex justify-center mt-8">
          <button
            type="button"
            className="h-12 w-[233px] rounded-md px-4 bg-[#CB0000] text-white"
            onClick={() => setModalOpen(true)}
          >
            Verify
          </button>
        </div>
      </section>

      <ContinueModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAction={() => {
          setModalOpen(false);
          router.push("/profile/complete");
        }}
        title="Account Created"
        description="Your account has been successfully created"
        buttonLabel="Complete Profile"
      />
    </main>
  );
}

function OtpInput({ length = 4 }: { length?: number }) {
  const [values, setValues] = useState<string[]>(
    Array.from({ length }, () => "")
  );
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const refs = useRef<Array<HTMLInputElement | null>>(
    Array.from({ length }, () => null)
  );

  const setChar = (i: number, char: string) => {
    setValues((prev) => {
      const next = [...prev];
      next[i] = char;
      return next;
    });
  };

  const onChange = (i: number, v: string) => {
    const val = v.replace(/\D/g, "").slice(0, 1);
    setChar(i, val);
    if (val && i < length - 1) refs.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (values[i]) {
        setChar(i, "");
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
        setChar(i - 1, "");
      }
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  };

  const onPaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;

    setValues((prev) => {
      const next = [...prev];
      for (let j = 0; j < length; j++) {
        const idx = i + j;
        if (idx >= length) break;
        next[idx] = text[j] ?? "";
      }
      return next;
    });

    const lastFilled = Math.min(i + text.length, length - 1);
    refs.current[lastFilled]?.focus();
  };

  return (
    <div className="flex items-center justify-center gap-3">
      {Array.from({ length }).map((_, i) => {
        const hasVal = !!values[i];
        const isFocused = focusedIndex === i;
        const active = hasVal || isFocused;

        return (
          <input
            key={i}
            ref={(el: HTMLInputElement | null) => {
              refs.current[i] = el;
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={values[i]}
            onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={(e) => onPaste(i, e)}
            onFocus={() => setFocusedIndex(i)}
            onBlur={() => setFocusedIndex(null)}
            className={[
              "h-[59px] w-[69px] text-center rounded-md outline-none otpInput",
              "border-[3px]", // increased border by 1px
              active ? "border-[#CC0000] text-[#CC0000]" : "border-[#DFDFDF]",
              "transition-colors",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}
