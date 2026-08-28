import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import AddPolicySteps from "../components/policies/AddPolicySteps";
import AddPolicyClientStep from "../components/policies/AddPolicyClientStep";
import AddPolicyPolicyStep from "../components/policies/AddPolicyPolicyStep";
import { fetchClientsByOib } from "../services/clientsService";
import {
  createPolicy,
  fetchActivePolicyOptions,
} from "../services/policiesService";
import "../styles/addPolicy.css";

const initialForm = {
  oib: "",
  clientId: "",
  isNewClient: false,
  clientName: "",
  email: "",
  birthDate: "",
  phoneNumber: "",

  policyNumber: "",
  startDate: "",
  location: "",
  insuranceCompany: "",
  partner: "",
  noPartner: false,
  insuranceType: "",
  premium: "",
  remark: "",
};

const emptyPolicyOptions = {
  locations: [],
  insuranceCompanies: [],
  partners: [],
  insuranceTypes: [],
};

const getOptionName = (item, keys) => {
  if (typeof item === "string") return item;
  const key = keys.find((candidate) => item?.[candidate]);
  return key ? item[key] : "";
};

const normalizeOptions = (items, keys) =>
  (items || [])
    .map((item) => ({
      id: item?.id || item?.Id || getOptionName(item, keys),
      name: getOptionName(item, keys),
    }))
    .filter((item) => item.name);

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

const getBirthDateError = (dateStr) => {
  if (!dateStr || dateStr.length < 10) return "";
  const yearNum = parseInt(dateStr.slice(0, 4), 10);
  if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2026)
    return "Datum mora biti između 1900. i 2026. godine.";
  return "";
};

const parseDateInput = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const hrDateMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})\.?$/);
  let isoDate;

  if (hrDateMatch) {
    const [, day, month, year] = hrDateMatch;
    const yearNum = parseInt(year, 10);
    if (yearNum < 1900 || yearNum > 2026) return null;
    isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  } else {
    isoDate = trimmed;
  }

  const date = new Date(isoDate);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString();
  }

  return trimmed;
};

