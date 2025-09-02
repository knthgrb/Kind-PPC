interface CardProps {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function Card({
  title,
  right,
  children,
  className = "",
}: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-[#F6F6F6] bg-[#F6F6F6] p-4 md:p-5 ${className}`}
    >
      {(title || right) && (
        <header className="mb-3 flex items-center justify-between">
          {title ? <h3 className="profileH1">{title}</h3> : <div />}
          {right}
        </header>
      )}
      {children}
    </section>
  );
}
