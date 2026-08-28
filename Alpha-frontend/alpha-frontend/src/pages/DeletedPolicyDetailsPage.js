import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import ClientInfoCard from "../components/policies/ClientInfoCard";
import PolicyHeader from "../components/policies/PolicyHeader";
import PolicyInfoCard from "../components/policies/PolicyInfoCard";
import { fetchDeletedPolicyById, restorePolicy } from "../services/policiesService";
import { getCurrentUser } from "../services/authService";
import "../styles/dashboard.css";
import "../styles/policyDetails.css";
import "../styles/deletedPolicyDetails.css";

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("hr-HR");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function DeletedPolicyBreadcrumbs() {
  return (
    <div className="details-breadcrumbs">
      <div className="details-brand-badge">
        <img src="/images/Alpha logo frame.png" alt="Alpha logo" />
      </div>
      <span>Alpha</span>
      <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
      <span>Smeće</span>
      <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
      <strong>Detalji obrisane police osiguranja</strong>
    </div>
  );
}

export default function DeletedPolicyDetailsPage() {
  const navigate = useNavigate();
  const { policyId } = useParams();
  const { state } = useLocation();
  const isAdmin = String(getCurrentUser()?.role).toLowerCase() === "admin";

  const [policy, setPolicy] = useState(state?.policy ?? null);
  const [loading, setLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchDeletedPolicyById(policyId);
        setPolicy(data);
      } catch {
        setPolicy(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [policyId]);

  const handleRestore = async () => {
    if (isRestoring || !policy?.id) return;
    setIsRestoring(true);
    setRestoreError("");
    try {
      await restorePolicy(policy.id);
      navigate("/smece", { replace: true });
    } catch (err) {
      setRestoreError(err.message || "Greška pri vraćanju police.");
      setIsRestoring(false);
    }
  };

  if (loading) return null;

  if (!policy) {
    return (
      <div className="dashboard-page">
        <Sidebar />
        <main className="main-panel policy-details-page deleted-policy-details-page">
          <p style={{ padding: 40 }}>Polica nije pronađena.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="main-panel policy-details-page deleted-policy-details-page">
        <section className="details-hero">
          <div className="details-hero-left">
            <DeletedPolicyBreadcrumbs />
            <PolicyHeader
              status="Obrisano"
              policyNumber={policy.policyNumber}
              subtitle="Pregled detalja obrisane police osiguranja"
              onBack={() => navigate("/smece")}
            />
          </div>

          <div className="details-actions">
            {isAdmin && (
              <button
                type="button"
                className="details-action dark"
                onClick={handleRestore}
                disabled={isRestoring}
              >
                <img src="/svg/arrowClockwise.svg" alt="" />
                {isRestoring ? "Vraćanje..." : "Vrati policu osiguranja"}
              </button>
            )}
            {restoreError ? <p className="delete-policy-error">{restoreError}</p> : null}
          </div>
        </section>

        <div className="details-content">
          <div className="deleted-policy-notice" role="status">
            <img src="/svg/info.svg" alt="" />
            <span>
              Odabrana polica osiguranja je obrisana
              {policy.deletedByName ? (
                <> od strane djelatnika <strong>{policy.deletedByName}</strong></>
              ) : null}
              {policy.deletedAt ? <> dana {formatDate(policy.deletedAt)}</>: null}.
              {policy.daysUntilPermanentDelete > 0
                ? ` Polica osiguranja će biti trajno obrisana za ${policy.daysUntilPermanentDelete} dana.`
                : " Polica osiguranja će uskoro biti trajno obrisana."}
              {policy.deleteReason ? (
                <> Razlog brisanja je naveden kao:<br /><br />"{policy.deleteReason}"
                {policy.deleteComment ? <><br />{policy.deleteComment}</> : null}</>
              ) : null}
            </span>
          </div>

          <ClientInfoCard
            clientName={policy.clientName}
            clientOib={policy.oib}
            dobText={formatDate(policy.dateOfBirth)}
            phoneNumber={policy.phoneNumber}
            email={policy.mailAddress}
          />

          <section className="details-block">
            <div className="details-block-heading">
              <h2>Detalji odabrane police osiguranja</h2>
              <p>Pregled polica osiguranja povezanih s ugovarateljem</p>
            </div>

            <PolicyInfoCard
              dateCreatedText={formatDate(policy.startingDate)}
              insuranceCompany={policy.insuranceCompany}
              insuranceType={policy.policyType}
              premium={formatCurrency(policy.price)}
              location={policy.location}
              partner={policy.partner}
              showPartner={!!policy.partner}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
