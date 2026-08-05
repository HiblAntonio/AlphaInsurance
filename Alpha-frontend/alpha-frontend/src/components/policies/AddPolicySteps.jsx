import React from "react";

export default function AddPolicySteps({
  currentStep,
  onStepChange,
  stepTwoUnlocked,
}) {
  return (
    <aside className="add-policy-steps">
      <span className="add-policy-steps-label">PODATCI</span>

      <div className="add-policy-steps-list">
        <button
          type="button"
          className={`add-policy-step ${currentStep === 1 ? "active" : ""}`}
          onClick={() => onStepChange(1)}
        >
          <img src="/svg/user.svg" alt="" />
          <span>Ugovaratelj</span>
        </button>

        <button
          type="button"
          className={`add-policy-step ${currentStep === 2 ? "active" : ""}`}
          onClick={() => onStepChange(2)}
          disabled={!stepTwoUnlocked}
        >
          <img src="/svg/note.svg" alt="" />
          <span>Polica osiguranja</span>
        </button>
      </div>
    </aside>
  );
}