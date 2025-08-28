import React from "react";

type ToggleButtonProps = {
  toggled?: boolean;
  defaultToggled?: boolean;
  onToggle?: (toggled: boolean) => void;
};

export default function ToggleButton({
  toggled: controlledToggled,
  defaultToggled = false,
  onToggle,
}: ToggleButtonProps) {
  const [uncontrolledToggled, setUncontrolledToggled] =
    React.useState(defaultToggled);

  const isControlled = controlledToggled !== undefined;
  const toggled = isControlled ? controlledToggled : uncontrolledToggled;

  const handleClick = () => {
    if (!isControlled) {
      setUncontrolledToggled((prev) => !prev);
    }
    if (onToggle) {
      onToggle(!toggled);
    }
  };

  return (
    <div className="toggle-btn-container">
      <button
        className={`toggle-btn ${toggled ? "toggled" : ""}`}
        onClick={handleClick}
      >
        <div className="thumb" />
      </button>
    </div>
  );
}
