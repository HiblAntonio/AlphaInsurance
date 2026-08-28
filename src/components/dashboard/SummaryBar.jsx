import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchLatestPolicy } from "../../services/policiesService";

const POLL_INTERVAL_MS = 30_000;

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

function buildItems(policy) {
  if (!policy) return null;
  return [
    { label: "Policu unio/la",       value: policy.agentName ?? "-" },
    { label: "Ugovaratelj",          value: policy.clientName ?? "-", blue: true },
    { label: "Broj police",          value: policy.policyNumber ?? "-" },
    { label: "Datum početka",        value: formatDate(policy.startingDate) },
    { label: "Osiguravajuća kuća",   value: policy.insuranceCompany ?? "-" },
    { label: "Vrsta osiguranja",     value: policy.policyType ?? "-" },
    { label: "Premija",              value: formatCurrency(policy.price) },
    { label: "Prodajno mjesto",      value: policy.location ?? "-" },
  ];
}

export default function SummaryBar() {
  const [items, setItems] = useState(null);
  const timerRef = useRef(null);

  async function load() {
    try {
      const policy = await fetchLatestPolicy();
      setItems(buildItems(policy));
    } catch {
      // keep previous data on error
    }
  }

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, []);

  if (!items) return null;

  return (
    <section className="top-summary-bar">
      {items.map((item) => (
        <div className="summary-item" key={item.label}>
          <span>{item.label}</span>
          {item.href ? (
            <Link className="summary-link" to={item.href}>{item.value}</Link>
          ) : (
            <strong style={item.blue ? { color: "#466ef9" } : undefined}>{item.value}</strong>
          )}
        </div>
      ))}
    </section>
  );
}
