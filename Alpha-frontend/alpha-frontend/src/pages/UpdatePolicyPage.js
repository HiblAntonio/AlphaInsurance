import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import PolicyBreadcrumbs from "../components/policies/PolicyBreadcrumbs";
import PolicyHeader from "../components/policies/PolicyHeader";
import AddPolicyPolicyStep from "../components/policies/AddPolicyPolicyStep";
import { fetchPolicyDetailsById, fetchActivePolicyOptions, updatePolicy } from "../services/policiesService";
import "../styles/addPolicy.css";
import "../styles/updatePolicy.css";

function isDateOlderThanDays(value, days) {
  if (!value || value === "-") return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return Date.now() - date.getTime() > days * 24 * 60 * 60 * 1000;
}

function formatDateInput(raw) {
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
}

function isPolicyBlocked(policy) {
  const isRenewed = Boolean(
    policy?.isRenewed ?? policy?.ISRenewed ?? policy?.iSRenewed ?? false
  );
  const dateCreated = policy?.dateCreated ?? policy?.DateCreated;
  return isRenewed && isDateOlderThanDays(dateCreated, 7);
}

const emptyOptions = { locations: [], insuranceCompanies: [], partners: [], insuranceTypes: [] };

let optionsCache = null;

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

function toDisplayDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
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

