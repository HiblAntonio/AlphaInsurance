import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/addPolicy.css";
import "../styles/employeeForm.css";

import Sidebar from "../components/dashboard/Sidebar";
import { addAgent, updateAgent, fetchAgentDetails, fetchAgentLocations } from "../services/agentsService";

const emptyEmployee = {
  name: "",
  idNumber: "",
  email: "",
  password: "",
  location: "Beli Manastir",
  role: "Admin",
};

const FALLBACK_LOCATIONS = ["Beli Manastir", "Đakovo", "Osijek"];

const getValue = (source, keys, fallback = "") => {
  if (!source) return fallback;
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
      return source[key];
    }
  }
  return fallback;
};


function normalizeEmployee(employee = {}) {
  return {
    name: getValue(employee, ["name", "Name"], ""),
    idNumber: getValue(
      employee,
      ["idNumber", "IDNumber", "iDNumber", "identificationNumber", "IdentificationNumber"],
      ""
    ),
    email: getValue(employee, ["email", "mailAddress", "MailAddress"], ""),
    password: "",
    location: getValue(employee, ["location", "Location", "locationName", "LocationName"], "Beli Manastir"),
    role: getValue(employee, ["role", "Role", "roleName", "RoleName"], "Admin"),
  };
}

export default function EmployeeFormPage() {
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const { state } = useLocation();
  const isEdit = Boolean(employeeId);

  const initialValues = useMemo(
    () => (isEdit ? normalizeEmployee(state?.agent || state?.employee) : emptyEmployee),
    [isEdit, state]
  );

  const [form, setForm] = useState(initialValues);
  const [loading, setLoading] = useState(isEdit && !state?.agent && !state?.employee);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [locations, setLocations] = useState(FALLBACK_LOCATIONS);

  useEffect(() => {
    if (!isEdit || state?.agent || state?.employee) return;

    let active = true;
    setLoading(true);
    fetchAgentDetails(employeeId)
      .then((agent) => {
        if (active) setForm(normalizeEmployee(agent));
      })
      .catch(() => {
        if (active) setError("Ne mogu dohvatiti podatke o djelatniku.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [employeeId, isEdit, state]);

  useEffect(() => {
    let active = true;
    fetchAgentLocations()
      .then((items) => {
        if (active && Array.isArray(items) && items.length > 0) {
          setLocations(items);
          setForm((current) => ({
            ...current,
            location: items.includes(current.location) ? current.location : items[0],
          }));
        }
      })
      .catch(() => {
        if (active) setLocations(FALLBACK_LOCATIONS);
      });

    return () => {
      active = false;
    };
  }, []);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (isEdit) {
      setSaving(true);
      try {
        await updateAgent(employeeId, {
          name: form.name.trim(),
          roleName: form.role,
          mailAddress: form.email.trim(),
          locationName: form.location,
          identificationNumber: form.idNumber.trim() || undefined,
        });
        setMessage("Djelatnik je uspješno ažuriran.");
        setTimeout(() => navigate("/zaposlenici"), 500);
      } catch (submitError) {
        setError(submitError.message || "Greška pri ažuriranju djelatnika.");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Ime i prezime, email adresa i lozinka su obavezni.");
      return;
    }

    setSaving(true);
    try {
      await addAgent({
        Name: form.name.trim(),
        RoleName: form.role,
        MailAddress: form.email.trim(),
        Password: form.password,
        Location: form.location,
      });
      setMessage("Djelatnik je uspješno dodan.");
      setTimeout(() => navigate("/zaposlenici"), 500);
    } catch (submitError) {
      setError(submitError.message || "Greška pri dodavanju djelatnika.");
    } finally {
      setSaving(false);
    }
  };

  const employeeName = form.name || "Djelatnik";
  const title = isEdit ? "Uređivanje odabranog djelatnika" : "Dodavanje novog djelatnika";
  const subtitle = isEdit
    ? "Forma za uređivanje odabranog djelatnika u Alpha sustavu"
    : "Forma za dodavanje novog djelatnika u Alpha sustav";
  const submitLabel = isEdit ? "Ažuriraj promjene" : "Dodaj novog djelatnika";

  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="main-panel employee-form-page">
        <section className="employee-form-shell">
          <div className="employee-form-breadcrumbs">
            <div className="welcome-breadcrumb-logo">
              <img src="/images/Alpha logo frame.png" alt="Alpha logo" />
            </div>
            <span>Alpha</span>
            <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
            <span>Djelatnici</span>
            <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
            {isEdit ? (
              <>
                <span>{employeeName}</span>
                <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
              </>
            ) : null}
            <strong>{title}</strong>
          </div>

          <div className="employee-form-title-row">
            <button
              type="button"
              className="employee-form-back"
              onClick={() => navigate(-1)}
              aria-label="Povratak"
            >
              <img src="/svg/arrow-left.svg" alt="" />
            </button>

            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>

          <form className="employee-form add-policy-form narrow" onSubmit={handleSubmit}>
            {loading ? <p className="employee-form-message">Učitavanje podataka...</p> : null}
            {error ? <p className="employee-form-message error">{error}</p> : null}
            {message ? <p className="employee-form-message success">{message}</p> : null}

            <div className="form-group">
              <label htmlFor="employee-name">Ime i prezime djelatnika</label>
              <input
                id="employee-name"
                type="text"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                required={!isEdit}
              />
            </div>


            <div className="form-group">
              <label htmlFor="employee-email">Email adresa</label>
              <input
                id="employee-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                required={!isEdit}
              />
            </div>

            {!isEdit && (
              <div className="form-group">
                <label htmlFor="employee-password">Lozinka</label>
                <input
                  id="employee-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-grid two">
              <div className="form-group">
                <label htmlFor="employee-location">Prodajno mjesto</label>
                <div className="select-wrap has-value">
                  <select
                    id="employee-location"
                    value={form.location}
                    onChange={(event) => updateField("location", event.target.value)}
                  >
                    {locations.map((location) => (
                      <option key={location}>{location}</option>
                    ))}
                  </select>
                  <img
                    src="/svg/arrow-down.svg"
                    alt=""
                    className="select-arrow"
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="employee-role">Uloga</label>
                <div className="select-wrap has-value">
                  <select
                    id="employee-role"
                    value={form.role}
                    onChange={(event) => updateField("role", event.target.value)}
                  >
                    <option>Admin</option>
                    <option>Djelatnik</option>
                  </select>
                  <img
                    src="/svg/arrow-down.svg"
                    alt=""
                    className="select-arrow"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="submit-dark-btn" disabled={saving || loading}>
              {saving ? "Spremanje..." : submitLabel}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
