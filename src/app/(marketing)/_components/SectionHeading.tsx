type SectionHeaderProps = {
  title: string;
  description: string;
  className?: string; // Optional additional classes
};

export default function SectionHeader({
  title,
  description,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`text-center mb-10 ${className}`}>
      <h2 className="sectionH2 mb-4">{title}</h2>
      <p className="sectionP">
        {description.includes("<br") ? (
          <span dangerouslySetInnerHTML={{ __html: description }} />
        ) : (
          description
        )}
      </p>
    </div>
  );
}
