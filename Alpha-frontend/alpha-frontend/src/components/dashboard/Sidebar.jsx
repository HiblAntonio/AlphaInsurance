import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { NavLink, useNavigate } from "react-router-dom";
import { sidebarMainMenu, sidebarSettingsMenu } from "../../data/dashboardData";
import { getCurrentUser, logout } from "../../services/authService";
import { fetchTodayPoliciesCount } from "../../services/policiesService";
import WhatsNewModal from "./WhatsNewModal";

export default function Sidebar() {
  const currentUser = getCurrentUser();
  const username = currentUser.username || "Korisnik";
  const role = currentUser.role || "Korisnik";
  const isAdmin = String(currentUser.role ?? "").toLowerCase() === "admin";
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [todayCount, setTodayCount] = useState(0);
  const btnRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    function load() {
      fetchTodayPoliciesCount()
        .then((count) => { if (!cancelled) setTodayCount(count); })
        .catch(() => {});
    }
    load();
    const interval = setInterval(load, 2 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const visibleMainMenu = sidebarMainMenu.filter(
    (item) => item.label !== "Zaposlenici" || isAdmin
  );

  const close = () => setIsOpen(false);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e) {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  function openMenu() {
    const rect = btnRef.current.getBoundingClientRect();
    setDropdownPos({ top: rect.bottom + 8, left: rect.left });
    setMenuOpen((v) => !v);
  }

  async function handleLogout() {
    setMenuOpen(false);
    try { await logout(); } catch {}
    navigate("/login");
  }

  return (
    <>
      <WhatsNewModal />
      {showWhatsNew && <WhatsNewModal open={showWhatsNew} onClose={() => setShowWhatsNew(false)} />}
      <button
        className="sidebar-hamburger"
        type="button"
        aria-label="Otvori meni"
        onClick={() => setIsOpen(true)}
      >
        <span />
        <span />
        <span />
      </button>

      {isOpen && (
        <div className="sidebar-overlay" aria-hidden="true" onClick={close} />
      )}

      <aside className={`sidebar-panel${isOpen ? " is-open" : ""}`}>
        <button
          className="sidebar-close"
          type="button"
          aria-label="Zatvori meni"
          onClick={close}
        >
          ×
        </button>

        <div className="sidebar-top">
          <div className="sidebar-user-card">
            <div className="sidebar-user-main">
              <div className="brand-badge">
                <img src="/images/Alpha logo frame.png" alt="Alpha logo" />
              </div>

              <div className="sidebar-user-copy">
                <strong>{username}</strong>
                <span>{role}</span>
              </div>
            </div>

            <div className="sidebar-user-menu">
              <button
                ref={btnRef}
                className="icon-btn"
                type="button"
                aria-label="Više opcija"
                onClick={openMenu}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </div>

          <div className="sidebar-tabs">
            <div className="sidebar-group">
              <div className="sidebar-heading">
                <span>MAIN MENU</span>
                <i>
                  <img src="/svg/arrow-down.svg" alt="" />
                </i>
              </div>

              <nav className="sidebar-nav">
                {visibleMainMenu.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.href}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? "active" : ""}`
                    }
                    onClick={close}
                  >
                    <i>
                      <img src={item.icon} alt="" />
                    </i>
                    <span>{item.label}</span>
                    {item.href === "/statistika" && todayCount > 0 ? (
                      <strong className="sidebar-count">{todayCount}</strong>
                    ) : item.href !== "/statistika" && item.count != null ? (
                      <strong className="sidebar-count">{item.count}</strong>
                    ) : null}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="sidebar-group">
              <div className="sidebar-heading">
                <span>POSTAVKE</span>
                <i>
                  <img src="/svg/arrow-down.svg" alt="" />
                </i>
              </div>

              <nav className="sidebar-nav">
                {sidebarSettingsMenu.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.href}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? "active" : ""}`
                    }
                    onClick={close}
                  >
                    <i>
                      <img src={item.icon} alt="" />
                    </i>
                    <span>{item.label}</span>
                    {item.count != null ? (
                      <strong className="sidebar-count">{item.count}</strong>
                    ) : null}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-version-card">
            <div className="sidebar-version-head">
              <strong>Verzija 1.0.7.</strong>
              <button type="button" className="sidebar-version-close" aria-label="Zatvori">
                ×
              </button>
            </div>

            <p>
              Nova verzija web aplikacije koja omogućava bolji nadzor nad
              djelatnicima, preglednije sučelje, te jednostavnije korištenje.
            </p>

            <button type="button" className="sidebar-version-btn" onClick={() => setShowWhatsNew(true)}>
              Što je novo?
            </button>
          </div>
        </div>
      </aside>

      {menuOpen && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          className="sidebar-user-dropdown"
          style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left }}
        >
          <NavLink to="/postavke" className="sidebar-dropdown-item" onClick={() => setMenuOpen(false)}>
            <img src="/svg/settings.svg" alt="" />
            Postavke profila
          </NavLink>

          <div className="sidebar-dropdown-divider" />

          <button type="button" className="sidebar-dropdown-item logout" onClick={handleLogout}>
            <img src="/svg/arrow-right.svg" alt="" />
            Odjavi me
          </button>

          <div className="sidebar-dropdown-footer">
            <span>DANTE 1.0.0.</span>
            <span>2026</span>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
