// base44/shared/legalAssessment.ts
// Strict Legal Relevance Assessment Layer (Contradiction != Crime)

import { getLegalProvenance, type LegalProvenance } from './legalSourceOfTruth.ts';

export type LegalAssessmentStatus =
  | 'potentially_relevant'
  | 'not_relevant'
  | 'insufficient_evidence'
  | 'needs_human_review';

export interface LegalEvidenceReference {
  sourceFile: string;
  page: number;
  paragraph: string;
  section?: string;
  text: string;
  sourceHash: string;
}

export interface LegalAssessment {
  paragraph: string;
  status: LegalAssessmentStatus;
  rationale: string;
  sourceEvidence: LegalEvidenceReference[];
  supportingClaims: string[];
  missingEvidence: string[];
  requiresHumanReview: boolean;
}

/**
 * Vyhodnotí potenciálnu právnu relevanciu zisteného skutkového rozporu voči Trestnému zákonu SR.
 * ZÁSADNÉ PRAVIDLO: Rozpor v čase/mieste výpovede NIE JE automaticky trestným činom krivého svedectva.
 * Môže ísť o omyl, zlyhanie pamäte, nepresný zápis alebo nesprávnu interpretáciu.
 */
export function assessContradictionRelevance(contradiction: {
  id?: string;
  type?: string;
  severity?: string;
  explanation?: string;
  claim_a_id?: string;
  claim_b_id?: string;
  claim_a_quote?: string;
  claim_b_quote?: string;
  location_a?: string;
  location_b?: string;
  time_a?: string;
  time_b?: string;
}): LegalAssessment {
  const prov346 = getLegalProvenance('346'); // Krivá výpoveď a krivá prísaha

  if (!prov346) {
    return {
      paragraph: '346',
      status: 'insufficient_evidence',
      rationale: 'Právne ustanovenie § 346 nie je dostupné v Source of Truth datasete.',
      sourceEvidence: [],
      supportingClaims: [],
      missingEvidence: ['Source of Truth dataset'],
      requiresHumanReview: true
    };
  }

  const evidenceList: LegalEvidenceReference[] = [
    {
      sourceFile: prov346.sourceFile,
      page: prov346.sourcePage,
      paragraph: prov346.paragraph,
      text: prov346.text,
      sourceHash: prov346.sourceHash
    }
  ];

  const supportingClaims: string[] = [];
  if (contradiction.claim_a_quote) supportingClaims.push(`Výpoveď A: "${contradiction.claim_a_quote}"`);
  if (contradiction.claim_b_quote) supportingClaims.push(`Výpoveď B: "${contradiction.claim_b_quote}"`);

  // Identifikácia chýbajúcich dôkazných skutočností pre zákonnú skutkovú podstatu
  const missingEvidence: string[] = [
    'Preukázanie subjektívnej stránky (priamy úmysel svedka vedome klamať, vylúčenie omylu alebo zlyhania pamäte)',
    'Overenie zákonného poučenia svedka o následkoch krivej výpovede podľa Trestného poriadku',
    'Forenzné overenie objektívnej pravdivosti (kamerové záznamy, lokalizačné dáta BTS, listinné dôkazy)'
  ];

  return {
    paragraph: '346',
    status: 'potentially_relevant',
    rationale:
      'Zistený nesúlad vo výpovediach zakladá vecný dôvod na preverenie dôveryhodnosti a možnej relevancie k § 346 TZ SR. Samotný časový alebo priestorový rozpor však bez preukázania úmyslu a ďalších dôkazov nepredstavuje trestný čin.',
    sourceEvidence: evidenceList,
    supportingClaims,
    missingEvidence,
    requiresHumanReview: true
  };
}

/**
 * Všeobecné posúdenie skutkových tvrdení voči konkrétnemu paragrafu zo Source of Truth.
 */
export function createLegalAssessment(
  paragraphNumber: string,
  claims: Array<{ subject?: string; predicate?: string; object?: string; source_quote?: string }>,
  customRationale?: string
): LegalAssessment {
  const prov = getLegalProvenance(paragraphNumber);

  if (!prov) {
    return {
      paragraph: String(paragraphNumber),
      status: 'insufficient_evidence',
      rationale: `Paragraf § ${paragraphNumber} sa nenachádza v overenom datasete Zákona č. 300/2005 Z. z.`,
      sourceEvidence: [],
      supportingClaims: [],
      missingEvidence: ['Platné ustanovenie zákona'],
      requiresHumanReview: true
    };
  }

  const supportingClaims = claims
    .filter((c) => !!c.source_quote)
    .map((c) => `${c.subject || ''} ${c.predicate || ''} ${c.object || ''}: "${c.source_quote}"`.trim());

  return {
    paragraph: prov.paragraph,
    status: supportingClaims.length > 0 ? 'potentially_relevant' : 'insufficient_evidence',
    rationale:
      customRationale ||
      `Posúdenie relevancie k ustanoveniu ${prov.fullTitle}. Vyžaduje posúdenie vyšetrovateľom a prokurátorom.`,
    sourceEvidence: [
      {
        sourceFile: prov.sourceFile,
        page: prov.sourcePage,
        paragraph: prov.paragraph,
        text: prov.text,
        sourceHash: prov.sourceHash
      }
    ],
    supportingClaims,
    missingEvidence: [
      'Kompletný vyšetrovací spis',
      'Overenie materiálnych a formálnych znakov skutkovej podstaty'
    ],
    requiresHumanReview: true
  };
}
