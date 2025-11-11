interface ChipProps {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

export default function Chip({ children, onRemove, className }: ChipProps) {
  return (
    <span
      className={`profileSkills inline-flex items-center gap-2 rounded-xl border border-white bg-white px-3 py-1 ${
        className || ""
      }`}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          aria-label="remove"
          className="-mt-0.5 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onRemove}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
