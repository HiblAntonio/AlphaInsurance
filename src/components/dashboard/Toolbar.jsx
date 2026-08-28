import React from "react";

export default function Toolbar({
  search,
  onSearchChange,
  year,
  years,
  onYearChange,
  isAsc,
  onToggleSort,
  onOpenFilter,
}) {
  return (
    <div className="toolbar-row">
      <div className="toolbar-left">
        <form
          className="search-box"
          onSubmit={(e) => e.preventDefault()}
          role="search"
        >
          <label htmlFor="searchPolicies" className="visually-hidden">
            Pretraživanje polica
          </label>

          <div className="search-box-left">
            <i>
              <img src="/svg/search.svg" alt="" />
            </i>
            <input
              type="search"
              id="searchPolicies"
              name="search"
              className="search-input"
              placeholder="Pretraživanje..."
              autoComplete="off"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <small>CTRL + K</small>
        </form>

        <label className="year-filter">
          <select
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              outline: "none",
              font: "inherit",
              cursor: "pointer",
            }}
          >
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="toolbar-actions">
        <button type="button" className="filter-button" onClick={onOpenFilter}>
          <i>
            <img src="/svg/filter.svg" alt="" />
          </i>
          Filter
        </button>

        <button type="button" className="sort-button" onClick={onToggleSort}>
          <i>
            <img src="/svg/sort.svg" alt="" />
          </i>
          Sortiranje 
        </button>
      </div>
    </div>
  );
}
