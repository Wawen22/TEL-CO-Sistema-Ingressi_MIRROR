import { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useGraphApi } from "../hooks/useGraphApi";
import { LoadingSpinner } from "./LoadingSpinner";
import "./Dashboard.css";

const appTitle = import.meta.env.VITE_APP_TITLE || "TLCO App";

interface DashboardProps {
  onAdminAccess: () => void;
  canAccessAdmin: boolean;
}

export function Dashboard({ onAdminAccess, canAccessAdmin }: DashboardProps) {
  const { instance, accounts } = useMsal();
  const { callGraph, loading } = useGraphApi();
  const account = accounts[0];

  const [userProfile, setUserProfile] = useState<any>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!account) return;

      // Usa useGraphApi per semplificare le chiamate
      const profile = await callGraph((service) => service.getUserProfile());
      if (profile) setUserProfile(profile);

      const photo = await callGraph((service) => service.getMyPhoto());
      if (photo) setPhotoUrl(photo);
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const handleLogout = async () => {
    try {
      await instance.logoutRedirect();
    } catch (error) {
      console.error("Errore durante il logout:", error);
    }
  };

  const displayName = userProfile?.displayName || account?.name || "Utente";
  const email = userProfile?.mail || userProfile?.userPrincipalName || account?.username || "";
  const jobTitle = userProfile?.jobTitle || "—";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="dashboard-shell">
      {/* ───── Header ───── */}
      <header className="dashboard-header">
        <div className="header-left">
          <img src="/imgs/logo.png" alt="Logo" className="header-logo" />
          <span className="header-app-name">{appTitle}</span>
        </div>

        <div className="header-right">
          <div className="header-user-chip">
            {photoUrl ? (
              <img src={photoUrl} alt="Avatar" className="user-avatar" />
            ) : (
              <span className="user-avatar-placeholder">{initials}</span>
            )}
            <span>{displayName}</span>
          </div>

          {canAccessAdmin && (
            <button className="admin-btn" onClick={onAdminAccess}>
              ⚙️ Admin
            </button>
          )}

          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </header>

      {/* ───── Main Content ───── */}
      <main className="dashboard-main">
        {loading && !userProfile ? (
          <LoadingSpinner message="Caricamento profilo..." />
        ) : (
          <div className="welcome-card">
            {photoUrl ? (
              <img src={photoUrl} alt="Avatar" className="welcome-avatar" />
            ) : (
              <div className="welcome-avatar-placeholder">{initials}</div>
            )}

            <div className="welcome-chip">
              <span className="status-dot" />
              Sessione attiva
            </div>

            <h1>Ciao, {displayName.split(" ")[0]}! 👋</h1>
            <p className="welcome-sub">
              Sei autenticato con il tuo account Microsoft aziendale.
              Questa è la dashboard principale dell'applicazione.
            </p>

            <div className="welcome-info-grid">
              <div className="info-card">
                <span className="info-label">Nome completo</span>
                <span className="info-value">{displayName}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Email</span>
                <span className="info-value">{email}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Ruolo</span>
                <span className="info-value">{jobTitle}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ───── Footer ───── */}
      <footer className="dashboard-footer">
        {appTitle} — Powered by React + Microsoft 365 | Design System TLCO
      </footer>
    </div>
  );
}
