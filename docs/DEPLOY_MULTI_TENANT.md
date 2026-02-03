# 🚀 Guida Deploy Multi-Cliente – Kiosk Visitatori

Replica l'app kiosk su un nuovo tenant Microsoft 365 (nuovo cliente) seguendo queste fasi: Entra ID, SharePoint, Power Automate, variabili d'ambiente e verifica finale. La procedura vale per ambienti dev/stage/prod: ripeti i passi cambiando l'env file.

### Cosa viene rilasciato
- SPA React/Vite con MSAL e scanner QR.
- Liste SharePoint: `Visitatori` (anagrafica), `Accessi` (storico) e `Impostazioni` (configurazione).
- Flow Power Automate per invio QR e OTP (`action: send|resend|otp|otpsms`).
- App Registration Entra ID con app role `Totem.Admin` per l'area riservata.

---

## 📋 1. Panoramica Architettura

- **Frontend**: Vite + React + MSAL (Auth) + QR Scanner.
- **Dati**: 3 Liste SharePoint (Visitatori, Accessi, Impostazioni).
- **Automazioni**: Flow Power Automate (per invio email QR/OTP).
- **Auth**: App Registration su Entra ID (Configurata come SPA).
- **Ambiente**: File .env.local specifico per ogni tenant.

---

## ✅ 2. Requisiti Preliminari

