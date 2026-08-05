

export default function ContractorDetailsForm({
  values,
  onChange,
  onSubmit,
  canSubmit,
  submitLabel,
  radioName = "contractorPersonType",
  currentContractor,
  showCurrentContractor = false,
  useNameInput = false,
  className = "",
}) {
  return (
    <form
      className={`change-contractor-form ${className}`.trim()}
      onSubmit={onSubmit}
    >
      {showCurrentContractor && currentContractor ? (
        <>
          <div className="form-group">
            <label htmlFor="current-oib">OIB</label>
            <input
              id="current-oib"
              type="text"
              value={currentContractor.oib}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="current-client-name">Ugovaratelj</label>
            <input
              id="current-client-name"
              type="text"
              value={currentContractor.clientName}
              disabled
            />
          </div>

          <div className="change-contractor-divider">
            <span />
            <button type="button" aria-label="Zamjena ugovaratelja">
              <span aria-hidden="true">↺</span>
            </button>
            <span />
          </div>
        </>
      ) : null}

      <div className="form-group">
        <label htmlFor="contractor-oib">OIB</label>
        <input
          id="contractor-oib"
          type="text"
          value={values.oib}
          onChange={(event) =>
            onChange("oib", event.target.value.replace(/\D/g, "").slice(0, 11))
          }
          placeholder="37315905543"
          maxLength={11}
        />
      </div>

      <div className="form-group">
        <label htmlFor="contractor-client-name">Ugovaratelj</label>
        {useNameInput ? (
          <input
            id="contractor-client-name"
            type="text"
            value={values.clientName}
            onChange={(event) => onChange("clientName", event.target.value)}
            placeholder="Antonio Hibl"
          />
        ) : (
          <div className="select-wrap">
            <select
              id="contractor-client-name"
              value={values.clientName}
              onChange={(event) => onChange("clientName", event.target.value)}
            >
              <option value={values.clientName}>{values.clientName}</option>
              <option value="HIBL ANTONIO">HIBL ANTONIO</option>
              <option value="ANTONIO HIBL">ANTONIO HIBL</option>
            </select>
            <img
              src="/svg/arrow-down.svg"
              alt=""
              className="select-arrow"
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      <div className="person-type-row">
        <label className="checkbox-pill">
          <input
            type="radio"
            name={radioName}
            checked={values.personType === "fizicka"}
            onChange={() => onChange("personType", "fizicka")}
          />
          <span>Fizička osoba</span>
        </label>

        <label className="checkbox-pill">
          <input
            type="radio"
            name={radioName}
            checked={values.personType === "firma"}
            onChange={() => onChange("personType", "firma")}
          />
          <span>Firma</span>
        </label>

        <label className="checkbox-pill">
          <input
            type="radio"
            name={radioName}
            checked={values.personType === "obrt"}
            onChange={() => onChange("personType", "obrt")}
          />
          <span>Obrt</span>
        </label>
      </div>

      <div className="form-group">
        <label htmlFor="contractor-email">Email adresa</label>
        <input
          id="contractor-email"
          type="text"
          value={values.email}
          onChange={(event) => onChange("email", event.target.value)}
          placeholder="antoniohibl@gmail.com"
        />
      </div>

      <div className="form-grid two">
        <div className="form-group">
          <label htmlFor="contractor-dob">Datum rođenja</label>
          <input
            id="contractor-dob"
            type="text"
            value={values.dob}
            onChange={(event) => onChange("dob", event.target.value)}
            placeholder="12.10.2003."
          />
        </div>

        <div className="form-group">
          <label htmlFor="contractor-phone-number">Broj mobitela</label>
          <input
            id="contractor-phone-number"
            type="text"
            value={values.phoneNumber}
            onChange={(event) =>
              onChange("phoneNumber", event.target.value.replace(/[^\d+]/g, ""))
            }
            placeholder="097 787 70 51"
          />
        </div>
      </div>

      <button type="submit" className="submit-dark-btn" disabled={!canSubmit}>
        {submitLabel}
      </button>
    </form>
  );
}
