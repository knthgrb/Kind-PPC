"use client";

export default function Stepper({
  steps = 4,
  activeStep = 1, // 1-based index
  gapClass = "gap-2", // tweak spacing if needed
}: {
  steps?: number;
  activeStep: number;
  gapClass?: string;
}) {
  const list = Array.from({ length: steps }).map((_, i) => i + 1);

  return (
    <div className="w-full">
      {/* Circles row */}
      <div className={`w-full flex ${gapClass} justify-between items-end`}>
        {list.map((n) => {
          const done = n <= activeStep;
          return (
            <div key={`circle-${n}`} className="flex-1 flex flex-col items-center">
              <div
                className={[
                  "h-8 w-8 rounded-full flex items-center justify-center stepsNumber",
                  done ? "bg-[#CC0000] text-white" : "bg-[#EDEDED] text-[#05264E]",
                ].join(" ")}
              >
                {n}
              </div>
            </div>
          );
        })}
      </div>

      {/* Underline segments */}
      <div className={`mt-2 w-full flex ${gapClass}`}>
        {list.map((n) => {
          const done = n <= activeStep;
          return (
            <div
              key={`bar-${n}`}
              className={[
                "h-[8px] rounded-[50px] flex-1",
                done ? "bg-[#CC0000]" : "bg-[#EDEDED]",
              ].join(" ")}
            />
          );
        })}
      </div>
    </div>
  );
}
