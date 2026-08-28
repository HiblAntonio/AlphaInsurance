import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import PolicyBreadcrumbs from "../components/policies/PolicyBreadcrumbs";
import PolicyHeader from "../components/policies/PolicyHeader";
import CurrentPolicyPanel from "../components/policies/CurrentPolicyPanel";
import { extendPolicy, fetchActivePolicyOptions } from "../services/policiesService";
import "../styles/addPolicy.css";
import "../styles/extendPolicy.css";

const emptyOptions = { locations: [], insuranceCompanies: [], partners: [], insuranceTypes: [] };

const getOptionName = (item, keys) => {
  if (typeof item === "string") return item;
  const key = keys.find((k) => item?.[k]);
  return key ? item[key] : "";
};

const normalizeOptions = (items, keys) =>
  (items || [])
    .map((item) => ({
      id: item?.id || item?.Id || getOptionName(item, keys),
      name: getOptionName(item, keys),
    }))
    .filter((item) => item.name);


function toDisplayDate(value, addYears = 0) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (addYears) date.setFullYear(date.getFullYear() + addYears);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

function parsePremiumValue(value) {
  const num = parseFloat(String(value).replace(/[^\d,]/g, "").replace(",", "."));
  return Number.isFinite(num) ? String(num) : "";
}

