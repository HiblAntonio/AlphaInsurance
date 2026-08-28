import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/employees.css";

import Sidebar from "../components/dashboard/Sidebar";
import Pagination from "../components/dashboard/Pagination";
import { fetchAgents } from "../services/agentsService";

const PAGE_SIZE = 9;

const TABS = [
  { label: "Svi", role: "Svi" },
  { label: "Admini", role: "Admin" },
  { label: "Djelatnici", role: "Djelatnik" },
];

function mapAgent(item) {
  const roleName = item.roleName ?? item.RoleName ?? "";
  const isActive = item.isActive ?? item.IsActive ?? true;
  return {
    id: item.id ?? item.Id,
    role: isActive ? roleName : "Deaktiviran",
    roleType: isActive ? (roleName === "Admin" ? "admin" : "employee") : "inactive",
    idNumber:
      item.iDNumber ??
      item.IDNumber ??
      item.idNumber ??
      item.identificationNumber ??
      item.IdentificationNumber ??
      "",
    name: item.name ?? item.Name ?? "",
    email: item.mailAddress ?? item.MailAddress ?? "Nema podatka",
    location: item.location ?? item.Location ?? "Nema podatka",
  };
}

function EmployeesTabs({ tabs, activeRole, onTabChange }) {
  return (
    <div className="employees-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.role}
          type="button"
          className={activeRole === tab.role ? "active" : ""}
          onClick={() => onTabChange(tab.role)}
        >
          {tab.label}
          {tab.count != null ? <span>{tab.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

function EmployeesTable({ rows, loading, error }) {
  const navigate = useNavigate();

  return (
    <div className="employees-table-card">
      <div className="table-scroll">
        <table className="employees-table">
          <thead>
            <tr>
              <th>Uloga</th>
              <th>Identifikacijski broj</th>
              <th>Djelatnik</th>
              <th>Email adresa</th>
              <th>Lokacija</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="employees-empty-cell">
                  Učitavanje djelatnika...
                </td>
              </tr>
            ) : null}

            {!loading && error ? (
              <tr>
                <td colSpan="5" className="employees-empty-cell">
                  {error}
                </td>
              </tr>
            ) : null}

            {!loading && !error && rows.length === 0 ? (
              <tr>
                <td colSpan="5" className="employees-empty-cell">
                  Nema djelatnika za odabrane filtere.
                </td>
              </tr>
            ) : null}

            {!loading && !error
              ? rows.map((row) => (
                  <tr
                    key={row.id}
                    className="employees-link-row"
                    tabIndex={0}
                    role="button"
                    onClick={() =>
                      navigate(`/zaposlenici/${row.id}`, { state: { employee: row } })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/zaposlenici/${row.id}`, { state: { employee: row } });
                      }
                    }}
                  >
                    <td>
                      <span className={`employee-role-pill ${row.roleType}`}>{row.role}</span>
                    </td>
                    <td>{row.idNumber}</td>
                    <td>{row.name}</td>
                    <td>{row.email}</td>
                    <td>
                      <span className="employee-location-pill blue">{row.location}</span>
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeRole, setActiveRole] = useState("Svi");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPageNumber(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAgents({ search, role: activeRole, pageNumber, pageSize: PAGE_SIZE });
      setRows((data.items ?? data.Items ?? []).map(mapAgent));
      setTotalPages(data.totalPages ?? data.TotalPages ?? 1);
      setTotalCount(data.totalCount ?? data.TotalCount ?? 0);
    } catch {
      setRows([]);
      setTotalPages(1);
      setTotalCount(0);
      setError("Ne mogu dohvatiti djelatnike. Provjeri backend i URL.");
    } finally {
      setLoading(false);
    }
  }, [search, activeRole, pageNumber]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleTabChange = (role) => {
    setActiveRole(role);
    setPageNumber(1);
  };

  const tabs = TABS.map((tab) => ({
    ...tab,
    count: tab.role === activeRole ? totalCount : null,
  }));

  const normalizedPage = useMemo(
    () => Math.min(pageNumber, totalPages || 1),
    [pageNumber, totalPages]
  );

  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="main-panel employees-page">
        <section className="employees-shell">
          <div className="employees-top-row">
            <div>
              <div className="employees-breadcrumbs">
                <div className="welcome-breadcrumb-logo">
                  <img src="/images/Alpha logo frame.png" alt="Alpha logo" />
                </div>
                <span>Alpha</span>
                <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
                <strong>Zaposlenici</strong>
              </div>

              <div className="employees-title">
                <h1>Pregled svih djelatnika!</h1>
                <p>Pregled i filtriranje svih djelatnika</p>
              </div>
            </div>

            <button
              type="button"
              className="employees-add-button"
              onClick={() => navigate("/zaposlenici/novi")}
            >
              <span aria-hidden="true">+</span>
              Dodaj djelatnika
            </button>
          </div>

          <EmployeesTabs tabs={tabs} activeRole={activeRole} onTabChange={handleTabChange} />

          <div className="employees-toolbar">
            <form className="search-box employees-search" onSubmit={(event) => event.preventDefault()}>
              <span className="search-box-left">
                <i>
                  <img src="/svg/search.svg" alt="" />
                </i>
                <input
                  className="search-input"
                  placeholder="Pretraživanje..."
                  aria-label="Pretraživanje djelatnika"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </span>
              <small>CTRL + K</small>
            </form>
          </div>

          <EmployeesTable rows={rows} loading={loading} error={error} />

          <Pagination
            pageNumber={normalizedPage}
            totalPages={totalPages}
            onPageChange={setPageNumber}
          />
        </section>
      </main>
    </div>
  );
}
