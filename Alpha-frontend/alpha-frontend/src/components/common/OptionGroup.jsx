import React from "react";

export default function OptionGroup({ name, options = [] }) {
  return (
    <div className="person-type-row">
      {options.map((option) => (
        <label
          key={option.label}
          className={`check-option ${option.checked ? "active" : ""}`}
        >
          <input
            type={option.type || "radio"}
            name={name}
            defaultChecked={option.checked}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}