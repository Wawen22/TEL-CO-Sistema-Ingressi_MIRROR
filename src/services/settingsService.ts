import { Client } from "@microsoft/microsoft-graph-client";

export interface SettingItem {
  id?: string; // SharePoint Item ID
  Title: string; // Key (es. "AuthMode")
  Valore: string; // Value (es. "QR" or "EMAIL")
  Descrizione?: string;
}

export class SettingsService {
  private client: Client;
  private siteId: string;
  private listId: string;

  constructor(accessToken: string, siteId: string, listId: string) {
    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
    this.siteId = siteId;
    this.listId = listId;
  }

  /**
   * Recupera tutte le impostazioni
   */
  async getAllSettings(): Promise<SettingItem[]> {
    try {
      const response = await this.client
        .api(`/sites/${this.siteId}/lists/${this.listId}/items`)
        .expand("fields")
        .get();

      return response.value.map((item: any) => ({
        id: item.id,
        Title: item.fields.Title,
        Valore: item.fields.Valore,
        Descrizione: item.fields.Descrizione,
      }));
    } catch (error) {
      console.error("Errore recupero impostazioni:", error);
      throw error;
    }
  }

  /**
   * Recupera una specifica impostazione per Chiave (Title)
   */
  async getSetting(key: string): Promise<string | null> {
    try {
      // Filtra per Title eq 'Key'
      // Nota: Graph API filtering on list items fields can be tricky. 
      // Spesso è più semplice prendere tutto (se sono poche impostazioni) e filtrare client side.
      // Oppure usare filter=fields/Title eq 'Key' (richiede indicizzazione spesso).
      // Dato che le impostazioni sono poche, prendiamo tutto per sicurezza.
      
      const settings = await this.getAllSettings();
      const setting = settings.find(s => s.Title === key);
      return setting ? setting.Valore : null;
    } catch (error) {
      console.error(`Errore recupero impostazione ${key}:`, error);
      return null;
    }
  }

  /**
   * Aggiorna o Crea una impostazione
   */
  async updateSetting(key: string, value: string): Promise<void> {
    try {
      const settings = await this.getAllSettings();
      const existing = settings.find(s => s.Title === key);

      if (existing && existing.id) {
        // Update
        await this.client
          .api(`/sites/${this.siteId}/lists/${this.listId}/items/${existing.id}/fields`)
          .update({
            Valore: value
          });
      } else {
        // Create
        await this.client
          .api(`/sites/${this.siteId}/lists/${this.listId}/items`)
          .post({
            fields: {
              Title: key,
              Valore: value
            }
          });
      }
    } catch (error) {
      console.error(`Errore aggiornamento impostazione ${key}:`, error);
      throw error;
    }
  }
}
