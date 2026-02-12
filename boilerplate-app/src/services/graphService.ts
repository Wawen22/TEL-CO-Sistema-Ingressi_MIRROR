import { Client, ResponseType } from "@microsoft/microsoft-graph-client";

/**
 * Service per le chiamate a Microsoft Graph API.
 * Inizializza il client con l'access token ottenuto da MSAL.
 */
export class GraphService {
  private graphClient: Client;

  constructor(accessToken: string) {
    this.graphClient = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  /**
   * Ottiene il profilo dell'utente corrente
   */
  async getUserProfile() {
    try {
      const user = await this.graphClient.api("/me").get();
      return user;
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  }

  /**
   * Ottiene la foto profilo dell'utente corrente come blob URL
   */
  async getMyPhoto(): Promise<string | null> {
    try {
      const response = await this.graphClient
        .api("/me/photo/$value")
        .responseType(ResponseType.BLOB)
        .get();
      return URL.createObjectURL(response);
    } catch {
      return null;
    }
  }

  /**
   * Cerca utenti nel tenant
   */
  async searchUsers(query: string) {
    try {
      if (!query || query.length < 2) return [];
      const response = await this.graphClient
        .api("/users")
        .header("ConsistencyLevel", "eventual")
        .search(`"displayName:${query}" OR "mail:${query}"`)
        .select("id,displayName,mail,jobTitle,userPrincipalName")
        .top(10)
        .get();
      return response.value || [];
    } catch (error) {
      console.error("Error searching users:", error);
      return [];
    }
  }
}
