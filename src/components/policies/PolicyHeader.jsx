import React from "react";

export default function PolicyHeader({
  status,
  policyNumber,
  subtitle,
  onBack,
}) {
  return (
    <div className="details-title-row">
      <button className="details-back-btn" type="button" onClick={onBack}>
        <img src="/svg/arrow-left.svg" alt="Nazad" />
      </button>

      <div className="details-title-content">
        {status ? <span className="details-status">{status}</span> : null}
        <h1 className="details-policy-number">{policyNumber}</h1>
        <p className="details-subtitle">{subtitle}</p>
      </div>
    </div>
  );
}