"use client";

import Dropdown from "../dropdown/Dropdown";

type FilterDropdownProps = {
  icon: React.ElementType;
  value: string;
  options: string[];
  onChange: (val: string) => void;
};

export default function FilterDropdown({
  icon: Icon,
  value,
  options,
  onChange,
}: FilterDropdownProps) {
  return (
    <div className="flex items-center gap-2 w-full sm:flex-1 min-w-0">
      <Icon className="text-gray-500" />
      <Dropdown
        value={value}
        options={options}
        onChange={onChange}
        className="flex-1"
      />
    </div>
  );
}
