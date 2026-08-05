import React from "react";

export default function StatsCard({ title, value, subtitle }) {
  return (
    <article className="stats-card">
      <span className="stats-label">{title}</span>
      <strong>{value}</strong>
      <p>{subtitle}</p>
    </article>
  );
}