import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/employees.css";
import "../styles/employeeDetails.css";

import Sidebar from "../components/dashboard/Sidebar";
import { fetchAgentDetails, setAgentActive } from "../services/agentsService";

function formatCurrency(value) {
  if (!value && value !== 0) return "0,00 EUR";
  return `${Number(value).toLocaleString("hr-HR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EUR`;
}

const getValue = (source, keys, fallback = "") => {
  if (!source) return fallback;
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
      return source[key];
    }
  }
  return fallback;
};

function normalizeAgent(agent) {
  if (!agent) return null;

  return {
    id: getValue(agent, ["id", "Id"]),
    name: getValue(agent, ["name", "Name"], "Nema podatka"),
    roleName: getValue(agent, ["roleName", "RoleName"], "Djelatnik"),
    identificationNumber: getValue(
      agent,
      ["identificationNumber", "IdentificationNumber", "idNumber", "IDNumber", "iDNumber"],
      ""
    ),
    mailAddress: getValue(agent, ["mailAddress", "MailAddress", "email"], ""),
    locationName: getValue(
      agent,
      ["locationName", "LocationName", "location", "Location"],
      "Nema podatka"
    ),
    isActive: getValue(agent, ["isActive", "IsActive"], true),
    totalPremiumSum: getValue(agent, ["totalPremiumSum", "TotalPremiumSum"], 0),
    totalPoliciesCount: getValue(agent, ["totalPoliciesCount", "TotalPoliciesCount"], 0),
    monthlyPremiumSum: getValue(agent, ["monthlyPremiumSum", "MonthlyPremiumSum"], 0),
    monthlyPoliciesCount: getValue(agent, ["monthlyPoliciesCount", "MonthlyPoliciesCount"], 0),
  };
}

function InfoItem({ label, value, withCopy = false }) {
  return (
    <div className="employee-info-item">
      <span>{label}</span>
      <strong>
        {value}
        {withCopy ? (
          <button type="button" aria-label="Kopiraj email">
            <img src="/svg/copy.svg" alt="" aria-hidden="true" />
          </button>
        ) : null}
      </strong>
    </div>
  );
}

function StatCard({ value, title, text, image = false }) {
  return (
    <article className="employee-detail-card">
      <div>
        <span>{value}</span>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
      {image ? <img src="/images/file-text-dynamic-color.png" alt="" aria-hidden="true" /> : null}
    </article>
  );
}

