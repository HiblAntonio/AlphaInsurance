import React from "react";
import CurrentPolicyCard from "./CurrentPolicyCard";

export default function CurrentPolicyPanel({ policy }) {
  return (
    <aside className="extend-policy-left">
      <h3>Podatci trenutne police</h3>

      <div className="extend-policy-stack">
        <CurrentPolicyCard
          label="Ugovaratelj"
          value={policy.clientName}
          subvalue={policy.clientOib}
          link
          large
        />

        <CurrentPolicyCard
          label="Broj police osiguranja"
          value={policy.policyNumber}
        />

        <CurrentPolicyCard
          label="Datum početka osiguranja"
          value={policy.startDate}
        />
      </div>
    </aside>
  );
}