import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import Pagination from "../components/dashboard/Pagination";
import { fetchDeletedPolicies } from "../services/policiesService";
import "../styles/dashboard.css";
import "../styles/trash.css";

const PAGE_SIZE = 13;

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

export default function TrashPage() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [sortAsc, setSortAsc] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDeletedPolicies();
      setPolicies(data ?? []);
    } catch {
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredPolicies = useMemo(() => {
    const search = searchInput.trim().toLowerCase();
    const items = search
      ? policies.filter((p) =>
          [p.policyNumber, p.clientName, p.insuranceCompany, p.policyType,
           p.location, p.deletedByName, p.deleteReason]
            .join(" ").toLowerCase().includes(search)
        )
      : policies;

    return [...items].sort((a, b) => {
      const direction = sortAsc ? 1 : -1;
      return (new Date(a.deletedAt) - new Date(b.deletedAt)) * direction;
    });
  }, [policies, searchInput, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / PAGE_SIZE));
  const visiblePolicies = filteredPolicies.slice(
    (pageNumber - 1) * PAGE_SIZE,
    pageNumber * PAGE_SIZE
  );

  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="main-panel trash-page">
        <section className="trash-shell">
          <div className="trash-breadcrumbs">
            <div className="welcome-breadcrumb-logo">
              <img src="/images/Alpha logo frame.png" alt="Alpha logo" />
            </div>
            <span>Alpha</span>
            <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
            <strong>Smeće</strong>
          </div>

          <div className="trash-title">
            <h1>Smeće</h1>
            <p>Nedavno obrisane police osiguranja će biti automatski obrisane nakon 30 dana</p>
          </div>

          <div className="trash-toolbar">
            <form className="trash-search" onSubmit={(e) => e.preventDefault()}>
              <img src="/svg/search.svg" alt="" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setPageNumber(1); }}
                placeholder="Pretraživanje..."
                aria-label="Pretraživanje obrisanih polica"
              />
              <small>CTRL + K</small>
            </form>

            <button
              type="button"
              className="trash-sort-button"
              onClick={() => setSortAsc((v) => !v)}
            >
              <img src="/svg/sort.svg" alt="" />
              Sortiranje
            </button>
          </div>

          {loading ? null : filteredPolicies.length > 0 ? (
            <>
              <div className="trash-table-card">
                <div className="trash-table-scroll">
                  <table className="trash-table">
                    <thead>
                      <tr>
                        <th>Broj police</th>
                        <th>Ugovaratelj</th>
                        <th>Datum početka</th>
                        <th>Vrsta osiguranja</th>
                        <th>Premija</th>
                        <th>Datum brisanja</th>
                        <th>Obrisao/la</th>
                        <th>Razlog brisanja</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePolicies.map((policy) => (
                        <tr
                          key={policy.id}
                          className="trash-table-row"
                          onClick={() => navigate(`/smece/${policy.id}`, { state: { policy } })}
                        >
                          <td>{policy.policyNumber}</td>
                          <td>{policy.clientName}</td>
                          <td>{formatDate(policy.startingDate)}</td>
                          <td>{policy.policyType}</td>
                          <td>{formatCurrency(policy.price)}</td>
                          <td>{formatDate(policy.deletedAt)}</td>
                          <td>{policy.deletedByName ?? "-"}</td>
                          <td>{policy.deleteReason ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <Pagination
                pageNumber={pageNumber}
                totalPages={totalPages}
                onPageChange={setPageNumber}
              />
            </>
          ) : (
            <div className="trash-empty-state">
              <img src="/images/image 97.png" alt="Nema obrisanih polica" />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
