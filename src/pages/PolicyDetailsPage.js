import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import PolicyBreadcrumbs from "../components/policies/PolicyBreadcrumbs";
import PolicyHeader from "../components/policies/PolicyHeader";
import ClientInfoCard from "../components/policies/ClientInfoCard";
import PolicyInfoCard from "../components/policies/PolicyInfoCard";
import PreviousPoliciesSection from "../components/policies/PreviousPoliciesSection";
import { deletePolicy, fetchPolicyDetailsById } from "../services/policiesService";
import "../styles/policyDetails.css";

function formatDate(value) {
  if (!value || value === "-") return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("hr-HR");
}

function formatDateTime(value) {
  if (!value || value === "-") return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("hr-HR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function isDateOlderThanDays(value, days) {
  if (!value || value === "-") return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const ageInMs = Date.now() - date.getTime();
  return ageInMs > days * 24 * 60 * 60 * 1000;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function getValue(source, keys, fallback = "") {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key];
    }
  }

  return fallback;
}

function normalizeRelatedPolicy(policy) {
  return {
    policyNumber: getValue(policy, ["policyNumber", "PolicyNumber"], "-"),
    clientName: getValue(policy, ["clientName", "ClientName"], "-"),
    companyName: getValue(policy, ["companyName", "CompanyName"], "-"),
    policyType: getValue(policy, ["policyType", "PolicyType"], "-"),
    price: getValue(policy, ["price", "Price"], 0),
    locationName: getValue(policy, ["locationName", "LocationName"], "-"),
    previousPolicyNumber: getValue(policy, ["previousPolicyNumber", "PreviousPolicyNumber"], ""),
    startingDate: getValue(policy, ["startingDate", "StartingDate"], ""),
    dateCreated: getValue(policy, ["dateCreated", "DateCreated"], ""),
  };
}

function normalizePolicyDetails(policy, fallbackPolicy = {}) {
  const relatedPolicies = getValue(policy, ["relatedPolicies", "RelatedPolicies"], []);
  const isRenewed = Boolean(getValue(policy, ["isRenewed", "iSRenewed", "isRenewed", "ISRenewed"], fallbackPolicy.isRenewed ?? false));
  const startingDate = getValue(policy, ["startingDate", "StartingDate"], fallbackPolicy.startingDate || null);
  const dateCreated = getValue(policy, ["dateCreated", "DateCreated"], fallbackPolicy.dateCreated || null);
  const status = isRenewed
    ? "Produženo"
    : getValue(policy, ["status", "Status"], fallbackPolicy.status || "Aktivno");

  return {
    id: fallbackPolicy?.id || getValue(policy, ["id", "Id"], null),
    status,
    policyNumber: getValue(policy, ["policyNumber", "PolicyNumber"], fallbackPolicy.policyNumber || "-"),
    clientName: getValue(policy, ["userName", "UserName"], fallbackPolicy.clientName || "-"),
    clientOib: getValue(policy, ["oib", "Oib", "OIB"], fallbackPolicy.clientOib || "-"),
    phoneNumber: getValue(policy, ["phoneNumber", "PhoneNumber"], fallbackPolicy.phoneNumber || "-"),
    email: getValue(policy, ["mailAddress", "MailAddress", "email"], fallbackPolicy.email || "-"),
    dob: getValue(policy, ["dateOfBirth", "DateOfBirth", "dob"], fallbackPolicy.dob || null),
    startingDate,
    dateCreated,
    insuranceCompany: getValue(policy, ["insuranceCompany", "InsuranceCompany"], fallbackPolicy.insuranceCompany || "-"),
    insuranceType: getValue(policy, ["policyType", "PolicyType", "insuranceType"], fallbackPolicy.insuranceType || "-"),
    premium: formatCurrency(getValue(policy, ["price", "Price"], fallbackPolicy.price || 0)),
    location: getValue(policy, ["location", "Location"], fallbackPolicy.location || "-"),
    partner: getValue(policy, ["partner", "Partner"], fallbackPolicy.partner || ""),
    remark: getValue(policy, ["remark", "Remark"], fallbackPolicy.remark || ""),
    clientId: getValue(policy, ["clientId", "ClientId"], fallbackPolicy.clientId || null),
    createdByName: getValue(policy, ["createdByName", "CreatedByName"], fallbackPolicy.createdByName || null),
    isRenewed,
    previousPolicy: getValue(policy, ["previousPolicyNumber", "PreviousPolicyNumber"], fallbackPolicy.previousPolicyNumber || ""),
    previousPolicies: Array.isArray(relatedPolicies)
      ? relatedPolicies.map(normalizeRelatedPolicy)
      : [],
  };
}

