import { createClientFromRequest } from "npm:@base44/sdk@0.8.40";
import { secrets } from "base44:runtime";
import { runAnalysis, MAX_ATTEMPTS } from "../../shared/analyzeCore.ts";

const STUCK_THRESHOLD_MS = 4 * 60 * 1000;   // analyzing > 4 min = zaseknutý (normálna analýza + retry < 190s)
const MAX_RECOVER_PER_RUN = 5;              // bounds runtime pod 5-min limitom funkcie (80-doc batch safe)

// Recovery sweep — beží ako service role (scheduled workflow), žiadny app user.
// Nájde dokumenty zaseknuté v 'analyzing' a bezpečne ich re-analyzuje alebo označí error.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Auth gate — admin-only (platform-blessed pattern for scheduled/maintenance tasks).
    // Scheduled Recovery Sweep beží s admin identitou, takže gate je preň priepustná;
    // anonymný alebo bežný authenticated user cez priamy HTTP invoke je zamietnutý.
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const ec = base44.asServiceRole;

    const analyzing = await ec.entities.Document.filter({ status: "analyzing" });
    const now = Date.now();
    const stuck = [];
    for (const d of analyzing) {
      const started = d.processing_started_at ? new Date(d.processing_started_at).getTime() : 0;
      if (now - started > STUCK_THRESHOLD_MS) stuck.push(d);
    }

    // 429-pending retry — dokumenty, ktoré zlyhali na rate-limit a čakajú na next_retry_at.
    const pendingRetry = await ec.entities.Document.filter({
      status: "pending",
      next_retry_at: { $lte: new Date().toISOString() }
    });
    for (const d of pendingRetry) {
      if (d.next_retry_at) stuck.push(d);
    }

    let recovered = 0;
    let errored = 0;
    const apiKey = secrets.get("MISTRAL_API_KEY");

    for (const d of stuck.slice(0, MAX_RECOVER_PER_RUN)) {
      try {
        if ((d.attempt_count || 0) >= MAX_ATTEMPTS) {
          await ec.entities.Document.update(d.id, { status: "error", processing_finished_at: new Date().toISOString(), last_error: "stuck_timeout" });
          errored++;
          continue;
        }
        const fresh = await ec.entities.Document.get(d.id);
        await runAnalysis(ec, apiKey, fresh, fresh.title);
        recovered++;
      } catch (e) {
        console.log(JSON.stringify({ evt: "recovery_item_error", document_id: d.id, error: e.message }));
      }
    }

    console.log(JSON.stringify({ evt: "recovery_sweep", analyzing_total: analyzing.length, pending_retry_total: pendingRetry.length, stuck: stuck.length, recovered, errored }));
    return Response.json({ ok: true, analyzing_total: analyzing.length, pending_retry_total: pendingRetry.length, stuck: stuck.length, recovered, errored });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}