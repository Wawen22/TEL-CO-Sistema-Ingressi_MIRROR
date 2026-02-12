# 🚀 AI Project Blueprint — TLCO App Boilerplate

**Scopo:** Documento tecnico per agenti AI / assistenti di codice. Fornisce tutto il contesto necessario per comprendere, modificare e estendere applicazioni basate su questo boilerplate.

---

## 1. 🏗️ Architettura Tecnica (Serverless — Zero Backend)

L'applicazione è una **SPA (Single Page Application)** che non possiede un backend proprietario. Si appoggia interamente ai servizi cloud Microsoft tramite API (Sharepoint, PowerAutomate).

### Stack Tecnologico

| Layer | Tecnologia |
|---|---|
| **Frontend** | React 19+ con TypeScript |
| **Build Tool** | Vite 7 |
| **Autenticazione** | Microsoft Entra ID (Azure AD) via `@azure/msal-react` + `@azure/msal-browser` |
| **Database** | SharePoint Online Lists (accessibili via Microsoft Graph API) |
| **API Client** | `@microsoft/microsoft-graph-client` |
| **Styling** | CSS custom con design system TLCO (glassmorphism, Space Grotesk) |
| **Deploy** | Azure Static Web Apps (consigliato) |

### Flusso dati

```
Utente → Login Microsoft (MSAL redirect) → Access Token
        → React App chiama Microsoft Graph API direttamente
        → Graph API ↔ SharePoint Lists / User Profile / etc.
```

1. L'utente si autentica con il proprio account Microsoft 365 (redirect).
2. MSAL ottiene un Access Token con permessi delegati.
3. Il client React chiama direttamente `https://graph.microsoft.com/v1.0/...` per operazioni CRUD.
4. Un hook (`useTokenRenewal`) rinnova il token ogni 30 minuti in modo proattivo.

---

## 2. 📂 Struttura del Progetto

```
src/
├── main.tsx                    # Entry point React
├── App.tsx                     # MSAL Provider + routing auth/unauth + logica admin
├── index.css                   # Stili globali (font, reset, variabili)
│
├── config/
│   └── authConfig.ts           # Configurazione MSAL (clientId, tenantId, scopes, graph endpoints)
│
├── hooks/
│   ├── useTokenRenewal.ts      # Rinnovo proattivo token (30 min) + recovery automatico
│   └── useGraphApi.ts          # Hook generico per chiamate Graph (token + loading + error)
│
├── services/
│   └── graphService.ts         # Client Microsoft Graph (profilo, foto, ricerca utenti)
│
└── components/
    ├── Login.tsx + Login.css        # Pagina di login SSO
    ├── Dashboard.tsx + Dashboard.css  # Schermata principale (welcome, profilo utente)
    ├── AdminPanel.tsx + AdminPanel.css  # Pannello admin con sezioni placeholder
    ├── ErrorBoundary.tsx            # Cattura errori React con UI di fallback
    └── LoadingSpinner.tsx           # Spinner di caricamento stilizzato
```

---

## 3. 🔑 Flusso di Autenticazione

### Libreria: MSAL React

| Concetto | Dettaglio |
|---|---|
| **Metodo di login** | `loginRedirect` (non popup, per compatibilità kiosk/mobile) |
| **Cache** | `localStorage` (persiste tra riavvii browser) |
| **Token renewal** | `acquireTokenSilent` ogni 30 min via `useTokenRenewal` hook |
| **Recovery** | Se silent fallisce → `loginRedirect` con `prompt: "none"` (usa sessione Azure 365 giorni) |
| **Scopes base** | `User.Read` (aggiungere altri in `authConfig.ts` se necessario) |

### File chiave: `src/config/authConfig.ts`

```typescript
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_REDIRECT_URI,
  },
  cache: { cacheLocation: "localStorage" },
  system: { tokenRenewalOffsetSeconds: 300 }
};

export const loginRequest = {
  scopes: ["User.Read"]
};
```

### Inizializzazione in `App.tsx`

```typescript
const msalInstance = new PublicClientApplication(msalConfig);
msalInstance.initialize().then(() => {
  // Imposta account attivo, gestisce redirect callback
});
```

---

