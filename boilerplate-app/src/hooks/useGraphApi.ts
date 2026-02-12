import { useState, useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../config/authConfig";
import { GraphService } from "../services/graphService";

/**
 * Hook generico per chiamate Microsoft Graph.
 *
 * Semplifica il pattern ripetitivo di:
 *   1. Ottenere il token (acquireTokenSilent)
 *   2. Creare un GraphService
 *   3. Eseguire la chiamata
 *   4. Gestire loading/error
 *
 * @example
 * ```tsx
 * const { callGraph, loading, error } = useGraphApi();
 *
 * const loadProfile = async () => {
 *   const profile = await callGraph(service => service.getUserProfile());
 *   if (profile) setUser(profile);
 * };
 * ```
 */
export function useGraphApi() {
  const { instance, accounts } = useMsal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Esegue una chiamata Graph tramite il servizio.
   * Gestisce automaticamente token, loading e error.
   *
   * @param callback - Funzione che riceve un GraphService e ritorna una Promise
   * @returns Il risultato della callback, oppure null in caso di errore
   */
  const callGraph = useCallback(
    async <T>(callback: (service: GraphService) => Promise<T>): Promise<T | null> => {
      const account = accounts[0];
      if (!account) {
        setError(new Error("Nessun account autenticato"));
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account,
        });
        const service = new GraphService(response.accessToken);
        const result = await callback(service);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error("[useGraphApi] Errore:", error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [instance, accounts]
  );

  /**
   * Ottiene un access token valido per chiamate manuali.
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const account = accounts[0];
    if (!account) return null;
    try {
      const response = await instance.acquireTokenSilent({
        ...loginRequest,
        account,
      });
      return response.accessToken;
    } catch {
      return null;
    }
  }, [instance, accounts]);

  return { callGraph, getAccessToken, loading, error };
}
