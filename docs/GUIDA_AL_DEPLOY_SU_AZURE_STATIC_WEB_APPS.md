# ☁️ Guida al Deploy su Azure Static Web Apps

Questa guida spiega come pubblicare l'applicazione Kiosk Visitatori su Azure utilizzando il servizio **Azure Static Web Apps**.

Questo servizio è ideale per Single Page Applications (SPA) come questa (React + Vite) perché offre:
- **Hosting Gratuito** (Piano Free).
- **Certificato SSL** automatico.
- **CI/CD integrata** con GitHub Actions.
- **Domini personalizzati**.

---

## ✅ 1. Prerequisiti

1.  **Codice su GitHub**: Il progetto deve essere pushato su un repository GitHub.
2.  **Account Azure**: Accesso al [Portale Azure](https://portal.azure.com).
3.  **Variabili d'ambiente**: Avere a portata di mano i valori del file `.env.local`.

---

## 🚀 2. Creazione della Risorsa su Azure

1.  Accedi al [Portale Azure](https://portal.azure.com).
2.  Nella barra di ricerca, digita **Static Web Apps** e seleziona il servizio.
3.  Clicca su **+ Crea**.
4.  Compila la scheda **Basics**:
    - **Subscription**: La tua sottoscrizione Azure.
    - **Resource Group**: Seleziona uno esistente o creane uno nuovo (es. `rg-kiosk-visitatori`).
    - **Name**: Nome della risorsa (es. `kiosk-visitatori-app`).
    - **Plan type**: Seleziona **Free** (Per hobby/progetti personali).
    - **Deployment details**: Seleziona **GitHub**.
    - **Organization / Repository / Branch**: Collega il tuo account GitHub e seleziona il repo e il branch (solitamente `main` o `master`).

5.  Compila la sezione **Build Details**:
    - **Build Presets**: Seleziona `React`.
    - **App location**: `/` (La root del progetto).
    - **Api location**: Lascia vuoto (non usiamo Azure Functions backend qui).
    - **Output location**: `dist` (Vite compila in questa cartella di default).

6.  Clicca su **Review + create** e poi su **Create**.

> **Nota**: Azure creerà automaticamente un file workflow `.github/workflows/azure-static-web-apps-...yml` nel tuo repository e avvierà la prima build.

---

## 🔑 3. Configurazione Variabili d'Ambiente

Poiché il file `.env.local` non viene caricato su GitHub per sicurezza, l'applicazione fallirà se non configuri le variabili su Azure.

1.  Vai alla risorsa **Static Web App** appena creata nel portale Azure.
2.  Nel menu laterale, seleziona **Settings** -> **Environment variables**.
3.  Clicca su **+ Add** e inserisci tutte le variabili presenti nel tuo `.env.local`.

Esempio delle variabili da inserire:
- `VITE_CLIENT_ID`
- `VITE_TENANT_ID`
- `VITE_SHAREPOINT_SITE_ID`
- `VITE_SHAREPOINT_LIST_ID`
- `VITE_ACCESSI_LIST_ID`
- `VITE_SETTINGS_LIST_ID`
- `VITE_PA_SEND_QR_URL`
- `VITE_REDIRECT_URI` (Imposta questo valore all'URL fornito da Azure, vedi punto successivo).

4.  Clicca **Save**.

---

## 🔄 4. Aggiornamento Autenticazione (Entra ID)

Una volta completato il deploy, Azure ti fornirà un URL pubblico (es. `https://lively-river-123.azurestaticapps.net`).

1.  Copia l'URL dalla pagina **Overview** della tua Static Web App.
2.  Vai su **Microsoft Entra ID** -> **App registrations**.
3.  Seleziona l'app registrata per il Kiosk.
4.  Vai su **Authentication** -> **Single-page application**.
5.  Nella sezione **Redirect URIs**, aggiungi il nuovo URL di Azure.
    - Esempio: `https://lively-river-123.azurestaticapps.net`
    - *Opzionale*: Se usi un dominio custom, aggiungi anche quello (es. `https://totem.tuaazienda.com`).
6.  Aggiorna la variabile d'ambiente `VITE_REDIRECT_URI` su Azure (vedi punto 3) con questo nuovo URL.

---

## 🌐 5. Configurazione Dominio Custom (Opzionale)

Se vuoi usare un dominio aziendale (es. `totem.azienda.it`):

1.  Nella risorsa Static Web App, vai su **Custom domains**.
2.  Clicca su **+ Add** -> **Custom domain on other DNS**.
3.  Inserisci il tuo dominio (es. `www.totem.azienda.it`).
4.  Azure ti chiederà di creare un record **CNAME** nel tuo provider DNS (GoDaddy, Aruba, AWS, ecc.) che punta all'URL predefinito di Azure (`lively-river...`).
5.  Una volta aggiunto il CNAME, clicca su **Add**.
6.  Azure verificherà il dominio e installerà automaticamente un certificato SSL.

---

## 🛠 6. Troubleshooting

- **Schermata bianca dopo il deploy?**
    - Controlla la console del browser (F12). Se vedi errori 404 sui file JS/CSS, verifica che `Output location` nelle impostazioni di build sia `dist`.
- **Errore di Login (Auth)?**
    - Verifica di aver aggiunto l'URL esatto (https e senza slash finale se necessario) nei Redirect URI di Entra ID.
- **Dati non caricati (// filepath: /home/rnebili/Progetti/TEL&CO/MICROSOFT/TestTotemIngressi/kiosk-visitatori-poc/docs/DEPLOY_AZURE.md
# ☁️ Guida al Deploy su Azure Static Web Apps

Questa guida spiega come pubblicare l'applicazione Kiosk Visitatori su Azure utilizzando il servizio **Azure Static Web Apps**.

Questo servizio è ideale per Single Page Applications (SPA) come questa (React + Vite) perché offre:
- **Hosting Gratuito** (Piano Free).
- **Certificato SSL** automatico.
- **CI/CD integrata** con GitHub Actions.
- **Domini personalizzati**.

---

## ✅ 1. Prerequisiti

1.  **Codice su GitHub**: Il progetto deve essere pushato su un repository GitHub.
2.  **Account Azure**: Accesso al [Portale Azure](https://portal.azure.com).
3.  **Variabili d'ambiente**: Avere a portata di mano i valori del file `.env.local`.

---

## 🚀 2. Creazione della Risorsa su Azure

1.  Accedi al [Portale Azure](https://portal.azure.com).
2.  Nella barra di ricerca, digita **Static Web Apps** e seleziona il servizio.
3.  Clicca su **+ Crea**.
4.  Compila la scheda **Basics**:
    - **Subscription**: La tua sottoscrizione Azure.
    - **Resource Group**: Seleziona uno esistente o creane uno nuovo (es. `rg-kiosk-visitatori`).
    - **Name**: Nome della risorsa (es. `kiosk-visitatori-app`).
    - **Plan type**: Seleziona **Free** (Per hobby/progetti personali).
    - **Deployment details**: Seleziona **GitHub**.
    - **Organization / Repository / Branch**: Collega il tuo account GitHub e seleziona il repo e il branch (solitamente `main` o `master`).

5.  Compila la sezione **Build Details**:
    - **Build Presets**: Seleziona `React`.
    - **App location**: `/` (La root del progetto).
    - **Api location**: Lascia vuoto (non usiamo Azure Functions backend qui).
    - **Output location**: `dist` (Vite compila in questa cartella di default).

6.  Clicca su **Review + create** e poi su **Create**.

> **Nota**: Azure creerà automaticamente un file workflow `.github/workflows/azure-static-web-apps-...yml` nel tuo repository e avvierà la prima build.

---

## 🔑 3. Configurazione Variabili d'Ambiente

Poiché il file `.env.local` non viene caricato su GitHub per sicurezza, l'applicazione fallirà se non configuri le variabili su Azure.

1.  Vai alla risorsa **Static Web App** appena creata nel portale Azure.
2.  Nel menu laterale, seleziona **Settings** -> **Environment variables**.
3.  Clicca su **+ Add** e inserisci tutte le variabili presenti nel tuo `.env.local`.

Esempio delle variabili da inserire:
- `VITE_CLIENT_ID`
- `VITE_TENANT_ID`
- `VITE_SHAREPOINT_SITE_ID`
- `VITE_SHAREPOINT_LIST_ID`
- `VITE_ACCESSI_LIST_ID`
- `VITE_SETTINGS_LIST_ID`
- `VITE_PA_SEND_QR_URL`
- `VITE_REDIRECT_URI` (Imposta questo valore all'URL fornito da Azure, vedi punto successivo).

4.  Clicca **Save**.

---

## 🔄 4. Aggiornamento Autenticazione (Entra ID)

Una volta completato il deploy, Azure ti fornirà un URL pubblico (es. `https://lively-river-123.azurestaticapps.net`).

1.  Copia l'URL dalla pagina **Overview** della tua Static Web App.
2.  Vai su **Microsoft Entra ID** -> **App registrations**.
3.  Seleziona l'app registrata per il Kiosk.
4.  Vai su **Authentication** -> **Single-page application**.
5.  Nella sezione **Redirect URIs**, aggiungi il nuovo URL di Azure.
    - Esempio: `https://lively-river-123.azurestaticapps.net`
    - *Opzionale*: Se usi un dominio custom, aggiungi anche quello (es. `https://totem.tuaazienda.com`).
6.  Aggiorna la variabile d'ambiente `VITE_REDIRECT_URI` su Azure (vedi punto 3) con questo nuovo URL.

---

## 🌐 5. Configurazione Dominio Custom (Opzionale)

Se vuoi usare un dominio aziendale (es. `totem.azienda.it`):

1.  Nella risorsa Static Web App, vai su **Custom domains**.
2.  Clicca su **+ Add** -> **Custom domain on other DNS**.
3.  Inserisci il tuo dominio (es. `www.totem.azienda.it`).
4.  Azure ti chiederà di creare un record **CNAME** nel tuo provider DNS (GoDaddy, Aruba, AWS, ecc.) che punta all'URL predefinito di Azure (`lively-river...`).
5.  Una volta aggiunto il CNAME, clicca su **Add**.
6.  Azure verificherà il dominio e installerà automaticamente un certificato SSL.

---

## 🛠 6. Troubleshooting

- **Schermata bianca dopo il deploy?**
    - Controlla la console del browser (F12). Se vedi errori 404 sui file JS/CSS, verifica che `Output location` nelle impostazioni di build sia `dist`.
- **Errore di Login (Auth)?**
    - Verifica di aver aggiunto l'URL esatto (https e senza slash finale se necessario) nei Redirect URI di Entra ID.
- **Dati non caricati (