## 4. 🛡️ Logica Admin (Ruoli, Gruppi, Email)

L'accesso admin è determinato nell'ordine seguente (primo match vince):

1. **App Roles (Entra ID):** Il token ID contiene il claim `roles`. Se uno dei ruoli corrisponde a `adminRoleKeys`, l'utente è admin.
2. **Gruppi Azure AD:** Il token contiene il claim `groups`. Se uno dei group ID corrisponde a `VITE_ADMIN_GROUP_IDS`, l'utente è admin.
3. **Email (fallback):** Se l'email dell'utente è in `VITE_ADMIN_EMAILS`, l'utente è admin.

### Ruoli riconosciuti (`adminRoleKeys` in `App.tsx`)

```typescript
const adminRoleKeys = [
  "admin",
  "totem.admin",    // ← ruolo principale creato su Entra ID
  "totem-admin",
  "totem admin",
  "app.admin",
  "app-admin",
];
```

> **Setup consigliato su Entra ID:** Creare un App Role con Value `Totem.Admin` nella pagina App registrations → App roles, e assegnarlo agli utenti da Enterprise applications → Users and groups.

### Come aggiungere nuovi ruoli admin

1. In `App.tsx`, aggiungi il valore (lowercase) all'array `adminRoleKeys`.
2. Su Azure Portal, crea o aggiorna l'App Role corrispondente.
3. Assegna il ruolo agli utenti desiderati.

---

## 5. 🎨 Design System TLCO

### Font
- **Primario:** Space Grotesk (Google Fonts, importato in `index.css`)
- **Fallback:** Inter, system-ui, -apple-system, sans-serif

### Palette colori

| Ruolo | Colore | Uso |
|---|---|---|
| **Primario** | `#106ebe` → `#1da4f2` (gradiente) | Pulsanti, accent, elementi interattivi |
| **Amber** | `#f59e0b` | Badge admin, warning |
| **Successo** | `#10b981` | Status attivo, chip connessione |
| **Errore** | `#dc2626` | Pulsante logout, errori |
| **Testo primario** | `#0f172a` | Titoli, testo principale |
| **Testo secondario** | `#475569` / `#64748b` | Sottotitoli, label |
| **Background** | Gradiente radiale `#f0f6ff` → `#f8fafc` | Background pagina |

### Effetti UI

- **Glassmorphism:** `background: rgba(255, 255, 255, 0.74)` + `backdrop-filter: blur(18px)`
- **Soft shadows:** `box-shadow: 0 24px 64px rgba(15, 23, 42, 0.14)`
- **Border radius:** 12-24px per card/panel, 999px per chip/badge
- **Orbs decorativi:** Cerchi sfumati con `filter: blur(48px)` nel background del login

### Componenti chiave

| Componente | Classe CSS | Descrizione |
|---|---|---|
| **Chip** | `.hero-chip`, `.panel-badge`, `.welcome-chip` | Etichette arrotondate con bordo e sfondo tenue |
| **Card** | `.meta-card`, `.info-card`, `.welcome-card` | Box con bordo sottile, ombra e sfondo semi-trasparente |
| **Button primario** | `.login-btn` | Gradiente blu, griglia icona/testo/freccia |
| **Button secondario** | `.admin-btn`, `.logout-btn` | Sfondo tenue con bordo colorato |
| **Avatar placeholder** | `.welcome-avatar-placeholder` | Cerchio con gradiente e iniziali |
| **Modale** | `.admin-overlay` + `.admin-modal` | Overlay sfumato + pannello animato |

---

## 6. 📋 Variabili d'ambiente (`.env.local`)

| Variabile | Obbligatoria | Descrizione |
|---|---|---|
| `VITE_CLIENT_ID` | ✅ | Application (client) ID dell'app Azure |
| `VITE_TENANT_ID` | ✅ | Directory (tenant) ID |
| `VITE_REDIRECT_URI` | ✅ | URL di redirect post-login |
| `VITE_ADMIN_EMAILS` | ❌ | Email admin (fallback), separate da virgola |
| `VITE_ADMIN_GROUP_IDS` | ❌ | Group ID Azure per admin |
| `VITE_SHAREPOINT_SITE_ID` | ❌ | Site ID SharePoint (se usi liste SP) |
| `VITE_SHAREPOINT_LIST_ID` | ❌ | ID lista SharePoint principale |
| `VITE_APP_TITLE` | ❌ | Titolo app mostrato nell'UI |

