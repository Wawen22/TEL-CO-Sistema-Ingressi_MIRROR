# 🏗️ Architettura e Integrazione Microsoft 365

Questo documento descrive l'architettura tecnica della soluzione Kiosk Visitatori, spiegando i componenti chiave dell'ecosistema Microsoft 365 e come interagiscono tra loro. È pensato per sviluppatori, architetti software e responsabili tecnici che necessitano di comprendere il funzionamento "sotto il cofano" del sistema.

## 1. Panoramica Architetturale

L'applicazione è una **Single Page Application (SPA)** "Serverless" che si appoggia interamente ai servizi cloud di Microsoft 365. Non esiste un backend custom tradizionale (come Node.js, .NET o Java) da gestire, aggiornare o scalare; il backend è costituito dai servizi Microsoft stessi, orchestrati dal frontend.

### Diagramma Concettuale

```mermaid
graph TD
    User[Utente Kiosk] -->|Interagisce| FE[Frontend React/Vite]
    
    subgraph "Microsoft Cloud (Tenant Cliente)"
        FE -->|1. Autenticazione (OIDC)| Entra[Microsoft Entra ID]
        FE -->|2. Dati (Graph API)| SP[SharePoint Online]
        FE -->|3. Logica (HTTP POST)| PA[Power Automate]
        
        Entra -->|Rilascia Access Token| FE
        SP -->|Database (Liste)| SP_DB[(Liste Dati)]
        PA -->|Invia Email| Exchange[Exchange Online]
    end
```

### Flussi di Autenticazione Visitatori

Il sistema supporta due modalità di autenticazione, configurabili centralmente:

1.  **Modalità QR Code (Default):**
    *   Il visitatore riceve un QR Code via email al momento della registrazione.
    *   Scansiona il QR Code al totem per Ingresso/Uscita.
    *   Il sistema valida il codice confrontandolo con la lista SharePoint `Visitatori`.

2.  **Modalità Email + OTP:**
    *   Il visitatore inserisce la propria email al totem.
    *   Il sistema verifica l'esistenza dell'email nella lista `Visitatori`.
    *   Viene generato un OTP (One Time Password) client-side e inviato via Power Automate.
    *   Il visitatore inserisce l'OTP per confermare l'accesso.

3.  **Presa visione privacy + Destinazione ingresso**
    *   Prima di concludere la registrazione viene mostrata la modale "Informativa sulla privacy" con i PDF presi dal Drive SharePoint `PrivacyDocuments`.
    *   Dopo un ingresso valido viene richiesto di scegliere la destinazione; il percorso è salvato in `Accessi.PercorsoDestinazione` e usato dalle dashboard admin per instradare il visitatore.

---

## 2. Microsoft Entra ID (Identity Provider)

### Cos'è
Microsoft Entra ID (precedentemente noto come **Azure Active Directory**) è il servizio di gestione delle identità e degli accessi basato sul cloud. Funge da "passaporto" digitale per gli utenti e le applicazioni all'interno dell'ecosistema Microsoft.

### Il ruolo nel progetto
Invece di creare un sistema di login proprietario (con tabella utenti e password nel database), deleghiamo l'autenticazione a Entra ID.

1.  **App Registration:** L'applicazione Kiosk è registrata nel tenant Microsoft come entità digitale. Questo fornisce un `Client ID` che identifica univocamente il nostro frontend.
2.  **Protocollo Sicuro:** Utilizziamo **OAuth 2.0** e **OpenID Connect** con il flusso "Authorization Code con PKCE" (Proof Key for Code Exchange). Questo è lo standard di sicurezza attuale per le applicazioni frontend (SPA) che non possono conservare segreti (client secrets).
3.  **MSAL (Microsoft Authentication Library):** Nel codice React utilizziamo la libreria ufficiale `@azure/msal-react`. Questa gestisce la complessità dei redirect, il refresh silenzioso dei token (per non far scadere la sessione) e la cache sicura nel browser.

