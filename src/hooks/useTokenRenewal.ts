import { useEffect, useRef, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError, BrowserAuthError } from "@azure/msal-browser";
import type { SilentRequest, AuthenticationResult } from "@azure/msal-browser";
import { loginRequest } from "../config/authConfig";

/**
 * Intervallo di rinnovo del token in millisecondi (30 minuti).
 * Microsoft impone un limite massimo di 24h per gli access token.
 * Rinnovando ogni 30 minuti, il token non scade mai, nemmeno di notte.
 */
const TOKEN_RENEWAL_INTERVAL_MS = 30 * 60 * 1000; // 30 minuti

/**
 * Hook che gestisce il rinnovo proattivo e il recupero automatico del token.
 *
 * Meccanismo 1 — Rinnovo preventivo:
 *   Ogni 30 minuti chiama acquireTokenSilent per ottenere un token fresco,
 *   mantenendo attivo il refresh token anche durante periodi di inattività.
 *
 * Meccanismo 2 — Recupero automatico trasparente:
 *   Se acquireTokenSilent fallisce (es. problemi di rete temporanei), tenta
 *   ssoSilent per sfruttare la sessione persistente di Azure (365 giorni).
 *   Solo come ultima risorsa esegue un loginRedirect.
 */
export function useTokenRenewal() {
  const { instance, accounts } = useMsal();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRenewingRef = useRef(false);

  /**
   * Tenta di acquisire un token in modo silenzioso.
   * Se fallisce, prova ssoSilent. Se anche quello fallisce, esegue loginRedirect.
   * Restituisce l'AuthenticationResult oppure null.
   */
  const acquireTokenWithRecovery = useCallback(
    async (forceRefresh = false): Promise<AuthenticationResult | null> => {
      const account = accounts[0];
      if (!account) {
        console.warn("[TokenRenewal] Nessun account attivo, skip rinnovo.");
        return null;
      }

      const silentRequest: SilentRequest = {
        ...loginRequest,
        account,
        forceRefresh,
      };

      // --- Tentativo 1: acquireTokenSilent (usa refresh token dalla cache) ---
      try {
        const result = await instance.acquireTokenSilent(silentRequest);
        console.info(
          `[TokenRenewal] Token rinnovato silenziosamente. Scade: ${result.expiresOn?.toLocaleString()}`
        );
        return result;
      } catch (silentError) {
        console.warn("[TokenRenewal] acquireTokenSilent fallito:", silentError);

        // Determina se è un errore recuperabile con redirect
        const isInteractionRequired =
          silentError instanceof InteractionRequiredAuthError;
        const isIframeTimeout =
          silentError instanceof BrowserAuthError &&
          (silentError as any).errorCode === "monitor_window_timeout";

        if (isInteractionRequired || isIframeTimeout) {
          // --- Tentativo 2: loginRedirect con prompt "none" ---
          // NON usiamo ssoSilent perché si basa su un iframe nascosto
          // che fallisce nei browser moderni a causa del blocco dei
          // cookie di terze parti (monitor_window_timeout).
          // loginRedirect fa un redirect completo di pagina, aggirando
          // il problema iframe e sfruttando la sessione Azure a 365 giorni.
          try {
            console.info(
              "[TokenRenewal] Fallback a loginRedirect con prompt=none (sessione Azure 365 giorni)..."
            );
            await instance.loginRedirect({
              ...loginRequest,
              prompt: "none", // Non mostra UI, usa la sessione Azure esistente
            });
            // loginRedirect naviga via, quindi non arriveremo qui
            return null;
          } catch (redirectError) {
            console.error(
              "[TokenRenewal] loginRedirect fallito. Potrebbe servire login manuale:",
              redirectError
            );
            return null;
          }
        }

        // Errore non di interazione (es. rete temporanea), logga e ritorna null
        // Il prossimo ciclo di rinnovo riproverà tra 30 minuti
        console.error("[TokenRenewal] Errore non recuperabile (riprova al prossimo ciclo):", silentError);
        return null;
      }
    },
    [instance, accounts]
  );

  /**
   * Funzione di rinnovo proattivo periodico.
   * Chiamata ogni 30 minuti dall'interval.
   */
  const renewTokenProactively = useCallback(async () => {
    if (isRenewingRef.current) {
      console.info("[TokenRenewal] Rinnovo già in corso, skip.");
      return;
    }

    if (!accounts.length) {
      console.info("[TokenRenewal] Nessun account, skip rinnovo proattivo.");
      return;
    }

    isRenewingRef.current = true;
    try {
      await acquireTokenWithRecovery(false);
    } finally {
      isRenewingRef.current = false;
    }
  }, [accounts, acquireTokenWithRecovery]);

  /**
   * Imposta l'interval di rinnovo proattivo.
   * Si attiva solo quando c'è un account autenticato.
   */
  useEffect(() => {
    if (!accounts.length) {
      // Nessun utente loggato: pulisci interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Primo rinnovo immediato all'avvio (o dopo login)
    // Ritardato di 5 secondi per dare tempo a MSAL di stabilizzarsi
    const startupTimeout = setTimeout(() => {
      renewTokenProactively();
    }, 5000);

    // Rinnovo periodico ogni 30 minuti
    intervalRef.current = setInterval(() => {
      console.info("[TokenRenewal] Rinnovo proattivo schedulato...");
      renewTokenProactively();
    }, TOKEN_RENEWAL_INTERVAL_MS);

    console.info(
      `[TokenRenewal] Timer rinnovo attivato: ogni ${TOKEN_RENEWAL_INTERVAL_MS / 60000} minuti`
    );

    return () => {
      clearTimeout(startupTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [accounts, renewTokenProactively]);

  /**
   * Wrapper per acquireTokenSilent con recupero automatico.
   * Da usare nei componenti al posto di instance.acquireTokenSilent diretto.
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const result = await acquireTokenWithRecovery(false);
    return result?.accessToken ?? null;
  }, [acquireTokenWithRecovery]);

  return { getAccessToken, acquireTokenWithRecovery };
}