export default function EmployeeDetailsPage() {
  const navigate = useNavigate();
  const { employeeId: id } = useParams();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchAgentDetails(id)
      .then((data) => setAgent(normalizeAgent(data)))
      .catch(() => setAgent(null))
      .finally(() => setLoading(false));
  }, [id]);

  const roleType = agent?.roleName === "Admin" ? "admin" : "employee";

  async function handleSetActive(isActive) {
    setSaving(true);
    setActionError("");
    try {
      await setAgentActive(agent.id, isActive);
      setAgent((prev) => ({ ...prev, isActive }));
      setDeactivateOpen(false);
    } catch (err) {
      setActionError(err.message || "Greška pri promjeni statusa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="main-panel employee-details-page">
        <section className="employee-details-shell">
          <div className="employee-details-breadcrumbs">
            <div className="welcome-breadcrumb-logo">
              <img src="/images/Alpha logo frame.png" alt="Alpha logo" />
            </div>
            <span>Alpha</span>
            <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
            <span>Zaposlenici</span>
            <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
            <strong>Detalji djelatnika</strong>
          </div>

          <div className="employee-details-top-row">
            <div className="employee-details-title-row">
              <button
                type="button"
                className="employee-details-back"
                onClick={() => navigate("/zaposlenici")}
                aria-label="Povratak na zaposlenike"
              >
                <img src="/svg/arrow-left.svg" alt="" />
              </button>

              <div>
                <h1>Pregled detalja o djelatniku</h1>
                <p>Pregled detalja odabranog djelatnika</p>
              </div>
            </div>

            <div className="employee-details-actions">
              {agent && (
                <button
                  type="button"
                  className="employee-secondary-button"
                  onClick={() => { setActionError(""); setDeactivateOpen(true); }}
                >
                  <span aria-hidden="true" />
                  {agent.isActive ? "Deaktiviraj djelatnika" : "Aktiviraj djelatnika"}
                </button>
              )}
              <button
                type="button"
                className="employee-primary-button"
                onClick={() => navigate(`/zaposlenici/${id}/uredi`, { state: { agent } })}
              >
                <img src="/svg/pencile.svg" alt="" aria-hidden="true" />
                Uredi djelatnika
              </button>
            </div>
          </div>

          {loading ? (
            <div className="employee-empty-state">
              <p>Učitavanje podataka o djelatniku...</p>
            </div>
          ) : !agent ? (
            <div className="employee-empty-state">
              <p>Ne mogu dohvatiti podatke o djelatniku.</p>
            </div>
          ) : (
            <>
              <section className="employee-profile">
                <span className="employee-profile-label">Djelatnik</span>
                <span className={`employee-role-pill ${roleType}`}>{agent.roleName}</span>
                {!agent.isActive && (
                  <span className="employee-inactive-badge">Deaktiviran</span>
                )}

                <div className="employee-name-line">
                  <h2>{agent.name}</h2>
                  <span>{agent.identificationNumber}</span>
                </div>

                <div className="employee-info-row">
                  <InfoItem label="Prodajno mjesto" value={agent.locationName} />
                  <InfoItem label="Identifikacijski broj" value={agent.identificationNumber} />
                  <InfoItem
                    label="Email adresa"
                    value={agent.mailAddress || "Nema podatka"}
                    withCopy={Boolean(agent.mailAddress)}
                  />
                </div>
              </section>

              <section className="employee-detail-cards">
                <StatCard
                  value={formatCurrency(agent.totalPremiumSum)}
                  title={`${agent.totalPoliciesCount} polica osiguranja`}
                  text="ukupna premija i broj polica na kojima je djelatnik partner"
                  image
                />
                <StatCard
                  value={formatCurrency(agent.monthlyPremiumSum)}
                  title={`${agent.monthlyPoliciesCount} polica osiguranja`}
                  text="od početka tekućeg mjeseca"
                />
                <article className="employee-detail-card activity-card">
                  <span>Posljednja aktivnost</span>
                  <strong>Nema podatka</strong>
                  <p>Podaci o posljednjoj aktivnosti nisu dostupni.</p>
                </article>
              </section>
            </>
          )}

          <section className="employee-activity-section">
            <h2>Activity log</h2>
            <p>Kronološki poredak posljednjih aktivnosti od strane djelatnika</p>

            <div className="employee-empty-state">
              <img src="/images/chart-dynamic-color.png" alt="" />
              <h3>Nema rezultata</h3>
              <p>
                Skupljamo sve potrebne podatke kako
                <br />
                bi se aktivnosti svakog djelatnika mogle
                <br />
                što bolje prikazati.
              </p>
            </div>
          </section>
        </section>

        {deactivateOpen ? (
          <div className="employee-modal-overlay" role="dialog" aria-modal="true">
            <div className="employee-deactivate-modal">
              <div className="employee-modal-icon" aria-hidden="true">
                <span />
              </div>

              <h2>
                {agent?.isActive ? "Deaktivirati" : "Aktivirati"} djelatnika
                <br />
                "{agent?.name}"?
              </h2>
              <p>
                {agent?.isActive
                  ? <>Deaktiviranog djelatnika je moguće<br />ponovno aktivirati.</>
                  : <>Aktivirani djelatnik moći će se<br />prijaviti u sustav.</>}
              </p>

              {actionError && (
                <p style={{ color: "#991b1b", fontSize: 13, margin: "8px 0 0" }}>{actionError}</p>
              )}

              <div className="employee-modal-actions">
                <button
                  type="button"
                  className="employee-modal-cancel"
                  onClick={() => setDeactivateOpen(false)}
                  disabled={saving}
                >
                  Odustani
                </button>
                <button
                  type="button"
                  className="employee-modal-confirm"
                  onClick={() => handleSetActive(!agent.isActive)}
                  disabled={saving}
                >
                  {saving ? "Spremanje..." : agent?.isActive ? "Deaktiviraj" : "Aktiviraj"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