function ContractorCard({ policy, onEditContractor, onChangeContractor }) {
  return (
    <aside className="update-policy-contractor">
      <h3>Podatci o ugovaratelju</h3>

      <div className="update-contractor-card">
        <span className="current-policy-label">Ugovaratelj</span>
        <div className="current-policy-copy">
          <strong className="link">{policy.clientName}</strong>
          <span>{policy.clientOib}</span>
        </div>

        <div className="update-contractor-actions">
          <button
            type="button"
            className="update-contractor-btn"
            onClick={onEditContractor}
          >
            Uredi
          </button>
          <button
            type="button"
            className="update-contractor-btn dark"
            onClick={onChangeContractor}
          >
            Izmjeni
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function UpdatePolicyPage() {
  const navigate = useNavigate();
  const { policyNumber } = useParams();
  const location = useLocation();
  const locationKey = location.key;
  const sourcePolicy = location.state?.policy || {};

  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    // Fast path: state already has the needed fields
    if (sourcePolicy.isRenewed !== undefined || sourcePolicy.ISRenewed !== undefined) {
      if (isPolicyBlocked(sourcePolicy)) {
        navigate(`/police/${policyNumber}`, { replace: true });
        return;
      }
      setAccessChecked(true);
      return;
    }
    // Slow path: direct URL access — verify from API
    fetchPolicyDetailsById(policyNumber)
      .then((policy) => {
        if (isPolicyBlocked(policy)) {
          navigate(`/police/${policyNumber}`, { replace: true });
        } else {
          setAccessChecked(true);
        }
      })
      .catch(() => setAccessChecked(true)); // fail open
  }, [policyNumber]);

  const currentPolicy = useMemo(
    () => ({
      policyId: sourcePolicy.id || policyNumber || null,
      policyNumber:
        sourcePolicy.policyNumber || sourcePolicy.id || policyNumber || "",
      clientId: sourcePolicy.clientId || sourcePolicy.ClientId || null,
      clientName:
        sourcePolicy.clientName || sourcePolicy.ugovaratelj || "",
      clientOib:
        sourcePolicy.clientOib || sourcePolicy.oib || "",
      phoneNumber:
        sourcePolicy.phoneNumber || sourcePolicy.telefon || "",
      email: sourcePolicy.email || "",
      dob: toDisplayDate(sourcePolicy.dob || sourcePolicy.birthDate),
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

  const sessionKey = `updatePolicyForm_${policyNumber}`;

  const [form, setForm] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(sessionKey) || "null");
      if (saved?.locationKey === locationKey) return saved.form;
    } catch {}
    return {
      policyNumber: currentPolicy.policyNumber,
      startDate: currentPolicy.startDate,
      location: currentPolicy.location,
      insuranceCompany: currentPolicy.insuranceCompany,
      partner: currentPolicy.partner,
      noPartner: false,
      insuranceType: currentPolicy.insuranceType,
      premium: currentPolicy.premium,
      remark: currentPolicy.remark,
    };
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify({ locationKey, form }));
    } catch {}
  }, [form, sessionKey, locationKey]);

  const [policyOptions, setPolicyOptions] = useState(() => optionsCache || emptyOptions);

  useEffect(() => {
    if (optionsCache) return;
    let isActive = true;
    fetchActivePolicyOptions()
      .then((options) => {
        if (!isActive) return;
        const normalized = {
          locations: normalizeOptions(options.locations, ["name", "Name"]),
          insuranceCompanies: normalizeOptions(options.insuranceCompanies, ["name", "Name"]),
          partners: normalizeOptions(options.partners, ["name", "Name"]),
          insuranceTypes: normalizeOptions(options.insuranceTypes, ["type", "Type", "name", "Name"]),
        };
        optionsCache = normalized;
        setPolicyOptions(normalized);
      })
      .catch(() => {});
    return () => { isActive = false; };
  }, []);

  const updateField = (name, value) => {
    const nextValue = name === "startDate" ? formatDateInput(value) : value;
    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
      ...(name === "noPartner" && value ? { partner: "Nema partnera" } : {}),
    }));
  };

  const [contractorOverride, setContractorOverride] = useState(null);

  useEffect(() => {
    if (!currentPolicy.clientId) return;
    const key = `freshContractor_${currentPolicy.clientId}`;
    try {
      const fresh = JSON.parse(sessionStorage.getItem(key) || "null");
      if (fresh) {
        setContractorOverride(fresh);
        sessionStorage.removeItem(key);
      }
    } catch {}
  }, [currentPolicy.clientId]);

  const displayPolicy = contractorOverride
    ? { ...currentPolicy, ...contractorOverride }
    : currentPolicy;

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const canSubmit =
    !saving &&
    form.policyNumber.trim() &&
    form.startDate.trim() &&
    form.location.trim() &&
    form.insuranceCompany.trim() &&
    form.insuranceType.trim() &&
    String(form.premium).trim();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || !currentPolicy.policyId) return;

    setSaving(true);
    setSaveError("");

    try {
      await updatePolicy(currentPolicy.policyId, {
        policyNumber: form.policyNumber.trim(),
        price: parseFloat(form.premium),
        startingDate: parseDateInput(form.startDate),
        insuranceCompany: form.insuranceCompany,
        insuranceType: form.insuranceType,
        location: form.location,
        partner: form.partner || "",
        remark: form.remark,
      });

      try { sessionStorage.removeItem(sessionKey); } catch {}
      navigate(-1);
    } catch (err) {
      setSaveError(err.message || "Greška pri ažuriranju police.");
    } finally {
      setSaving(false);
    }
  };

  if (!accessChecked) return null;

  return (
    <AppShell>
      <div className="update-policy-page">
        <section className="update-policy-top">
          <PolicyBreadcrumbs
            policyNumber={currentPolicy.policyNumber}
            currentLabel="Ažuriranje police osiguranja"
          />

          <PolicyHeader
            policyNumber="Ažuriranje police osiguranja"
            subtitle="Promjene podataka o polici osiguranja će biti zabilježene u sustavu"
            onBack={() => navigate(-1)}
          />
        </section>

        <div className="update-policy-layout">
          <ContractorCard
            policy={displayPolicy}
            onEditContractor={() =>
              navigate(`/police/${currentPolicy.policyNumber}/ugovaratelj/uredi`, {
                state: { policy: displayPolicy },
              })
            }
            onChangeContractor={() =>
              navigate(`/police/${currentPolicy.policyNumber}/ugovaratelj`, {
                state: { policy: displayPolicy },
              })
            }
          />

          <form onSubmit={handleSubmit} className="update-policy-form-shell">
            {saveError && <p className="form-status-message error">{saveError}</p>}
            <AddPolicyPolicyStep
              values={form}
              onChange={updateField}
              canSubmit={canSubmit}
              options={policyOptions}
              submitLabel={saving ? "Ažuriranje..." : "Ažuriraj policu osiguranja"}
            />
          </form>
        </div>
      </div>
    </AppShell>
  );
}
