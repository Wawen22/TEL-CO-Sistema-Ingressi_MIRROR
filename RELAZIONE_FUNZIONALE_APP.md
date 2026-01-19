# Relazione Tecnica e Funzionale: Kiosk Visitatori

## Introduzione
L'applicazione **Kiosk Visitatori** è una soluzione di *Digital Reception* progettata per modernizzare, digitalizzare e mettere in sicurezza il processo di accoglienza ospiti in azienda. Il sistema sostituisce il cartaceo con un'interfaccia touch moderna, garantendo conformità GDPR, tracciabilità degli accessi e integrazione nativa con l'ecosistema Microsoft 365 aziendale.

---

## Punti di Forza e Tecnologie
Il sistema è costruito per sfruttare l'infrastruttura Microsoft già esistente in azienda, riducendo costi di gestione e aumentando la sicurezza.

*   **Integrazione Microsoft 365 Nativa**: Non richiede database esterni costosi. Tutti i dati risiedono nel **SharePoint** aziendale (liste visitatori, log accessi, documenti).
*   **Sicurezza Enterprise**: L'accesso all'applicazione e ai dati è protetto da **Microsoft Entra ID (Azure AD)**, garantendo che solo il personale autorizzato e il sistema stesso possano leggere/scrivere dati.
*   **Frontend Moderno**: Sviluppato in **React**, offre un'interfaccia fluida, reattiva e ottimizzata per schermi touch (Totem/Tablet).
*   **Automazione**: Utilizza **Power Automate** per l'invio automatico di email, QR Code e notifiche, senza richiedere server di posta dedicati.

---

## Funzionalità Utente (Lato Visitatore)
Il Kiosk offre un'esperienza *self-service* intuitiva, disponibile in doppia lingua (Italiano/Inglese).

### 1. Modalità di Accesso Flessibili
Il sistema supporta due modalità operative, configurabili dall'amministrazione:
*   **QR Code (Standard)**: Il visitatore riceve un QR via email e lo scansiona al totem per entrare/uscire in un istante.
*   **Email + OTP**: In assenza di QR, il visitatore può identificarsi inserendo la propria email e un codice temporaneo (OTP) ricevuto in tempo reale.

### 2. Onboarding e Registrazione
I nuovi visitatori possono registrarsi autonomamente al totem:
*   Compilazione anagrafica (Nome, Azienda, Email, Referente).
*   Gestione categorie specifiche (es. Ispettori, Fornitori) con campi aggiuntivi (Progetto, Commessa).
*   Generazione automatica del pass (QR Code) inviato via email.

### 3. Gestione Privacy e Sicurezza (GDPR)
*   **Accettazione Privacy**: Durante la registrazione, il sistema mostra le informative privacy (gestite dinamicamente come PDF). L'accettazione è obbligatoria per procedere.
*   **Video Tutorial Sicurezza**: Al primo accesso, il sistema può obbligare la visione di un video di sicurezza. Il sistema "ricorda" se l'utente lo ha già visto, evitando di riproporlo agli accessi successivi.

### 4. Check-in e Check-out
*   **Ingresso**: Scansione QR -> (Video se necessario) -> Scelta del reparto/destinazione -> Conferma.
*   **Uscita**: Scansione QR -> Registrazione orario di uscita.

---

## Funzionalità Amministrative (Lato Staff)
Un'area riservata, accessibile solo agli utenti autorizzati (Receptionist/Admin), permette il controllo completo.

### 1. Dashboard "Presenti Ora"
Visualizzazione in tempo reale di tutti i visitatori attualmente all'interno dell'edificio. Permette di sapere sempre chi è presente in caso di emergenza.

### 2. Storico e Audit
Registro completo di tutti i movimenti (Ingressi e Uscite) con timestamp, destinazione e dettagli visitatore. Utile per reportistica e controlli di sicurezza.

### 3. Gestione Visitatori
Anagrafica completa dei visitatori registrati, con possibilità di ricerca e gestione.

### 4. Gestione Documenti Privacy
Interfaccia per caricare, aggiornare o rimuovere i file PDF delle informative privacy mostrate dal totem, senza dover modificare il codice dell'app.

### 5. Impostazioni
Pannello per configurare il comportamento del totem (es. cambio modalità da QR a Email) direttamente dall'interfaccia.

---

## Riepilogo Tecnico
| Componente | Tecnologia Utilizzata | Ruolo |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, TypeScript | Interfaccia Utente (Kiosk & Admin) |
| **Autenticazione** | Microsoft Authentication Library (MSAL) | Login sicuro e gestione token |
| **Database** | SharePoint Online Lists | Archiviazione Anagrafiche e Log |
| **Documentale** | SharePoint Document Library | Archiviazione PDF Privacy |
| **Backend Logic** | Power Automate (Flows) | Invio Email, OTP e generazione PDF/QR |
