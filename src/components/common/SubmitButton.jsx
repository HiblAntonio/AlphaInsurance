import React from "react";

export default function SubmitButton({ children }) {
  return (
    <button type="submit" className="submit-policy-btn">
      {children}
    </button>
  );
}