- Accesso **Global Admin** (o Application Admin + SharePoint Admin) sul tenant del cliente.
- Node.js (v18+) installato sulla macchina di deploy che costruisce/serve il frontend.
- URL del sito SharePoint dove risiederanno i dati (es. https://cliente.sharepoint.com/sites/Totem).

---

## 🔐 3. Setup Entra ID (App Registration SPA)

1.  Accedi al [Portale Azure](https://portal.azure.com) → **Microsoft Entra ID**.
2.  Vai su **App registrations** → **New registration**.
3.  Compila il form:
    - **Name**: Kiosk-Visitatori (o nome del cliente).
    - **Supported account types**: _Accounts in this organizational directory only (Single tenant)_.
    - **Redirect URI**: Seleziona **Single-page application (SPA)** e inserisci http://localhost:5173 (aggiungi l'URL di produzione in seguito).
4.  Clicca **Register** o **Crea**.
5.  Dalla pagina _Overview_, copia e annota:
    - **Application (client) ID → VITE_CLIENT_ID** nell’env
    - **Directory (tenant) ID → VITE_TENANT_ID** nell’env
6.  Vai su **API Permissions** → **Add a permission** → **Microsoft Graph** → **Delegated**.
7.  Seleziona i seguenti permessi:
    - User.Read
    - Sites.Read.All
    - Sites.ReadWrite.All (Fondamentale per scrivere nelle liste)
8.  Clicca **Add permissions** e successivamente **Grant admin consent for \[Nome Organizzazione\]**.
9.  (Solo per il pannello admin) Ruolo `Totem.Admin` e verifica:
    - **A1 – Crea App Role**: in **App roles** → **Create app role** → Display name `Totem Admin`, Value `Totem.Admin`, Allowed member types **Users/Groups**, Description “Consente accesso al pannello amministrazione totem”, salva.
    - **A2 – Assegna**: vai in **Enterprise applications** → cerca l'app → **Users and groups** → **Add user/group** → seleziona utenti/gruppi admin → scegli ruolo `Totem Admin` → assegna.
    - **A3 – Verifica token**: logout/login (o finestra Incognito), copia l’`id_token` dai DevTools e incollalo su https://jwt.ms; controlla che il claim `roles` contenga `Totem.Admin`. Se non c’è, verifica l’assegnazione e rifai login.

---

## 🗄️ 4. Configurazione SharePoint (Dati)

### 4.1 Creazione Liste (UI SharePoint)

Vai nel sito SharePoint dedicato (es. https://cliente.sharepoint.com/sites/Totem) e crea tre liste tramite _Site contents_ → _New_ → _List_ → _Blank list_.

#### Lista A: Visitatori

- **Title**: (Rinomina la colonna di default, usata per IDVisitatore univoco).
- **Nome**: Single line of text.
- **Cognome**: Single line of text.
- **Email**: Single line of text.
- **Azienda**: Single line of text.
- **Stato**: Choice (Attivo, Non Attivo) - Default: Attivo.
- **Categoria**: Choice (VISITATORE, ISPETTORE, CONSULENTE, FORNITORE) - Default: VISITATORE. _Nota: Case sensitive._

#### Lista B: Accessi

- **Title**: (Rinomina, usata per ID Accesso univoco).
- **VisitoreID**: Lookup (punta a Visitatori, colonna Title. Seleziona anche Nome e Cognome come campi aggiuntivi).
- **VisitoreNome**: Single line of text (copia statica per storico).
- **VisitoreCognome**: Single line of text (copia statica per storico).
- **Timestamp**: Date and Time (Include Time).
- **Azione**: Choice (Ingresso, Uscita).
- **PuntoAccesso**: Choice (Reception, Ingresso Principale, etc.).
- **Categoria**: Choice (Stessi valori della lista Visitatori).
- **Note**: Multiple lines of text (opzionale).

#### Lista C: Impostazioni

- **Title**: (Rinomina in "Chiave", usata per identificare il parametro, es. `AuthMode`).
- **Valore**: Single line of text (es. `QR` o `EMAIL`).
- **Descrizione**: Multiple lines of text (opzionale).

> **Importante**: Crea subito un elemento in questa lista con Title=`AuthMode` e Valore=`QR` per inizializzare il sistema.

### 4.2 Recupero degli ID (Site ID e List ID)

Questa è la parte critica. Segui i metodi specifici per evitare errori.

#### A. Recuperare il SHAREPOINT_SITE_ID

1.  Vai su [Graph Explorer](https://developer.microsoft.com/graph/graph-explorer) e fai login con l'account del tenant.
2.  Esegui questa query GET:  
    \[https://graph.microsoft.com/v1.0/sites/cliente.sharepoint.com:/sites/NomeSito\](https://graph.microsoft.com/v1.0/sites/cliente.sharepoint.com:/sites/NomeSito)  
    <br/>_(Esempio: https://graph.microsoft.com/v1.0/sites/crm640156.sharepoint.com:/sites/TestTotem)_
3.  Copia il valore del campo "id" → Questo valore è il `VITE_SHAREPOINT_SITE_ID` nell’env.
    - Formato atteso: dominio.sharepoint.com,guid-sito,guid-web

#### B. Recuperare i LIST_ID (Metodo Browser) → Questo valore è `VITE_SHAREPOINT_SITE_ID` nell’env

1.  Apri la lista **Visitatori** su SharePoint.
2.  Clicca l'ingranaggio ⚙️ in alto a destra → **List settings** (Impostazioni elenco).
3.  Guarda l'URL nel browser. Cerca la parte finale: List=%7Bxxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx%7D.
4.  Copia la stringa tra %7B e %7D. Questo è il GUID della lista.
5.  **Ripeti** l'operazione per la lista **Accessi** e per la lista **Impostazioni**.

### 4.3 Permessi SharePoint per operatori (non admin)

Perché lo scanner funzioni anche per utenti senza ruolo `Totem.Admin`, assegna permessi alle liste:

- **Visitatori**: permesso almeno **Lettura** (serve a validare il QR contro l'elenco).
- **Accessi**: permesso **Contribute/Edit** (serve a scrivere l'ingresso/uscita).

- **PrivacyDocuments (Drive)**: chi ha permessi deve poter leggere/caricare PDF per l'informativa; crea un drive/cartella SharePoint chiamata `PrivacyDocuments` nello stesso sito.

Procedura rapida:
1. In SharePoint vai su **Site contents** → Lista **Visitatori** → **Settings** → **Permissions for this list** → assegna il gruppo/utente operativo con ruolo **Read**.
2. Ripeti per la lista **Accessi** assegnando **Edit/Contribute**.
3. (Consigliato) Crea un gruppo SharePoint dedicato, es. `Totem Operators`, aggiungilo una volta alle due liste con i permessi indicati, e inserisci lì gli utenti non admin.
4. Se vedi `AccessDenied` in console e QR “non valido” per utenti non admin, verifica questi permessi sulle liste.

---

## 📄 5. Documenti Privacy (SharePoint Drive)

1. Nel sito SharePoint del cliente, crea (o individua) un Document Library o Drive chiamato **PrivacyDocuments**.
2. Carica i PDF obbligatori all'interno di questa libreria; saranno resi disponibili nella modale "Informativa sulla privacy" lato totem e nel pannello di gestione `PrivacyManager`.
3. Assicurati che gli utenti amministratori abbiano permessi di upload/eliminazione sul drive, mentre i visitatori necessitano solo di lettura tramite Graph (delegato all'utente autenticato del totem).

> Il frontend legge automaticamente i documenti dal drive `PrivacyDocuments` e li mostra in un elenco cliccabile; il contenuto è aperto in un iframe con presa visione obbligatoria prima di completare la registrazione.

---

## ⚡ 6. Configurazione Power Automate

1.  Vai su [make.powerautomate.com](https://make.powerautomate.com).
2.  Crea un **Instant cloud flow** → Trigger: **When an HTTP request is received**.
3.  Nel trigger, imposta questo Schema JSON (o usa "Generate from sample"):  
   ```json
   {
     "type": "object",
     "properties": {
       "action": { "type": "string" },
       "idVisitatore": { "type": "string" },
       "qrCode": { "type": "string" },
       "nome": { "type": "string" },
       "cognome": { "type": "string" },
       "email": { "type": "string" },
       "telefono": { "type": "string" },
       "azienda": { "type": "string" },
       "puntoAccesso": { "type": "string" },
       "categoria": { "type": "string" },
       "language": { "type": "string" },
       "source": { "type": "string" },
       "otpCode": { "type": "string" }
     }
   }
   ```
    
4.  Aggiungi un'azione **Switch/Condition** sul campo `action`:
    - **Case `send`**: Aggiungi azione "Send an email (V2)". Corpo: Benvenuto, ecco il tuo QR Code (usa contenuto dinamico qrCode).
    - **Case `resend`**: Aggiungi azione "Send an email (V2)". Corpo: Ecco di nuovo il tuo QR Code.
    - **Case `otp`**: Aggiungi azione "Send an email (V2)". Oggetto: "Il tuo codice di accesso". Corpo: "Il tuo codice è: @{triggerBody()?['otpCode']}".
    - **Case `otpsms`**: Aggiungi un'azione SMS (es. "Send SMS" con connettore Twilio/Teams/CPaaS). Numero: `@{triggerBody()?['telefono']}`. Corpo: "Il tuo codice è: @{triggerBody()?['otpCode']}".
5.  Salva il flow.
6.  Riapri il trigger "When an HTTP request is received" e copia il campo **HTTP POST URL**. Questo è il tuo `VITE_PA_SEND_QR_URL`.

Payload usato dal frontend:
```json
{
  "action": "send" | "resend" | "otp" | "otpsms",
  "idVisitatore": "VIS-...",
  "qrCode": "VIS-...",
  "otpCode": "123456",
  "nome": "...",
  "cognome": "...",
  "email": "...",
  "telefono": "+39 333 123 4567",
  "azienda": "...",
  "puntoAccesso": "Kiosk Principale",
  "categoria": "VISITATORE",
  "language": "it",
  "source": "totem"
}
```

---

## ⚙️ 6. Configurazione Variabili d'ambiente (.env.local)

Crea o aggiorna il file .env.local nella root del progetto.

Esempio di configurazione completa (basata sul tuo setup attuale):

```env
# --- Configurazione Microsoft Entra ID (Azure AD) ---
# Copia da App Registration > Overview  
VITE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_REDIRECT_URI=http://localhost:5173

# --- Configurazione SharePoint ---  
# ID Sito recuperato da Graph Explorer (formato a 3 parti con virgole)  
VITE_SHAREPOINT_SITE_ID=dominio.sharepoint.com,site-guid,web-guid

# URL visibile del sito (usato per link diretti se necessario)  
VITE_SHAREPOINT_SITE_URL=https://dominio.sharepoint.com/sites/NomeSito

# GUID recuperato dall'URL delle impostazioni lista (senza %7B %7D)  
VITE_SHAREPOINT_LIST_ID=guid-lista-visitatori
VITE_ACCESSI_LIST_ID=guid-lista-accessi
VITE_SETTINGS_LIST_ID=guid-lista-impostazioni

# --- Configurazione Power Automate ---  
# URL generato dopo il salvataggio del Flow  
VITE_PA_SEND_QR_URL=https://prod-xx.region.logic.azure.com:443/workflows/... 

# Admin (opzionali, oltre all'app role)
VITE_ADMIN_EMAILS=user1@contoso.com,user2@contoso.com
VITE_ADMIN_GROUP_IDS=<groupId1>,<groupId2>

```
Ricarica npm run dev dopo modifiche all'env.

---

## 🎨 8. Adattamento al Cliente (Branding)

- **Loghi e Testi**: Modifica src/components/KioskMain.tsx per cambiare il titolo del totem o i loghi aziendali.
- **Categorie Personalizzate**: Se il cliente usa categorie diverse da "VISITATORE/FORNITORE", aggiorna:
    1.  Le Choice nelle Liste SharePoint.
    2.  Il dropdown nel componente React (file KioskMain.tsx).
    3.  I riferimenti in AccessiService.ts se presenti hardcoded.

---

## 🛠 9. Troubleshooting e Test

### Checklist di validazine su nuovo tenant

- Login MSAL completato (nessun 401/consent mancante).
- **Onboarding nuovo visitatore**: crea record in `Visitatori`, ricevi email con QR (flow ramo `send`).
- **Reinvio QR**: ricerca per email esistente, nessun nuovo record, email inviata (flow `resend`).
- **Ingresso/Uscita**: scansione QR registra riga in `Accessi` con Azione, PuntoAccesso, Categoria corretti; blocco uscita se manca ingresso.
- **Area admin** (solo ruolo `Totem.Admin` o override env): presenze live, storico filtrabile, elenco visitatori accessibile.

### Errori Comuni

- **403 Forbidden / Access Denied**:
    - Verifica di aver premuto **"Grant Admin Consent"** in Entra ID.
    - Verifica che l'utente loggato abbia diritti di scrittura sul sito SharePoint.
- **404 Item Not Found**:
    - Il VITE_SHAREPOINT_LIST_ID è sbagliato. Hai rimosso %7B e %7D?
    - Il VITE_SHAREPOINT_SITE_ID è nel formato sbagliato (deve contenere le virgole).
- **CORS Error su Power Automate**:
    - Solitamente Power Automate accetta chiamate da qualsiasi origine, ma verifica che il metodo sia POST e l'header Content-Type: application/json.

---

## 10) Rollout multi-tenant veloce (riassunto)
1. Clona repo o scarica build.
2. Crea App Registration + permessi + ruolo admin, prendi ID.
3. Crea liste SharePoint, prendi Site ID + List ID, assegna permessi operatori.
4. Crea flow Power Automate con schema sopra, copia URL.
5. Compila `.env.local` per il tenant.
6. Build e pubblica; esegui la checklist di validazione.
    
