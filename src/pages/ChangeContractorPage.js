import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import PolicyBreadcrumbs from "../components/policies/PolicyBreadcrumbs";
import PolicyHeader from "../components/policies/PolicyHeader";
import { changeClient, fetchClientsByOib } from "../services/clientsService";
import "../styles/addPolicy.css";
import "../styles/updatePolicy.css";

const formatBirthDate = (raw) => {
  const digits = String(raw).replace(/\D/g, "").slice(0, 8);
  if (digits.length === 0) return "";
  const dayRaw = digits.slice(0, 2);
  let dayStr = dayRaw;
  if (dayRaw.length === 2) {
    const d = parseInt(dayRaw, 10);
    if (d > 31) dayStr = "31";
    else if (d < 1) dayStr = "01";
  }
  if (digits.length <= 2) return dayStr;
  const monthRaw = digits.slice(2, 4);
  let monthStr = monthRaw;
  if (monthRaw.length === 2) {
    const m = parseInt(monthRaw, 10);
    if (m > 12) monthStr = "12";
    else if (m < 1) monthStr = "01";
  }
  if (digits.length <= 4) return `${dayStr}.${monthStr}`;
  return `${dayStr}.${monthStr}.${digits.slice(4)}`;
};

const parseDateToIso = (value) => {
  if (!value) return null;
  const parts = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);
  if (!parts) return null;
  const [, day, month, year] = parts;
  return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00.000Z`).toISOString();
};

export default function ChangeContractorPage() {
  const navigate = useNavigate();
  const { policyNumber } = useParams();
  const { state } = useLocation();
  const sourcePolicy = state?.policy || {};

  const policyId = sourcePolicy.policyId || null;
  const originalClientId = sourcePolicy.clientId || sourcePolicy.ClientId || null;
  const currentContractor = useRef({
    clientName: sourcePolicy.clientName || sourcePolicy.ugovaratelj || "",
    clientOib: sourcePolicy.clientOib || sourcePolicy.oib || "",
  }).current;

  const [oib, setOib] = useState("");
  const [clientOptions, setClientOptions] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [lookupStatus, setLookupStatus] = useState("idle");
  const [newClient, setNewClient] = useState({
    clientName: "",
    email: "",
    dob: "",
    phoneNumber: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (oib.length !== 11) {
      setClientOptions([]);
      setSelectedClientId("");
      setLookupStatus("idle");
      return;
    }

    let active = true;
    setLookupStatus("loading");

    const timeout = setTimeout(async () => {
      try {
        const clients = await fetchClientsByOib(oib);
        if (!active) return;

        const normalized = clients.map((c) => ({
          id: c.id || c.Id,
          name: c.name || c.Name || "",
          oib: c.oib || c.OIB || oib,
        }));

        setClientOptions(normalized);
        if (normalized.length === 0) {
          setLookupStatus("not-found");
          setSelectedClientId("");
        } else {
          setLookupStatus("found");
          setSelectedClientId(normalized[0].id);
        }
      } catch {
        if (active) setLookupStatus("idle");
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [oib]);

  const updateNewClient = (name, value) => {
    setNewClient((prev) => ({
      ...prev,
      [name]:
        name === "dob" ? formatBirthDate(value)
        : name === "clientName" ? value.toUpperCase()
        : name === "phoneNumber" ? value.replace(/[^\d+]/g, "")
        : value,
    }));
  };

  const isCreatingNew = lookupStatus === "not-found" || selectedClientId === "__new__";

  const canSubmit =
    !saving &&
    oib.length === 11 &&
    lookupStatus !== "loading" &&
    (isCreatingNew
      ? newClient.clientName.trim() && newClient.phoneNumber.trim()
      : Boolean(selectedClientId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || !policyId) return;

    setSaving(true);
    setError("");

    try {
      const client =
        !isCreatingNew
          ? { isNew: false, clientId: selectedClientId, oib }
          : {
              isNew: true,
              oib,
              name: newClient.clientName.trim(),
              emailAddress: newClient.email.trim() || null,
              phoneNumber: newClient.phoneNumber.trim(),
              dob: parseDateToIso(newClient.dob) || null,
            };

      await changeClient({ policyId, client });

      if (originalClientId) {
        const fresh = isCreatingNew
          ? { clientName: newClient.clientName.trim(), clientOib: oib }
          : (() => {
              const picked = clientOptions.find((c) => c.id === selectedClientId);
              return { clientName: picked?.name ?? "", clientOib: picked?.oib ?? oib };
            })();
        try {
          sessionStorage.setItem(`freshContractor_${originalClientId}`, JSON.stringify(fresh));
        } catch {}
      }

      navigate(-1);
    } catch (err) {
      setError(err.message || "Greška pri izmjeni ugovaratelja.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="change-contractor-page">
        <section className="change-contractor-top">
          <PolicyBreadcrumbs
            policyNumber={policyNumber || currentContractor.clientName || "Ugovaratelj"}
            currentLabel="Izmjena ugovaratelja"
          />
          <PolicyHeader
            policyNumber="Izmjena ugovaratelja"
            subtitle="Promjena ugovaratelja će se izvršiti za sve police koje su povezane s trenutno odabranom policom"
            onBack={() => navigate(-1)}
          />
        </section>

        {error && <div className="form-status-message error">{error}</div>}

        <form className="change-contractor-form" onSubmit={handleSubmit}>
          <div className="add-policy-form narrow">
            <div className="form-group">
              <label>Ime i prezime</label>
              <input type="text" value={currentContractor.clientName} readOnly style={{ background: "#f0f1f5", cursor: "default" }} />
            </div>
            <div className="form-group">
              <label>OIB</label>
              <input type="text" value={currentContractor.clientOib} readOnly style={{ background: "#f0f1f5", cursor: "default" }} />
            </div>
          </div>

          <div className="change-contractor-divider">
            <span />
            <span aria-hidden="true">↺</span>
            <span />
          </div>

          <div className="add-policy-form narrow">
            <div className="form-group">
              <label htmlFor="change-oib">OIB</label>
              <input
                id="change-oib"
                type="text"
                value={oib}
                onChange={(e) =>
                  setOib(e.target.value.replace(/\D/g, "").slice(0, 11))
                }
                placeholder="11 znamenki"
                maxLength={11}
                inputMode="numeric"
              />
              {lookupStatus === "loading" && (
                <small>Provjera ugovaratelja...</small>
              )}
              {lookupStatus === "not-found" && (
                <small>Ugovaratelj nije pronađen, popunite sva polja.</small>
              )}
              {lookupStatus === "found" && !isCreatingNew && (
                <small>Odaberite ugovaratelja iz liste.</small>
              )}
            </div>

            <div className="form-group">
                <label htmlFor="change-client-name">Ugovaratelj</label>

                {lookupStatus === "found" && !isCreatingNew ? (
                  <div className={`select-wrap ${selectedClientId ? "has-value" : ""}`}>
                    <select
                      id="change-client-select"
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                      {clientOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                      <option value="__new__">Unesi novog ugovaratelja</option>
                    </select>
                    <img src="/svg/arrow-down.svg" alt="" className="select-arrow" aria-hidden="true" />
                  </div>
                ) : (
                  <div className={`client-select-field ${isCreatingNew ? "active" : ""}`}>
                    <input
                      id="change-client-name"
                      type="text"
                      value={newClient.clientName}
                      onChange={(e) => updateNewClient("clientName", e.target.value)}
                    />
                    {clientOptions.length > 0 && (
                      <button
                        type="button"
                        className="client-select-arrow-btn back-active"
                        onClick={() => setSelectedClientId(clientOptions[0].id)}
                        aria-label="Povratak na odabir ugovaratelja"
                        tabIndex={-1}
                      >
                        <img src="/svg/arrow-down.svg" alt="" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}
              </div>

            {isCreatingNew && (
              <>
                <div className="form-group">
                  <label htmlFor="change-email">Email adresa</label>
                  <input
                    id="change-email"
                    type="text"
                    value={newClient.email}
                    onChange={(e) => updateNewClient("email", e.target.value)}
                    placeholder="email@primjer.hr"
                  />
                </div>

                <div className="form-grid two">
                  <div className="form-group">
                    <label htmlFor="change-dob">Datum rođenja</label>
                    <input
                      id="change-dob"
                      type="text"
                      value={newClient.dob}
                      onChange={(e) => updateNewClient("dob", e.target.value)}
                      placeholder="DD.MM.YYYY"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="change-phone">Broj mobitela</label>
                    <input
                      id="change-phone"
                      type="text"
                      value={newClient.phoneNumber}
                      onChange={(e) => updateNewClient("phoneNumber", e.target.value)}
                      placeholder="097 787 70 51"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="submit-dark-btn"
              disabled={!canSubmit}
            >
              {saving ? "Izmjena..." : "Izmijeni ugovaratelja"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
