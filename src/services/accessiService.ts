import { Client } from "@microsoft/microsoft-graph-client";
import type { Accesso, VisitorePresente } from "../types/accessi.types";

/**
 * Service per la gestione degli accessi su SharePoint
 */
export class AccessiService {
  private graphClient: Client;
  private siteId: string;
  private accessiListId: string;
  private visitatoriListId: string;

  // Evita di rompere i filtri OData con apici
  private static escapeODataString(value: string) {
    return value.replace(/'/g, "''");
  }

  constructor(
    accessToken: string,
    siteId: string,
    accessiListId: string,
    visitatoriListId: string
  ) {
    this.graphClient = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
    this.siteId = siteId;
    this.accessiListId = accessiListId;
    this.visitatoriListId = visitatoriListId;
  }

  /**
   * Crea un nuovo accesso (check-in o check-out)
   */
  async createAccesso(accesso: Accesso) {
    try {
      const item = {
        fields: {
          Title: `ACC-${Date.now()}`, // ID Accesso univoco
          field_1: accesso.VisitoreID || "", // Campo testo con IDVisitatore
          field_2: accesso.VisitoreNome || "",
          field_3: accesso.VisitoreCognome || "",
          field_4: accesso.Timestamp || new Date().toISOString(),
          field_5: accesso.Azione || "Ingresso",
          field_6: accesso.PuntoAccesso || "Kiosk Principale",
          field_7: accesso.Note || "",
          field_8: accesso.Categoria || "VISITATORE",
          field_10: accesso.PercorsoDestinazione || "",
        },
      };

      const response = await this.graphClient
        .api(`/sites/${this.siteId}/lists/${this.accessiListId}/items`)
        .post(item);

      return response;
    } catch (error) {
      console.error("❌ Errore nella creazione dell'accesso:", error);
      throw error;
    }
  }

  /**
   * Aggiorna il percorso di destinazione su un accesso esistente
   */
  async updatePercorsoDestinazione(accessoId: string, destinazione: string) {
    try {
      await this.graphClient
        .api(`/sites/${this.siteId}/lists/${this.accessiListId}/items/${accessoId}/fields`)
        .update({ field_10: destinazione });
    } catch (error) {
      console.error("❌ Errore aggiornamento PercorsoDestinazione:", error);
      throw error;
    }
  }

  /**
   * Ottiene tutti gli accessi di un visitatore specifico
   */
  async getAccessiByVisitatore(visitatoreId: string) {
    try {
      const filter = `fields/field_1 eq '${AccessiService.escapeODataString(visitatoreId)}'`;
      const items = await this.getAllAccessi(200, filter, "fields/field_4 desc");
      return items;
    } catch (error) {
      console.error("❌ Errore nel recupero degli accessi:", error);
      throw error;
    }
  }

  /**
   * Ottiene tutti gli accessi con paginazione e filtri
   */
  async getAllAccessi(top: number = 100, filter?: string, orderBy: string = "fields/field_4 desc") {
    try {
      const items: any[] = [];

      let apiCall = this.graphClient
        .api(`/sites/${this.siteId}/lists/${this.accessiListId}/items`)
        .expand("fields($select=Title,field_1,field_2,field_3,field_4,field_5,field_6,field_7,field_8,field_10)")
        .top(top)
        .orderby(orderBy)
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly");

      if (filter) {
        apiCall = apiCall.filter(filter);
      }

      let response = await apiCall.get();
      items.push(...(response.value || []).map(AccessiService.normalizeAccessoItem));

      while (response["@odata.nextLink"]) {
        response = await this.graphClient
          .api(response["@odata.nextLink"])
          .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
          .get();
        items.push(...(response.value || []).map(AccessiService.normalizeAccessoItem));
      }

      return items;
    } catch (error) {
      console.error("❌ Errore nel recupero di tutti gli accessi:", error);
      throw error;
    }
  }

  /**
   * Ottiene l'ultimo accesso di un visitatore
   */
  async getUltimoAccesso(visitatoreId: string) {
    try {
      const filter = `fields/field_1 eq '${AccessiService.escapeODataString(visitatoreId)}'`;
      const response = await this.graphClient
        .api(`/sites/${this.siteId}/lists/${this.accessiListId}/items`)
        .expand("fields($select=Title,field_1,field_2,field_3,field_4,field_5,field_6,field_7,field_8,field_10)")
        .filter(filter)
        .orderby("fields/field_4 desc")
        .top(1)
        .header("Prefer", "HonorNonIndexedQueriesWarningMayFailRandomly")
        .get();

      const items = (response.value || []).map(AccessiService.normalizeAccessoItem);
      return items.length > 0 ? items[0] : null;
    } catch (error) {
      console.error("❌ Errore nel recupero dell'ultimo accesso:", error);
      throw error;
    }
  }

  /**
   * Normalizza i campi dell'accesso mappando i nomi interni SharePoint
   * ai nomi logici usati dal codice (compatibilità con colonne field_1, field_2, ...)
   */
  private static normalizeAccessoItem(item: any) {
    const f = item?.fields || {};
    const normalized = {
      ...f,
      VisitoreID: f.field_1 ?? f.VisitoreID,
      VisitoreNome: f.field_2 ?? f.VisitoreNome,
      VisitoreCognome: f.field_3 ?? f.VisitoreCognome,
      Timestamp: f.field_4 ?? f.Timestamp,
      Azione: f.field_5 ?? f.Azione,
      PuntoAccesso: f.field_6 ?? f.PuntoAccesso,
      Note: f.field_7 ?? f.Note,
      Categoria: f.field_8 ?? f.Categoria,
      PercorsoDestinazione: f.field_10 ?? f.PercorsoDestinazione,
    };

    return {
      ...item,
      fields: normalized,
    };
  }

  /**
   * Ottiene la lista dei visitatori attualmente presenti
   * (ultimo accesso di tipo "Ingresso" senza corrispondente "Uscita")
   */
  async getVisitoriPresenti(): Promise<VisitorePresente[]> {
    try {
      // Limita la finestra di ricerca per ridurre carico su liste grandi (config via env)
      const envLookback = Number(import.meta.env.VITE_ACCESSI_LOOKBACK_HOURS);
      const LOOKBACK_HOURS = Number.isFinite(envLookback) && envLookback > 0 ? envLookback : 48;
      const sinceIso = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();

      // 1. Ottieni gli accessi delle ultime 48h ordinati per timestamp decrescente (paginato)
      const accessi = await this.getAllAccessi(
        200,
        `fields/field_4 ge '${sinceIso}'`
      );

      // 2. Ottieni tutti i visitatori per avere i dettagli
      const visitatoriResponse = await this.graphClient
        .api(`/sites/${this.siteId}/lists/${this.visitatoriListId}/items`)
        .expand("fields($select=id,Title,field_1,field_2,field_4)")
        .get();

      const visitatori = (visitatoriResponse.value || []).map((v: any) => {
        const f = v.fields || {};
        return {
          ...v,
          fields: {
            ...f,
            Nome: f.field_1 ?? f.Nome,
            Cognome: f.field_2 ?? f.Cognome,
            Azienda: f.field_4 ?? f.Azienda,
          },
        };
      });
      
      // Crea una mappa IDVisitatore (Title) -> dettagli visitatore
      const visitatoriMap = new Map();
      visitatori.forEach((v: any) => {
        visitatoriMap.set(v.fields.Title, {
          id: v.fields.id,
          idVisitatore: v.fields.Title,
          nome: v.fields.Nome,
          cognome: v.fields.Cognome,
          azienda: v.fields.Azienda,
        });
      });

      // 3. Raggruppa accessi per visitatore e trova l'ultimo
      const visitatoriAccessiMap = new Map<string, any[]>();
      
      accessi.forEach((accesso: any) => {
        const visId = accesso.fields.VisitoreID;
        if (!visId) return;

        if (!visitatoriAccessiMap.has(visId)) {
          visitatoriAccessiMap.set(visId, []);
        }
        visitatoriAccessiMap.get(visId)?.push(accesso.fields);
      });

      // 4. Filtra solo i visitatori con ultimo accesso = "Ingresso"
      const presenti: VisitorePresente[] = [];

      visitatoriAccessiMap.forEach((accessiVisitatore, visitatoreId) => {
        // Ordina per timestamp decrescente
        accessiVisitatore.sort((a, b) => 
          new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime()
        );

        const ultimoAccesso = accessiVisitatore[0];

        // Se l'ultimo accesso è "Ingresso", il visitatore è presente
        if (ultimoAccesso.Azione === "Ingresso") {
          const visitatoreDettagli = visitatoriMap.get(visitatoreId);
          
          if (visitatoreDettagli) {
            presenti.push({
              visitatoreId: visitatoreDettagli.idVisitatore,
              nome: visitatoreDettagli.nome || "",
              cognome: visitatoreDettagli.cognome || "",
              azienda: visitatoreDettagli.azienda || "",
              timestampIngresso: ultimoAccesso.Timestamp,
              puntoAccesso: ultimoAccesso.PuntoAccesso,
              PercorsoDestinazione: ultimoAccesso.PercorsoDestinazione,
            });
          }
        }
      });

      return presenti;
    } catch (error) {
      console.error("❌ Errore nel recupero dei visitatori presenti:", error);
      throw error;
    }
  }

  /**
   * Ottiene il List ID della lista Accessi cercandola per nome
   */
  static async getAccessiListId(accessToken: string, siteId: string): Promise<string | null> {
    try {
      return await AccessiService.getListIdByName(accessToken, siteId, "Accessi");
    } catch (error) {
      console.error("❌ Errore nel recupero del List ID:", error);
      throw error;
    }
  }

  /**
   * Ottiene il List ID di una lista SharePoint cercandola per displayName
   */
  static async getListIdByName(accessToken: string, siteId: string, listName: string): Promise<string | null> {
    try {
      const client = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        },
      });

      const response = await client
        .api(`/sites/${siteId}/lists`)
        .filter(`displayName eq '${listName}'`)
        .get();

      if (response.value && response.value.length > 0) {
        return response.value[0].id;
      }

      return null;
    } catch (error) {
      console.error("❌ Errore nel recupero del List ID per", listName, error);
      throw error;
    }
  }
}
