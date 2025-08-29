interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Card({ title, children, className = "" }: CardProps) {
  return (
    <section className={`rounded-2xl bg-gray-50 p-4 sm:p-5 ${className}`}>
      {title && (
        <h3 className="mb-4 text-lg sm:text-[1.314rem] font-semibold text-[#222222]">
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}
