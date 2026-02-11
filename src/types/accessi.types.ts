/**
 * Interfaccia per i dati degli accessi
 */
export interface Accesso {
  id?: string;
  Title?: string; // ID Accesso (auto-generato da SharePoint)
  VisitoreID?: string; // ID Visitatore (campo testo)
  VisitoreNome?: string; // Nome visitatore
  VisitoreCognome?: string; // Cognome visitatore
  Timestamp?: string; // ISO 8601 DateTime
  Azione?: "Ingresso" | "Uscita";
  PuntoAccesso?: string; // "Kiosk Principale" | "Reception" | "Magazzino"
  Note?: string;
  Categoria?: string;
  PercorsoDestinazione?: string; // Campo choice su SharePoint (es. Direzione, Tecnico, ...)
  ReferenteAppuntamento?: string; // Nuovo campo per il referente (nome utente tenant)
}

/**
 * Interfaccia per il visitatore presente (con ultimo accesso)
 */
export interface VisitorePresente {
  visitatoreId: string;
  nome: string;
  cognome: string;
  azienda?: string;
  timestampIngresso: string;
  puntoAccesso: string;
  PercorsoDestinazione?: string;
  ReferenteAppuntamento?: string;
}
