import React from "react";
import Sidebar from "../dashboard/Sidebar";
import PolicyBreadcrumbs from "./PolicyBreadcrumbs";

export default function AddPolicyLayout({
  title,
  subtitle,
  onBack,
  showBackButton,
  children,
}) {
  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="main-panel add-policy-page">
        <div className="add-policy-shell">
          <div className="add-policy-header">
            <PolicyBreadcrumbs
              currentLabel="Dodavanje police osiguranja"
            />

            <div className="add-policy-title-row">
              {showBackButton && (
                <button
                  type="button"
                  className="add-policy-back-btn"
                  onClick={onBack}
                >
                  <img src="/svg/arrow-left.svg" alt="Nazad" />
                </button>
              )}

              <div className="add-policy-title-wrap">
                <h1>{title}</h1>
                <p>{subtitle}</p>
              </div>
            </div>
          </div>

          <div className="add-policy-content">{children}</div>
        </div>
      </main>
    </div>
  );
}