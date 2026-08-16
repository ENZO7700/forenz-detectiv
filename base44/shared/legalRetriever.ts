// base44/shared/legalRetriever.ts
// Secure and validated Legal Retriever layer for ForenzDetectiv

import {
  getLegalParagraph,
  getLegalProvenance,
  searchLegalSource,
  getRelevantLegalParagraphs,
  verifyLegalSourceIntegrity,
  type LegalProvenance,
  type LegalParagraph
} from './legalSourceOfTruth.ts';

export interface LegalRetrievalResult {
  paragraph: string;
  fullTitle: string;
  provenance: LegalProvenance;
  sectionsCount: number;
}

export class LegalRetriever {
  /**
   * Overí integritu datasetu pred načítaním.
   */
  static ensureIntegrity(): boolean {
    const check = verifyLegalSourceIntegrity();
    if (!check.ok) {
      throw new Error(`LEGAL_RETRIEVAL_FAILED: Integrity check failed - ${check.error}`);
    }
    return true;
  }

  /**
   * Priame vyhľadanie paragrafu podľa čísla (napr. "346" alebo "§ 346").
   */
  static getParagraph(paragraphNumber: string | number): LegalRetrievalResult | null {
    this.ensureIntegrity();
    const p = getLegalParagraph(paragraphNumber);
    if (!p) return null;
    const prov = getLegalProvenance(p.paragraph);
    if (!prov) return null;

    return {
      paragraph: p.paragraph,
      fullTitle: p.full_title,
      provenance: prov,
      sectionsCount: p.sections.length
    };
  }

  /**
   * Vyhľadávanie podľa kľúčových slov alebo fráz.
   */
  static search(query: string, maxResults = 5): LegalProvenance[] {
    this.ensureIntegrity();
    return searchLegalSource(query, maxResults);
  }

  /**
   * Vyhľadávanie podľa témy (napr. "false_testimony", "fraud", "krádež").
   */
  static getByTopic(topic: string): LegalRetrievalResult[] {
    this.ensureIntegrity();
    const paragraphs = getRelevantLegalParagraphs(topic);
    return paragraphs
      .map((p) => {
        const prov = getLegalProvenance(p.paragraph);
        if (!prov) return null;
        return {
          paragraph: p.paragraph,
          fullTitle: p.full_title,
          provenance: prov,
          sectionsCount: p.sections.length
        };
      })
      .filter((r): r is LegalRetrievalResult => r !== null);
  }

  /**
   * Hromadné načítanie pre viacero paragrafov alebo tém.
   */
  static getMultiple(identifiersOrTopics: string[]): LegalRetrievalResult[] {
    this.ensureIntegrity();
    const resultsMap = new Map<string, LegalRetrievalResult>();

    for (const item of identifiersOrTopics) {
      // Skús ako paragraf
      const direct = this.getParagraph(item);
      if (direct) {
        resultsMap.set(direct.paragraph, direct);
        continue;
      }

      // Inak skús ako topic
      const topicMatches = this.getByTopic(item);
      for (const tm of topicMatches) {
        resultsMap.set(tm.paragraph, tm);
      }
    }

    return Array.from(resultsMap.values());
  }
}
