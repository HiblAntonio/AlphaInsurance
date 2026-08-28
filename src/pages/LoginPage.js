import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css';
import { login, saveAuthSession, setupSilentRefresh } from "../services/authService";

function LoginPage() {
  const [idBroj, setIdBroj] = useState('');
  const [lozinka, setLozinka] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
      e.preventDefault();
      setError('');

      try {
          setIsSubmitting(true);
          const loginResponse = await login(idBroj, lozinka);
          saveAuthSession(loginResponse);
          setupSilentRefresh();
          navigate('/dashboard');
      } catch (err) {
          setError(err.message);
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <main className="alpha-page">
      <div className="container-fluid px-0 h-100">
        <div className="row g-0 h-100">
          <section className="col-12 col-lg-6 login-side">
            <div className="login-wrap">
              <div className="login-box">
                <div className="alpha-logo" aria-label="Alpha logo">
                  <img src="/images/AlphaLogo-login.png" alt="Alpha logo" />
                </div>

                <div className="login-copy">
                  <h1>Prijava u sustav</h1>
                  <p>
                    Prijavite se koristeći vaš identifikacijski broj i lozinku.
                  </p>
                </div>

                <form className="login-form" onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label htmlFor="idBroj" className="form-label">
                      Identifikacijski broj
                    </label>
                    <input
                      type="number"
                      className="form-control alpha-input"
                      id="idBroj"
                      placeholder="100"
                      value={idBroj}
                      onChange={(e) => setIdBroj(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="lozinka" className="form-label">
                      Lozinka
                    </label>
                    <input
                      type="password"
                      className="form-control alpha-input"
                      id="lozinka"
                      placeholder="*************"
                      value={lozinka}
                      onChange={(e) => setLozinka(e.target.value)}
                      required
                    />
                  </div>

                  {error && <p className="login-error">{error}</p>}

                  <button type="submit" className="btn alpha-login-btn w-100" disabled={isSubmitting}>
                    {isSubmitting ? "Prijava..." : "Prijavi se"}
                  </button>
                </form>
              </div>
            </div>
          </section>

          <section className="col-12 col-lg-6 preview-side">
            <img src="images/Background-Image.png" alt="Preview background" />
          </section>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
