import "./AdminPanel.css";

interface AdminPanelProps {
  onClose: () => void;
}

/**
 * Pannello Admin — placeholder.
 * Aggiungi qui le sezioni di amministrazione della tua applicazione.
 */
export function AdminPanel({ onClose }: AdminPanelProps) {
  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2>Pannello Admin</h2>
            <span className="admin-badge">⚙️ Amministrazione</span>
          </div>
          <button className="admin-close-btn" onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>

        {/* Section: Gestione Utenti */}
        <div className="admin-section">
          <h3>👥 Gestione Utenti</h3>
          <p>
            Sezione per la gestione degli utenti, ruoli e permessi dell'applicazione.
          </p>
          <div className="admin-placeholder">
            <span className="placeholder-icon">🔧</span>
            Placeholder — Implementa qui la gestione utenti
          </div>
        </div>

        {/* Section: Impostazioni */}
        <div className="admin-section">
          <h3>⚙️ Impostazioni App</h3>
          <p>
            Configurazione generale dell'applicazione, parametri e preferenze.
          </p>
          <div className="admin-placeholder">
            <span className="placeholder-icon">🔧</span>
            Placeholder — Implementa qui le impostazioni
          </div>
        </div>

        {/* Section: Log & Audit */}
        <div className="admin-section">
          <h3>📊 Log & Audit</h3>
          <p>
            Monitoraggio attività, log di sistema e audit trail.
          </p>
          <div className="admin-placeholder">
            <span className="placeholder-icon">🔧</span>
            Placeholder — Implementa qui i log e l'audit
          </div>
        </div>
      </div>
    </div>
  );
}
