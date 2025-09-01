"use client";

export default function Tag({
  tag,
  onRemove,
}: {
  tag: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center bg-gray-100 px-2 py-1 rounded-full text-sm max-w-[150px]">
      <span className="truncate" title={tag}>
        {tag}
      </span>
      <button
        className="ml-1 text-gray-600 hover:text-red-500"
        onClick={onRemove}
      >
        &times;
      </button>
    </div>
  );
}
