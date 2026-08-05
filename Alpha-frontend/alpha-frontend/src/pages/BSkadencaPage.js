import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../styles/dashboard.css";
import "../styles/bSkadenca.css";
import "../styles/statistics.css";

import Sidebar from "../components/dashboard/Sidebar";
import { fetchBSkadencaData, fetchDashboardFilterOptions } from "../services/policiesService";
import { getCurrentUser } from "../services/authService";

const currentYear = new Date().getFullYear();

const MONTH_LABELS = [
  "Sijecanj","Veljaca","Ozujak","Travanj","Svibanj","Lipanj",
  "Srpanj","Kolovoz","Rujan","Listopad","Studeni","Prosinac",
];

function formatCurrency(value) {
  return new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(Number(value) || 0);
}

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("hr-HR");
}

function FilterBar({ filters, options, onChange }) {
  const dateFromRef = useRef(null);
  const dateToRef = useRef(null);
  const fromLabel = filters.dateFrom ? formatDate(filters.dateFrom) : "Od datuma";
  const toLabel = filters.dateTo ? formatDate(filters.dateTo) : "Do datuma";

  return (
    <div className="bsk-filter-row">
      <div className="sales-date-range">
        <button
          type="button"
          className="sales-date-filter"
          onClick={() => dateFromRef.current?.showPicker()}
        >
          <i aria-hidden="true" />
          <span>{fromLabel}</span>
          <input
            ref={dateFromRef}
            type="date"
            value={filters.dateFrom}
            max={filters.dateTo || undefined}
            onChange={(e) => onChange("dateFrom", e.target.value)}
            aria-label="Od datuma"
          />
        </button>
        <span className="sales-date-sep">—</span>
        <button
          type="button"
          className="sales-date-filter"
          onClick={() => dateToRef.current?.showPicker()}
        >
          <i aria-hidden="true" />
          <span>{toLabel}</span>
          <input
            ref={dateToRef}
            type="date"
            value={filters.dateTo}
            min={filters.dateFrom || undefined}
            onChange={(e) => onChange("dateTo", e.target.value)}
            aria-label="Do datuma"
          />
        </button>
        {(filters.dateFrom || filters.dateTo) && (
          <button
            type="button"
            className="sales-date-clear"
            onClick={() => { onChange("dateFrom", ""); onChange("dateTo", ""); }}
            aria-label="Očisti raspon datuma"
          >
            ×
          </button>
        )}
      </div>

      <select
        aria-label="Osiguravajuća kuća"
        value={filters.insuranceCompany}
        onChange={(e) => onChange("insuranceCompany", e.target.value)}
      >
        <option value="">Osiguravajuća kuća</option>
        {options.companies.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <select
        aria-label="Vrsta osiguranja"
        value={filters.insuranceType}
        onChange={(e) => onChange("insuranceType", e.target.value)}
      >
        <option value="">Vrsta osiguranja</option>
        {options.policyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <select
        aria-label="Prodajno mjesto"
        value={filters.location}
        onChange={(e) => onChange("location", e.target.value)}
      >
        <option value="">Prodajno mjesto</option>
        {options.locations.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
    </div>
  );
}

const CHART_W = 1000;
const CHART_H = 260;
const CHART_PAD_TOP = 16;

function buildPath(points, weekMin, weekSpan, maxVal) {
  if (!points.length) return "";
  const xs = (w) => ((w - weekMin) / weekSpan) * CHART_W;
  const ys = (v) => CHART_PAD_TOP + (1 - v / maxVal) * (CHART_H - CHART_PAD_TOP);
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xs(p.weekNumber).toFixed(1)},${ys(p.policyCount).toFixed(1)}`)
    .join(" ");
}

function buildFillPath(points, weekMin, weekSpan, maxVal) {
  if (!points.length) return "";
  const xs = (w) => ((w - weekMin) / weekSpan) * CHART_W;
  const ys = (v) => CHART_PAD_TOP + (1 - v / maxVal) * (CHART_H - CHART_PAD_TOP);
  const start = `M${xs(points[0].weekNumber).toFixed(1)},${CHART_H}`;
  const line = points.map((p) => `L${xs(p.weekNumber).toFixed(1)},${ys(p.policyCount).toFixed(1)}`).join(" ");
  const end = `L${xs(points[points.length - 1].weekNumber).toFixed(1)},${CHART_H}Z`;
  return `${start} ${line} ${end}`;
}

function WeeklyLineChart({ weeklyData, weeklyDataComparison, year, comparisonYear, yearSummary, comparisonYearSummary, percentChange, isAdmin }) {
  const [tooltip, setTooltip] = React.useState(null);
  const svgRef = React.useRef(null);

  // Compute actual week range from data; default full year
  const allWeekNums = [...weeklyData, ...weeklyDataComparison].map((d) => d.weekNumber);
  const weekMin = allWeekNums.length ? Math.min(...allWeekNums) : 1;
  const weekMax = allWeekNums.length ? Math.max(...allWeekNums) : 52;
  const weekSpan = Math.max(weekMax - weekMin, 1);

  const allCounts = [...weeklyData, ...weeklyDataComparison].map((d) => d.policyCount);
  const maxVal = Math.max(...allCounts, 1);

  const yStep = Math.ceil(maxVal / 5) || 1;
  const yLabels = Array.from({ length: 6 }, (_, i) => yStep * (5 - i));

  const xs = (w) => ((w - weekMin) / weekSpan) * CHART_W;
  const ys = (v) => CHART_PAD_TOP + (1 - v / maxVal) * (CHART_H - CHART_PAD_TOP);

  // Month labels: compute actual ISO week of the 1st of each month for `year`
  const xLabels = MONTH_LABELS.map((label, m) => {
    const week = getISOWeek(new Date(year, m, 1));
    return { label, week, x: xs(week) };
  }).filter(({ week }) => week >= weekMin - 0.5 && week <= weekMax + 0.5);

  function handleMouseMove(e) {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const week = Math.round(weekMin + relX * weekSpan);
    const clamped = Math.max(weekMin, Math.min(weekMax, week));

    // Find nearest data point within ±2 weeks
    const findNearest = (arr) => arr.reduce((best, d) => {
      const dist = Math.abs(d.weekNumber - clamped);
      return dist <= 2 && (!best || dist < Math.abs(best.weekNumber - clamped)) ? d : best;
    }, null);

    const curr = findNearest(weeklyData);
    const prev = findNearest(weeklyDataComparison);

    if (!curr && !prev) { setTooltip(null); return; }
    setTooltip({ week: (curr || prev).weekNumber, svgX: xs(clamped), curr, prev });
  }

  const linePath = buildPath(weeklyData, weekMin, weekSpan, maxVal);
  const fillPath = buildFillPath(weeklyData, weekMin, weekSpan, maxVal);
  const linePathPrev = buildPath(weeklyDataComparison, weekMin, weekSpan, maxVal);
  const fillPathPrev = buildFillPath(weeklyDataComparison, weekMin, weekSpan, maxVal);

  return (
    <section className="bsk-panel bsk-chart-panel">
      <div className="bsk-chart-head">
        <div>
          <h2>Pregled grafa za broj polica po tjednima</h2>
          <p>Pregled broja polica po datumu produženja</p>
        </div>

        <div className="bsk-year-comparison">
          <div>
            <span>{year}</span>
            <strong>{(yearSummary?.policyCount ?? 0).toLocaleString("hr-HR")} polica</strong>
            {isAdmin && <em>{formatCurrency(yearSummary?.policySum ?? 0)}</em>}
          </div>
          <b>vs</b>
          <div>
            <span>{comparisonYear}</span>
            <strong>{(comparisonYearSummary?.policyCount ?? 0).toLocaleString("hr-HR")} polica</strong>
            {isAdmin && <em>{formatCurrency(comparisonYearSummary?.policySum ?? 0)}</em>}
          </div>
          <small className={percentChange >= 0 ? "positive" : "negative"}>
            {percentChange > 0 ? "+" : ""}{percentChange.toFixed(1).replace(".", ",")} %
          </small>
        </div>
      </div>

      <div className="bsk-line-chart">
        <div className="bsk-lc-y">
          {yLabels.map((v) => <span key={v}>{v}</span>)}
        </div>

        <div className="bsk-lc-plot-wrap">
          <div className="bsk-lc-grid">
            {yLabels.map((v) => <span key={v} />)}
          </div>

          <svg
            ref={svgRef}
            className="bsk-lc-svg"
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            preserveAspectRatio="none"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setTooltip(null)}
          >
            <defs>
              <linearGradient id="bskFillCurr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#466ef9" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#466ef9" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="bskFillPrev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d0d5dd" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#d0d5dd" stopOpacity="0" />
              </linearGradient>
            </defs>

            {fillPathPrev && <path d={fillPathPrev} fill="url(#bskFillPrev)" />}
            {linePathPrev && <path d={linePathPrev} fill="none" stroke="#d0d5dd" strokeWidth="2" />}
            {fillPath && <path d={fillPath} fill="url(#bskFillCurr)" />}
            {linePath && <path d={linePath} fill="none" stroke="#466ef9" strokeWidth="2.5" />}

            {tooltip && (
              <>
                <line x1={tooltip.svgX} y1={CHART_PAD_TOP} x2={tooltip.svgX} y2={CHART_H}
                  stroke="#d0d5dd" strokeWidth="1" strokeDasharray="4 3" />
                {tooltip.curr && (
                  <circle cx={xs(tooltip.curr.weekNumber)} cy={ys(tooltip.curr.policyCount)}
                    r="5" fill="#466ef9" stroke="#fff" strokeWidth="2" />
                )}
                {tooltip.prev && (
                  <circle cx={xs(tooltip.prev.weekNumber)} cy={ys(tooltip.prev.policyCount)}
                    r="5" fill="#d0d5dd" stroke="#fff" strokeWidth="2" />
                )}
              </>
            )}
          </svg>

          {tooltip && (
            <div className="bsk-lc-tooltip" style={{ left: `${(tooltip.svgX / CHART_W) * 100}%` }}>
              <strong>Tjedan {tooltip.week}</strong>
              {tooltip.curr && <span style={{ color: "#466ef9" }}>{year}: {tooltip.curr.policyCount} polica</span>}
              {tooltip.prev && <span style={{ color: "#8b8b8b" }}>{comparisonYear}: {tooltip.prev.policyCount} polica</span>}
            </div>
          )}

          <div className="bsk-lc-x">
            {xLabels.map(({ week, label, x }) => (
              <span key={week} style={{ left: `${(x / CHART_W) * 100}%` }}>{label}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="bsk-lc-legend">
        <span><i style={{ background: "#466ef9" }} />{year}</span>
        <span><i style={{ background: "#d0d5dd" }} />{comparisonYear}</span>
      </div>
    </section>
  );
}

function StatusDonut({ renewedCount, notRenewedCount, year }) {
  const total = renewedCount + notRenewedCount;
  const renewedPct = total > 0 ? ((renewedCount / total) * 100).toFixed(1) : 0;
  const notRenewedPct = total > 0 ? ((notRenewedCount / total) * 100).toFixed(1) : 0;
  const renewedDeg = total > 0 ? (renewedCount / total) * 360 : 0;

  return (
    <section className="bsk-panel bsk-status-card">
      <h3>Statistika polica za {year}. godinu</h3>
      <p>Pregled statusa polica za odabrani period</p>

      <div
        className="bsk-donut"
        aria-hidden="true"
        style={{ background: `conic-gradient(#466ef9 0deg ${renewedDeg}deg, #a8c0ff ${renewedDeg}deg 360deg)` }}
      />

      <div className="bsk-donut-legend">
        <span><i className="donut-renewed" />Produžene ({renewedPct} %)</span>
        <span><i className="donut-not-renewed" />Nisu produžene ({notRenewedPct} %)</span>
      </div>
    </section>
  );
}

function TypeStatsTable({ typeStats, year, comparisonYear, isAdmin }) {
  return (
    <section className="bsk-panel bsk-type-card">
      <h3>Statistika vrsta polica</h3>
      <p>Pregled vrsta polica za odabrani period</p>

      <div className="bsk-type-table">
        <div className="bsk-type-head">
          <span>Vrsta osiguranja</span>
          <span>{year}. godinu</span>
          <span>{comparisonYear}. godinu</span>
          <span>Razlika</span>
        </div>

        {typeStats.map((row) => {
          const diff = row.previousCount > 0
            ? ((row.currentCount - row.previousCount) / row.previousCount * 100).toFixed(1)
            : null;
          return (
            <div className="bsk-type-row" key={row.type}>
              <strong>{row.type}</strong>
              <span>
                {row.currentCount.toLocaleString("hr-HR")}
                {isAdmin && <small>{formatCurrency(row.currentSum)}</small>}
              </span>
              <span>
                {row.previousCount.toLocaleString("hr-HR")}
                {isAdmin && <small>{formatCurrency(row.previousSum)}</small>}
              </span>
              <em className={diff >= 0 ? "positive" : "negative"}>
                {diff !== null ? `${diff > 0 ? "+" : ""}${diff.replace(".", ",")} %` : "—"}
              </em>
            </div>
          );
        })}

        {typeStats.length === 0 && (
          <div className="bsk-type-row"><strong>Nema podataka</strong></div>
        )}
      </div>
    </section>
  );
}

export default function BSkadencaPage() {
  const availableYears = useMemo(() => {
    const start = 2023;
    return Array.from({ length: currentYear - start + 2 }, (_, i) => start + i);
  }, []);

  const isAdmin = String(getCurrentUser()?.role ?? "").toLowerCase() === "admin";

  const [year, setYear] = useState(currentYear);
  const [comparisonYear, setComparisonYear] = useState(currentYear - 1);
  const [filters, setFilters] = useState({
    insuranceCompany: "", insuranceType: "", location: "",
    dateFrom: "", dateTo: "",
  });
  const [options, setOptions] = useState({ companies: [], policyTypes: [], locations: [], partners: [] });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardFilterOptions().then(setOptions).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchBSkadencaData({
        year,
        comparisonYear,
        insuranceCompany: filters.insuranceCompany,
        insuranceType: filters.insuranceType,
        location: filters.location,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
      setData(result);
    } catch (err) {
      setError("Ne mogu dohvatiti podatke B-skadence.");
    } finally {
      setLoading(false);
    }
  }, [year, comparisonYear, filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const weeklyData = data?.weeklyData ?? [];
  const weeklyDataComparison = data?.weeklyDataComparison ?? [];
  const yearSummary = data?.yearSummary;
  const comparisonYearSummary = data?.comparisonYearSummary;
  const percentChange = data?.percentChange ?? 0;
  const typeStats = data?.typeStats ?? [];
  const renewedCount = data?.renewedCount ?? 0;
  const notRenewedCount = data?.notRenewedCount ?? 0;

  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="main-panel bsk-page">
        <section className="bsk-shell">
          <div className="bsk-top">
            <div>
              <div className="bsk-breadcrumbs">
                <div className="welcome-breadcrumb-logo">
                  <img src="/images/Alpha logo frame.png" alt="Alpha logo" />
                </div>
                <span>Alpha zastupanje</span>
                <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
                <strong>B-skadenca</strong>
              </div>

              <div className="bsk-title">
                <h1>Pregled B-skadence</h1>
                <p>Pregled i filtriranje polica osiguranja</p>
              </div>
            </div>

            <div className="bsk-year-selectors">
              <label>
                Godina
                <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                  {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
              <label>
                Usporedi s
                <select value={comparisonYear} onChange={(e) => setComparisonYear(Number(e.target.value))}>
                  {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
            </div>
          </div>

          <FilterBar
            filters={filters}
            options={options}
            onChange={updateFilter}
          />

          {error && <p className="form-status-message error">{error}</p>}

          {loading ? (
            <p className="bsk-loading">Učitavanje...</p>
          ) : (
            <>
              <WeeklyLineChart
                weeklyData={weeklyData}
                weeklyDataComparison={weeklyDataComparison}
                year={year}
                comparisonYear={comparisonYear}
                yearSummary={yearSummary}
                comparisonYearSummary={comparisonYearSummary}
                percentChange={percentChange}
                isAdmin={isAdmin}
              />

              <div className="bsk-section-title">
                <h2>Pregled statistike vrste osiguranja i statusa polica</h2>
                <p>Pregled trenutnog statusa polica i vrsta polica</p>
              </div>

              <div className="bsk-bottom-grid">
                <StatusDonut renewedCount={renewedCount} notRenewedCount={notRenewedCount} year={comparisonYear} />
                <TypeStatsTable typeStats={typeStats} year={year} comparisonYear={comparisonYear} isAdmin={isAdmin} />
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
