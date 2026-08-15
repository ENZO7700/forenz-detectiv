import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
import { runAnalysis } from "../../shared/analyzeCore.ts";
import { checkRate } from "../../shared/rateLimit.ts";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { documentId, documentTitle } = body || {};
    if (!documentId) return Response.json({ error: "Chýba documentId." }, { status: 400 });

    // Server-side ownership check — používateľ môže analyzovať iba vlastný dokument.
    let doc;
    try {
      doc = await base44.entities.Document.get(documentId);
    } catch (_) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!doc || doc.created_by_id !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Zamedzenie re-analýze už bežiaceho dokumentu.
    if (doc.status === "analyzing") {
      return Response.json({ error: "Dokument sa už analyzuje." }, { status: 409 });
    }

    // Per-user rate limit (100 / 15 min) — kompatibilné s batch 100.
    const rl = await checkRate(base44.asServiceRole, "analyze:" + user.id, 100, 15 * 60 * 1000);
    if (!rl.ok) {
      return Response.json({ error: "Prekročený limit analýz. Skús o chvíľu.", retryAfter: rl.retryAfterMs }, { status: 429 });
    }

    const apiKey = secrets.get("MISTRAL_API_KEY");
    const result = await runAnalysis(base44, apiKey, doc, documentTitle || doc.title);
    return Response.json(Object.assign({ ok: result.ok, documentId }, result), { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}