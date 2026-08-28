import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import "../styles/contractors.css";

import Sidebar from "../components/dashboard/Sidebar";
import SummaryBar from "../components/dashboard/SummaryBar";
import Pagination from "../components/dashboard/Pagination";
import {
  fetchClients,
  fetchInactiveClientsCount,
  fetchRecentlyLostClientsCount,
} from "../services/clientsService";

const PAGE_SIZE = 9;

function getValue(source, keys, fallback = "") {
  const key = keys.find((item) => source?.[item] !== undefined && source?.[item] !== null);
  return key ? source[key] : fallback;
}

function formatDate(value) {
  if (!value) return "Nema podatka";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("hr-HR");
}

function mapContractor(client) {
  const isActive = Boolean(getValue(client, ["isActive", "IsActive"], false));

  return {
    id: getValue(client, ["id", "Id"]),
    status: isActive ? "Aktivan" : "Neaktivan",
    oib: getValue(client, ["oib", "Oib", "OIB"], "Nema podatka"),
    name: getValue(client, ["clientName", "ClientName", "name", "Name"], "Nema podatka"),
    legalStatus: getValue(client, ["legalStatus", "LegalStatus"], "Nema podatka"),
    email: getValue(
      client,
      ["clientEmailAddress", "ClientEmailAddress", "emailAddress", "EmailAddress"],
      "Nema podatka"
    ),
    birthDate: formatDate(getValue(client, ["dob", "Dob", "dateOfBirth", "DateOfBirth"], "")),
    phone: getValue(client, ["phoneNumber", "PhoneNumber"], "Nema podatka"),
    birthday: Boolean(getValue(client, ["isBirthday", "IsBirthday"], false)),
  };
}

function ContractorsStats({ totalCount, inactiveCount, recentlyLostCount, loading }) {
  return (
    <div className="contractors-stats-grid">
      <article>
        <span>Ukupan broj ugovaratelja</span>
        <strong>{loading ? "..." : totalCount}</strong>
        <p>prema trenutnom filteru</p>
      </article>

      <article>
        <span>Broj neaktivnih ugovaratelja</span>
        <strong>{loading ? "..." : inactiveCount}</strong>
        <p>koji nemaju niti jednu aktivnu policu</p>
      </article>

      <article>
        <span>Broj nedavno izgubljenih ugovaratelja</span>
        <strong>{loading ? "..." : recentlyLostCount}</strong>
        <p>kojima je nedavno istekla polica</p>
      </article>
    </div>
  );
}

function ContractorsTabs({ totalCount }) {
  const tabs = [{ label: "Svi", count: totalCount, active: true }];

  return (
    <div className="contractors-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.label}
          type="button"
          className={tab.active ? "active" : ""}
        >
          {tab.label}
          <span>{tab.count}</span>
        </button>
      ))}
    </div>
  );
}

const CONTRACTOR_SKELETON_WIDTHS = [
  ["short", "medium", "long", "medium", "long", "medium", "short"],
  ["medium", "long", "medium", "short", "long", "short", "medium"],
  ["long", "short", "long", "medium", "medium", "long", "medium"],
  ["short", "medium", "medium", "long", "short", "medium", "long"],
  ["medium", "long", "short", "medium", "long", "medium", "short"],
  ["long", "medium", "long", "short", "medium", "long", "medium"],
  ["short", "long", "medium", "medium", "short", "medium", "long"],
  ["medium", "short", "long", "medium", "long", "short", "medium"],
  ["long", "medium", "short", "long", "medium", "medium", "short"],
];

