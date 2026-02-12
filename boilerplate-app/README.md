# TLCO App Boilerplate

Boilerplate pronto all'uso per applicazioni **React + Microsoft 365** con il design system TLCO.

## ✨ Cosa include

| Feature | Descrizione |
|---|---|
| **Login SSO** | Pagina di login con Microsoft Entra ID (MSAL redirect) |
| **Dashboard** | Schermata principale con profilo utente, avatar da Graph API |
| **Admin Panel** | Modale admin con placeholder, protetta da ruoli/gruppi/email |
| **Token Renewal** | Hook `useTokenRenewal` per rinnovo proattivo ogni 30 min |
| **Graph Service** | Service class per Microsoft Graph (profilo, foto, ricerca utenti) |
| **Design System** | Stile TLCO: glassmorphism, gradient blu/amber, Space Grotesk font |

## 🚀 Quick Start

```bash
# 1. Copia la cartella e rinominala
cp -r boilerplate-app my-new-app
cd my-new-app

# 2. Aggiorna package.json (name, description, version)

# 3. Configura .env.local con i tuoi valori Azure (vedi sezione sotto)

# 4. Installa dipendenze e avvia
npm install
npm run dev
```

---

## 🔐 Configurazione Azure — Passo per passo

### Passo 0: Registrare l'App su Azure Portal

1. Vai su [Azure Portal → App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps)
2. Clicca **"New registration"**
3. Dai un nome all'app (es. `TLCO My App`)
4. In **Supported account types** seleziona "Single tenant" (solo la tua organizzazione)
5. In **Redirect URI**, seleziona **SPA** e inserisci `http://localhost:5173`
6. Clicca **Register**

Dalla pagina dell'app registrata, copia:
- **Application (client) ID** → `VITE_CLIENT_ID`
- **Directory (tenant) ID** → `VITE_TENANT_ID`

### Passo 0b: Configurare i permessi API

1. Nella pagina dell'app, vai in **API permissions**
2. Clicca **Add a permission** → **Microsoft Graph** → **Delegated permissions**
3. Aggiungi almeno:
   - `User.Read` (profilo utente)
   - `User.ReadBasic.All` (ricerca utenti, opzionale)
   - `Sites.ReadWrite.All` (se usi SharePoint)
4. Clicca **Grant admin consent** per il tuo tenant

---

### Passo 1: Ottenere il Site ID di SharePoint

> Necessario solo se la tua app usa SharePoint Lists.

