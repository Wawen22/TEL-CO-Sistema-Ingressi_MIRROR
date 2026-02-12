import { useEffect, useRef, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError, BrowserAuthError } from "@azure/msal-browser";
import type { SilentRequest, AuthenticationResult } from "@azure/msal-browser";
import { loginRequest } from "../config/authConfig";

/**
 * Intervallo di rinnovo del token in millisecondi (30 minuti).
 */
const TOKEN_RENEWAL_INTERVAL_MS = 30 * 60 * 1000;

/**
 * Hook per il rinnovo proattivo e il recupero automatico del token MSAL.
 *
 * - Rinnova il token ogni 30 minuti via acquireTokenSilent
 * - Se fallisce, esegue loginRedirect con prompt=none (sessione Azure 365 giorni)
 * - Espone getAccessToken() per ottenere un token valido su richiesta
 */
export function useTokenRenewal() {
  const { instance, accounts } = useMsal();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRenewingRef = useRef(false);

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

      try {
        const result = await instance.acquireTokenSilent(silentRequest);
        console.info(
          `[TokenRenewal] Token rinnovato. Scade: ${result.expiresOn?.toLocaleString()}`
        );
        return result;
      } catch (silentError) {
        console.warn("[TokenRenewal] acquireTokenSilent fallito:", silentError);

        const isInteractionRequired =
          silentError instanceof InteractionRequiredAuthError;
        const isIframeTimeout =
          silentError instanceof BrowserAuthError &&
          (silentError as any).errorCode === "monitor_window_timeout";

        if (isInteractionRequired || isIframeTimeout) {
          try {
            console.info("[TokenRenewal] Fallback a loginRedirect con prompt=none...");
            await instance.loginRedirect({
              ...loginRequest,
              prompt: "none",
            });
            return null;
          } catch (redirectError) {
            console.error("[TokenRenewal] loginRedirect fallito:", redirectError);
            return null;
          }
        }

        console.error("[TokenRenewal] Errore non recuperabile:", silentError);
        return null;
      }
    },
    [instance, accounts]
  );

  const renewTokenProactively = useCallback(async () => {
    if (isRenewingRef.current || !accounts.length) return;
    isRenewingRef.current = true;
    try {
      await acquireTokenWithRecovery(false);
    } finally {
      isRenewingRef.current = false;
    }
  }, [accounts, acquireTokenWithRecovery]);

  useEffect(() => {
    if (!accounts.length) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const startupTimeout = setTimeout(() => {
      renewTokenProactively();
    }, 5000);

    intervalRef.current = setInterval(() => {
      console.info("[TokenRenewal] Rinnovo proattivo schedulato...");
      renewTokenProactively();
    }, TOKEN_RENEWAL_INTERVAL_MS);

    return () => {
      clearTimeout(startupTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [accounts, renewTokenProactively]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const result = await acquireTokenWithRecovery(false);
    return result?.accessToken ?? null;
  }, [acquireTokenWithRecovery]);

  return { getAccessToken, acquireTokenWithRecovery };
}