---

## 7. 🧩 Pattern e convenzioni

### Service Pattern
I servizi (`graphService.ts`) accettano un `accessToken` nel costruttore e inizializzano un `Client` Graph:

```typescript
export class GraphService {
  private graphClient: Client;
  constructor(accessToken: string) {
    this.graphClient = Client.init({
      authProvider: (done) => done(null, accessToken),
    });
  }
  async getUserProfile() { return this.graphClient.api("/me").get(); }
}
```

### Come ottenere un token per chiamare un servizio

```typescript
const response = await instance.acquireTokenSilent({
  ...loginRequest,
  account: accounts[0],
});
const service = new GraphService(response.accessToken);
const profile = await service.getUserProfile();
```

### Hook pattern
- `useTokenRenewal()` — si attiva automaticamente, rinnova il token ogni 30 min; restituisce `getAccessToken()`.
- `useGraphApi()` — hook generico per chiamate Graph. Gestisce token, loading, error in automatico:

```typescript
const { callGraph, loading, error } = useGraphApi();

// Una riga per qualsiasi chiamata Graph:
const profile = await callGraph(service => service.getUserProfile());
const photo = await callGraph(service => service.getMyPhoto());
```

### Componenti utility
- `<ErrorBoundary>` — wrappa l'app in `App.tsx`, cattura errori React e mostra UI di fallback con pulsante "Ricarica".
- `<LoadingSpinner message="..." />` — spinner coerente col design system, usabile ovunque serve feedback di caricamento.

### Componenti: convenzioni

- Ogni componente ha il proprio file CSS co-locato (es. `Login.tsx` + `Login.css`).
- I componenti esportati come named export (es. `export function Dashboard`) tranne `Login` (default export per convenzione storica).
- Le prop della dashboard includono `onAdminAccess` e `canAccessAdmin` per il pattern admin.

---

## 8. 📝 Prompt consigliato per l'agente AI

Per estendere l'applicazione, usa questo prompt come base:

> "Agisci come un Senior React Developer esperto in ecosistema Microsoft 365.
>
> L'applicazione usa il boilerplate TLCO: React 19, TypeScript, Vite, MSAL React per auth, Microsoft Graph per dati, SharePoint Lists come database. Il design system usa glassmorphism, gradiente blu (#106ebe → #1da4f2), font Space Grotesk.
>
> **Contesto tecnico:**
> - Auth: MSAL redirect con token renewal hook (30 min)
> - Admin: determinato da App Roles (`Totem.Admin`) su Entra ID + fallback email
> - Servizi: pattern classe con accessToken nel costruttore + Graph Client
> - CSS: file co-locati, nessun framework CSS (no Tailwind), stile glassmorphism
>
> **Richiesta:** [DESCRIVI QUI LA FEATURE DA IMPLEMENTARE]
>
> Segui le convenzioni del progetto: service pattern, CSS co-locato, hook pattern, named exports."

---

## 9. 🔧 Come estendere

### Aggiungere un nuovo servizio SharePoint

1. Crea `src/services/myDataService.ts` seguendo il pattern di `graphService.ts`.
2. Usa `graph.api(\`/sites/\${siteId}/lists/\${listId}/items\`).get()` per leggere.
3. Usa `.post({ fields: { ... } })` per creare, `.patch()` per aggiornare.

### Aggiungere una nuova pagina

1. Crea `src/components/MyPage.tsx` + `src/components/MyPage.css`.
2. Importa in `App.tsx` e aggiungi dentro `<AuthenticatedTemplate>`.
3. Per navigazione multi-pagina, aggiungi `react-router-dom` e configura le routes.

### Aggiungere scope API

In `src/config/authConfig.ts`, estendi `loginRequest.scopes`:
```typescript
export const loginRequest = {
  scopes: ["User.Read", "Sites.ReadWrite.All", "Mail.Read"],
};
```
Poi aggiungi i permessi corrispondenti su Azure Portal → API permissions.