const getTodayDisplayDate = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}.${today.getFullYear()}`;
};

export default function AddPolicyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => ({
    ...initialForm,
    startDate: getTodayDisplayDate(),
  }));
  const [clientOptions, setClientOptions] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientLookupMessage, setClientLookupMessage] = useState("");
  const [clientFieldsOpen, setClientFieldsOpen] = useState(false);
  const [policyOptions, setPolicyOptions] = useState(emptyPolicyOptions);
  const [policyOptionsMessage, setPolicyOptionsMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const birthDateError = form.isNewClient ? getBirthDateError(form.birthDate) : "";

  const canGoNext =
    form.oib.trim().length === 11 &&
    form.clientName.trim().length > 0 &&
    (!form.isNewClient || (
      form.birthDate.trim().length === 10 &&
      !birthDateError &&
      form.phoneNumber.trim().length > 0
    ));

  const canSubmit =
    form.policyNumber.trim().length > 0 &&
    form.startDate.trim().length > 0 &&
    form.location.trim().length > 0 &&
    form.insuranceCompany.trim().length > 0 &&
    form.insuranceType.trim().length > 0 &&
    String(form.premium).trim().length > 0 &&
    Number.isFinite(Number(form.premium));

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
        setPolicyOptionsMessage("");
      })
      .catch((error) => {
        if (!isActive) return;
        setPolicyOptions(emptyPolicyOptions);
        setPolicyOptionsMessage(error.message);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const sanitizePremium = (value) => {
    const normalized = String(value)
      .replace(",", ".")
      .replace(/[^0-9.]/g, "");
    const [whole, ...decimalParts] = normalized.split(".");
    const decimals = decimalParts.join("").slice(0, 2);

    return decimalParts.length ? `${whole}.${decimals}` : whole;
  };

  const formatPremium = () => {
    setForm((prev) => {
      const premium = Number(prev.premium);
      if (!String(prev.premium).trim() || !Number.isFinite(premium)) {
        return { ...prev, premium: "" };
      }

      return {
        ...prev,
        premium: premium.toFixed(2),
      };
    });
  };

  useEffect(() => {
    const oib = form.oib.trim();
    let isActive = true;

    if (oib.length !== 11) {
      setClientOptions([]);
      setClientLookupMessage("");
      return;
    }

    const timeout = setTimeout(async () => {
      setClientsLoading(true);
      setClientLookupMessage("");

      try {
        const clients = await fetchClientsByOib(oib);
        const normalizedClients = clients.map((client) => ({
          id: client.id || client.Id,
          oib: client.oib || client.OIB || client.Oib || oib,
          name: client.name || client.Name || "",
        }));

        if (!isActive) return;

        setClientOptions(normalizedClients);

        if (normalizedClients.length === 0) {
          setClientLookupMessage("Ugovaratelj nije pronađen, popunite sva polja.");
          setClientFieldsOpen(true);
          setForm((prev) => ({
            ...prev,
            clientId: "",
            isNewClient: true,
          }));
          return;
        }

        setClientLookupMessage("Odaberite ugovaratelja iz liste.");
        setClientFieldsOpen(false);
        setForm((prev) => {
          const existingSelection = normalizedClients.find(
            (client) => client.id === prev.clientId
          );
          const selectedClient = existingSelection || normalizedClients[0];

          return {
            ...prev,
            clientId: selectedClient.id,
            clientName: selectedClient.name,
            isNewClient: false,
          };
        });
      } catch (err) {
        if (!isActive) return;

        setClientOptions([]);
        setClientLookupMessage(err.message);
      } finally {
        if (isActive) {
          setClientsLoading(false);
        }
      }
    }, 350);

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [form.oib]);

  const updateField = (name, value) => {
    const nextValue =
      name === "oib"
        ? String(value).replace(/\D/g, "").slice(0, 11)
        : name === "clientName"
        ? String(value).toUpperCase()
        : name === "startDate"
        ? formatBirthDate(value)
        : name === "phoneNumber"
        ? String(value).replace(/[^\d+]/g, "")
        : value;

    const opensClientFields = name === "clientName" || name === "email" || name === "birthDate" || name === "phoneNumber";
    
    setForm((prev) => ({
      ...prev,
      [name]: name === "premium" ? sanitizePremium(nextValue) : nextValue,
      ...(name === "oib"
        ? { clientId: "", clientName: "", isNewClient: false }
        : {}),
      ...(name === "noPartner" && nextValue ? { partner: "" } : {}),
      ...(opensClientFields ? { clientId: "", isNewClient: true } : {}),
    }));

    if (opensClientFields) setClientFieldsOpen(true);
  };

  const handleBackToClientSelect = () => {
    const first = clientOptions[0];
    if (!first) return;
    setForm((prev) => ({
      ...prev,
      clientId: first.id,
      clientName: first.name,
      isNewClient: false,
    }));
    setClientFieldsOpen(false);
  };

  const selectClient = (clientId) => {
    if (clientId === "__new__") {
      setForm((prev) => ({
        ...prev,
        clientId: "",
        clientName: "",
        birthDate: "",
        email: "",
        phoneNumber: "",
        isNewClient: true,
      }));
      setClientFieldsOpen(true);
      return;
    }

    const selectedClient = clientOptions.find((client) => client.id === clientId);

    if (!selectedClient) return;

    setForm((prev) => ({
      ...prev,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      isNewClient: false,
    }));
    setClientFieldsOpen(false);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      return;
    }

    navigate("/dashboard");
  };

  const handleNext = () => {
    if (!canGoNext) return;
    setStep(2);
  };

  const handleStepChange = (nextStep) => {
    if (nextStep === 1) {
      setStep(1);
      return;
    }

    if (nextStep === 2 && canGoNext) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitMessage("");

    const request = {
      client: {
        isNew: form.isNewClient || !form.clientId,
        clientId: form.clientId || "00000000-0000-0000-0000-000000000000",
        oib: form.oib.trim(),
        name: form.clientName.trim(),
        emailAddress: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        dob: form.birthDate.trim() ? parseDateInput(form.birthDate) : null,
      },
      policy: {
        policyNumber: form.policyNumber.trim(),
        price: Number(form.premium),
        remark: form.remark.trim(),
        startingDate: form.startDate.trim() ? parseDateInput(form.startDate) : null,
        insuranceCompany: form.insuranceCompany,
        insuranceType: form.insuranceType,
        location: form.location,
        partner: form.noPartner ? "Nema partnera" : form.partner,
        previousPolicyNumber: "",
      },
    };

    try {
      await createPolicy(request);
      navigate("/dashboard", {
        state: { message: "Polica osiguranja je uspjesno dodana." },
      });
    } catch (error) {
      setSubmitMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="main-panel add-policy-page">
        <div className="add-policy-shell">
          <AddPolicySteps
            currentStep={step}
            onStepChange={handleStepChange}
            stepTwoUnlocked={canGoNext}
          />

          <div className="add-policy-right">
            <div className="add-policy-top">
              <div className="add-policy-breadcrumbs">
                <div className="add-policy-brand-badge">
                  <img src="/images/Alpha logo frame.png" alt="Alpha logo" />
                </div>

                <span>Alpha</span>
                <span className="breadcrumb-separator">›</span>
                <span>Police osiguranja</span>
                <span className="breadcrumb-separator">›</span>
                <strong>Dodavanje police osiguranja</strong>
              </div>

              <div className="add-policy-title-row">
                <button
                  type="button"
                  className="add-policy-back-btn"
                  onClick={handleBack}
                  aria-label={step === 2 ? "Povratak na prvi korak" : "Povratak na dashboard"}
                >
                  <img src="/svg/arrow-left.svg" alt="" />
                </button>

                <div className="add-policy-title-wrap">
                  <h1>Dodavanje police osiguranja</h1>
                  <p>
                    Podatci o ugovaratelju će se automatski popuniti nakon unosa OIB-a
                  </p>
                </div>
              </div>
            </div>

            <div className="add-policy-content" style={{ paddingTop: step === 1 ? "260px" : "189px" }}>
              <form onSubmit={handleSubmit} className="add-policy-form-shell">
                {step === 1 ? (
                  <AddPolicyClientStep
                    values={form}
                    onChange={updateField}
                    onClientSelect={selectClient}
                    onNext={handleNext}
                    canGoNext={canGoNext}
                    clientOptions={clientOptions}
                    clientsLoading={clientsLoading}
                    clientLookupMessage={clientLookupMessage}
                    clientFieldsOpen={clientFieldsOpen}
                    onOpenClientFields={() => setClientFieldsOpen(true)}
                    onBackToClientSelect={handleBackToClientSelect}
                    birthDateError={birthDateError}
                  />
                ) : (
                  <AddPolicyPolicyStep
                    values={form}
                    onChange={updateField}
                    onPremiumBlur={formatPremium}
                    canSubmit={canSubmit}
                    options={policyOptions}
                    isSubmitting={isSubmitting}
                  />
                )}
                {(policyOptionsMessage || submitMessage) && (
                  <p className="add-policy-form-message">
                    {submitMessage || policyOptionsMessage}
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
