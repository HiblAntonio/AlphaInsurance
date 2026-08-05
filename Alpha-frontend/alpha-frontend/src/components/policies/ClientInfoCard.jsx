import React, { useState } from "react";

export default function ClientInfoCard({
  clientName,
  clientOib,
  dobText,
  phoneNumber,
  email,
}) {
  const [copied, setCopied] = useState(false);

  function handleCopyEmail() {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section className="details-client-section">
      <div className="details-client-top">
        <span className="details-label">Ugovaratelj</span>

        <div className="details-client-header">
          <h2>{clientName}</h2>
          <span className="details-client-oib">{clientOib}</span>
        </div>
      </div>

      <div className="details-client-grid">
        <div className="details-client-item">
          <span className="details-label">Datum rođenja</span>
          <strong>{dobText}</strong>
        </div>

        <div className="details-divider" />

        <div className="details-client-item">
          <span className="details-label">Broj telefona</span>
          <strong style={!phoneNumber ? { opacity: 0.5 } : undefined}>
            {phoneNumber || "Nema podataka"}
          </strong>
        </div>

        <div className="details-divider" />

        <div className="details-client-item">
          <span className="details-label">Email adresa</span>
          <strong style={!email ? { opacity: 0.5 } : undefined}>
            {email || "Nema podataka"}
            {email && (
              <button
                type="button"
                onClick={handleCopyEmail}
                aria-label="Kopiraj email"
                title={copied ? "Kopirano!" : "Kopiraj email"}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0 0 0 6px",
                  verticalAlign: "middle",
                  color: "#466ef9",
                }}
              >
                <img src="/svg/copy.svg" alt="" style={{ width: 14, height: 14, filter: "invert(38%) sepia(90%) saturate(700%) hue-rotate(210deg)" }} />
              </button>
            )}
          </strong>
        </div>
      </div>
    </section>
  );
}
