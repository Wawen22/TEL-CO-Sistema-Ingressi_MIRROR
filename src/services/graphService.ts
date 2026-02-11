import { Client } from "@microsoft/microsoft-graph-client";

/**
 * Service per le chiamate a Microsoft Graph API
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
   * Ottiene la lista dei siti SharePoint
   */
  async getSites() {
    try {
      const sites = await this.graphClient.api("/sites?search=*").get();
      return sites.value;
    } catch (error) {
      console.error("Error getting sites:", error);
      throw error;
    }
  }

  /**
   * Ottiene un sito specifico tramite path
   */
  async getSiteByPath(hostname: string, sitePath: string) {
    try {
      const site = await this.graphClient
        .api(`/sites/${hostname}:${sitePath}`)
        .get();
      return site;
    } catch (error) {
      console.error("Error getting site by path:", error);
      throw error;
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

  /**
   * Ottiene la foto profilo di un utente
   */
  async getUserPhoto(userId: string): Promise<string | null> {
    try {
      const response = await this.graphClient
        .api(`/users/${userId}/photo/$value`)
        .responseType("blob")
        .get();
      
      return URL.createObjectURL(response);
    } catch (error) {
      // Errore comune: l'utente non ha una foto (404)
      return null;
    }
  }
}
