interface RedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export default function RedButton({
  children,
  className = "",
  ...props
}: RedButtonProps) {
  return (
    <button
      {...props}
      className={[
        "w-[118px] h-[36px] rounded-md bg-[#CB0000] text-white",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
