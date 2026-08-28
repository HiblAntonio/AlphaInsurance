import React from "react";

export default function FormField({
  label,
  type = "text",
  defaultValue,
  placeholder,
  className = "",
}) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
}