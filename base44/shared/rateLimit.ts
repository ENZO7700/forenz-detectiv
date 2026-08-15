// Best-effort DB-backed rate limiter (fixed window). Runs asServiceRole (bypasses RLS).
// NOTE: serverless concurrency makes this slightly racy — under-counts under bursts,
// čo znamená, že pri extrémnej paralelizácii pustí o niekoľko requestov viac, ale
// stále efektívne throttles floody jedného používateľa.
// Pri chybe limitera fail-open (neblokuje legitímnu funkcionalitu).

export async function checkRate(asServiceRole, key, max, windowMs) {
  const now = Date.now();
  const windowStart = new Date(now - (now % windowMs)).toISOString();
  try {
    const existing = await asServiceRole.entities.RateLimit.filter({ key, window: windowStart });
    const rec = existing && existing[0];
    const count = rec ? (rec.count || 0) : 0;
    if (count >= max) {
      return { ok: false, retryAfterMs: windowMs - (now % windowMs) };
    }
    if (rec) {
      await asServiceRole.entities.RateLimit.update(rec.id, { count: count + 1 });
    } else {
      await asServiceRole.entities.RateLimit.create({ key, window: windowStart, count: 1 });
    }
    return { ok: true };
  } catch (_e) {
    // Fail-open: chyba limitera nesmie blokovať legitímnu funkcionalitu.
    return { ok: true };
  }
}