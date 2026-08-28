import React from "react";

export default function PolicyInfoCard({
  dateCreatedText,
  insuranceCompany,
  insuranceType,
  premium,
  location,
  partner,
  showPartner = true,
}) {
  return (
    <div className={`details-info-card ${showPartner ? "" : "without-partner"}`}>
      <div className="details-info-item accent">
        <span className="details-label">Datum početka osiguranja</span>
        <strong>{dateCreatedText}</strong>
      </div>

      <div className="details-info-item">
        <span className="details-label">Osiguravajuća kuća</span>
        <strong>{insuranceCompany}</strong>
      </div>

      <div className="details-info-item">
        <span className="details-label">Vrsta osiguranja</span>
        <strong>{insuranceType}</strong>
      </div>

      <div className="details-info-item">
        <span className="details-label">Premija</span>
        <strong>{premium}</strong>
      </div>

      <div className="details-info-item">
        <span className="details-label">Prodajno mjesto</span>
        <strong>{location}</strong>
      </div>

      {showPartner ? (
        <div className="details-info-item">
          <span className="details-label">Partner</span>
          <strong>{partner || "Nema partnera"}</strong>
        </div>
      ) : null}
    </div>
  );
}
