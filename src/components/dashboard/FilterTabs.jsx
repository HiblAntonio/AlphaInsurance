import React from "react";

export default function FilterTabs({ tabs, activeKey, onChange }) {
  return (
    <div className="filter-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key || "all"}
          type="button"
          className={`tab-link ${activeKey === tab.key ? "active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label} <span>{tab.count}</span>
        </button>
      ))}
    </div>
  );
}