function ContractorsTable({ rows, loading, error }) {
  const navigate = useNavigate();

  const thead = (
    <thead>
      <tr>
        <th>Status</th>
        <th>OIB</th>
        <th>Ugovaratelj</th>
        <th>Pravni status</th>
        <th>Email adresa</th>
        <th>Datum rođenja</th>
        <th>Broj mobitela</th>
      </tr>
    </thead>
  );

  if (loading) {
    return (
      <div className="contractors-table-card">
        <div className="table-scroll">
          <table className="contractors-table">
            {thead}
            <tbody>
              {CONTRACTOR_SKELETON_WIDTHS.map((cols, rowIdx) => (
                <tr key={rowIdx} className="skeleton-row">
                  {cols.map((width, colIdx) => (
                    <td key={colIdx}>
                      <span className={`skeleton-cell ${width}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="contractors-table-card">
      <div className="table-scroll">
        <table className="contractors-table">
          {thead}

          <tbody>
            {error ? (
              <tr>
                <td colSpan="7" className="contractors-empty-cell">
                  {error}
                </td>
              </tr>
            ) : null}

            {!error && rows.length === 0 ? (
              <tr>
                <td colSpan="7" className="contractors-empty-cell">
                  Nema ugovaratelja za odabrane filtere.
                </td>
              </tr>
            ) : null}

            {!error
              ? rows.map((row) => (
                  <tr
                    key={row.id}
                    className="contractors-link-row"
                    tabIndex={0}
                    role="button"
                    onClick={() =>
                      navigate(`/ugovaratelji/${row.id}`, {
                        state: { contractor: row },
                      })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/ugovaratelji/${row.id}`, {
                          state: { contractor: row },
                        });
                      }
                    }}
                  >
                    <td>
                      <span
                        className={`contractor-status ${
                          row.status === "Neaktivan" ? "inactive" : ""
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td>{row.oib}</td>
                    <td>{row.name}</td>
                    <td>{row.legalStatus}</td>
                    <td>{row.email}</td>
                    <td>
                      <span className="birthday-date-cell">
                        {row.birthDate}
                        {row.birthday ? (
                          <img
                            src="/svg/birthday-cake.svg"
                            alt="Rodendan"
                            className="birthday-icon"
                          />
                        ) : null}
                      </span>
                    </td>
                    <td>{row.phone}</td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ContractorsFilterMenu({ open, filters, onToggle, onSortChange }) {
  if (!open) return null;

  return (
    <div className="contractors-filter-menu">
      <label>
        <span>Rođendani</span>
        <input
          type="checkbox"
          checked={filters.hasBirthday}
          onChange={() => onToggle("hasBirthday")}
        />
      </label>
      <label>
        <span>Aktivni</span>
        <input
          type="checkbox"
          checked={filters.isActive}
          onChange={() => onToggle("isActive")}
        />
      </label>
      <label>
        <span>Neaktivni</span>
        <input
          type="checkbox"
          checked={filters.isNotActive}
          onChange={() => onToggle("isNotActive")}
        />
      </label>
      <button
        type="button"
        className={filters.sortNewestFirst ? "active" : ""}
        onClick={() => onSortChange(true)}
      >
        Posljednje dodano
      </button>
      <button
        type="button"
        className={!filters.sortNewestFirst ? "active" : ""}
        onClick={() => onSortChange(false)}
      >
        Najstarije dodano
      </button>
    </div>
  );
}

const STORAGE_KEY = "contractorsPageState";

function loadSavedState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const defaultFilters = {
  hasBirthday: false,
  isActive: true,
  isNotActive: true,
  sortNewestFirst: false,
};

export default function ContractorsPage() {
  const saved = loadSavedState();

  const [filterOpen, setFilterOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [searchInput, setSearchInput] = useState(saved?.searchInput ?? "");
  const [search, setSearch] = useState(saved?.search ?? "");
  const [pageNumber, setPageNumber] = useState(saved?.pageNumber ?? 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [recentlyLostCount, setRecentlyLostCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(saved?.filters ?? defaultFilters);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ searchInput, search, pageNumber, filters }));
  }, [searchInput, search, pageNumber, filters]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPageNumber(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchClients({
        search,
        pageNumber,
        pageSize: PAGE_SIZE,
        ...filters,
      });

      setRows((data.items ?? []).map(mapContractor));
      setTotalPages(data.totalPages ?? 1);
      setTotalCount(data.totalCount ?? 0);
    } catch {
      setRows([]);
      setTotalPages(1);
      setTotalCount(0);
      setError("Ne mogu dohvatiti ugovaratelje. Provjeri backend i URL.");
    } finally {
      setLoading(false);
    }
  }, [filters, pageNumber, search]);

  const loadStats = useCallback(async () => {
    const today = new Date().toDateString();
    const cached = (() => { try { return JSON.parse(sessionStorage.getItem("contractorsStats")); } catch { return null; } })();
    if (cached?.date === today) {
      setInactiveCount(cached.inactiveCount);
      setRecentlyLostCount(cached.recentlyLostCount);
      return;
    }

    setStatsLoading(true);

    try {
      const [inactive, recentlyLost] = await Promise.all([
        fetchInactiveClientsCount(),
        fetchRecentlyLostClientsCount(),
      ]);

      setInactiveCount(inactive ?? 0);
      setRecentlyLostCount(recentlyLost ?? 0);
      sessionStorage.setItem("contractorsStats", JSON.stringify({ date: today, inactiveCount: inactive ?? 0, recentlyLostCount: recentlyLost ?? 0 }));
    } catch {
      setInactiveCount(0);
      setRecentlyLostCount(0);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const statsAreLoading = statsLoading;
  const normalizedPageNumber = useMemo(
    () => Math.min(pageNumber, totalPages || 1),
    [pageNumber, totalPages]
  );

  const toggleFilter = (key) => {
    setFilters((current) => ({
      ...current,
      [key]: !current[key],
    }));
    setPageNumber(1);
  };

  const changeSort = (sortNewestFirst) => {
    setFilters((current) => ({
      ...current,
      sortNewestFirst,
    }));
    setPageNumber(1);
  };

  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="main-panel contractors-page">
        <SummaryBar />

        <section className="contractors-hero">
          <div className="contractors-breadcrumbs">
            <div className="welcome-breadcrumb-logo">
              <img src="/images/Alpha logo frame.png" alt="Alpha logo" />
            </div>
            <span>Alpha</span>
            <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
            <strong>Ugovaratelji</strong>
          </div>

          <div className="contractors-title">
            <h1>Pregled ugovaratelja!</h1>
            <p>Pregled i filtriranje svih ugovaratelja</p>
          </div>

          <ContractorsStats
            totalCount={totalCount}
            inactiveCount={inactiveCount}
            recentlyLostCount={recentlyLostCount}
            loading={statsAreLoading}
          />
        </section>

        <section className="contractors-content">
          <ContractorsTabs totalCount={totalCount} />

          <div className="contractors-toolbar">
            <form className="search-box contractors-search" onSubmit={(e) => e.preventDefault()}>
              <span className="search-box-left">
                <i>
                  <img src="/svg/search.svg" alt="" />
                </i>
                <input
                  className="search-input"
                  placeholder="Pretraživanje..."
                  aria-label="Pretraživanje ugovaratelja"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </span>
              <small>CTRL + K</small>
            </form>

            <div className="contractors-filter-wrap">
              <button
                type="button"
                className="filter-button contractors-filter-button"
                onClick={() => setFilterOpen((current) => !current)}
              >
                <i>
                  <img src="/svg/filter.svg" alt="" />
                </i>
                Filter
              </button>

              <ContractorsFilterMenu
                open={filterOpen}
                filters={filters}
                onToggle={toggleFilter}
                onSortChange={changeSort}
              />
            </div>
          </div>

          <ContractorsTable rows={rows} loading={loading} error={error} />

          <Pagination
            pageNumber={normalizedPageNumber}
            totalPages={totalPages}
            onPageChange={setPageNumber}
          />
        </section>
      </main>
    </div>
  );
}
