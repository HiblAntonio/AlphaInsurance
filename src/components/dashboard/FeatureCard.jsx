import React from "react";
import { Link } from "react-router-dom";

export default function FeatureCard({ title, description, image, href, onClick }) {
  const inner = (
    <>
      <div className="feature-copy">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <img src={image} alt={title} />
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="feature-card feature-card-link" onClick={onClick}>
        {inner}
      </button>
    );
  }

  return (
    <Link to={href} className="feature-card feature-card-link">
      {inner}
    </Link>
  );
}