function parseDateInput(value) {
  if (!value) return null;
  const parts = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);
  if (!parts) return null;
  const [, day, month, year] = parts;
  return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00.000Z`).toISOString();
}

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

export default function ExtendPolicyPage() {
  const navigate = useNavigate();
  const { policyNumber } = useParams();
  const { state } = useLocation();

  const sourcePolicy = state?.policy || {};

  const currentPolicy = useMemo(
    () => ({
      policyNumber:
        sourcePolicy.policyNumber || sourcePolicy.id || policyNumber || "-",
      clientId: sourcePolicy.clientId || sourcePolicy.ClientId || null,
      clientName:
        sourcePolicy.clientName || sourcePolicy.ugovaratelj || "",
      clientOib:
        sourcePolicy.clientOib || sourcePolicy.oib || "",
      startDate: toDisplayDate(
        sourcePolicy.startingDate ||
          sourcePolicy.startDate ||
          sourcePolicy.dateCreated
      ),
      location:
        sourcePolicy.location || sourcePolicy.prodajnoMjesto || "",
      insuranceCompany:
        sourcePolicy.insuranceCompany ||
        sourcePolicy.osiguravajucaKuca ||
        "",
      insuranceType:
        sourcePolicy.insuranceType || sourcePolicy.vrstaOsiguranja || "",
      premium: parsePremiumValue(sourcePolicy.premium || sourcePolicy.premija || ""),
      partner: sourcePolicy.partner || "",
      remark: sourcePolicy.remark || "",
    }),
    [policyNumber, sourcePolicy]
  );

  const [policyOptions, setPolicyOptions] = useState(emptyOptions);

  useEffect(() => {
    let isActive = true;
    fetchActivePolicyOptions()
      .then((options) => {
        if (!isActive) return;
        setPolicyOptions({
          locations: normalizeOptions(options.locations, ["name", "Name"]),
          insuranceCompanies: normalizeOptions(options.insuranceCompanies, ["name", "Name"]),
          partners: normalizeOptions(options.partners, ["name", "Name"]),
          insuranceTypes: normalizeOptions(options.insuranceTypes, ["type", "Type", "name", "Name"]),
        });
      })
      .catch(() => {});
    return () => { isActive = false; };
  }, []);

  const [form, setForm] = useState({
    oib: currentPolicy.clientOib,
    policyNumber: currentPolicy.policyNumber,
    startDate: toDisplayDate(
      sourcePolicy.startingDate ||
        sourcePolicy.startDate ||
        sourcePolicy.dateCreated,
      1
    ),
    location: currentPolicy.location,
    insuranceCompany: currentPolicy.insuranceCompany,
    partner: currentPolicy.partner,
    noPartner: false,
    insuranceType: currentPolicy.insuranceType,
    premium: currentPolicy.premium,
    remark: currentPolicy.remark,
  });

  const updateField = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: name === "startDate" ? formatBirthDate(value) : value,
      ...(name === "noPartner" && value ? { partner: "Nema partnera" } : {}),
    }));
  };

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    !saving &&
    (currentPolicy.clientId || form.oib.trim()) &&
    form.policyNumber.trim() &&
    form.startDate.trim() &&
    form.location.trim() &&
    form.insuranceType.trim() &&
    form.premium.toString().trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError("");

    try {
      await extendPolicy(currentPolicy.clientId, {
        policyNumber: form.policyNumber.trim(),
        price: parseFloat(form.premium),
        startingDate: parseDateInput(form.startDate),
        insuranceCompany: form.insuranceCompany,
        insuranceType: form.insuranceType,
        location: form.location,
        partner: form.partner || "",
        remark: form.remark || null,
        previousPolicyNumber: currentPolicy.policyNumber,
      });

      navigate(-1);
    } catch (err) {
      setError(err.message || "Greška pri produživanju police.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="extend-policy-page">
        <section className="extend-policy-top">
          <PolicyBreadcrumbs currentLabel="Produživanje police osiguranja" />

          <PolicyHeader
            policyNumber="Produživanje police osiguranja"
            subtitle="Produživanje odabrane police osiguranja"
            onBack={() => navigate(-1)}
          />
        </section>

        <div className="extend-policy-layout">
          <CurrentPolicyPanel policy={currentPolicy} />

          <form onSubmit={handleSubmit} className="extend-policy-form-shell">
            {error && <div className="form-status-message error" style={{ margin: "0 0 16px 0" }}>{error}</div>}
            <section className="add-policy-step-content add-policy-policy-step extend-policy-form">
              <div className="add-policy-form narrow extend-policy-form-inner">
                {!currentPolicy.clientOib && (
                  <div className="form-group">
                    <label htmlFor="extend-oib">OIB</label>
                    <input
                      id="extend-oib"
                      type="text"
                      value={form.oib}
                      onChange={(e) => updateField("oib", e.target.value)}
                      placeholder="12345678910"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="extend-policy-number">Broj police</label>
                  <input
                    id="extend-policy-number"
                    type="text"
                    value={form.policyNumber}
                    onChange={(e) => updateField("policyNumber", e.target.value)}
                    placeholder="06202602856725"
                  />
                </div>

                <div className="form-grid two">
                  <div className="form-group">
                    <label htmlFor="extend-start-date">Datum početka osiguranja</label>
                    <input
                      id="extend-start-date"
                      type="text"
                      value={form.startDate}
                      onChange={(e) => updateField("startDate", e.target.value)}
                      placeholder="12.10.2026."
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="extend-location">Prodajno mjesto</label>
                    <div className={`select-wrap ${form.location ? "has-value" : ""}`}>
                      <select
                        id="extend-location"
                        value={form.location}
                        onChange={(e) => updateField("location", e.target.value)}
                      >
                        <option value="">Prodajno mjesto</option>
                        {policyOptions.locations.map((l) => (
                          <option key={l.id || l.name} value={l.name}>{l.name}</option>
                        ))}
                      </select>
                      <img src="/svg/arrow-down.svg" alt="" className="select-arrow" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="extend-company">Osiguravajuća kuća</label>
                    <div className={`select-wrap ${form.insuranceCompany ? "has-value" : ""}`}>
                      <select
                        id="extend-company"
                        value={form.insuranceCompany}
                        onChange={(e) => updateField("insuranceCompany", e.target.value)}
                      >
                        <option value="">Osiguravajuća kuća</option>
                        {policyOptions.insuranceCompanies.map((c) => (
                          <option key={c.id || c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <img src="/svg/arrow-down.svg" alt="" className="select-arrow" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="extend-partner">Partner</label>
                    <div className={`select-wrap ${form.partner ? "has-value" : ""}`}>
                      <select
                        id="extend-partner"
                        value={form.partner}
                        onChange={(e) => updateField("partner", e.target.value)}
                        disabled={form.noPartner}
                      >
                        <option value="">Odaberi partnera</option>
                        {policyOptions.partners.map((p) => (
                          <option key={p.id || p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                      <img src="/svg/arrow-down.svg" alt="" className="select-arrow" aria-hidden="true" />
                    </div>
                    <label className="checkbox-inline">
                      <input
                        type="checkbox"
                        checked={form.noPartner}
                        onChange={(e) => updateField("noPartner", e.target.checked)}
                      />
                      <span>Bez partnera</span>
                    </label>
                  </div>

                  <div className="form-group">
                    <label htmlFor="extend-type">Vrsta osiguranja</label>
                    <div className={`select-wrap ${form.insuranceType ? "has-value" : ""}`}>
                      <select
                        id="extend-type"
                        value={form.insuranceType}
                        onChange={(e) => updateField("insuranceType", e.target.value)}
                      >
                        <option value="">Odaberi</option>
                        {policyOptions.insuranceTypes.map((t) => (
                          <option key={t.id || t.name} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                      <img src="/svg/arrow-down.svg" alt="" className="select-arrow" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="extend-premium">Premija</label>
                    <div className="input-with-suffix">
                      <input
                        id="extend-premium"
                        type="number"
                        value={form.premium}
                        onChange={(e) => updateField("premium", e.target.value)}
                        placeholder="375.42"
                      />
                      <span>€</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="extend-remark">Napomena</label>
                  <textarea
                    id="extend-remark"
                    rows="5"
                    value={form.remark}
                    onChange={(e) => updateField("remark", e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="submit-dark-btn"
                  disabled={!canSubmit}
                >
                  {saving ? "Produživanje..." : "Produži policu osiguranja"}
                </button>
              </div>
            </section>
          </form>
        </div>
      </div>
    </AppShell>
  );
}