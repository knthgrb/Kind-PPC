interface GhostButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export default function GhostButton({
  children,
  className = "",
  ...props
}: GhostButtonProps) {
  return (
    <button
      {...props}
      className={[
        "w-[118px] h-[36px] rounded-md border border-[#CFCFCF] bg-white",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