### Perché è fondamentale
Garantisce che solo gli utenti del tenant aziendale possano accedere al Kiosk. Inoltre, gestisce i permessi tramite i **Delegated Permissions** (es. "L'utente loggato autorizza l'app a leggere le liste SharePoint per suo conto").

---

## 3. Integrazione con SharePoint (Il "Database")

### Il concetto
Utilizziamo SharePoint Online non come semplice gestore documentale, ma come un **Headless CMS** o un database NoSQL leggero. Le "Liste" di SharePoint fungono da tabelle del database relazionale.

### Come avviene il collegamento
Il frontend non comunica direttamente con i server di SharePoint in modo proprietario, ma utilizza **Microsoft Graph**.

1.  **Il Token:** Dopo il login, il frontend richiede a Entra ID un "Access Token" specifico che include i permessi (scope) `Sites.ReadWrite.All`.
2.  **Microsoft Graph API:** È l'API unificata di Microsoft (`https://graph.microsoft.com`). Il frontend invia richieste HTTP standard (GET, POST, PATCH) a Graph, includendo il token nell'header `Authorization: Bearer <token>`.
3.  **Proxy Trasparente:** Graph riceve la richiesta, valida il token e, se l'utente ha i permessi, esegue l'operazione sulla lista SharePoint specifica (identificata da Site ID e List ID).

### Vantaggi
*   **Zero Backend:** Nessun database SQL da configurare, pagare o manutenere.
*   **Data Sovereignty:** I dati restano nel tenant del cliente, rispettando le policy di compliance aziendali.
*   **Accessibilità:** Gli amministratori possono visualizzare ed esportare i dati (es. in Excel) direttamente dall'interfaccia nativa di SharePoint.

---

## 4. Integrazione con Power Automate (Logica Backend)

### Il concetto
Per operazioni che richiedono l'invio di email o logiche di business asincrone (es. generazione PDF, notifiche complesse) che non vogliamo gestire nel frontend, utilizziamo Power Automate (Logic Apps).

### Come avviene il collegamento
1.  **Trigger HTTP:** Abbiamo creato un flusso (Flow) che inizia con un trigger "When an HTTP request is received". Questo genera un URL pubblico univoco che funge da endpoint API REST.
2.  **Chiamata dal Frontend:** Quando un visitatore si registra o richiede un OTP, il frontend esegue una `fetch()` (POST) verso questo URL.
3.  **Payload JSON:** Il payload include un campo `action` che determina l'operazione:
    *   `send`: Invia QR Code di benvenuto.
    *   `resend`: Reinvia QR Code esistente.
    *   `otp`: Invia codice OTP numerico per accesso senza QR.
4.  **Esecuzione Flow:** Power Automate riceve il JSON, valuta l'azione tramite uno Switch e invia l'email appropriata.

### Sicurezza
L'URL del trigger contiene una firma SAS (Shared Access Signature) integrata nella query string. Chi possiede l'URL completo può attivare il flusso. Per questo motivo, l'URL è salvato nel file `.env` e non deve essere esposto pubblicamente nel codice sorgente (repository).

---

## Riepilogo Tecnico per Sviluppatori

| Componente | Tecnologia | Libreria/Protocollo | Funzione |
| :--- | :--- | :--- | :--- |
| **Frontend** | React + Vite | TypeScript | Interfaccia Utente, Logica Client, Scanner QR |
| **Auth** | Entra ID | `@azure/msal-browser` | Login SSO, gestione Token, Protezione Route |
| **API Dati** | Microsoft Graph | `@microsoft/microsoft-graph-client` | CRUD su Liste SharePoint (Visitatori, Accessi) |
| **Backend Logic** | Power Automate | `fetch` (REST) | Invio Email, Orchestrazione processi |
| **Database** | SharePoint Lists | - | Persistenza dati, Audit log nativo |

Questa architettura "Low-Code / Pro-Code Hybrid" permette uno sviluppo rapido, costi di manutenzione minimi e una sicurezza di livello enterprise nativa, sfruttando le licenze Microsoft 365 già in possesso del cliente.