const deleteReasonOptions = ["Storno", "Krivo produženo", "Ostalo"];

function DeletePolicyModal({
  policyNumber,
  selectedReason,
  deleteNote,
  isDeleting,
  error,
  onReasonChange,
  onNoteChange,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="delete-policy-overlay" role="presentation">
      <section
        className="delete-policy-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-policy-title"
      >
        <div className="delete-policy-icon-wrap" aria-hidden="true">
          <div className="delete-policy-icon">
            <img src="/svg/trash.svg" alt="" />
          </div>
        </div>

        <div className="delete-policy-copy">
          <h2 id="delete-policy-title">
            Obriši policu osiguranja {policyNumber}?
          </h2>
          <p>Policu osiguranja moguće je vratiti unutar 30 dana od brisanja.</p>
        </div>

        <div className="delete-policy-reasons" role="group" aria-label="Razlog brisanja">
          {deleteReasonOptions.map((reason) => (
            <button
              key={reason}
              type="button"
              className={selectedReason === reason ? "active" : ""}
              onClick={() => onReasonChange(reason)}
            >
              {reason}
            </button>
          ))}
        </div>

        <textarea
          className="delete-policy-note"
          value={deleteNote}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder={selectedReason === "Ostalo" ? "Opis... (obavezno)" : "Opis... (opcionalno)"}
          rows="5"
        />

        {error ? <p className="delete-policy-error">{error}</p> : null}

        <div className="delete-policy-actions">
          <button
            type="button"
            className="delete-policy-cancel"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Odustani
          </button>
          <button
            type="button"
            className="delete-policy-confirm"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Brisanje..." : "Obriši policu"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function PolicyDetailsPage() {
  const { policyNumber: policyId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const fallbackPolicy = state?.policy;
  const [details, setDetails] = useState(() =>
    fallbackPolicy
      ? { ...normalizePolicyDetails(fallbackPolicy, fallbackPolicy), id: fallbackPolicy.id || policyId }
      : null
  );
  const [loading, setLoading] = useState(Boolean(policyId));
  const [error, setError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("Ostalo");
  const [deleteNote, setDeleteNote] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!policyId) return;

    let isActive = true;
    setLoading(true);
    setError("");

    fetchPolicyDetailsById(policyId)
      .then((policy) => {
        if (!isActive) return;
        setDetails({
          ...normalizePolicyDetails(policy, fallbackPolicy),
          id: fallbackPolicy?.id || policyId,
        });
      })
      .catch(() => {
        if (!isActive) return;
        setError("Ne mogu dohvatiti detalje police. Provjeri backend i pokušaj ponovno.");
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [policyId, fallbackPolicy]);

  const goBack = () => {
    navigate(state?.returnTo || "/dashboard", {
      state: {
        pageNumber: state?.dashboardPageNumber || 1,
        searchInput: state?.dashboardSearch || "",
        year: state?.dashboardYear,
      },
      replace: true,
    });
  };

  const openDeleteModal = () => {
    setDeleteError("");
    setDeleteReason("Ostalo");
    setDeleteNote("");
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteModalOpen(false);
  };

  const handleDeletePolicy = async () => {
    if (!details?.id || isDeleting) return;

    if (deleteReason === "Ostalo" && !deleteNote.trim()) {
      setDeleteError("Opis je obavezan kada je odabrano 'Ostalo'.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await deletePolicy(details.id, deleteReason, deleteNote);
      navigate("/dashboard", {
        state: { message: "Polica osiguranja je obrisana." },
      });
    } catch (deleteRequestError) {
      setDeleteError(deleteRequestError.message || "Ne mogu obrisati policu.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && !details) {
    return (
      <AppShell>
        <div className="policy-details-page">
          <div className="policy-details-empty">
            <h1>Učitavanje detalja police...</h1>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error && !details) {
    return (
      <AppShell>
        <div className="policy-details-page">
          <div className="policy-details-empty">
            <h1>Detalji police nisu dostupni</h1>
            <p>{error}</p>
            <button
              type="button"
              className="details-action primary"
              onClick={goBack}
            >
              Povratak na dashboard
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!details) {
    return (
      <AppShell>
        <div className="policy-details-page">
          <div className="policy-details-empty">
            <h1>Detalji police nisu dostupni</h1>
            <p>Otvori detalje klikom iz tablice na dashboardu.</p>
            <button
              type="button"
              className="details-action primary"
              onClick={() => navigate("/dashboard")}
            >
              Povratak na dashboard
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const showRenewedNotice =
    details.isRenewed && isDateOlderThanDays(details.dateCreated, 7);

  return (
    <AppShell>
      <div className="policy-details-page">
        <section className="details-hero">
          <div className="details-hero-left">
            <PolicyBreadcrumbs currentLabel="Detalji police osiguranja" />

            <PolicyHeader
              status={details.status}
              policyNumber={details.policyNumber}
              subtitle="Pregled detalja odabrane police osiguranja"
              onBack={goBack}
            />
          </div>

          <div className="details-actions">
            {!showRenewedNotice && (
              <button
                type="button"
                className="details-action secondary"
                onClick={() =>
                  navigate(`/police/${details.id}/uredi`, {
                    state: { policy: details },
                  })
                }
              >
                <img src="/svg/pencilSimple.svg" alt="" />
                Uredi policu
              </button>
            )}

            {!details.isRenewed && (
              <button
                type="button"
                className="details-action dark"
                onClick={() =>
                  navigate(`/police/${details.id}/produzi`, {
                    state: { policy: details },
                  })
                }
              >
                <img src="/svg/arrowClockwise.svg" alt="" />
                Produži policu
              </button>
            )}

            <button
              type="button"
              className="details-action danger"
              onClick={openDeleteModal}
              aria-label="Obriši policu"
            >
              <img src="/svg/trash-simple.svg" alt="" />
            </button>
          </div>
        </section>

        <div className="details-content">
          {showRenewedNotice ? (
            <div className="details-renewed-notice" role="status">
              <img src="/svg/info-green.svg" alt="" />
              <span>
                Odabrana polica osiguranja je produžena te naknadne izmjene na njoj nisu moguće.
              </span>
            </div>
          ) : null}

          <ClientInfoCard
            clientName={details.clientName}
            clientOib={details.clientOib}
            dobText={formatDate(details.dob)}
            phoneNumber={details.phoneNumber}
            email={details.email}
          />

          <section className="details-block">
            <div className="details-block-heading details-policy-heading-row">
              <div className="details-policy-heading-copy">
                <h2>Detalji odabrane police osiguranja</h2>
                <p>Pregled police osiguranja povezane s ugovarateljem</p>
              </div>

              {(details.createdByName || details.dateCreated) ? (
                <div className="details-created-by">
                  <span>{details.createdByName ? "Policu unio/la" : "Polica kreirana"}</span>
                  {details.createdByName && <strong>{details.createdByName}</strong>}
                  <time>{formatDateTime(details.dateCreated)}</time>
                </div>
              ) : null}
            </div>

            <PolicyInfoCard
              dateCreatedText={formatDate(details.startingDate)}
              insuranceCompany={details.insuranceCompany}
              insuranceType={details.insuranceType}
              premium={details.premium}
              location={details.location}
              partner={details.partner}
            />

            {details.remark ? (
              <div className="details-remark-card">
                <span className="details-label">Napomena</span>
                <strong>{details.remark}</strong>
              </div>
            ) : null}
          </section>

          <PreviousPoliciesSection previousPolicies={details.previousPolicies} />
        </div>

        {deleteModalOpen ? (
          <DeletePolicyModal
            policyNumber={details.policyNumber}
            selectedReason={deleteReason}
            deleteNote={deleteNote}
            isDeleting={isDeleting}
            error={deleteError}
            onReasonChange={setDeleteReason}
            onNoteChange={setDeleteNote}
            onCancel={closeDeleteModal}
            onConfirm={handleDeletePolicy}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
