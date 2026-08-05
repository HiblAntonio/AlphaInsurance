import React from "react";
import { Link } from "react-router-dom";

export default function PageHeader({
  backTo = "/dashboard",
  title,
  description,
  breadcrumbs = [],
  currentLabel,
}) {
  return (
    <div className="add-policy-header">
      <div className="add-policy-breadcrumbs">
        <div className="brand-badge breadcrumb-logo">
          <img src="/images/Alpha logo frame.png" alt="Alpha logo" />
        </div>

        {breadcrumbs.map((item, index) => (
          <React.Fragment key={item}>
            <span className="crumb-muted">{item}</span>
            <i className="bi bi-chevron-right"></i>
          </React.Fragment>
        ))}

        <span className="add-policy-current">{currentLabel}</span>
      </div>

      <div className="add-policy-title-row">
        <Link to={backTo} className="back-btn" aria-label="Natrag">
          <i className="bi bi-chevron-left"></i>
        </Link>

        <div className="add-policy-title-wrap">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}