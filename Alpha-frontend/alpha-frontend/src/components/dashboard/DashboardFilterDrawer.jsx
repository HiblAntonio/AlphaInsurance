import { useEffect, useRef, useState } from "react";
import { fetchDashboardFilterOptions } from "../../services/policiesService";

const initialFilters = {
  dateFrom: "",
  dateTo: "",
  priceFrom: "",
  priceTo: "",
  insuranceCompany: [],
  insuranceType: [],
  location: [],
  partner: [],
};

export { initialFilters };

function CheckboxDropdown({ name, items, selected, placeholder, onToggle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? selected[0]
      : `${selected.length} odabrano`;

  return (
    <div className="filter-dropdown" ref={ref}>
      <button
        type="button"
        className={`filter-dropdown-trigger${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={selected.length === 0 ? "filter-dropdown-placeholder" : ""}>
          {label}
        </span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6L8 10L12 6" stroke="#464646" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="filter-dropdown-menu">
          {items.map((item) => (
            <label key={item} className="filter-checkbox-item">
              <input
                type="checkbox"
                checked={selected.includes(item)}
                onChange={() => onToggle(name, item)}
              />
              {item}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DashboardFilterDrawer({
  open,
  filters,
  year,
  onClose,
  onApply,
}) {
  const [draft, setDraft] = useState(initialFilters);
  const [options, setOptions] = useState({ companies: [], policyTypes: [], locations: [], partners: [] });

  useEffect(() => {
    fetchDashboardFilterOptions()
      .then(setOptions)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      setDraft(filters);
    }
  }, [filters, open]);

  if (!open) return null;

  const updateField = (name, value) => {
    setDraft((prev) => ({ ...prev, [name]: value }));
  };

  const toggleArrayField = (name, value) => {
    setDraft((prev) => {
      const current = Array.isArray(prev[name]) ? prev[name] : [];
      return {
        ...prev,
        [name]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
  };

  const parseDateText = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const match = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.?$/);
    if (match) {
      const [, day, month] = match;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return trimmed;
  };

  const formatDateDisplay = (iso) => {
    if (!iso) return "";
    const m = iso.match(/^\d{4}-(\d{2})-(\d{2})/);
    if (m) return `${m[2]}.${m[1]}.`;
    return iso;
  };

  const maskDateInput = (raw) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  };

  const updateDate = (name, value) => updateField(name, maskDateInput(value));

  const commitDate = (name, value) => {
    const parsed = parseDateText(value);
    if (parsed) {
      const m = parsed.match(/^\d{4}-(\d{2})-(\d{2})$/);
      if (m) {
        const month = parseInt(m[1], 10);
        const day = parseInt(m[2], 10);
        if (day < 1 || day > 31 || month < 1 || month > 12) {
          updateField(name, "");
          return;
        }
      }
    }
    updateField(name, parsed);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onApply(draft);
  };

  return (
    <div className="dashboard-filter-overlay" role="presentation">
      <aside
        className="dashboard-filter-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-filter-title"
      >
        <form className="dashboard-filter-form" onSubmit={handleSubmit}>
          <div className="dashboard-filter-header">
            <button
              type="button"
              className="dashboard-filter-back"
              onClick={onClose}
              aria-label="Zatvori filtriranje"
            >
              <img src="/svg/arrow-left.svg" alt="" />
            </button>

            <div>
              <h2 id="dashboard-filter-title">Filtriranje polica</h2>
              <p>Postavljanje parametara za filtriranje polica osiguranja</p>
            </div>
          </div>

          <div className="dashboard-filter-fields">
            <div className="dashboard-filter-group">
              <label>Raspon datuma</label>
              <div className="dashboard-filter-range">
                <input
                  type="text"
                  value={formatDateDisplay(draft.dateFrom)}
                  placeholder="DD.MM."
                  maxLength={5}
                  onChange={(e) => updateDate("dateFrom", e.target.value)}
                  onBlur={(e) => commitDate("dateFrom", e.target.value)}
                />
                <span />
                <input
                  type="text"
                  value={formatDateDisplay(draft.dateTo)}
                  placeholder="DD.MM."
                  maxLength={5}
                  onChange={(e) => updateDate("dateTo", e.target.value)}
                  onBlur={(e) => commitDate("dateTo", e.target.value)}
                />
              </div>
            </div>

            <div className="dashboard-filter-group">
              <label>Premija</label>
              <div className="dashboard-filter-range">
                <input
                  type="number"
                  min="0"
                  value={draft.priceFrom}
                  onChange={(e) => updateField("priceFrom", e.target.value)}
                  placeholder="0"
                />
                <span />
                <input
                  type="number"
                  min="0"
                  value={draft.priceTo}
                  onChange={(e) => updateField("priceTo", e.target.value)}
                  placeholder="200"
                />
              </div>
            </div>

            <div className="dashboard-filter-group">
              <label>Osiguravajuća kuća</label>
              <CheckboxDropdown
                name="insuranceCompany"
                items={options.companies}
                selected={draft.insuranceCompany ?? []}
                placeholder="Sve"
                onToggle={toggleArrayField}
              />
            </div>

            <div className="dashboard-filter-group">
              <label>Vrsta osiguranja</label>
              <CheckboxDropdown
                name="insuranceType"
                items={options.policyTypes}
                selected={draft.insuranceType ?? []}
                placeholder="Sve"
                onToggle={toggleArrayField}
              />
            </div>

            <div className="dashboard-filter-group">
              <label>Prodajno mjesto</label>
              <CheckboxDropdown
                name="location"
                items={options.locations}
                selected={draft.location ?? []}
                placeholder="Sva"
                onToggle={toggleArrayField}
              />
            </div>

            <div className="dashboard-filter-group">
              <label>Partneri</label>
              <CheckboxDropdown
                name="partner"
                items={options.partners}
                selected={draft.partner ?? []}
                placeholder="Svi"
                onToggle={toggleArrayField}
              />
            </div>
          </div>

          <div className="dashboard-filter-actions">
            <button type="button" className="dashboard-filter-cancel" onClick={onClose}>
              Odustani
            </button>
            <button type="submit" className="dashboard-filter-apply">
              Primjeni filter
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}
