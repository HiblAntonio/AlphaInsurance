import React from "react";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("hr-HR");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export default function PreviousPoliciesSection({ previousPolicies = [] }) {
  return (
    <section className="details-block">
      <div className="details-block-heading">
        <h2>Pregled prethodnih polica osiguranja</h2>
        <p>Pregled polica osiguranja povezanih s ugovarateljem</p>
      </div>

      {previousPolicies.length ? (
        <div className="details-related-table-card">
          <div className="details-related-table-scroll">
            <table className="details-related-table">
              <thead>
                <tr>
                  <th>Broj police</th>
                  <th>Osiguravajuća kuća</th>
                  <th>Vrsta osiguranja</th>
                  <th>Premija</th>
                  <th>Prodajno mjesto</th>
                  <th>Polica napravljena</th>
                  <th>Datum produženja</th>
                  <th>Policu napravio/la</th>
                </tr>
              </thead>

              <tbody>
                {previousPolicies.map((policy) => (
                  <tr key={`${policy.policyNumber}-${policy.previousPolicyNumber || policy.startingDate}`}>
                    <td>{policy.policyNumber}</td>
                    <td>{policy.companyName}</td>
                    <td>{policy.policyType}</td>
                    <td>{formatCurrency(policy.price)}</td>
                    <td>{policy.locationName}</td>
                    <td>{formatDate(policy.dateCreated)}</td>
                    <td>{formatDate(policy.startingDate)}</td>
                    <td>{policy.clientName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="details-empty-state">
          <img src="/images/NoResult.png" alt="" />
          <div className="details-empty-copy">
            <h3>Nema rezultata</h3>
            <p>Odabrana polica osiguranja nema povezanih prethodnih polica.</p>
          </div>
        </div>
      )}
    </section>
  );
}
