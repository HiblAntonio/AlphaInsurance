import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

const CURRENT_VERSION = "1.0.0.";
const STORAGE_KEY = "dante_last_seen_version";

// Prevent re-showing on every page navigation within a session
let shownThisSession = false;

const CHANGES = [
  "Odabir datuma rođenja putem kalendara prilikom unosa novog klijenta.",
];

export default function WhatsNewModal({ open, onClose }) {
  const controlled = open !== undefined;
  const [autoVisible, setAutoVisible] = useState(false);

  useEffect(() => {
    if (controlled) return;
    if (shownThisSession) return;
    const lastSeen = localStorage.getItem(STORAGE_KEY);
    if (lastSeen !== CURRENT_VERSION) {
      setAutoVisible(true);
      shownThisSession = true;
    }
  }, [controlled]);

  const visible = controlled ? open : autoVisible;

  function close() {
    if (controlled) { onClose?.(); return; }
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    setAutoVisible(false);
  }

  if (!visible) return null;

  return ReactDOM.createPortal(
    <div className="whats-new-overlay" onClick={close}>
      <div className="whats-new-modal" onClick={(e) => e.stopPropagation()}>
        <div className="whats-new-header">
          <div className="whats-new-badge">Novo</div>
          <h2>Što je novo u verziji {CURRENT_VERSION}?</h2>
          <p>Pregled novih funkcionalnosti i poboljšanja</p>
        </div>

        <ul className="whats-new-list">
          {CHANGES.map((change, i) => (
            <li key={i}>
              <span className="whats-new-dot" />
              {change}
            </li>
          ))}
        </ul>

        <div className="whats-new-footer">
          <button type="button" className="whats-new-btn" onClick={close}>
            Razumijem, nastavi
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
