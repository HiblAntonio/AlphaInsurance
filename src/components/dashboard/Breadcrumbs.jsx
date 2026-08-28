import React from "react";
import { summaryItems } from "../../data/dashboardData";

export default function SummaryBar() {
  return (
    <section className="top-summary-bar">
      {summaryItems.map((item) => (
        <div className="summary-item" key={item.label}>
          <span>{item.label}</span>
          <strong className={item.isLink ? "summary-link" : ""}>
            {item.value}
          </strong>
        </div>
      ))}
    </section>
  );
}