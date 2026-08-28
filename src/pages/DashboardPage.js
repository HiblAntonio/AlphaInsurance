import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import "../styles/dashboard.css";

import Sidebar from "../components/dashboard/Sidebar";
import SummaryBar from "../components/dashboard/SummaryBar";
import WelcomeBlock from "../components/dashboard/WelcomeBlock";
import FeatureCard from "../components/dashboard/FeatureCard";
import StatsCard from "../components/dashboard/StatsCard";
import FilterTabs from "../components/dashboard/FilterTabs";
import Toolbar from "../components/dashboard/Toolbar";
import PoliciesTable from "../components/dashboard/PoliciesTable";
import Pagination from "../components/dashboard/Pagination";
import DashboardFilterDrawer, {
  initialFilters,
} from "../components/dashboard/DashboardFilterDrawer";

import { featureCards } from "../data/dashboardData";
import { fetchPolicies, fetchTabCounts } from "../services/policiesService";
import { getCurrentUser } from "../services/authService";

const PAGE_SIZE = 8;

const TAB_CONFIG = [
  { key: "", label: "Svi", countKey: "svi" },
  { key: "ActiveStatus", label: "Aktivni", countKey: "aktivni" },
  { key: "InactiveStatus", label: "Neaktivni", countKey: "neaktivni" },
  { key: "TwoWeekStatus", label: "2 tjedna prije isteka", countKey: "dvaTjedna" },
  { key: "OneWeekStatus", label: "Tjedan prije isteka", countKey: "tjedan" },
];

const FILTER_LABELS = {
  dateRange: "Raspon datuma",
  priceRange: "Premija",
  insuranceCompany: "Osiguravajuća kuća",
  insuranceType: "Vrsta osiguranja",
  location: "Prodajno mjesto",
  partner: "Partner",
};

function formatDateLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("hr-HR");
}

function buildActiveFilterChips(filters) {
  const chips = [];

  if (filters.dateFrom || filters.dateTo) {
    chips.push({
      key: "dateRange",
      label: FILTER_LABELS.dateRange,
      value: `${formatDateLabel(filters.dateFrom) || "Od"} - ${
        formatDateLabel(filters.dateTo) || "Do"
      }`,
    });
  }

  if (filters.priceFrom || filters.priceTo) {
    chips.push({
      key: "priceRange",
      label: FILTER_LABELS.priceRange,
      value: `${filters.priceFrom || "0"} - ${filters.priceTo || "∞"} €`,
    });
  }

  ["insuranceCompany", "insuranceType", "location", "partner"].forEach((key) => {
    const arr = Array.isArray(filters[key]) ? filters[key] : filters[key] ? [filters[key]] : [];
    if (arr.length > 0) {
      chips.push({
        key,
        label: FILTER_LABELS[key],
        value: arr.join(", "),
      });
    }
  });

  return chips;
}

