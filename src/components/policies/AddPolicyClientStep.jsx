import React from "react";

export default function AddPolicyClientStep({
  values,
  onChange,
  onClientSelect,
  onNext,
  canGoNext,
  clientOptions = [],
  clientsLoading = false,
  clientLookupMessage = "",
  clientFieldsOpen = false,
  onOpenClientFields,
  onBackToClientSelect,
  birthDateError = "",
}) {
  const hasClientOptions = clientOptions.length > 0;

  const openClientFields = () => {
    onOpenClientFields?.();
  };

  const handleClientNameChange = (value) => {
    openClientFields();
    onChange("clientName", value);
  };

  return (
    <section className="add-policy-step-content">
      <div className="add-policy-form narrow">
        <div className="form-group">
          <label htmlFor="oib">OIB</label>
          <input
            id="oib"
            type="text"
            value={values.oib}
            onChange={(e) => onChange("oib", e.target.value)}
            maxLength={11}
            inputMode="numeric"
          />
          {(clientsLoading || clientLookupMessage) && (
            <small>{clientsLoading ? "Provjera ugovaratelja..." : clientLookupMessage}</small>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="clientName">Ugovaratelj</label>

          {hasClientOptions && !clientFieldsOpen ? (
            <div className={`select-wrap ${values.clientId ? "has-value" : ""}`}>
              <select
                id="clientName"
                value={values.clientId}
                onChange={(e) => onClientSelect(e.target.value)}
              >
                {clientOptions.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
                <option value="__new__">Unesi novog ugovaratelja</option>
              </select>

              <img
                src="/svg/arrow-down.svg"
                alt=""
                className="select-arrow"
                aria-hidden="true"
              />
            </div>
          ) : (
            <div className={`client-select-field ${clientFieldsOpen ? "active" : ""}`}>
              <input
                id="clientName"
                type="text"
                value={values.clientName}
                onClick={openClientFields}
                onFocus={openClientFields}
                onChange={(e) => handleClientNameChange(e.target.value)}
              />
              <button
                type="button"
                className={`client-select-arrow-btn ${clientFieldsOpen && hasClientOptions ? "back-active" : ""}`}
                onClick={clientFieldsOpen && hasClientOptions ? () => onBackToClientSelect?.() : openClientFields}
                aria-label={clientFieldsOpen && hasClientOptions ? "Povratak na odabir ugovaratelja" : "Otvori polje"}
                tabIndex={-1}
              >
                <img
                  src="/svg/arrow-down.svg"
                  alt=""
                  aria-hidden="true"
                />
              </button>
            </div>
          )}
        </div>

        <div className={`client-extra-fields ${clientFieldsOpen ? "open" : ""}`}>
          <div className="form-group">
            <label htmlFor="email">Email adresa</label>
            <input
              id="email"
              type="email"
              value={values.email}
              onChange={(e) => onChange("email", e.target.value)}
            />
          </div>

          <div className="form-grid two client-details-grid">
            <div className="form-group">
              <label htmlFor="birthDate">Datum rođenja</label>
              <input
                id="birthDate"
                type="date"
                value={values.birthDate}
                onChange={(e) => onChange("birthDate", e.target.value)}
                min="1900-01-01"
                max="2026-12-31"
              />
              {birthDateError && <small style={{ color: "#d92d20" }}>{birthDateError}</small>}
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Broj mobitela</label>
              <input
                id="phoneNumber"
                type="tel"
                value={values.phoneNumber}
                onChange={(e) => onChange("phoneNumber", e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          className="submit-dark-btn"
          onClick={onNext}
          disabled={!canGoNext}
        >
          Sljedeći korak
        </button>
      </div>
    </section>
  );
}
