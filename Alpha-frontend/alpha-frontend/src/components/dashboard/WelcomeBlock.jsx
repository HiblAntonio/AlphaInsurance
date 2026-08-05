import React from "react";
import { getCurrentUser } from "../../services/authService";

export default function WelcomeBlock() {
  const currentUser = getCurrentUser();
  const username = (currentUser.username || "Korisnik")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <section className="welcome-block">
      <div className="welcome-breadcrumbs">
        <div className="welcome-breadcrumb-brand">
          <div className="welcome-breadcrumb-logo">
            <img src="/images/Alpha logo frame.png" alt="Alpha logo" />
          </div>

          <span className="welcome-breadcrumb-muted">Alpha zastupanje</span>
        </div>

        <img
          className="welcome-breadcrumb-arrow"
          src="/svg/arrow-right.svg"
          alt=""
          aria-hidden="true"
        />

        <span className="welcome-breadcrumb-current">Police osiguranja</span>
      </div>

      <div className="welcome-title-box">
        <h1>Dobrodošao/la nazad, {username}!</h1>
        <p>Pregled i filtriranje svih polica osiguranja</p>
      </div>
    </section>
  );
}