1. Vai su [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
2. Accedi con il tuo account aziendale
3. Esegui questa query GET:

```
GET https://graph.microsoft.com/v1.0/sites/{tuodominio}.sharepoint.com:/sites/{NomeSito}
```

**Esempio:**
```
GET https://graph.microsoft.com/v1.0/sites/cloudtlco.sharepoint.com:/sites/TLCODIGITAL
```

4. Nella risposta JSON, il Site ID è composto da tre parti separate da virgola:

```
{hostname},{siteId},{webId}
```

**Esempio risultato:**
```
cloudtlco.sharepoint.com,956b1b93-cb36-4fb4-90cc-27e9d405b56d,fb46a3ba-2d20-4ff3-8f66-44c8776274b6
```

5. Copia l'intera stringa → `VITE_SHAREPOINT_SITE_ID`

---

### Passo 2: Ottenere i List ID di SharePoint

Una volta ottenuto il Site ID, puoi recuperare gli ID delle liste.

1. Su [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer), esegui:

```
GET https://graph.microsoft.com/v1.0/sites/{SITE_ID}/lists
```

**Esempio:**
```
GET https://graph.microsoft.com/v1.0/sites/cloudtlco.sharepoint.com,956b1b93-cb36-4fb4-90cc-27e9d405b56d,fb46a3ba-2d20-4ff3-8f66-44c8776274b6/lists
```

2. Nella risposta JSON troverai un array di liste. Cerca quelle che ti servono e copia i rispettivi `id`:

```json
{
  "value": [
    {
      "id": "06c9cc9b-b4b7-4f92-ad64-38f8b93dfb19",
      "displayName": "Visitatori",
      ...
    },
    {
      "id": "8d00ffb7-215d-4361-83db-d1680a56dc1b",
      "displayName": "Accessi",
      ...
    }
  ]
}
```

3. Copia gli ID nelle rispettive variabili del `.env.local`:
   - `VITE_SHAREPOINT_LIST_ID` → lista principale
   - `VITE_ACCESSI_LIST_ID` → lista accessi
   - `VITE_SETTINGS_LIST_ID` → lista impostazioni
   - ecc.

---

### Passo 3: Configurare il ruolo Admin su Entra ID

> **Approccio consigliato:** usare un App Role personalizzato su Microsoft Entra ID,  
> invece di hardcodare email nel file `.env.local`.

#### 3a. Creare l'App Role

1. Vai su [Azure Portal → App registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps)
2. Seleziona la tua app
3. Nel menu laterale, clicca **App roles**
4. Clicca **Create app role** e compila:
   - **Display name:** `Totem Admin`
   - **Allowed member types:** `Users/Groups`
   - **Value:** `Totem.Admin` (questo è il valore tecnico usato nel codice)
   - **Description:** `Amministratore dell'applicazione`
5. Attiva l'opzione **"Do you want to enable this app role?"**
6. Clicca **Apply**

> **Nota:** il valore del ruolo (es. `Totem.Admin`) deve corrispondere a uno dei valori nell'array `adminRoleKeys` in [`App.tsx`](src/App.tsx:68). Di default il boilerplate riconosce: `admin`, `totem.admin`, `totem-admin`, `totem admin`, `app.admin`, `app-admin`.

#### 3b. Assegnare il ruolo agli utenti

1. Vai su [Azure Portal → Enterprise applications](https://portal.azure.com/#view/Microsoft_AAD_IAM/StartboardApplicationsMenuBlade)
2. Cerca e seleziona la tua app
3. Nel menu laterale, clicca **Users and groups**
4. Clicca **Add user/group**
5. Seleziona l'utente (o il gruppo) a cui assegnare il ruolo
6. Seleziona il ruolo **Totem Admin**
7. Clicca **Assign**

#### 3c. Abilitare i ruoli nel token

Per fare in modo che i ruoli vengano inclusi nel token ID:

1. Nella pagina dell'app registration, vai su **Token configuration**
2. Clicca **Add optional claim**
3. Seleziona **ID Token**
4. Cerca e seleziona `roles`
5. Clicca **Add**

Dopo questa configurazione, gli utenti con il ruolo assegnato avranno il claim `roles: ["App.Admin"]` nel loro token, e il boilerplate mostrerà automaticamente il pulsante Admin nella dashboard.

#### 3d. Metodo alternativo: Admin via email (fallback)

Se non vuoi configurare App Roles, puoi usare la variabile d'ambiente come fallback:

```env
VITE_ADMIN_EMAILS=admin@tuodominio.onmicrosoft.com,altro.admin@tuodominio.it
```

Il boilerplate controlla in ordine: **Ruoli → Gruppi → Email**. Il primo match rende l'utente admin.

---

## 📁 Struttura

```
boilerplate-app/
├── public/
│   ├── vite.svg
│   └── imgs/
│       └── logo.png
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Root con MSAL, routing auth/unauth, admin check
│   ├── index.css             # Global styles + font import
│   ├── config/
│   │   └── authConfig.ts     # Configurazione MSAL (client, tenant, scopes)
│   ├── hooks/
│   │   └── useTokenRenewal.ts  # Rinnovo proattivo token + recovery
│   ├── services/
│   │   └── graphService.ts   # Microsoft Graph API client
│   └── components/
│       ├── Login.tsx + .css   # Pagina di login
│       ├── Dashboard.tsx + .css  # Schermata principale
│       └── AdminPanel.tsx + .css  # Pannello admin (modal)
├── .env.local                # Variabili d'ambiente (da configurare)
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── vite.config.ts
└── eslint.config.js
```

## 📋 Riepilogo variabili `.env.local`

| Variabile | Descrizione | Come ottenerla |
|---|---|---|
| `VITE_CLIENT_ID` | Client ID dell'app Azure | Azure Portal → App registrations → Overview |
| `VITE_TENANT_ID` | Tenant ID dell'organizzazione | Azure Portal → App registrations → Overview |
| `VITE_REDIRECT_URI` | URL di redirect post-login | `http://localhost:5173` (dev) oppure URL produzione |
| `VITE_ADMIN_EMAILS` | Email admin (fallback) | Opzionale, separate da virgola |
| `VITE_ADMIN_GROUP_IDS` | Group ID Azure per admin | Opzionale, da Azure AD Groups |
| `VITE_SHAREPOINT_SITE_ID` | Site ID SharePoint | Passo 1 sopra (Graph Explorer) |
| `VITE_SHAREPOINT_LIST_ID` | ID lista SharePoint | Passo 2 sopra (Graph Explorer) |
| `VITE_SHAREPOINT_SITE_URL` | URL del sito SharePoint | Es. `https://tuodominio.sharepoint.com/sites/NomeSito` |
| `VITE_APP_TITLE` | Titolo dell'app | Personalizzabile liberamente |

---

## 🎨 Design System

- **Font:** Space Grotesk (Google Fonts)
- **Colori primari:** `#106ebe` → `#1da4f2` (gradiente blu Microsoft)
- **Colori accent:** `#f59e0b` (amber per badge admin)
- **Background:** Glassmorphism con `backdrop-filter: blur()` e gradienti radiali
- **Bordi:** Arrotondati (12-24px), soft shadows
- **Componenti:** Chip, Card, Badge, Button con stile coerente

## 🛠 Personalizzazione

### Aggiungere scope Graph API
In [`authConfig.ts`](src/config/authConfig.ts:48), aggiungi gli scope necessari:
```ts
export const loginRequest: PopupRequest = {
  scopes: ["User.Read", "Sites.ReadWrite.All", "Mail.Read"],
};
```

### Aggiungere pagine
1. Crea un nuovo componente in `src/components/`
2. Importalo in [`App.tsx`](src/App.tsx) e aggiungilo dentro `<AuthenticatedTemplate>`

### Aggiungere sezioni admin
Modifica [`AdminPanel.tsx`](src/components/AdminPanel.tsx) aggiungendo nuove `<div className="admin-section">`.

### Personalizzare i ruoli admin riconosciuti
In [`App.tsx`](src/App.tsx:68), l'array `adminRoleKeys` elenca i valori di ruolo accettati (case-insensitive):
```ts
const adminRoleKeys = [
  "admin",
  "totem.admin",    // ← ruolo principale creato su Entra ID
  "totem-admin",
  "totem admin",
  "app.admin",
  "app-admin",
];
```
Aggiungi o rimuovi valori in base alle tue necessità.

## 📦 Tech Stack

- **React 19** + TypeScript
- **Vite 7** (bundler)
- **@azure/msal-browser** + **@azure/msal-react** (auth)
- **@microsoft/microsoft-graph-client** (Graph API)
- **ESLint** con flat config
