import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// Verejná read-only resolúcia zdieľaného linku.
// Bežiace ako service role (obchádza RLS), ale prístup je striktne obmedzený:
//  - vyžaduje platný kryptografický token
//  - overí revoked_at a expires_at
//  - vráti IBA dáta patriace k danému zdieľaniu (konkrétna výpoveď alebo všetko od tvorcu)
//  - nepovoľuje žiadne write operácie
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Zdieľaný link je read-only, ale vyžadujeme prihláseného používateľa
    // (route je za ProtectedRoute) — zabraňuje anonymnej brute-force tokenov.
    const viewer = await base44.auth.me();
    if (!viewer) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const token = body?.token;
    if (!token || typeof token !== 'string' || token.length > 128 || !/^[a-f0-9]+$/.test(token)) {
      return Response.json({ error: 'Neplatný token.' }, { status: 400 });
    }

    const found = await base44.asServiceRole.entities.SharedCase.filter({ token });
    const sc = found && found[0];
    if (!sc) return Response.json({ error: 'Neplatný odkaz. Link neexistuje alebo bol zneplatnený.' }, { status: 404 });

    if (sc.revoked_at) {
      return Response.json({ error: 'Tento zdieľaný odkaz bol zneplatnený.' }, { status: 403 });
    }
    if (sc.expires_at && new Date(sc.expires_at).getTime() < Date.now()) {
      return Response.json({ error: 'Platnosť zdieľaného odkazu vypršala.' }, { status: 403 });
    }

    const creatorId = sc.created_by;
    const documentId = sc.document_id || null;

    const base = (e) => (e || []);
    let documents, persons, relationships, redFlags, flaggedPassages, events, locations, vehicles, claims, contradictions;
    if (documentId) {
      [documents, persons, relationships, redFlags, flaggedPassages, events, locations, vehicles, claims] = await Promise.all([
        base44.asServiceRole.entities.Document.filter({ id: documentId }),
        base44.asServiceRole.entities.Person.filter({ document_id: documentId }),
        base44.asServiceRole.entities.Relationship.filter({ document_id: documentId }),
        base44.asServiceRole.entities.RedFlag.filter({ document_id: documentId }),
        base44.asServiceRole.entities.FlaggedPassage.filter({ document_id: documentId }),
        base44.asServiceRole.entities.Event.filter({ document_id: documentId }),
        base44.asServiceRole.entities.Location.filter({ document_id: documentId }),
        base44.asServiceRole.entities.Vehicle.filter({ document_id: documentId }),
        base44.asServiceRole.entities.ForensicClaim.filter({ document_id: documentId })
      ]);
      const allContras = await base44.asServiceRole.entities.Contradiction.filter({ created_by_id: creatorId });
      contradictions = (allContras || []).filter((c) => c.document_a_id === documentId || c.document_b_id === documentId);
    } else {
      [documents, persons, relationships, redFlags, flaggedPassages, events, locations, vehicles, claims, contradictions] = await Promise.all([
        base44.asServiceRole.entities.Document.filter({ created_by_id: creatorId }),
        base44.asServiceRole.entities.Person.filter({ created_by_id: creatorId }),
        base44.asServiceRole.entities.Relationship.filter({ created_by_id: creatorId }),
        base44.asServiceRole.entities.RedFlag.filter({ created_by_id: creatorId }),
        base44.asServiceRole.entities.FlaggedPassage.filter({ created_by_id: creatorId }),
        base44.asServiceRole.entities.Event.filter({ created_by_id: creatorId }),
        base44.asServiceRole.entities.Location.filter({ created_by_id: creatorId }),
        base44.asServiceRole.entities.Vehicle.filter({ created_by_id: creatorId }),
        base44.asServiceRole.entities.ForensicClaim.filter({ created_by_id: creatorId }),
        base44.asServiceRole.entities.Contradiction.filter({ created_by_id: creatorId })
      ]);
    }

    return Response.json({
      sharedBy: sc.created_by_name || 'Neznámy',
      scope: { creatorId, documentId },
      documents: base(documents),
      persons: base(persons),
      relationships: base(relationships),
      redFlags: base(redFlags),
      flaggedPassages: base(flaggedPassages),
      events: base(events),
      locations: base(locations),
      vehicles: base(vehicles),
      claims: base(claims),
      contradictions: base(contradictions)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}