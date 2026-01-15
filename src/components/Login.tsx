import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../config/authConfig";
import "./Login.css";

function Login() {
  const { instance } = useMsal();

  const handleLogin = async () => {
    try {
      // Usa redirect invece di popup per evitare problemi con popup bloccati
      await instance.loginRedirect(loginRequest);
      console.log("✅ Redirect al login Microsoft...");
    } catch (error) {
      console.error("❌ Errore durante il login:", error);
      alert("Errore durante il login. Controlla la console per i dettagli.");
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
          <div className="hero-chip">Totem ingressi • POC</div>
          <h1>Controllo accessi con Microsoft 365</h1>
          <p className="hero-lead">
            Abilita il totem per ingressi e uscite con autenticazione SSO, tracciamento su SharePoint e flussi
            Power Automate pronti.
          </p>

          <div className="hero-meta">
            <div className="meta-card">
              <span className="meta-label">Identità</span>
              <span className="meta-value">Microsoft Entra ID</span>
            </div>
            <div className="meta-card">
              <span className="meta-label">Dati</span>
              <span className="meta-value">SharePoint Lists</span>
            </div>
            <div className="meta-card">
              <span className="meta-label">Modalità</span>
              <span className="meta-value">Kiosk ready</span>
            </div>
          </div>

          <ul className="hero-list">
            <li><span className="list-dot" />Badge digitali via QR e onboarding visitatori</li>
            <li><span className="list-dot" />Tracciamento ingressi/uscite con feedback in tempo reale</li>
            <li><span className="list-dot" />Percorso admin dedicato per monitoraggio e audit</li>
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
            <p className="foot-note">POC: dati archiviati su SharePoint per test funzionali</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;
