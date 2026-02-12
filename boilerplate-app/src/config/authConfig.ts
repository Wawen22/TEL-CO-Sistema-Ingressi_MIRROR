import type { Configuration, PopupRequest } from "@azure/msal-browser";

/**
 * Configurazione MSAL per l'autenticazione Microsoft.
 * I valori vengono letti dal file .env.local tramite Vite.
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_TENANT_ID}`,
    redirectUri: import.meta.env.VITE_REDIRECT_URI,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    tokenRenewalOffsetSeconds: 300,
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case 0:
            console.error(message);
            return;
          case 1:
            console.warn(message);
            return;
          case 2:
            console.info(message);
            return;
          case 3:
            console.debug(message);
            return;
        }
      },
    },
  },
};

/**
 * Scopes richiesti per il login.
 * Aggiungi qui gli scope necessari per la tua applicazione.
 */
export const loginRequest: PopupRequest = {
  scopes: ["User.Read"],
};

/**
 * Configurazione endpoint Microsoft Graph
 */
export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphApiEndpoint: "https://graph.microsoft.com/v1.0",
};
