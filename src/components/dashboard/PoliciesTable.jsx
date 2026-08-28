import React from "react";
import { useNavigate } from "react-router-dom";

const STATUS_MAP = {
  "Active":           { label: "Aktivno",              cls: "active" },
  "Renewed":          { label: "Obnovljeno",            cls: "renewed" },
  "Inactive":         { label: "Neaktivno",             cls: "inactive" },
  "Two Weeks Active": { label: "2 tjedna",      cls: "two-weeks" },
  "One Week Active":  { label: "1 tjedan",     cls: "one-week" },
};

function statusInfo(raw) {
  return STATUS_MAP[raw] ?? { label: raw, cls: "" };
}

const SKELETON_WIDTHS = [
  ["short", "medium", "long", "medium", "long", "medium", "short", "medium"],
  ["medium", "long", "medium", "short", "medium", "long", "medium", "short"],
  ["long", "short", "long", "medium", "short", "medium", "long", "medium"],
  ["short", "medium", "medium", "long", "medium", "short", "medium", "long"],
  ["medium", "long", "short", "medium", "long", "medium", "short", "medium"],
  ["long", "medium", "long", "short", "medium", "long", "medium", "short"],
  ["short", "long", "medium", "medium", "short", "medium", "long", "medium"],
  ["medium", "short", "long", "medium", "long", "short", "medium", "long"],
];

function SkeletonTable() {
  return (
    <div className="table-card">
      <div className="table-scroll">
        <table className="alpha-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Broj police</th>
              <th>Ugovaratelj</th>
              <th>Datum produženja</th>
              <th>Osiguravajuća kuća</th>
              <th>Vrsta osiguranja</th>
              <th>Premija</th>
              <th>Prodajno mjesto</th>
            </tr>
          </thead>
          <tbody>
            {SKELETON_WIDTHS.map((cols, rowIdx) => (
              <tr key={rowIdx} className="skeleton-row">
                {cols.map((width, colIdx) => (
                  <td key={colIdx}>
                    <span className={`skeleton-cell ${width}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PoliciesTable({ items, loading, error, pageNumber = 1, search = "", year, onClearSearch, onCreatePolicy }) {
  const navigate = useNavigate();

  const openPolicy = (policy) => {
    const params = new URLSearchParams();
    if (pageNumber > 1) params.set("pageNumber", String(pageNumber));
    if (search) params.set("search", search);
    const query = params.toString();

    navigate(`/police/${policy.id}`, {
      state: {
        policy,
        dashboardPageNumber: pageNumber,
        dashboardSearch: search,
        dashboardYear: year,
        returnTo: `/dashboard${query ? `?${query}` : ""}`,
      },
    });
  };

  if (loading) return <SkeletonTable />;

  if (error) {
    return (
      <div className="table-card">
        <div className="table-scroll" style={{ padding: "24px", color: "#b42318" }}>
          {error}
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="table-card policies-empty-state">
        <img src="/images/folder-dynamic-color.png" alt="" className="policies-empty-img" />
        <h3 className="policies-empty-title">Nema rezultata</h3>
        <p className="policies-empty-subtitle">Pokušajte promijeniti filtere ili upisati drugačiji pojam za pretragu.</p>
        <div className="policies-empty-actions">
          <button type="button" className="policies-empty-btn outline" onClick={onClearSearch}>Očisti pretragu</button>
          <button type="button" className="policies-empty-btn filled" onClick={onCreatePolicy}>+ Kreiraj policu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-scroll">
        <table className="alpha-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Broj police</th>
              <th>Ugovaratelj</th>
              <th>Datum produženja</th>
              <th>Osiguravajuća kuća</th>
              <th>Vrsta osiguranja</th>
              <th>Premija</th>
              <th>Prodajno mjesto</th>
            </tr>
          </thead>

          <tbody>
            {items.map((policy) => (
              <tr
                key={policy.id}
                className="table-link-row"
                tabIndex={0}
                role="button"
                onClick={() => openPolicy(policy)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openPolicy(policy);
                  }
                }}
              >
                <td>
                  {(() => { const s = statusInfo(policy.status); return <span className={`status-pill ${s.cls}`}>{s.label}</span>; })()}
                </td>
                <td title={policy.policyNumber}>{policy.policyNumber}</td>
                <td title={policy.clientName}>{policy.clientName}</td>
                <td title={new Date(policy.startingDate).toLocaleDateString("hr-HR")}>
                  {new Date(policy.startingDate).toLocaleDateString("hr-HR")}
                </td>
                <td title={policy.insuranceCompany}>{policy.insuranceCompany}</td>
                <td title={policy.insuranceType}>{policy.insuranceType}</td>
                <td title={policy.price}>{Number(policy.price).toFixed(2)} €</td>
                <td title={policy.location}>{policy.location}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
