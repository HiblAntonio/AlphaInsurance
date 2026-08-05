import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "../styles/dashboard.css";
import "../styles/statistics.css";

import Sidebar from "../components/dashboard/Sidebar";
import SummaryBar from "../components/dashboard/SummaryBar";
import Pagination from "../components/dashboard/Pagination";
import { getCurrentUser } from "../services/authService";
import {
  fetchAgentSummary,
  fetchPremiumComparison,
  fetchSalesChartData,
  fetchSalesStatistics,
  fetchStatisticsFilterOptions,
  fetchTodayStatistics,
  fetchTodaysFilterOptions,
} from "../services/policiesService";

const PAGE_SIZE = 9;

const initialSummary = {
  yearPoliciesCount: 0,
  todayPoliciesCount: 0,
  todayPremiumSum: 0,
  yearPremiumSum: 0,
  averagePoliciesPerDay: 0,
  todayVsAverageDifference: 0,
  beliManastirPoliciesCount: 0,
};

const periodOptions = [
  { value: "last7", label: "Zadnjih 7 dana" },
  { value: "month", label: "Mjesec" },
  { value: "ytd", label: "YTD" },
  { value: "year", label: "Godina" },
];

const monthLabels = [
  "Sij",
  "Velj",
  "Ozu",
  "Tra",
  "Svi",
  "Lip",
  "Srp",
  "Kol",
  "Ruj",
  "Lis",
  "Stu",
  "Pro",
];

const fullMonthLabels = [
  "Sijecanj",
  "Veljaca",
  "Ozujak",
  "Travanj",
  "Svibanj",
  "Lipanj",
  "Srpanj",
  "Kolovoz",
  "Rujan",
  "Listopad",
  "Studeni",
  "Prosinac",
];

const weekLabels = [
  "1 Sijecanj",
  "7 Sijecnja",
  "14 Sijecnja",
  "21 Sijecnja",
  "28 Sijecnja",
  "4 Veljace",
  "11 Veljace",
  "18 Veljace",
  "25 Veljace",
  "4 Ozujka",
  "11 Ozujka",
  "18 Ozujka",
  "25 Ozujka",
];

const periodLabelOptions = {
  "1T": ["Pon", "Uto", "Sri", "Cet", "Pet", "Sub", "Ned"],
  "1M": ["Tjedan 1", "Tjedan 2", "Tjedan 3", "Tjedan 4"],
  "3M": weekLabels,
  YTD: fullMonthLabels.slice(0, new Date().getMonth() + 1),
  "1G": fullMonthLabels,
  Max: fullMonthLabels,
};

const emptySalesStatistics = {
  insuranceCompanies: [],
  partners: [],
  locations: [],
};

function formatCurrency(value) {
  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("hr-HR");
}

function getItemName(item) {
  return item.locationName ?? item.LocationName ?? item.name ?? "";
}

function getItemCount(item) {
  return Number(item.policyCount ?? item.PolicyCount ?? 0);
}

function getItemSum(item) {
  return Number(item.policySum ?? item.PolicySum ?? 0);
}

function normalizeSalesItems(items) {
  return (items ?? []).map((item) => ({
    name: getItemName(item),
    policyCount: getItemCount(item),
    policySum: getItemSum(item),
  }));
}

function calculateShare(value, total) {
  if (!total) return 0;
  return (value / total) * 100;
}

function sampleLabels(labels, max) {
  if (labels.length <= max) return labels;
  const step = Math.ceil((labels.length - 1) / (max - 1));
  const result = [];
  for (let i = 0; i < labels.length; i += step) result.push(labels[i]);
  const last = labels[labels.length - 1];
  if (result[result.length - 1] !== last) {
    if (result.length < max) result.push(last);
    else result[result.length - 1] = last;
  }
  return result;
}


