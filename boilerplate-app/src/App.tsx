import { useState } from "react";
import {
  MsalProvider,
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
  useMsal,
} from "@azure/msal-react";
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { msalConfig } from "./config/authConfig";
import Login from "./components/Login";
import { Dashboard } from "./components/Dashboard";
import { AdminPanel } from "./components/AdminPanel";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useTokenRenewal } from "./hooks/useTokenRenewal";

// ───── Inizializzazione MSAL ─────
const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().then(() => {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as any;
      msalInstance.setActiveAccount(payload.account);
    }
  });

  msalInstance.handleRedirectPromise().catch((error) => {
    console.error("❌ Errore durante la gestione del redirect:", error);
  });
});

// ───── App Content (dentro MsalProvider) ─────
function AppContent() {
  const { accounts } = useMsal();
  const [showAdmin, setShowAdmin] = useState(false);

  // Rinnovo proattivo del token ogni 30 minuti
  useTokenRenewal();

  // ── Calcolo ruolo admin ──
  const account = accounts[0];
  const claims = (account?.idTokenClaims || {}) as any;
  const roles: string[] = Array.isArray(claims?.roles) ? claims.roles : [];
  const groups: string[] = Array.isArray(claims?.groups) ? claims.groups : [];
  const username = (
    claims?.preferred_username ||
    account?.username ||
    ""
  ).toLowerCase();

  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);
  const adminGroupIds = (import.meta.env.VITE_ADMIN_GROUP_IDS || "")
    .split(",")
    .map((g: string) => g.trim())
    .filter(Boolean);
  const adminRoleKeys = [
    "admin",
    "totem.admin",
    "totem-admin",
    "totem admin",
    "app.admin",
    "app-admin",
  ];

  const normalizedRoles = roles.map((r: string) => r.toLowerCase().trim());
  const normalizedGroups = groups.map((g: string) => g.toLowerCase().trim());
  const normalizedAdminGroups = adminGroupIds.map((g: string) =>
    g.toLowerCase().trim()
  );

  const isAdmin = Boolean(
    normalizedRoles.some((r) => adminRoleKeys.includes(r)) ||
      normalizedGroups.some((g) => normalizedAdminGroups.includes(g)) ||
      (username && adminEmails.includes(username))
  );

  return (
    <div style={{ margin: 0, padding: 0, height: "100vh", width: "100vw", overflow: "hidden" }}>
      <AuthenticatedTemplate>
        <Dashboard
          onAdminAccess={() => setShowAdmin(true)}
          canAccessAdmin={isAdmin}
        />
        {showAdmin && isAdmin && (
          <AdminPanel onClose={() => setShowAdmin(false)} />
        )}
      </AuthenticatedTemplate>

      <UnauthenticatedTemplate>
        <Login />
      </UnauthenticatedTemplate>
    </div>
  );
}

// ───── App Root ─────
function App() {
  return (
    <ErrorBoundary>
      <MsalProvider instance={msalInstance}>
        <AppContent />
      </MsalProvider>
    </ErrorBoundary>
  );
}

export default App;
