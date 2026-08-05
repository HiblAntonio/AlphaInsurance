import React from "react";

export default function AddPolicyPolicyStep({
  values,
  onChange,
  onPremiumBlur,
  canSubmit,
  options = {},
  isSubmitting = false,
  useDatePicker = false,
  startDateMin = "",
  submitLabel = "Dodaj policu osiguranja",
}) {
  const locations = options.locations || [];
  const insuranceCompanies = options.insuranceCompanies || [];
  const partners = options.partners || [];
  const insuranceTypes = options.insuranceTypes || [];

  return (
    <section className="add-policy-step-content add-policy-policy-step">
      <div className="add-policy-form narrow">
        <div className="form-group">
          <label htmlFor="policyNumber">Broj police</label>
          <input
            id="policyNumber"
            type="text"
            value={values.policyNumber}
            onChange={(e) => onChange("policyNumber", e.target.value)}
          />
        </div>

        <div className="form-grid two">
          <div className="form-group">
            <label htmlFor="startDate">Datum početka osiguranja</label>
            <input
              id="startDate"
              type="text"
              value={values.startDate}
              onChange={(e) => onChange("startDate", e.target.value)}
              placeholder="DD.MM.YYYY"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Prodajno mjesto</label>
            <div className={`select-wrap ${values.location ? "has-value" : ""}`}>
              <select
                id="location"
                value={values.location}
                onChange={(e) => onChange("location", e.target.value)}
              >
                <option value="">Prodajno mjesto</option>
                {locations.map((location) => (
                  <option key={location.id || location.name} value={location.name}>
                    {location.name}
                  </option>
                ))}
              </select>

              <img
                src="/svg/arrow-down.svg"
                alt=""
                className="select-arrow"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="insuranceCompany">Osiguravajuća kuća</label>
            <div className={`select-wrap ${values.insuranceCompany ? "has-value" : ""}`}>
              <select
                id="insuranceCompany"
                value={values.insuranceCompany}
                onChange={(e) => onChange("insuranceCompany", e.target.value)}
              >
                <option value="">Osiguravajuća kuća</option>
                {insuranceCompanies.map((company) => (
                  <option key={company.id || company.name} value={company.name}>
                    {company.name}
                  </option>
                ))}
              </select>

              <img
                src="/svg/arrow-down.svg"
                alt=""
                className="select-arrow"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="partner">Partner</label>
            <div className={`select-wrap ${values.partner ? "has-value" : ""}`}>
              <select
                id="partner"
                value={values.partner}
                onChange={(e) => onChange("partner", e.target.value)}
                disabled={values.noPartner}
              >
                <option value="">Odaberi partnera</option>
                {partners.map((partner) => (
                  <option key={partner.id || partner.name} value={partner.name}>
                    {partner.name}
                  </option>
                ))}
              </select>

              <img
                src="/svg/arrow-down.svg"
                alt=""
                className="select-arrow"
                aria-hidden="true"
              />
            </div>

            <label className="checkbox-inline">
              <input
                type="checkbox"
                checked={values.noPartner}
                onChange={(e) => onChange("noPartner", e.target.checked)}
              />
              <span>Bez partnera</span>
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="insuranceType">Vrsta osiguranja</label>
            <div className={`select-wrap ${values.insuranceType ? "has-value" : ""}`}>
              <select
                id="insuranceType"
                value={values.insuranceType}
                onChange={(e) => onChange("insuranceType", e.target.value)}
              >
                <option value="">Odaberi</option>
                {insuranceTypes.map((insuranceType) => (
                  <option
                    key={insuranceType.id || insuranceType.name}
                    value={insuranceType.name}
                  >
                    {insuranceType.name}
                  </option>
                ))}
              </select>

              <img
                src="/svg/arrow-down.svg"
                alt=""
                className="select-arrow"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="premium">Premija</label>
            <div className="input-with-suffix">
              <input
                id="premium"
                type="text"
                inputMode="decimal"
                value={values.premium}
                onChange={(e) => onChange("premium", e.target.value)}
                onBlur={onPremiumBlur}
              />
              <span>EUR</span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="remark">Napomena</label>
          <textarea
            id="remark"
            rows="5"
            value={values.remark}
            onChange={(e) => onChange("remark", e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="submit-dark-btn"
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? "Spremanje..." : submitLabel}
        </button>
      </div>
    </section>
  );
}
