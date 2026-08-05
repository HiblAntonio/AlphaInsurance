import React from "react";

export default function PolicyBreadcrumbs({ policyNumber, currentLabel }) {
  return (
    <div className="details-breadcrumbs">
      <div className="details-brand-badge">
        <img src="/images/Alpha logo frame.png" alt="Alpha logo" />
      </div>

      <span>Alpha zastupanje</span>
      <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
      <span>Police osiguranja</span>

      {policyNumber ? (
        <>
          <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
          <span>{policyNumber}</span>
        </>
      ) : null}

      {currentLabel ? (
        <>
          <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
          <strong>{currentLabel}</strong>
        </>
      ) : null}
    </div>
  );
}
