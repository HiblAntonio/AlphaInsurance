import React from "react";

export default function CurrentPolicyCard({
  label,
  value,
  subvalue,
  link = false,
  large = false,
}) {
  return (
    <div className={`current-policy-card ${large ? "large" : ""}`}>
      <span className="current-policy-label">{label}</span>

      <div className="current-policy-copy">
        <strong className={link ? "link" : ""}>{value}</strong>
        {subvalue ? <span>{subvalue}</span> : null}
      </div>
    </div>
  );
}