"use client";

import Image from "next/image";

type RoleCardProps = {
  iconSrc: string;
  title: string;
  bullets: string[];
  selected?: boolean;
  onSelect?: () => void;
};

export default function RoleCard({
  iconSrc,
  title,
  bullets,
  selected = false,
  onSelect,
}: RoleCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={[
        "w-full md:w-[506px] md:h-[181px]",
        "text-left rounded-xl border-[1.8px] p-5 md:p-3 transition-shadow",
        selected ? "border-[#CC0000]" : "border-[#DCDCDC]",
        "hover:shadow-sm",
        "focus:outline-none cursor-pointer",
      ].join(" ")}
    >
      <div className="flex items-start justify-between mb-3">
        {/* Icon — turns red if selected */}
        <Image
          src={iconSrc}
          alt=""
          width={28}
          height={28}
          style={{
            filter: selected
              ? "invert(17%) sepia(100%) saturate(7478%) hue-rotate(356deg) brightness(90%) contrast(101%)"
              : "none",
          }}
        />
      </div>

      {/* Title — turns red if selected */}
      <h2
        className="mb-2 signupH2"
        style={{ color: selected ? "#CC0000" : "inherit" }}
      >
        {title}
      </h2>

      <ul className="space-y-1">
        {bullets.map((t, i) => (
          <li key={i} className="leading-relaxed signupBullet">
            {t}
          </li>
        ))}
      </ul>
    </button>
  );
}
