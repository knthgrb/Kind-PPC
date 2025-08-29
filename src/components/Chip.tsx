interface ChipProps {
  children: React.ReactNode;
  onRemove?: () => void;
}

export default function Chip({ children, onRemove }: ChipProps) {
  return (
    <span className="profileSkills inline-flex items-center gap-2 rounded-md border border-white bg-white px-3 py-1">
      {children}
      {onRemove ? (
        <button
          type="button"
          aria-label="remove"
          className="-mt-0.5"
          onClick={onRemove}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
