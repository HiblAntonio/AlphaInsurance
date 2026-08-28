import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/contractors.css";
import "../styles/contractorDetails.css";

import Sidebar from "../components/dashboard/Sidebar";
import { fetchClientDetails } from "../services/clientsService";

function getValue(source, keys, fallback = "") {
  const key = keys.find((item) => source?.[item] !== undefined && source?.[item] !== null);
  return key ? source[key] : fallback;
}

function formatDate(value) {
  if (!value) return "Nema podatka";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("hr-HR");
}

function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0,00 EUR";

  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: "EUR",
  }).format(number);
}

function getPolicyStatus(policy) {
  if (getValue(policy, ["isRenewed", "IsRenewed"], false)) {
    return { label: "Produzena", type: "renewed" };
  }

  if (getValue(policy, ["isActive", "IsActive"], false)) {
    return { label: "Aktivna", type: "active" };
  }

  return { label: "Neaktivna", type: "inactive" };
}

function mapPolicy(policy, index) {
  const status = getPolicyStatus(policy);

  return {
    id: `${getValue(policy, ["policyNumber", "PolicyNumber"], index)}-${index}`,
    policyNumber: getValue(policy, ["policyNumber", "PolicyNumber"], "Nema podatka"),
    insuranceCompany: getValue(policy, ["insuranceCompany", "InsuranceCompany"], "Nema podatka"),
    insuranceType: getValue(policy, ["policyType", "PolicyType"], "Nema podatka"),
    premium: formatCurrency(getValue(policy, ["price", "Price"], 0)),
    location: getValue(policy, ["location", "Location"], "Nema podatka"),
    renewalDate: formatDate(getValue(policy, ["startingDate", "StartingDate"], "")),
    createdBy: "Nema podatka",
    status: status.label,
    statusType: status.type,
  };
}

function normalizeContractor(details, fallback = {}) {
  const policies = getValue(details, ["policies", "Policies"], []);
  const hasActivePolicy = policies.some((policy) =>
    Boolean(getValue(policy, ["isActive", "IsActive"], false))
  );

  return {
    id: getValue(details, ["id", "Id"], fallback.id || ""),
    status: hasActivePolicy || fallback.status === "Aktivan" ? "Aktivan" : "Neaktivan",
    oib: getValue(details, ["oib", "Oib", "OIB"], fallback.oib || "Nema podatka"),
    name: getValue(details, ["name", "Name"], fallback.name || "Nema podatka"),
    legalStatus: fallback.legalStatus || "Nema podatka",
    birthDate: formatDate(getValue(details, ["dob", "Dob"], fallback.birthDate || "")),
    phone: getValue(details, ["phoneNumber", "PhoneNumber"], fallback.phone || "Nema podatka"),
    email: getValue(
      details,
      ["emailAddress", "EmailAddress", "clientEmailAddress", "ClientEmailAddress"],
      fallback.email || "Nema podatka"
    ),
    totalPremiumSum: getValue(details, ["totalPremiumSum", "TotalPremiumSum"], 0),
    activePremiumSum: getValue(details, ["activePremiumSum", "ActivePremiumSum"], 0),
    policies: policies.map(mapPolicy),
  };
}

function PremiumCard({ title, value, subtitle }) {
  return (
    <article className="contractor-premium-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{subtitle}</p>
    </article>
  );
}

