import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import PolicyBreadcrumbs from "../components/policies/PolicyBreadcrumbs";
import PolicyHeader from "../components/policies/PolicyHeader";
import ContractorDetailsForm from "../components/policies/ContractorDetailsForm";
import { fetchClientDetails, updateClient } from "../services/clientsService";
import "../styles/addPolicy.css";
import "../styles/updatePolicy.css";

function getValue(source, keys, fallback = "") {
  const key = keys.find((item) => source?.[item] !== undefined && source?.[item] !== null);
  return key ? source[key] : fallback;
}

function toDisplayDate(value) {
  if (!value) return "";
  if (/^\d{1,2}\.\d{1,2}\.\d{4}/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${date.getFullYear()}`;
}

function formatBirthDate(raw) {
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

function parseDateToIso(value) {
  if (!value) return null;
  const parts = value.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);
  if (!parts) return null;
  const [, day, month, year] = parts;
  return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00.000Z`).toISOString();
}

function buildFormValues(details = {}, fallback = {}) {
  return {
    oib: getValue(details, ["oib", "Oib", "OIB"], fallback.oib || ""),
    clientName: getValue(
      details,
      ["name", "Name", "clientName", "ClientName"],
      fallback.name || fallback.clientName || ""
    ),
    email: getValue(
      details,
      ["emailAddress", "EmailAddress", "clientEmailAddress", "ClientEmailAddress"],
      fallback.email || ""
    ),
    dob: toDisplayDate(getValue(details, ["dob", "Dob"], fallback.dob || fallback.birthDate || "")),
    phoneNumber: getValue(
      details,
      ["phoneNumber", "PhoneNumber"],
      fallback.phone || fallback.phoneNumber || ""
    ),
  };
}

export default function EditContractorPage() {
  const navigate = useNavigate();
  const { contractorId, policyNumber } = useParams();
  const { state } = useLocation();
  const sourcePolicy = state?.policy || {};
  const sourceContractor = state?.contractor || {};

  const clientId =
    contractorId ||
    sourceContractor.id ||
    sourcePolicy.clientId ||
    sourcePolicy.clientID ||
    "";

  const fallbackRef = useRef(null);
  if (fallbackRef.current === null) {
    fallbackRef.current = {
      oib: sourceContractor.oib || sourcePolicy.clientOib || sourcePolicy.oib || "",
      clientName: sourceContractor.name || sourcePolicy.clientName || sourcePolicy.ugovaratelj || "",
      phoneNumber: sourceContractor.phone || sourcePolicy.phoneNumber || sourcePolicy.telefon || "",
      dob: sourcePolicy.dob || sourceContractor.birthDate || "",
      email: sourceContractor.email || sourcePolicy.email || "",
    };
  }

  const [form, setForm] = useState(() => buildFormValues({}, fallbackRef.current));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const hasUserEdited = useRef(false);

  useEffect(() => {
    if (!clientId) return;

    let active = true;

    fetchClientDetails(clientId)
      .then((details) => {
        if (active && !hasUserEdited.current) {
          setForm(buildFormValues(details, fallbackRef.current));
        }
      })
      .catch(() => {});

    return () => { active = false; };
  }, [clientId]);

  const updateField = (name, value) => {
    hasUserEdited.current = true;
    setForm((prev) => ({
      ...prev,
      [name]: name === "dob" ? formatBirthDate(value) : value,
    }));
    setError("");
  };

  const canSubmit =
    Boolean(clientId) &&
    form.clientName.trim() &&
    form.oib.length === 11 &&
    !saving;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setError("");

    try {
      await updateClient({
        clientId,
        oib: form.oib.trim(),
        name: form.clientName.trim(),
        emailAddress: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        dob: parseDateToIso(form.dob),
      });

      try {
        sessionStorage.setItem(
          `freshContractor_${clientId}`,
          JSON.stringify({
            clientName: form.clientName.trim(),
            clientOib: form.oib.trim(),
            email: form.email.trim(),
            phoneNumber: form.phoneNumber.trim(),
          })
        );
      } catch {}
      navigate(-1);
    } catch (err) {
      setError(err.message || "Ne mogu ažurirati podatke ugovaratelja.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="change-contractor-page">
        <section className="change-contractor-top edit-contractor-top">
          <PolicyBreadcrumbs
            policyNumber={policyNumber || form.clientName || "Ugovaratelj"}
            currentLabel="Uredivanje ugovaratelja"
          />

          <PolicyHeader
            policyNumber="Uredivanje ugovaratelja"
            subtitle="Izmjene detalja ugovaratelja izvrsit ce se za sve police s kojima je klijent povezan"
            onBack={() => navigate(-1)}
          />
        </section>

        {error ? <div className="form-status-message error">{error}</div> : null}

        <ContractorDetailsForm
          values={form}
          onChange={updateField}
          onSubmit={handleSubmit}
          canSubmit={canSubmit}
          submitLabel={saving ? "Ažuriranje..." : "Ažuriraj ugovaratelja"}
          radioName="editPersonType"
          useNameInput
          className="edit-contractor-form"
        />
      </div>
    </AppShell>
  );
}