export default function DashboardPage() {
  const currentYear = new Date().getFullYear();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPageNumber = Number(
    state?.pageNumber || searchParams.get("pageNumber") || 1
  );
  const initialSearch = state?.searchInput ?? searchParams.get("search") ?? "";

  const [policies, setPolicies] = useState([]);
  const [tabCounts, setTabCounts] = useState({
    svi: 0,
    aktivni: 0,
    neaktivni: 0,
    dvaTjedna: 0,
    tjedan: 0,
  });

  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [year, setYear] = useState(state?.year ? Number(state.year) : currentYear);
  const [isAsc, setIsAsc] = useState(false);
  const [pageNumber, setPageNumber] = useState(
    Number.isFinite(initialPageNumber) && initialPageNumber > 0
      ? initialPageNumber
      : 1
  );
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState(() => {
    try {
      const raw = sessionStorage.getItem("dashboardFilters");
      return raw ? JSON.parse(raw) : initialFilters;
    } catch {
      return initialFilters;
    }
  });
  const [filterOpen, setFilterOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [countsLoading, setCountsLoading] = useState(false);
  const [error, setError] = useState("");

  const prevSearchInput = useRef(searchInput);
  useEffect(() => {
    if (prevSearchInput.current === searchInput) return;
    prevSearchInput.current = searchInput;
    const timeout = setTimeout(() => {
      setPageNumber(1);
      setSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);

    if (pageNumber > 1) {
      nextParams.set("pageNumber", String(pageNumber));
    } else {
      nextParams.delete("pageNumber");
    }

    if (searchInput) {
      nextParams.set("search", searchInput);
    } else {
      nextParams.delete("search");
    }

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [pageNumber, searchInput, searchParams, setSearchParams]);

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchPolicies({
        search,
        status: selectedStatus,
        year,
        isAsc,
        pageNumber,
        pageSize: PAGE_SIZE,
        insuranceCompany: filters.insuranceCompany,
        insuranceType: filters.insuranceType,
        location: filters.location,
        partner: filters.partner,
        priceFrom: filters.priceFrom ? Number(filters.priceFrom) : 0,
        priceTo: filters.priceTo ? Number(filters.priceTo) : Number.MAX_SAFE_INTEGER,
        dateFrom: filters.dateFrom || `${year}-01-01`,
        dateTo: filters.dateTo || `${year}-12-31`,
      });

      setPolicies(data.items ?? []);
      setTotalPages(data.totalPages ?? 1);
      setTotalCount(data.totalCount ?? 0);
    } catch (err) {
      setError("Ne mogu dohvatiti police. Provjeri backend i URL.");
      setPolicies([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [search, selectedStatus, year, isAsc, pageNumber, filters]);

  const loadTabCounts = useCallback(async () => {
    setCountsLoading(true);

    try {
      const data = await fetchTabCounts(year, {
        ...filters,
        dateFrom: filters.dateFrom || `${year}-01-01`,
        dateTo: filters.dateTo || `${year}-12-31`,
      });
      setTabCounts({
        svi: data.svi ?? 0,
        aktivni: data.aktivni ?? 0,
        neaktivni: data.neaktivni ?? 0,
        dvaTjedna: data.dvaTjedna ?? 0,
        tjedan: data.tjedan ?? 0,
      });
    } catch {
      setTabCounts({
        svi: 0,
        aktivni: 0,
        neaktivni: 0,
        dvaTjedna: 0,
        tjedan: 0,
      });
    } finally {
      setCountsLoading(false);
    }
  }, [year, filters]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  useEffect(() => {
    loadTabCounts();
  }, [loadTabCounts]);

  const tabs = useMemo(
    () =>
      TAB_CONFIG.map((tab) => ({
        key: tab.key,
        label: tab.label,
        count: tabCounts[tab.countKey] ?? 0,
      })),
    [tabCounts]
  );

  const availableYears = useMemo(() => {
    const startYear = 2023;
    return Array.from(
      { length: currentYear + 1 - startYear + 1 },
      (_, index) => startYear + index
    );
  }, [currentYear]);

  const activeFilterChips = useMemo(
    () => buildActiveFilterChips(filters),
    [filters]
  );

  useEffect(() => {
    try {
      sessionStorage.setItem("dashboardFilters", JSON.stringify(filters));
    } catch {}
  }, [filters]);

  const handlePrint = async () => {
    const win = window.open("", "_blank");
    if (!win) {
      alert("Pop-up prozor je blokiran. Dozvoli pop-up prozore za ovu stranicu i pokušaj ponovo.");
      return;
    }
    try {
      const data = await fetchPolicies({
        search,
        status: selectedStatus,
        year,
        isAsc,
        pageNumber: 1,
        pageSize: 5000,
        insuranceCompany: filters.insuranceCompany,
        insuranceType: filters.insuranceType,
        location: filters.location,
        partner: filters.partner,
        priceFrom: filters.priceFrom ? Number(filters.priceFrom) : 0,
        priceTo: filters.priceTo ? Number(filters.priceTo) : Number.MAX_SAFE_INTEGER,
        dateFrom: filters.dateFrom || `${year}-01-01`,
        dateTo: filters.dateTo || `${year}-12-31`,
      });

      const items = data.items ?? [];
      const user = getCurrentUser();
      const printedAt = new Date().toLocaleString("hr-HR");

      const STATUS_LABEL = {
        "ActiveStatus": "Aktivni", "InactiveStatus": "Neaktivni",
        "TwoWeekStatus": "2 tjedna prije isteka", "OneWeekStatus": "Tjedan prije isteka",
      };
      const fmtArr = (arr) => Array.isArray(arr) && arr.length ? arr.join(", ") : null;
      const criteriaRows = [
        ["Godina", String(year)],
        ["Status", selectedStatus ? (STATUS_LABEL[selectedStatus] ?? selectedStatus) : null],
        ["Pretraga", search || null],
        ["Datum od", filters.dateFrom ? new Date(filters.dateFrom).toLocaleDateString("hr-HR") : null],
        ["Datum do", filters.dateTo ? new Date(filters.dateTo).toLocaleDateString("hr-HR") : null],
        ["Premija od", filters.priceFrom ? `${filters.priceFrom} €` : null],
        ["Premija do", filters.priceTo ? `${filters.priceTo} €` : null],
        ["Osiguravajuća kuća", fmtArr(filters.insuranceCompany)],
        ["Vrsta osiguranja", fmtArr(filters.insuranceType)],
        ["Prodajno mjesto", fmtArr(filters.location)],
        ["Partner", fmtArr(filters.partner)],
      ].filter(([, v]) => v !== null);

      const criteriaHtml = criteriaRows.map(([k, v]) =>
        `<span class="crit"><strong>${k}:</strong> ${v}</span>`
      ).join("");

      const STATUS_MAP = {
        "Active":           { label: "Aktivno",     bg: "#e9faf1", color: "#027a48" },
        "Renewed":          { label: "Obnovljeno",  bg: "#e9faf1", color: "#027a48" },
        "Inactive":         { label: "Neaktivno",   bg: "#fde8e8", color: "#c0392b" },
        "Two Weeks Active": { label: "2 tjedna",    bg: "#fef9e7", color: "#b7860b" },
        "One Week Active":  { label: "1 tjedan",    bg: "#ebebeb", color: "#555555" },
      };

      const statusCell = (raw) => {
        const info = STATUS_MAP[raw];
        if (!info) return raw ?? "-";
        return `<span style="display:inline-block;padding:2px 10px;border-radius:20px;background:${info.bg};color:${info.color};font-weight:500;font-size:10px;white-space:nowrap">${info.label}</span>`;
      };

      const formatDate = (val) => {
        if (!val) return "-";
        const d = new Date(val);
        return isNaN(d) ? val : d.toLocaleDateString("hr-HR");
      };
      const formatPrice = (val) =>
        new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(val ?? 0);

      const rows = items.map((p) => `
        <tr>
          <td>${statusCell(p.status)}</td>
          <td>${p.policyNumber ?? "-"}</td>
          <td>${p.clientName ?? "-"}</td>
          <td>${formatDate(p.startingDate)}</td>
          <td>${p.insuranceCompany ?? "-"}</td>
          <td>${p.insuranceType ?? "-"}</td>
          <td>${formatPrice(p.price)}</td>
          <td>${p.phoneNumber ?? "-"}</td>
          <td>${p.location ?? "-"}</td>
        </tr>`).join("");

      const html = `<!DOCTYPE html>
<html lang="hr">
<head>
  <meta charset="utf-8" />
  <title>Police osiguranja ${year}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; color: #111; position: relative; }
    h1 { font-size: 15px; margin-bottom: 6px; }
    .meta { font-size: 10px; color: #555; margin-bottom: 8px; }
    .criteria { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
    .crit { background: #f1f3f9; border: 1px solid #d8dce8; border-radius: 4px; padding: 2px 8px; font-size: 10px; color: #333; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1a1a2e; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; }
    td { padding: 5px 8px; border-bottom: 1px solid #e0e0e0; }
    tr:nth-child(even) td { background: #f8f8f8; }
    .watermark {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 22px;
      font-weight: 700;
      color: #000;
      opacity: 0.07;
      white-space: nowrap;
      pointer-events: none;
      letter-spacing: 2px;
      z-index: 0;
    }
    @page { size: A4 landscape; margin: 15mm; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="watermark">${user.id || user.username || ""}</div>
  <h1>Police osiguranja — ${year}</h1>
  <div class="meta">
    Ispisao/la: <strong>${user.username || "—"}</strong>
    &nbsp;|&nbsp; Datum ispisa: <strong>${printedAt}</strong>
    &nbsp;|&nbsp; Ukupno: <strong>${items.length} polica</strong>
  </div>
  ${criteriaHtml ? `<div class="criteria">${criteriaHtml}</div>` : ""}
  <table>
    <thead>
      <tr>
        <th>Status</th>
        <th>Broj police</th>
        <th>Ugovaratelj</th>
        <th>Datum produženja</th>
        <th>Osiguravajuća kuća</th>
        <th>Vrsta osiguranja</th>
        <th>Premija</th>
        <th>Broj telefona</th>
        <th>Prodajno mjesto</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload = () => window.print();<\/script>
</body>
</html>`;

      const blob = new Blob([html], { type: "text/html" });
      win.location.href = URL.createObjectURL(blob);
    } catch {
      win.close();
      alert("Greška pri dohvaćanju polica za ispis.");
    }
  };

  const applyFilters = (nextFilters) => {
    setFilters(nextFilters);
    setPageNumber(1);
    setFilterOpen(false);
  };

  const removeFilter = (key) => {
    setFilters((prev) => {
      if (key === "dateRange") {
        return { ...prev, dateFrom: "", dateTo: "" };
      }

      if (key === "priceRange") {
        return { ...prev, priceFrom: "", priceTo: "" };
      }

      const arrayKeys = ["insuranceCompany", "insuranceType", "location", "partner"];
      return { ...prev, [key]: arrayKeys.includes(key) ? [] : "" };
    });
    setPageNumber(1);
  };

  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="main-panel">
        <SummaryBar />

        <section className="dashboard-top-section">
          <WelcomeBlock />

          <div className="cards-grid">
            {featureCards.map((card) => (
              <FeatureCard
                key={card.title}
                title={card.title}
                description={card.description}
                image={card.image}
                href={card.href}
                onClick={card.title === "Isprintaj police" ? handlePrint : undefined}
              />
            ))}

            <StatsCard
              title="Ukupan broj polica"
              value={countsLoading ? "..." : totalCount}
              subtitle={`Godina ${year}`}
            />
          </div>
        </section>

        <div className="dashboard-bottom-section">
          <FilterTabs
            tabs={tabs}
            activeKey={selectedStatus}
            onChange={(status) => {
              setSelectedStatus(status);
              setPageNumber(1);
            }}
          />

          <Toolbar
            search={searchInput}
            onSearchChange={setSearchInput}
            year={year}
            years={availableYears}
            onYearChange={(value) => {
              setYear(Number(value));
              setPageNumber(1);
            }}
            isAsc={isAsc}
            onToggleSort={() => {
              setIsAsc((prev) => !prev);
              setPageNumber(1);
            }}
            onOpenFilter={() => setFilterOpen(true)}
          />

          {activeFilterChips.length ? (
            <div className="active-filter-row" aria-label="Aktivni filteri">
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  className="active-filter-chip"
                  onClick={() => removeFilter(chip.key)}
                  aria-label={`Ukloni filter ${chip.label}`}
                >
                  <span aria-hidden="true">×</span>
                  <strong>{chip.label}</strong>
                  <em>{chip.value}</em>
                </button>
              ))}
            </div>
          ) : null}

          <PoliciesTable
            items={policies}
            loading={loading}
            error={error}
            pageNumber={pageNumber}
            search={searchInput}
            year={year}
            onClearSearch={() => setSearchInput("")}
            onCreatePolicy={() => navigate("/dodaj-policu")}
          />

          <Pagination
            pageNumber={pageNumber}
            totalPages={totalPages}
            onPageChange={setPageNumber}
          />
        </div>

        <DashboardFilterDrawer
          open={filterOpen}
          filters={filters}
          year={year}
          onClose={() => setFilterOpen(false)}
          onApply={applyFilters}
        />
      </main>
    </div>
  );
}