function ContractorPoliciesTable({ policies, loading, error }) {
  return (
    <div className="contractor-policies-card">
      <div className="table-scroll">
        <table className="contractor-policies-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Broj police</th>
              <th>Osiguravajuća kuća</th>
              <th>Vrsta osiguranja</th>
              <th>Premija</th>
              <th>Prodajno mjesto</th>
              <th>Datum produženja</th>
              <th>Policu napravio/la</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="contractor-policies-empty-cell">
                  Ucitavanje polica...
                </td>
              </tr>
            ) : null}

            {!loading && error ? (
              <tr>
                <td colSpan="8" className="contractor-policies-empty-cell">
                  {error}
                </td>
              </tr>
            ) : null}

            {!loading && !error && policies.length === 0 ? (
              <tr>
                <td colSpan="8" className="contractor-policies-empty-cell">
                  Ugovaratelj nema povezanih polica.
                </td>
              </tr>
            ) : null}

            {!loading && !error
              ? policies.map((policy) => (
                  <tr key={policy.id}>
                    <td>
                      <span className={`policy-status-pill ${policy.statusType}`}>
                        {policy.status}
                      </span>
                    </td>
                    <td>{policy.policyNumber}</td>
                    <td>{policy.insuranceCompany}</td>
                    <td>{policy.insuranceType}</td>
                    <td>{policy.premium}</td>
                    <td>{policy.location}</td>
                    <td>{policy.renewalDate}</td>
                    <td>{policy.createdBy}</td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContractorPoliciesGrid({ policies, loading, error }) {
  if (loading || error || policies.length === 0) {
    return <ContractorPoliciesTable policies={policies} loading={loading} error={error} />;
  }

  return (
    <div className="contractor-policies-grid">
      {policies.map((policy) => (
        <article className="contractor-policy-card" key={policy.id}>
          <div className="policy-card-top">
            <span className={`policy-status-pill ${policy.statusType}`}>
              {policy.status}
            </span>
            <time>{policy.renewalDate}</time>
          </div>

          <strong>{policy.policyNumber}</strong>
          <span className="policy-card-location">{policy.location}</span>

          <div className="policy-card-bottom">
            <b>{policy.premium}</b>
            <span>
              {policy.insuranceType} - {policy.insuranceCompany}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function ContractorDetailsPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { contractorId } = useParams();
  const [viewMode, setViewMode] = useState("table");
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [policySearch, setPolicySearch] = useState("");

  useEffect(() => {
    if (!contractorId) return;

    let active = true;
    setLoading(true);
    setError("");

    fetchClientDetails(contractorId)
      .then((data) => {
        if (active) setDetails(data);
      })
      .catch(() => {
        if (active) {
          setDetails(null);
          setError("Ne mogu dohvatiti detalje ugovaratelja. Provjeri backend i URL.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [contractorId]);

  const contractor = useMemo(
    () => normalizeContractor(details || {}, state?.contractor || {}),
    [details, state]
  );

  const filteredPolicies = useMemo(() => {
    const search = policySearch.trim().toLowerCase();
    if (!search) return contractor.policies;

    return contractor.policies.filter((policy) =>
      [
        policy.policyNumber,
        policy.insuranceCompany,
        policy.insuranceType,
        policy.location,
        policy.premium,
        policy.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [contractor.policies, policySearch]);

  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="main-panel contractor-details-page">
        <section className="contractor-details-shell">
          <div className="contractor-details-breadcrumbs">
            <div className="welcome-breadcrumb-logo">
              <img src="/images/Alpha logo frame.png" alt="Alpha logo" />
            </div>
            <span>Alpha</span>
            <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
            <span>Ugovaratelji</span>
            <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
            <strong>Detalji ugovaratelja</strong>
          </div>

          <div className="contractor-details-top-row">
            <div className="contractor-details-title-row">
              <button
                type="button"
                className="contractor-details-back"
                onClick={() => navigate("/ugovaratelji")}
                aria-label="Povratak na ugovaratelje"
              >
                <img src="/svg/arrow-left.svg" alt="" />
              </button>

              <div>
                <h1>Pregled detalja ugovaratelja</h1>
                <p>Pregled detalja odabranog ugovaratelja</p>
              </div>
            </div>

            <button
              type="button"
              className="contractor-edit-button"
              onClick={() =>
                navigate(`/ugovaratelji/${contractor.id || contractorId}/uredi`, {
                  state: { contractor },
                })
              }
            >
              <img src="/svg/pencile.svg" alt="" aria-hidden="true" />
              Uredi podatke
            </button>
          </div>

          {error && !details ? (
            <div className="contractor-details-error">{error}</div>
          ) : null}

          <div className="contractor-profile-section">
            <div className="contractor-profile-main">
              <span className="contractor-label">Ugovaratelj</span>
              <span
                className={`contractor-status ${
                  contractor.status === "Neaktivan" ? "inactive" : ""
                }`}
              >
                {loading ? "Ucitavanje" : contractor.status}
              </span>
              <div className="contractor-name-line">
                <h2>{contractor.name}</h2>
                <span>{contractor.oib}</span>
              </div>

              <div className="contractor-info-row">
                <div>
                  <span>Pravni status</span>
                  <strong>{contractor.legalStatus}</strong>
                </div>
                <div>
                  <span>Datum rođenja</span>
                  <strong>{contractor.birthDate}</strong>
                </div>
                <div>
                  <span>Broj telefona</span>
                  <strong>{contractor.phone}</strong>
                </div>
                <div>
                  <span>Email adresa</span>
                  <strong className="contractor-email">
                    {contractor.email}
                    <button
                      type="button"
                      aria-label="Kopiraj email"
                      onClick={() => navigator.clipboard?.writeText(contractor.email)}
                    >
                      <img src="/svg/copy.svg" alt="" aria-hidden="true" />
                    </button>
                  </strong>
                </div>
              </div>
            </div>

            <div className="contractor-premium-grid">
              <PremiumCard
                title="Suma premija"
                value={loading ? "..." : formatCurrency(contractor.totalPremiumSum)}
                subtitle="svih polica"
              />
              <PremiumCard
                title="Suma premija"
                value={loading ? "..." : formatCurrency(contractor.activePremiumSum)}
                subtitle="svih aktivnih polica"
              />
            </div>
          </div>

          <section className="contractor-policies-section">
            <div className="contractor-policies-heading">
              <h2>Pregled polica osiguranja</h2>
              <p>Pregled polica osiguranja povezanih s ugovarateljem</p>
            </div>

            <div className="contractor-policies-toolbar">
              <form className="search-box contractor-policies-search" onSubmit={(e) => e.preventDefault()}>
                <span className="search-box-left">
                  <i>
                    <img src="/svg/search.svg" alt="" />
                  </i>
                  <input
                    className="search-input"
                    placeholder="Pretraživanje..."
                    aria-label="Pretraživanje polica"
                    value={policySearch}
                    onChange={(event) => setPolicySearch(event.target.value)}
                  />
                </span>
                <small>CTRL + K</small>
              </form>

              <div className="contractor-policies-actions">
                <div className="view-toggle">
                  <button
                    type="button"
                    className={viewMode === "table" ? "active" : ""}
                    aria-label="Prikaz liste"
                    onClick={() => setViewMode("table")}
                  >
                    <img src="/svg/textcolum.svg" alt="" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={viewMode === "grid" ? "active" : ""}
                    aria-label="Prikaz kartica"
                    onClick={() => setViewMode("grid")}
                  >
                    <img src="/svg/squaresFour.svg" alt="" aria-hidden="true" />
                  </button>
                </div>

                <button type="button" className="filter-button">
                  <i>
                    <img src="/svg/filter.svg" alt="" />
                  </i>
                  Filter
                </button>
              </div>
            </div>

            {viewMode === "grid" ? (
              <ContractorPoliciesGrid
                policies={filteredPolicies}
                loading={loading}
                error={details ? "" : error}
              />
            ) : (
              <ContractorPoliciesTable
                policies={filteredPolicies}
                loading={loading}
                error={details ? "" : error}
              />
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
