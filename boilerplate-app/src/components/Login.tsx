import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../config/authConfig";
import "./Login.css";

const appTitle = import.meta.env.VITE_APP_TITLE || "TLCO App";

function Login() {
  const { instance } = useMsal();

  const handleLogin = async () => {
    try {
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("❌ Errore durante il login:", error);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-backdrop">
        <div className="login-grid-lines" />
        <div className="login-orb orb-left" />
        <div className="login-orb orb-right" />
      </div>

      <div className="login-content">
        <section className="login-hero">
          <div className="hero-chip">{appTitle} • Microsoft 365</div>
          <h1>Benvenuto in {appTitle}</h1>
          <p className="hero-lead">
            Applicazione aziendale con autenticazione SSO Microsoft Entra ID,
            integrazione Graph API e design system TLCO.
          </p>

          <div className="hero-meta">
            <div className="meta-card">
              <span className="meta-label">Identità</span>
              <span className="meta-value">Microsoft Entra ID</span>
            </div>
            <div className="meta-card">
              <span className="meta-label">API</span>
              <span className="meta-value">Microsoft Graph</span>
            </div>
            <div className="meta-card">
              <span className="meta-label">Framework</span>
              <span className="meta-value">React + Vite</span>
            </div>
          </div>

          <ul className="hero-list">
            <li><span className="list-dot" />Single sign-on aziendale con Microsoft Entra ID</li>
            <li><span className="list-dot" />Rinnovo automatico del token e recupero sessione</li>
            <li><span className="list-dot" />Sezione admin con controllo ruoli e gruppi</li>
          </ul>
        </section>

        <section className="login-panel">
          <div className="panel-head">
            <span className="panel-badge">Accesso riservato</span>
            <h2>Entra con il tuo account Microsoft</h2>
            <p>Single sign-on aziendale, nessuna password salvata sul dispositivo.</p>
          </div>

          <button onClick={handleLogin} className="login-btn" aria-label="Accedi con Microsoft">
            <span className="m365-mark" aria-hidden="true">
              <span className="tile" />
              <span className="tile" />
              <span className="tile" />
              <span className="tile" />
            </span>
            <span className="btn-text">
              <strong>Accedi con Microsoft</strong>
              <small>SSO protetto • Entra ID</small>
            </span>
            <span className="btn-arrow" aria-hidden="true">→</span>
          </button>

          <div className="panel-footer">
            <div className="foot-chip">
              <span className="chip-dot" />Sessione cifrata e gestita da Azure
            </div>
            <p className="foot-note">Autenticazione gestita tramite Microsoft Entra ID</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;
