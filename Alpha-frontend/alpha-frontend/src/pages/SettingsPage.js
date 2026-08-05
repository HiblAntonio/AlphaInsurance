import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import "../styles/dashboard.css";
import "../styles/settings.css";

import Sidebar from "../components/dashboard/Sidebar";
import { getCurrentUser, changePassword } from "../services/authService";
import { fetchAgentDetails } from "../services/agentsService";
import { fetchLookupItems, addLookupItem, updateLookupItem, setLookupItemActive } from "../services/lookupService";

const ADMIN_TABS = ["Vrijednosti lookup tablice"];

function isAdmin(user) {
  return user?.role === "Admin" || user?.role === "Super Admin";
}


const lookupTabs = [
  "Osiguravajuće kuće",
  "Partneri",
  "Vrste osiguranja",
  "Prodajna mjesta",
];

const systemSettings = [
  "Djelatnici mogu vidjeti police samo s vlastitog prodajnog područja",
  "Djelatnici mogu uređivati samo svoje police osiguranja",
  "Postavi vremensku zabranu za djelatnike",
  "Odjava s računa nakon neaktivnosti",
  "Zaključaj police osiguranja nakon određenog vremenskog perioda",
  "Obavezna promjena lozinke",
];

function SettingsOverview({ user, agentDetails }) {
  const userDetails = [
    ["Identifikacijski broj", agentDetails?.identificationNumber ?? "—"],
    ["Prodajno mjesto", agentDetails?.locationName ?? "—"],
  ];

  return (
    <section className="settings-overview">
      <div className="settings-section-heading">
        <h2>Pregled osnovnih informacija</h2>
        <p>Pregled informacija o djelatniku i o sustavu</p>
      </div>

      <div className="settings-product-card">
        <div className="settings-product-logo">
          <img src="/images/Alpha logo frame.png" alt="Alpha logo" />
        </div>
        <div>
          <strong>DANTE - Program za vođenje polica osiguranja</strong>
          <span>Alpha web v1.0.0.</span>
        </div>
      </div>

      <div className="settings-user-block">
        <div className="settings-user-head">
          <span className="settings-role-pill">{user.role}</span>
          <h3>{user.username}</h3>
          {user.email && <p>{user.email}</p>}
        </div>

        <dl className="settings-details-list">
          {userDetails.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <p className="settings-note">
          *Identifikacijski broj i prodajno mjesto mogu promijeniti samo Admin
          djelatnici
        </p>
      </div>
    </section>
  );
}

function PasswordField({ label, name, value, onChange, show, onToggleShow }) {
  return (
    <label>
      <span>{label}</span>
      <div className="settings-password-field">
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          autoComplete="new-password"
        />
        <button type="button" onClick={onToggleShow} aria-label={`Prikaži ${label.toLowerCase()}`}>
          <span aria-hidden="true">
            <img src="svg/eye.svg" alt="oko" />
          </span>
        </button>
      </div>
    </label>
  );
}

function SettingsSecurity() {
  const [fields, setFields] = useState({ current: "", newPw: "", confirm: "" });
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false });
  const [status, setStatus] = useState(null); // { type: "success"|"error", msg }
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setFields((f) => ({ ...f, [name]: value }));
    setStatus(null);
  }

  function toggleShow(name) {
    setShow((s) => ({ ...s, [name]: !s[name] }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!fields.current || !fields.newPw || !fields.confirm) {
      setStatus({ type: "error", msg: "Sva polja su obavezna." });
      return;
    }
    if (fields.newPw !== fields.confirm) {
      setStatus({ type: "error", msg: "Nova lozinka i potvrda se ne podudaraju." });
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(fields.current, fields.newPw, fields.confirm);
      setFields({ current: "", newPw: "", confirm: "" });
      setStatus({ type: "success", msg: "Lozinka je uspješno promijenjena." });
    } catch (err) {
      setStatus({ type: "error", msg: err.message || "Greška pri promjeni lozinke." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="settings-security">
      <div className="settings-section-heading">
        <h2>Postavljanje nove lozinke</h2>
        <p>Ažuriranje trenutne lozinke</p>
      </div>

      <form className="settings-password-form" onSubmit={handleSubmit}>
        <PasswordField
          label="Trenutna lozinka"
          name="current"
          value={fields.current}
          onChange={handleChange}
          show={show.current}
          onToggleShow={() => toggleShow("current")}
        />
        <PasswordField
          label="Nova lozinka"
          name="newPw"
          value={fields.newPw}
          onChange={handleChange}
          show={show.newPw}
          onToggleShow={() => toggleShow("newPw")}
        />
        <PasswordField
          label="Potvrdi novu lozinku"
          name="confirm"
          value={fields.confirm}
          onChange={handleChange}
          show={show.confirm}
          onToggleShow={() => toggleShow("confirm")}
        />

        {status && (
          <p className={`settings-password-status settings-password-status--${status.type}`}>
            {status.msg}
          </p>
        )}

        <button type="submit" className="settings-password-submit" disabled={submitting}>
          {submitting ? "Slanje..." : "Ažuriraj lozinku"}
        </button>
      </form>
    </section>
  );
}

const addLabelByTab = {
  "Osiguravajuće kuće": "Dodaj osiguravajuću kuću",
  "Partneri":           "Dodaj partnera",
  "Vrste osiguranja":   "Dodaj vrstu osiguranja",
  "Prodajna mjesta":    "Dodaj prodajno mjesto",
};

function LookupModal({ tab, editName, onClose, onSaved }) {
  const [value, setValue] = useState(editName ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim()) { setError("Naziv ne smije biti prazan."); return; }
    setSubmitting(true);
    setError("");
    try {
      if (editName) {
        await updateLookupItem(tab, editName, value.trim());
      } else {
        await addLookupItem(tab, value.trim());
      }
      onSaved();
    } catch (err) {
      setError(err.message || "Greška pri spremanju.");
    } finally {
      setSubmitting(false);
    }
  }

  const title = editName ? "Uredi naziv" : addLabelByTab[tab];

  return ReactDOM.createPortal(
    <div className="lookup-modal-overlay" onClick={onClose}>
      <div className="lookup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="lookup-modal-header">
          <h3>{title}</h3>
          <button type="button" className="lookup-modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="lookup-modal-body">
          <label>
            Naziv
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Unesite naziv..."
            />
          </label>
          {error && <p className="lookup-modal-error">{error}</p>}
          <div className="lookup-modal-actions">
            <button type="button" className="lookup-modal-btn outline" onClick={onClose}>Odustani</button>
            <button type="submit" className="lookup-modal-btn filled" disabled={submitting}>
              {submitting ? "Spremanje..." : "Spremi"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function SettingsLookupTables() {
  const [activeTab, setActiveTab] = useState(lookupTabs[0]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { editName: string|null }
  const [togglingName, setTogglingName] = useState(null);

  function loadRows(tab) {
    setLoading(true);
    fetchLookupItems(tab)
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadRows(activeTab); }, [activeTab]);

  function handleSaved() {
    setModal(null);
    loadRows(activeTab);
  }

  async function handleToggleActive(row) {
    setTogglingName(row.name);
    try {
      await setLookupItemActive(activeTab, row.name, !row.isActive);
      setRows((prev) => prev.map((r) => r.name === row.name ? { ...r, isActive: !r.isActive } : r));
    } catch {
      // silently ignore; row stays unchanged
    } finally {
      setTogglingName(null);
    }
  }

  return (
    <section className="settings-lookup">
      {modal && (
        <LookupModal
          tab={activeTab}
          editName={modal.editName}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      <div className="settings-section-heading">
        <h2>Uređivanje lookup tablica</h2>
        <p>Uređivanje vrijednosti unutar lookup tablica sustava</p>
      </div>

      <div className="settings-lookup-tabs">
        {lookupTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="settings-lookup-heading-row">
        <div className="settings-section-heading">
          <h2>Pregled — {activeTab}</h2>
          <p>Uređivanje i dodavanje novih vrijednosti</p>
        </div>

        <button type="button" className="settings-add-lookup" onClick={() => setModal({ editName: null })}>
          <img src="/svg/plus.svg" alt="" />
          {addLabelByTab[activeTab]}
        </button>
      </div>

      <div className="settings-lookup-table-card">
        <div className="table-scroll">
          <table className="settings-lookup-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Naziv</th>
                <th>Radnja</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3}>Učitavanje...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={3}>Nema podataka.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.name} className={row.isActive ? "" : "lookup-row-inactive"}>
                  <td>
                    <span className={`lookup-status-badge ${row.isActive ? "active" : "inactive"}`}>
                      {row.isActive ? "Aktivno" : "Neaktivno"}
                    </span>
                  </td>
                  <td>{row.name}</td>
                  <td>
                    <div className="lookup-actions">
                      <button type="button" className="lookup-edit" onClick={() => setModal({ editName: row.name })}>
                        <img src="/svg/pencilSimple.svg" alt="" />
                        Uredi
                      </button>
                      <button
                        type="button"
                        className={`lookup-toggle ${row.isActive ? "deactivate" : "activate"}`}
                        disabled={togglingName === row.name}
                        onClick={() => handleToggleActive(row)}
                      >
                        {row.isActive ? "Deaktiviraj" : "Aktiviraj"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function SettingsSystem() {
  return (
    <section className="settings-system">
      <div className="settings-section-heading">
        <h2>Postavke sustava za ograničenja djelatnika</h2>
        <p>Postavljanje sigurnosnih sustava</p>
      </div>

      <div className="settings-system-checks">
        {systemSettings.map((setting) => (
          <label key={setting}>
            <input type="checkbox" />
            <span>{setting}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Pregled");
  const [agentDetails, setAgentDetails] = useState(null);
  const user = getCurrentUser();
  const admin = isAdmin(user);
  const tabs = ["Pregled", "Sigurnost", ...(admin ? ADMIN_TABS : [])];

  useEffect(() => {
    if (user?.id) {
      fetchAgentDetails(user.id).then(setAgentDetails).catch(() => {});
    }
  }, [user?.id]);

  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="main-panel settings-page">
        <section className="settings-shell">
          <div className="settings-breadcrumbs">
            <div className="welcome-breadcrumb-logo">
              <img src="/images/Alpha logo frame.png" alt="Alpha logo" />
            </div>
            <span>Alpha zastupanje</span>
            <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
            <strong>Postavke</strong>
          </div>

          <div className="settings-title">
            <h1>Postavke</h1>
            <p>Postavke računa korisnika</p>
          </div>

          <nav className="settings-tabs" aria-label="Postavke">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={activeTab === tab ? "active" : ""}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>

          {activeTab === "Sigurnost" ? (
            <SettingsSecurity />
          ) : activeTab === "Vrijednosti lookup tablice" ? (
            <SettingsLookupTables />
          ) : activeTab === "Postavke sustava" ? (
            <SettingsSystem />
          ) : (
            <SettingsOverview user={user} agentDetails={agentDetails} />
          )}
        </section>
      </main>
    </div>
  );
}