function SparkLineChart({ labels, series, yLabels, filled = false, secondarySeries = null, extraSeries = [], tooltipData = null }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const plotRef = useRef(null);

  const width = 1000;
  const height = 260;
  const seriesList = [
    { values: series, className: "primary" },
    ...(secondarySeries ? [{ values: secondarySeries, className: "secondary" }] : []),
    ...extraSeries,
  ].filter((item) => item.values.length);
  const allValues = seriesList.flatMap((item) => item.values.filter((v) => v !== null && v !== undefined));
  const maxValue = Math.max(...allValues, 1);

  const computedYLabels = yLabels ?? Array.from({ length: 8 }, (_, i) => {
    const val = Math.round(maxValue * (8 - i) / 8);
    return String(val);
  });

  const getPoint = (value, index, list) => {
    if (value === null || value === undefined) return null;
    const x = list.length === 1 ? 0 : (index / (list.length - 1)) * width;
    const y = height - (value / maxValue) * (height - 22) - 8;
    return { x, y };
  };

  const buildLinePath = (pts) => {
    let d = "";
    let started = false;
    for (const pt of pts) {
      if (pt === null) {
        started = false;
      } else {
        d += `${started ? " L" : "M"} ${pt.x} ${pt.y}`;
        started = true;
      }
    }
    return d;
  };

  const primaryPoints = series.map((value, index) => getPoint(value, index, series));
  const primaryPath = buildLinePath(primaryPoints);
  const fillPath = filled && primaryPath
    ? `${primaryPath} L ${width} ${height} L 0 ${height} Z`
    : "";

  const handleMouseMove = (e) => {
    if (!plotRef.current || series.length === 0) return;
    const rect = plotRef.current.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const fraction = relX / rect.width;
    const rawIndex = fraction * (series.length - 1);
    const index = Math.round(Math.max(0, Math.min(series.length - 1, rawIndex)));
    setHoveredIndex(index);
    setMousePos({ x: relX, y: relY });
  };

  const handleMouseLeave = () => setHoveredIndex(null);

  const hoveredPoint = hoveredIndex !== null && series.length > 0
    ? getPoint(series[hoveredIndex], hoveredIndex, series)
    : null;

  const tooltipItem = hoveredIndex !== null && tooltipData ? tooltipData[hoveredIndex] : null;

  return (
    <div className="sales-chart">
      <div className="sales-chart-y">
        {computedYLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div
        className="sales-chart-plot"
        ref={plotRef}
        onMouseMove={tooltipData ? handleMouseMove : undefined}
        onMouseLeave={tooltipData ? handleMouseLeave : undefined}
      >
        <div className="sales-grid-lines" aria-hidden="true">
          {computedYLabels.map((label) => (
            <span key={label} />
          ))}
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="sales-fill-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(70,110,249,0.22)" />
              <stop offset="100%" stopColor="rgba(70,110,249,0)" />
            </linearGradient>
          </defs>
          {filled && <path d={fillPath} className="sales-line-fill" />}
          {seriesList.map((item, seriesIndex) => {
            const points = item.values.map((value, index) => getPoint(value, index, item.values));
            const itemPath = buildLinePath(points);

            return (
              <path
                key={`${item.className}-${seriesIndex}`}
                d={itemPath}
                className={`sales-line ${item.className}`}
              />
            );
          })}
          {hoveredPoint && (
            <>
              <line
                x1={hoveredPoint.x} y1={0}
                x2={hoveredPoint.x} y2={height}
                className="chart-hover-line"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r={7}
                className="chart-hover-dot"
              />
            </>
          )}
        </svg>
        {tooltipItem && (
          <div
            className={`chart-tooltip${mousePos.x > (plotRef.current?.offsetWidth ?? 0) * 0.75 ? " chart-tooltip--left" : ""}`}
            style={{ left: mousePos.x, top: mousePos.y }}
          >
            <strong>{tooltipItem.label}</strong>
            {tooltipItem.yearValues
              ? tooltipItem.yearValues.map((yv) => (
                  <span key={yv.year} className="chart-tooltip-year">
                    <i style={{ background: yv.color }} />
                    {yv.year}: {formatCurrency(yv.value)}
                  </span>
                ))
              : (
                <>
                  <div className="chart-tooltip-divider" />
                  <div className="chart-tooltip-row">
                    <span className="chart-tooltip-count">{tooltipItem.policyCount.toLocaleString("hr-HR")}</span>
                    <span className="chart-tooltip-unit">polica</span>
                  </div>
                  <div className="chart-tooltip-premium">{formatCurrency(tooltipItem.priceSum)}</div>
                </>
              )
            }
          </div>
        )}
      </div>
      <div className="sales-chart-x">
        {sampleLabels(labels, 13).map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function toTitleCase(str) {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeTodayPolicy(policy) {
  const previousPolicy =
    policy.previousPolicy ??
    policy.previousPolicyNumber ??
    policy.PreviousPolicy ??
    "";
  const isRenewed = String(previousPolicy).trim().length > 0;

  return {
    policyNumber: policy.policyNumber ?? policy.PolicyNumber ?? "",
    clientName: policy.clientName ?? policy.ClientName ?? "",
    startingDate: policy.startingDate ?? policy.StartingDate ?? "",
    insuranceCompany: policy.insuranceCompany ?? policy.InsuranceCompany ?? "",
    price: policy.price ?? policy.Price ?? 0,
    location: policy.location ?? policy.Location ?? "",
    enteredBy: toTitleCase(policy.enteredBy ?? policy.agentName ?? policy.partner ?? policy.Partner ?? ""),
    previousPolicy,
    renewalPolicy: isRenewed ? previousPolicy : "Nova",
  };
}

function StatisticCard({ title, value, note, positive }) {
  return (
    <article className="statistics-card">
      <span>{title}</span>
      <strong>{value}</strong>
      <p className={positive ? "positive" : ""}>{note}</p>
    </article>
  );
}

function getPeriodLabels(period) {
  if (period === "last7") {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return date.toLocaleDateString("hr-HR", {
        day: "2-digit",
        month: "2-digit",
      });
    });
  }

  if (period === "month") {
    return ["Tjedan 1", "Tjedan 2", "Tjedan 3", "Tjedan 4"];
  }

  return monthLabels;
}

function normalizeChartItems(items, period) {
  const labels = getPeriodLabels(period);
  const sourceItems = items.length ? items : labels.map((label) => ({ label }));

  return sourceItems.map((item, index) => {
    const newPoliciesCount = item.newPoliciesCount ?? item.policyCount ?? item.count ?? 0;
    const renewedPoliciesCount = item.renewedPoliciesCount ?? 0;

    return {
      ...item,
      label: item.label ?? item.periodLabel ?? labels[index] ?? item.locationName ?? "",
      newPoliciesCount,
      renewedPoliciesCount,
      totalPoliciesCount:
        item.totalPoliciesCount ?? newPoliciesCount + renewedPoliciesCount,
    };
  });
}

function LocationBarChart({ items, period, onPeriodChange }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const chartItems = normalizeChartItems(items, period);
  const maxValue = Math.max(
    ...chartItems.map((item) => item.totalPoliciesCount || 0),
    1
  );

  const compact = chartItems.length > 8;
  const barStep = Math.ceil(maxValue / 5) || 1;
  const yLabels = Array.from({ length: 5 }, (_, i) => barStep * (5 - i));

  return (
    <section className="statistics-panel location-chart-panel">
      <div className="statistics-panel-head">
        <div>
          <h3>Broj unesenih polica</h3>
          <p>Pregled broja unesenih polica po zadanom kriteriju</p>
        </div>

        <select
          className="statistics-select"
          value={period}
          onChange={(event) => onPeriodChange(event.target.value)}
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="location-chart">
        <div className="chart-grid-lines" aria-hidden="true">
          {yLabels.map((label) => (
            <div key={label} className="chart-grid-line">
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className={`chart-bars${compact ? " compact" : ""}`} onMouseLeave={() => setHoveredIndex(null)}>
          {chartItems.map((item, index) => {
            const newHeight = Math.max((item.newPoliciesCount / maxValue) * 100, item.newPoliciesCount ? 4 : 0);
            const renewedHeight = Math.max((item.renewedPoliciesCount / maxValue) * 100, item.renewedPoliciesCount ? 4 : 0);
            const isHovered = hoveredIndex === index;

            return (
              <div
                className="chart-bar-group"
                key={`${item.label}-${index}`}
                onMouseEnter={() => setHoveredIndex(index)}
                style={{ position: "relative" }}
              >
                {isHovered && (
                  <div className="bar-tooltip">
                    <strong>{item.label}</strong>
                    <div className="bar-tooltip-divider" />
                    <div className="bar-tooltip-row">
                      <span className="bar-tooltip-count">{item.totalPoliciesCount.toLocaleString("hr-HR")}</span>
                      <span className="bar-tooltip-unit">polica</span>
                    </div>
                    <div className="bar-tooltip-breakdown">
                      <span><i className="bar-tooltip-dot new" />Nova: {item.newPoliciesCount.toLocaleString("hr-HR")}</span>
                      <span><i className="bar-tooltip-dot renewed" />Produžena: {item.renewedPoliciesCount.toLocaleString("hr-HR")}</span>
                    </div>
                  </div>
                )}
                <div className="stacked-bar">
                  <span className="bar-renewed" style={{ height: `${renewedHeight}%` }} />
                  <span className="bar-new" style={{ height: `${newHeight}%` }} />
                </div>
                <small>{item.label}</small>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const DONUT_COLORS = ["#466ef9", "#9cb2ff", "#c7d5ff", "#6b8eff", "#d8dce5", "#a0aec0", "#63b3ed"];

function buildDonutGradient(byType) {
  if (!byType || byType.length === 0)
    return "conic-gradient(#d8dce5 0 100%)";
  const active = byType.filter((t) => t.count > 0).sort((a, b) => b.count - a.count);
  if (active.length === 0) return "conic-gradient(#d8dce5 0 100%)";
  const total = active.reduce((s, t) => s + t.count, 0);
  let cumulative = 0;
  const stops = [];
  active.forEach((t, i) => {
    const pct = (t.count / total) * 100;
    const color = DONUT_COLORS[i % DONUT_COLORS.length];
    stops.push(`${color} ${cumulative.toFixed(2)}% ${(cumulative + pct).toFixed(2)}%`);
    cumulative += pct;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function QuickStats({ unrenewed, expiring, topPartners, period, onPeriodChange }) {
  return (
    <div className="quick-stats-grid">
      <section className="statistics-panel compact-stat-panel">
        <div className="statistics-panel-head">
          <div>
            <h3>Broj neproduženih polica</h3>
            <p>Ukupan broj neproduženih polica od zadanog kriterija</p>
          </div>

          <select
            className="statistics-select"
            value={period}
            onChange={(event) => onPeriodChange(event.target.value)}
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <strong>{unrenewed.count}</strong>
        <span>{formatCurrency(unrenewed.priceSum)}</span>
      </section>

      <section className="statistics-panel expiring-panel">
        <div>
          <h3>Broj polica koje ističu unutar 2 tjedna</h3>
          <p>Ukupan broj polica i suma premija</p>
        </div>

        <div className="expiring-panel-body">
          <div>
            <strong>{expiring.count}</strong>
            <span>{formatCurrency(expiring.priceSum)}</span>
          </div>
          <div className="donut-chart-wrap">
            <div className="donut-chart" aria-hidden="true" style={{ background: buildDonutGradient(expiring.byType) }} />
            {expiring.byType && expiring.byType.length > 0 && (
              <div className="donut-chart-tooltip">
                <div className="donut-chart-tooltip-title">Vrste osiguranja</div>
                {(() => {
                  const active = expiring.byType.filter((t) => t.count > 0).sort((a, b) => b.count - a.count);
                  const total = active.reduce((s, t) => s + t.count, 0);
                  return active.map((t, i) => (
                    <div key={t.type} className="donut-chart-tooltip-row">
                      <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#374151", fontSize: 12 }}>
                        <i style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                        {t.type}
                      </span>
                      <span style={{ flexShrink: 0 }}>
                        <strong style={{ color: "#181818", fontSize: 13 }}>{t.count}</strong><span style={{ color: "#9ca3af", fontSize: 10 }}> – {total > 0 ? Math.round((t.count / total) * 100) : 0}%</span>
                      </span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="statistics-panel partners-panel">
        <h3>Najaktivniji partneri</h3>
        <p>Broj polica ugovorenih kod pojedinih partnera od početka tekuće godine</p>

        <div className="partners-list">
          {topPartners.map((partner, index) => (
            <div key={`${partner.partnerName}-${index}`} className="partner-row">
              <span>{index + 1}. {partner.partnerName}</span>
              <strong>{partner.policyCount} polica</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SalesFilterBar({ filters, options, onChange }) {
  const setFilter = (name, value) => onChange({ ...filters, [name]: value });
  const fromLabel = filters.dateFrom ? formatDate(filters.dateFrom) : "Od datuma";
  const toLabel = filters.dateTo ? formatDate(filters.dateTo) : "Do datuma";
  const dateFromRef = useRef(null);
  const dateToRef = useRef(null);

  return (
    <div className="sales-filter-bar">
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
            onChange={(event) => setFilter("dateFrom", event.target.value)}
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
            onChange={(event) => setFilter("dateTo", event.target.value)}
            aria-label="Do datuma"
          />
        </button>
        {(filters.dateFrom || filters.dateTo) && (
          <button
            type="button"
            className="sales-date-clear"
            onClick={() => onChange({ ...filters, dateFrom: "", dateTo: "" })}
            aria-label="Očisti raspon datuma"
          >
            ×
          </button>
        )}
      </div>

      <select
        className="sales-filter-select"
        value={filters.insuranceCompany}
        onChange={(event) => setFilter("insuranceCompany", event.target.value)}
      >
        <option value="">Osiguravajuća kuća</option>
        {options.insuranceCompanies.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      <select
        className="sales-filter-select compact"
        value={filters.partner}
        onChange={(event) => setFilter("partner", event.target.value)}
      >
        <option value="">Partner</option>
        {options.partners.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      <select
        className="sales-filter-select"
        value={filters.insuranceType}
        onChange={(event) => setFilter("insuranceType", event.target.value)}
      >
        <option value="">Vrsta osiguranja</option>
        {options.insuranceTypes.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>

      <select
        className="sales-filter-select"
        value={filters.location}
        onChange={(event) => setFilter("location", event.target.value)}
      >
        <option value="">Prodajno mjesto</option>
        {options.locations.map((name) => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </div>
  );
}

function SalesHeader({ title, description }) {
  return (
    <div className="sales-section-heading">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function SalesCreatedPoliciesCard({ creationStats }) {
  const newPct = creationStats?.newPercentage ?? 0;
  const renewedPct = creationStats?.renewedPercentage ?? 0;
  const newCount = creationStats?.newCount ?? 0;
  const renewedCount = creationStats?.renewedCount ?? 0;

  return (
    <section className="statistics-panel sales-created-card">
      <div>
        <h3>Statistika kreiranih polica</h3>
        <p>Pregled omjera obnovljenih i novih polica od početka tekuće godine</p>
      </div>

      <div className="created-policy-chart">
        <div className="created-policy-axis">
          {[100, 80, 60, 40, 20].map((label) => <span key={label}>{label}</span>)}
        </div>
        <div className="created-policy-grid" aria-hidden="true">
          {[100, 80, 60, 40, 20].map((label) => <span key={label} />)}
        </div>
        <div className="created-policy-bars">
          <span className="bar-dark" style={{ height: `${Math.max(newPct, 4)}%` }} />
          <span className="bar-blue" style={{ height: `${Math.max(renewedPct, 4)}%` }} />
        </div>
        <div className="created-policy-legend">
          <span><i className="dot dark" />Nove police — {newCount.toLocaleString("hr-HR")} ({newPct.toFixed(1)} %)</span>
          <span><i className="dot blue" />Produžene police — {renewedCount.toLocaleString("hr-HR")} ({renewedPct.toFixed(1)} %)</span>
        </div>
      </div>
    </section>
  );
}

function SalesCompaniesCard({ items }) {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const rows = [...items].sort((a, b) => (b.policyCount ?? 0) - (a.policyCount ?? 0));
  const totalCount = rows.reduce((sum, item) => sum + (item.policyCount ?? 0), 0) || 1;

  const toggle = (name) => setSelectedCompany((prev) => (prev === name ? null : name));

  const selectedItem = rows.find(
    (item) => (item.name || item.companyName || "Nema naziva") === selectedCompany
  );

  return (
    <section className="statistics-panel sales-companies-card">
      <div>
        <h3>Statistika osiguravajućih kuća</h3>
        <p>Postotak polica po osiguravajućim kućama</p>
      </div>

      <div className="sales-company-bars">
        {rows.map((item, index) => {
          const name = item.name || item.companyName || "Nema naziva";
          const isSelected = selectedCompany === name;
          const latestBreakdown = (item.yearlyBreakdown ?? []).slice().sort((a, b) => b.year - a.year)[0];
          const premiumGrowth = latestBreakdown?.growthPercentage ?? null;

          return (
            <div
              className={`sales-company-row${isSelected ? " expanded" : ""}`}
              key={`${name}-${index}`}
              onClick={() => toggle(name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && toggle(name)}
            >
              <div className="company-name">
                <strong>{name}</strong>
                <span>{(item.policyCount ?? 0).toLocaleString("hr-HR")} polica</span>
              </div>
              <span
                className="company-bar"
                style={{ width: `${Math.max(((item.policyCount ?? 0) / totalCount) * 100, 2)}%` }}
              />
              <div className="company-values">
                {premiumGrowth !== null ? (
                  <strong className={premiumGrowth >= 0 ? "growth-positive" : "growth-negative"}>
                    {premiumGrowth > 0 ? "+" : ""}{premiumGrowth.toFixed(1).replace(".", ",")} %
                  </strong>
                ) : (
                  <strong>—</strong>
                )}
                <span>{formatCurrency(item.policySum ?? 0)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedItem && (
        <div className="sales-company-table">
          <p className="company-breakdown-title">{selectedItem.name || selectedItem.companyName}</p>
          {(selectedItem.yearlyBreakdown ?? []).map((bd) => (
            <div key={bd.year}>
              <strong>{bd.year}</strong>
              <span>{bd.policyCount.toLocaleString("hr-HR")}</span>
              <span>{formatCurrency(bd.policySum)}</span>
              <em className={bd.growthPercentage >= 0 ? "positive" : "negative"}>
                {bd.growthPercentage > 0 ? "+" : ""}{bd.growthPercentage.toFixed(1).replace(".", ",")} %
              </em>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SalesLocationsCard({ items }) {
  const colors = ["#466ef9", "#a2b6fc", "#5d5d5d", "#d0d5dd"];
  const topItems = items.slice(0, 4);
  const total = topItems.reduce((sum, item) => sum + item.policyCount, 0);
  let current = 0;
  const stops = topItems.map((item, index) => {
    const start = current;
    const end = start + calculateShare(item.policyCount, total);
    current = end;
    return `${colors[index]} ${start}% ${end}%`;
  });

  return (
    <section className="statistics-panel sales-locations-card">
      <div>
        <h3>Police po mjestima</h3>
        <p>Broj i postotak polica osiguranja unesenih po mjestima od početka tekućeg mjeseca</p>
      </div>
      <div className="location-donut" style={{ background: `conic-gradient(${stops.join(", ") || "#d0d5dd 0 100%"})` }} />
      <div className="location-donut-legend">
        {topItems.map((item, index) => (
          <span key={`${item.name}-${index}`}>
            <i style={{ background: colors[index] }} />
            {item.name || "Nema mjesta"} ({calculateShare(item.policyCount, total).toFixed(1)} %)
          </span>
        ))}
      </div>
    </section>
  );
}

function SalesPartnersCard({ items }) {
  const colors = ["#466ef9", "#464646", "#a2b6fc", "#d0d5dd", "#ecf0fe", "#c7d2fe", "#818cf8", "#6b7280", "#93c5fd", "#fbbf24"];
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const totalCount = items.reduce((sum, item) => sum + item.policyCount, 0);

  const top10 = items.slice(0, 10);
  const rest = items.slice(10);
  const restCount = rest.reduce((sum, item) => sum + item.policyCount, 0);
  const restSum = rest.reduce((sum, item) => sum + item.policySum, 0);

  const barSegments = [
    ...top10.map((item, i) => ({
      name: item.name || "Nema partnera",
      policyCount: item.policyCount,
      policySum: item.policySum,
      color: colors[i],
    })),
    ...(rest.length > 0 ? [{ name: "Ostalo", policyCount: restCount, policySum: restSum, color: "#e5e7eb" }] : []),
  ];

  return (
    <section className="statistics-panel sales-partners-card">
      <div>
        <h3>Statistika partnera</h3>
        <p>Broj i udio polica osiguranja kod pojedinog partnera</p>
      </div>
      <div className="partner-bar-wrapper">
        <div className="partner-share-bar" onMouseLeave={() => setHoveredSegment(null)}>
          {barSegments.map((seg, index) => (
            <span
              key={`${seg.name}-${index}`}
              style={{ width: `${Math.max(calculateShare(seg.policyCount, totalCount), 2)}%`, background: seg.color }}
              onMouseEnter={() => setHoveredSegment(index)}
            />
          ))}
        </div>
        {hoveredSegment !== null && (() => {
          const seg = barSegments[hoveredSegment];
          let leftPct = 0;
          for (let i = 0; i < hoveredSegment; i++) {
            leftPct += Math.max(calculateShare(barSegments[i].policyCount, totalCount), 2);
          }
          leftPct += Math.max(calculateShare(seg.policyCount, totalCount), 2) / 2;
          const clampedLeft = Math.min(Math.max(leftPct, 10), 90);
          return (
            <div className="partner-bar-tooltip" style={{ left: `${clampedLeft}%` }}>
              <strong>{seg.name}</strong>
              <span>{seg.policyCount.toLocaleString("hr-HR")} polica</span>
              <span>{calculateShare(seg.policyCount, totalCount).toFixed(1).replace(".", ",")} %</span>
              <span>{formatCurrency(seg.policySum)}</span>
            </div>
          );
        })()}
      </div>
      <div className="sales-partner-list">
        {items.map((item, index) => (
          <div key={`${item.name}-${index}`}>
            <span>{item.name || "Nema partnera"}</span>
            <strong>{item.policyCount.toLocaleString("hr-HR")} polica</strong>
            <strong>{formatCurrency(item.policySum)}</strong>
            <strong>{calculateShare(item.policyCount, totalCount).toFixed(1).replace(".", ",")} %</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function SalesStatsView({ salesStats, year, salesFilters, loading, error }) {
  const [policyPeriod, setPolicyPeriod] = useState("YTD");
  const [chartData, setChartData] = useState({ totalCount: 0, totalSum: 0, dataPoints: [] });
  const [premiumData, setPremiumData] = useState({ dataPoints: [] });
  const [visibleYears, setVisibleYears] = useState({
    [year]: true,
    [year - 1]: true,
    [year - 2]: false,
    [year - 3]: false,
  });

  useEffect(() => {
    let cancelled = false;
    fetchSalesChartData({ period: policyPeriod.toLowerCase(), year, ...salesFilters })
      .then((data) => { if (!cancelled) setChartData(data ?? { totalCount: 0, totalSum: 0, dataPoints: [] }); })
      .catch(() => { if (!cancelled) setChartData({ totalCount: 0, totalSum: 0, dataPoints: [] }); });
    return () => { cancelled = true; };
  }, [policyPeriod, year, salesFilters]);

  useEffect(() => {
    let cancelled = false;
    const allYears = [year, year - 1, year - 2, year - 3];
    fetchPremiumComparison({ years: allYears, ...salesFilters })
      .then((data) => { if (!cancelled) setPremiumData(data ?? { dataPoints: [] }); })
      .catch(() => { if (!cancelled) setPremiumData({ dataPoints: [] }); });
    return () => { cancelled = true; };
  }, [year, salesFilters]);

  const companies = salesStats.insuranceCompanies ?? [];
  const partners = normalizeSalesItems(salesStats.partners);
  const locations = normalizeSalesItems(salesStats.locations);
  const creationStats = salesStats.creationStats ?? { newCount: 0, renewedCount: 0, newPercentage: 0, renewedPercentage: 0 };
  const totalCount = chartData.totalCount;
  const totalPremium = chartData.totalSum;
  const policyLabels = chartData.dataPoints.length > 0
    ? chartData.dataPoints.map((p) => p.label)
    : (periodLabelOptions[policyPeriod] ?? periodLabelOptions.YTD);
  const policySeries = chartData.dataPoints.length > 0
    ? chartData.dataPoints.map((p) => p.policyCount)
    : [];
  const yearOptions = [year, year - 1, year - 2, year - 3];
  const yearColors = ["primary", "secondary", "tertiary", "quaternary"];
  const yearColorValues = ["#466ef9", "#a2b6fc", "#5d5d5d", "#d0d5dd"];
  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();

  const selectedYearSeries = yearOptions
    .map((yearOption, index) => {
      if (!visibleYears[yearOption]) return null;
      const values = premiumData.dataPoints.map((p) => {
        // Don't draw future months for the current year — return null to break the line
        if (yearOption === currentYearNum && p.monthNumber > currentMonthNum) return null;
        const val = p.cumulativeValueByYear?.[yearOption];
        return val !== undefined ? Number(val) : 0;
      });
      return { year: yearOption, values, className: yearColors[index] };
    })
    .filter(Boolean);
  const firstYearSeries = selectedYearSeries[0]?.values ?? [];
  const additionalYearSeries = selectedYearSeries.slice(1);

  const premiumLabels = premiumData.dataPoints.length > 0
    ? premiumData.dataPoints.map((p) => fullMonthLabels[(p.monthNumber ?? 1) - 1])
    : fullMonthLabels;
  const premiumMax = Math.max(
    ...premiumData.dataPoints.flatMap((p) => Object.values(p.cumulativeValueByYear ?? {}).map(Number)),
    1
  );
  const premiumYStep = premiumMax / 8;
  const premiumYLabels = Array.from({ length: 8 }, (_, i) => {
    const val = premiumMax - premiumYStep * i;
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${Math.round(val / 1000)}k`;
    return String(Math.round(val));
  });
  const premiumTooltipData = premiumData.dataPoints.map((p, idx) => ({
    label: fullMonthLabels[(p.monthNumber ?? 1) - 1],
    yearValues: selectedYearSeries
      .filter((s) => s.values[idx] !== null)
      .map((s) => ({
        year: s.year,
        value: s.values[idx] ?? 0,
        color: yearColorValues[yearOptions.indexOf(s.year)],
      })),
  }));
  const currentMonthPoint = premiumData.dataPoints.find((p) => p.monthNumber === currentMonthNum);
  const currentYearTotal = Number(currentMonthPoint?.cumulativeValueByYear?.[year] ?? 0);
  const prevYearTotal = Number(currentMonthPoint?.cumulativeValueByYear?.[year - 1] ?? 0);
  const growthPct = prevYearTotal > 0 ? ((currentYearTotal - prevYearTotal) / prevYearTotal) * 100 : null;

  useEffect(() => {
    setVisibleYears((current) => ({
      [year]: current[year] ?? true,
      [year - 1]: current[year - 1] ?? true,
      [year - 2]: current[year - 2] ?? false,
      [year - 3]: current[year - 3] ?? false,
    }));
  }, [year]);

  if (loading) {
    return <div className="statistics-table-state">Ucitavanje prodajne statistike...</div>;
  }

  if (error) {
    return <div className="statistics-table-state error">{error}</div>;
  }

  return (
    <div className="sales-stats-view">
      <SalesHeader
        title="Pregled datuma produženja polica i vrijednosti polica"
        description="Pregled broja polica po tjednima i vrijednosti polica po kriterijima"
      />

      <section className="statistics-panel sales-wide-card">
        <div className="sales-card-head">
          <div>
            <h3>Pregled grafa za broj polica po danima</h3>
            <p>Pregled broja polica po datumu unosa</p>
            <div className="sales-period-pills">
              {["1T", "1M", "3M", "YTD", "1G", "Max"].map((label) => (
                <button
                  type="button"
                  className={label === policyPeriod ? "active" : ""}
                  key={label}
                  onClick={() => setPolicyPeriod(label)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="sales-card-total">
            <strong>{totalCount.toLocaleString("hr-HR")}</strong>
            <span>polica osiguranja</span>
            <em>{formatCurrency(totalPremium)}</em>
          </div>
        </div>
        <SparkLineChart labels={policyLabels} series={policySeries} filled tooltipData={chartData.dataPoints} />
      </section>

      <section className="statistics-panel sales-wide-card">
        <div className="sales-card-head">
          <div>
            <h3>Vrijednost polica</h3>
            <p>Pregled vrijednosti polica osiguranja s prethodnim godinama</p>
            <div className="sales-legend">
              {yearOptions.map((yearOption, index) => (
                <label key={yearOption}>
                  <input
                    type="checkbox"
                    checked={Boolean(visibleYears[yearOption])}
                    onChange={(event) => {
                      setVisibleYears((current) => ({
                        ...current,
                        [yearOption]: event.target.checked,
                      }));
                    }}
                  />
                  <i className={yearColors[index]} />
                  {yearOption}
                </label>
              ))}
            </div>
          </div>
          <div className="sales-card-comparison">
            <span>{year - 1}<strong>{formatCurrency(prevYearTotal)}</strong></span>
            <em>vs</em>
            <span>{year}<strong>{formatCurrency(currentYearTotal)}</strong></span>
            {growthPct !== null && (
              <small className={growthPct < 0 ? "negative" : ""}>
                {growthPct >= 0 ? "+" : ""}{growthPct.toFixed(1).replace(".", ",")} %
              </small>
            )}
          </div>
        </div>
        <SparkLineChart
          labels={premiumLabels}
          series={firstYearSeries}
          extraSeries={additionalYearSeries}
          yLabels={premiumYLabels}
          tooltipData={premiumTooltipData.length > 0 ? premiumTooltipData : null}
        />
      </section>

      <SalesHeader
        title="Pregled statistike osiguravajućih kuća, partnera i lokacija"
        description="Pregled kreiranih polica, osiguravajućih kuća, partnera te lokacija po zadanom kriteriju"
      />

      <div className="sales-bottom-grid">
        <div className="sales-left-column">
          <SalesCreatedPoliciesCard creationStats={creationStats} />
          <SalesLocationsCard items={locations} />
        </div>
        <SalesCompaniesCard items={companies} />
      </div>
        <SalesPartnersCard items={partners} />
    </div>
  );
}

function StatisticsTable({ items, loading, error, hasFilters, onClearFilters }) {
  if (loading) {
    return <div className="statistics-table-state">Ucitavanje podataka...</div>;
  }

  if (error) {
    return <div className="statistics-table-state error">{error}</div>;
  }

  if (!items.length) {
    return (
      <div className="table-card policies-empty-state">
        <img src="/images/folder-dynamic-color.png" alt="" className="policies-empty-img" />
        <h3 className="policies-empty-title">Nema rezultata</h3>
        <p className="policies-empty-subtitle">
          {hasFilters
            ? "Pokušajte promijeniti filtere ili upisati drugačiji pojam za pretragu."
            : "Nema danas unesenih polica."}
        </p>
        {hasFilters && (
          <div className="policies-empty-actions">
            <button type="button" className="policies-empty-btn outline" onClick={onClearFilters}>Očisti pretragu</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="table-card statistics-table-card">
      <div className="table-scroll">
        <table className="alpha-table statistics-table">
          <thead>
            <tr>
              <th>Broj police</th>
              <th>Ugovaratelj</th>
              <th>Datum produženja</th>
              <th>Osiguravajuća kuća</th>
              <th>Premija</th>
              <th>Prodajno mjesto</th>
              <th>Policu izradio/la</th>
              <th>Produženje police</th>
            </tr>
          </thead>

          <tbody>
            {items.map((policy) => (
              <tr key={`${policy.policyNumber}-${policy.previousPolicy || "new"}`}>
                <td>{policy.policyNumber}</td>
                <td>{policy.clientName}</td>
                <td>{formatDate(policy.startingDate)}</td>
                <td>{policy.insuranceCompany}</td>
                <td>{formatCurrency(policy.price)}</td>
                <td>{policy.location}</td>
                <td>{policy.enteredBy}</td>
                <td>{policy.renewalPolicy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  const currentYear = new Date().getFullYear();
  const currentUser = getCurrentUser();
  const isAdmin = String(currentUser.role).toLowerCase() === "admin";
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(initialSummary);
  const [locationChart, setLocationChart] = useState([]);
  const [unrenewedPolicies, setUnrenewedPolicies] = useState({ count: 0, priceSum: 0 });
  const [expiringPolicies, setExpiringPolicies] = useState({ count: 0, priceSum: 0 });
  const [topPartners, setTopPartners] = useState([]);
  const [agentSummary, setAgentSummary] = useState(null);
  const [salesStats, setSalesStats] = useState(emptySalesStatistics);
  const [salesFilters, setSalesFilters] = useState({
    dateFrom: "",
    dateTo: "",
    insuranceCompany: "",
    partner: "",
    insuranceType: "",
    location: "",
  });
  const [filterOptions, setFilterOptions] = useState({
    insuranceCompanies: [],
    partners: [],
    insuranceTypes: [],
    locations: [],
  });
  const [todaysFilterOptions, setTodaysFilterOptions] = useState({ agents: [], locations: [] });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState("");
  const [location, setLocation] = useState("");
  const [policyKinds, setPolicyKinds] = useState([]);
  const [period, setPeriod] = useState("last7");
  const [year, setYear] = useState(currentYear);
  const [activeTab, setActiveTab] = useState("overview");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [salesLoading, setSalesLoading] = useState(false);
  const [error, setError] = useState("");
  const [salesError, setSalesError] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPageNumber(1);
      setSearch(searchInput.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchTodayStatistics({
        search,
        user,
        location,
        period,
        year,
        includeAdminBreakdown: isAdmin,
        pageNumber,
        pageSize: PAGE_SIZE,
      });

      setItems((data.items ?? []).map(normalizeTodayPolicy));
      setSummary(data.summary ?? initialSummary);
      setLocationChart(data.locationChart ?? []);
      setUnrenewedPolicies(data.unrenewedPolicies ?? { count: 0, priceSum: 0 });
      setExpiringPolicies(data.expiringPolicies ?? { count: 0, priceSum: 0 });
      setTopPartners(data.topPartners ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch {
      setItems([]);
      setSummary(initialSummary);
      setLocationChart([]);
      setUnrenewedPolicies({ count: 0, priceSum: 0 });
      setExpiringPolicies({ count: 0, priceSum: 0 });
      setTopPartners([]);
      setTotalPages(1);
      setError("Ne mogu dohvatiti statistiku. Provjeri backend i bazu.");
    } finally {
      setLoading(false);
    }
  }, [search, user, location, period, year, isAdmin, pageNumber]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  useEffect(() => {
    fetchTodaysFilterOptions()
      .then((data) => setTodaysFilterOptions(data ?? { agents: [], locations: [] }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isAdmin) return;
    fetchAgentSummary()
      .then((data) => setAgentSummary(data))
      .catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;

    fetchStatisticsFilterOptions()
      .then((options) => {
        if (isMounted) {
          setFilterOptions({
            insuranceCompanies: options.insuranceCompanies ?? [],
            partners: options.partners ?? [],
            insuranceTypes: options.insuranceTypes ?? [],
            locations: options.locations ?? [],
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setFilterOptions({
            insuranceCompanies: [],
            partners: [],
            insuranceTypes: [],
            locations: [],
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  const loadSalesStatistics = useCallback(async () => {
    if (!isAdmin || activeTab !== "sales") return;

    setSalesLoading(true);
    setSalesError("");

    try {
      const data = await fetchSalesStatistics({
        ...salesFilters,
        year,
      });

      setSalesStats(data ?? emptySalesStatistics);
    } catch (requestError) {
      setSalesStats(emptySalesStatistics);
      setSalesError(requestError.message || "Ne mogu dohvatiti prodajnu statistiku. Provjeri backend i bazu.");
    } finally {
      setSalesLoading(false);
    }
  }, [activeTab, isAdmin, salesFilters, year]);

  useEffect(() => {
    loadSalesStatistics();
  }, [loadSalesStatistics]);

  const visibleItems = useMemo(() => {
    if (policyKinds.length === 0 || policyKinds.length === 2) {
      return items;
    }

    if (policyKinds.includes("new")) {
      return items.filter((item) => !String(item.previousPolicy).trim());
    }

    if (policyKinds.includes("renewed")) {
      return items.filter((item) => String(item.previousPolicy).trim());
    }

    return items;
  }, [items, policyKinds]);

  const users = todaysFilterOptions.agents;
  const locations = todaysFilterOptions.locations;

  const averageDelta = Math.round(summary.todayVsAverageDifference ?? 0);
  const averageNote =
    averageDelta >= 0
      ? `+${averageDelta}% vise od prosjeka po danu`
      : `${averageDelta}% manje od prosjeka po danu`;

  const changePolicyKind = (kind, checked) => {
    setPolicyKinds((current) => {
      if (checked) {
        return current.includes(kind) ? current : [...current, kind];
      }

      return current.filter((item) => item !== kind);
    });
    setPageNumber(1);
  };

  return (
    <div className="dashboard-page">
      <Sidebar />

      <main className="main-panel">
        <SummaryBar />

        <section className="statistics-hero">
          <div className="welcome-block">
            <div className="welcome-breadcrumbs">
              <div className="welcome-breadcrumb-brand">
                <div className="welcome-breadcrumb-logo">
                  <img src="/images/Alpha logo frame.png" alt="Alpha logo" />
                </div>
                <span className="welcome-breadcrumb-muted">Alpha zastupanje</span>
              </div>
              <img className="welcome-breadcrumb-arrow" src="/svg/arrow-right.svg" alt="" />
              <span className="welcome-breadcrumb-current">Statistika</span>
            </div>

            <div className="statistics-title-row">
              <div className="welcome-title-box">
                <h1>Pregled statistike</h1>
                <p>Pregled i filtriranje dnevne statistike za zaposlenike</p>
              </div>

              <select
                className="statistics-year-select"
                value={year}
                onChange={(event) => {
                  setYear(Number(event.target.value));
                  setPageNumber(1);
                }}
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((yearOption) => (
                  <option key={yearOption} value={yearOption}>
                    {yearOption}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="statistics-cards-grid">
            {isAdmin ? (
              <>
                <StatisticCard
                  title="Unesenih polica od početka godine"
                  value={summary.yearPoliciesCount}
                  note="naspram prosle godine"
                />
                <StatisticCard
                  title="Broj danas unesenih polica"
                  value={summary.todayPoliciesCount}
                  note={averageNote}
                  positive={averageDelta >= 0}
                />
                <StatisticCard
                  title="Suma premija danas unesenih polica"
                  value={formatCurrency(summary.todayPremiumSum)}
                  note="za sve lokacije"
                />
                <StatisticCard
                  title="Suma premija od početka godine"
                  value={formatCurrency(summary.yearPremiumSum)}
                  note="za sve lokacije"
                />
              </>
            ) : (
              <>
                <StatisticCard
                  title="Broj polica na kojima sam ja partner"
                  value={agentSummary?.partnerPoliciesYTD ?? "—"}
                  note="od početka godine"
                />
                <StatisticCard
                  title="Broj danas unesenih polica"
                  value={agentSummary?.myPoliciesToday ?? "—"}
                  note="koje sam ja unio"
                />
                <StatisticCard
                  title="Broj danas unesenih polica"
                  value={agentSummary?.allPoliciesToday ?? "—"}
                  note="za sve lokacije"
                />
                <StatisticCard
                  title="Broj danas unesenih polica"
                  value={agentSummary?.locationPoliciesToday ?? "—"}
                  note="za moju lokaciju"
                />
              </>
            )}
          </div>
        </section>

        <section className="statistics-content">
          {isAdmin && (
            <>
              <div className="statistics-tabs">
                <button
                  type="button"
                  className={activeTab === "overview" ? "active" : ""}
                  onClick={() => setActiveTab("overview")}
                >
                  Brzi pregled
                </button>
                <button
                  type="button"
                  className={activeTab === "sales" ? "active" : ""}
                  onClick={() => setActiveTab("sales")}
                >
                  Prodaja
                </button>
              </div>

              {activeTab === "sales" && (
                <SalesFilterBar
                  filters={salesFilters}
                  options={filterOptions}
                  onChange={setSalesFilters}
                />
              )}

              {activeTab === "overview" && (
                <div className="statistics-overview-grid">
                  <LocationBarChart
                    items={locationChart}
                    period={period}
                    onPeriodChange={(value) => {
                      setPeriod(value);
                      setPageNumber(1);
                    }}
                  />

                  <QuickStats
                    unrenewed={unrenewedPolicies}
                    expiring={expiringPolicies}
                    topPartners={topPartners}
                    period={period}
                    onPeriodChange={(value) => {
                      setPeriod(value);
                      setPageNumber(1);
                    }}
                  />
                </div>
              )}
            </>
          )}

          {isAdmin && activeTab === "sales" ? (
            <SalesStatsView
              salesStats={salesStats}
              year={year}
              salesFilters={salesFilters}
              loading={salesLoading}
              error={salesError}
            />
          ) : (
            <>
              <div className="statistics-heading">
                <h2>Danas unesene police</h2>
                <p>Pregled danas unesenih polica osiguranja</p>
              </div>

              <div className="statistics-toolbar">
                <div className="toolbar-left statistics-filters">
                  <label className="search-box">
                    <span className="search-box-left">
                      <i>
                        <img src="/svg/search.svg" alt="" />
                      </i>
                      <input
                        className="search-input"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder="Pretraživanje..."
                      />
                    </span>
                    <small>CTRL + K</small>
                  </label>

                  <select
                    className="statistics-select"
                    value={user}
                    onChange={(event) => {
                      setUser(event.target.value);
                      setPageNumber(1);
                    }}
                  >
                    <option value="">Korisnik</option>
                    {users.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="statistics-select"
                    value={location}
                    onChange={(event) => {
                      setLocation(event.target.value);
                      setPageNumber(1);
                    }}
                  >
                    <option value="">Prodajno mjesto</option>
                    {locations.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="statistics-checks">
                  <label>
                    <input
                      type="checkbox"
                      checked={policyKinds.includes("new")}
                      onChange={(event) => changePolicyKind("new", event.target.checked)}
                    />
                    <span>Nove police</span>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={policyKinds.includes("renewed")}
                      onChange={(event) => changePolicyKind("renewed", event.target.checked)}
                    />
                    <span>Produžene police</span>
                  </label>
                </div>
              </div>

              <div className={totalPages <= 1 ? "statistics-table-wrap no-pagination" : "statistics-table-wrap"}>
                <StatisticsTable
                  items={visibleItems}
                  loading={loading}
                  error={error}
                  hasFilters={!!(search || user || location || policyKinds.length > 0)}
                  onClearFilters={() => { setSearchInput(""); setUser(""); setLocation(""); setPolicyKinds([]); }}
                />

                <Pagination
                  pageNumber={pageNumber}
                  totalPages={totalPages}
                  onPageChange={setPageNumber}
                />
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
