import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { runContradictionDetection } from "../../shared/contradictionEngine.ts";

// Spustí cross-document contradiction detection pre prihláseného používateľa.
// Voliteľné body.documentId obmedzí (re)compute na rozpory dotýkajúce sa jedného dokumentu.
// Bežiace v user contexte (RLS izoluje dáta medzi používateľmi).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const scopeDocId = (body && body.documentId) || null;

    const res = await runContradictionDetection(base44, user.id, scopeDocId);
    return Response.json(Object.assign({ ok: true }, res));
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}