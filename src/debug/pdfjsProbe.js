// Temporary browser probe for pdfjs-dist + Vite (debug session 121488)
const send = (obj) => {
  const payload = { sessionId: '121488', runId: 'agent-repro', timestamp: Date.now(), ...obj };
  fetch('/__agent_debug', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});
};

try {
  const probeUrl = `${location.origin}/node_modules/.vite/deps/pdfjs-dist.js`;
  let probe;
  try {
    const r = await fetch(probeUrl, { method: 'HEAD', cache: 'no-store' });
    probe = { ok: r.ok, status: r.status };
  } catch (e) {
    probe = { ok: false, err: String(e && e.message || e) };
  }
  send({ hypothesisId: 'A', location: 'src-probe:deps', message: 'deps probe', data: { probe, origin: location.origin } });

  const mod = await import('pdfjs-dist');
  send({
    hypothesisId: 'B',
    location: 'src-probe:import',
    message: 'import ok',
    data: { version: mod.version || null, hasGetDocument: typeof mod.getDocument, probe }
  });

  if (mod.GlobalWorkerOptions) {
    mod.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  }
  const workerSrc = mod.GlobalWorkerOptions?.workerSrc;
  const wr = await fetch(workerSrc, { method: 'HEAD', cache: 'no-store' });
  send({
    hypothesisId: 'F',
    location: 'src-probe:worker',
    message: 'worker probe',
    data: { workerSrc, workerStatus: wr.status, workerOk: wr.ok }
  });

  // Exercise same helper path as production
  const { loadPdfDocument } = await import('../lib/pdfPageChunker.js');
  const bytes = Uint8Array.from(
    atob(
      // minimal valid-ish PDF header; may fail parse but proves loader path
      'JVBERi0xLjAKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCAzIDNdCj4+CmVuZG9iagp4cmVmCjAgNAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNAovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKMTc0CiUlRU9G'
    ),
    (c) => c.charCodeAt(0)
  );
  const file = new File([bytes], 'probe.pdf', { type: 'application/pdf' });
  try {
    const doc = await loadPdfDocument(file);
    send({
      hypothesisId: 'G',
      location: 'src-probe:loadPdfDocument',
      message: 'loadPdfDocument ok',
      data: { pageCount: doc.pageCount }
    });
    await doc.pdf.destroy();
  } catch (e) {
    send({
      hypothesisId: 'G',
      location: 'src-probe:loadPdfDocument',
      message: 'loadPdfDocument fail',
      data: { name: e && e.name, message: e && e.message }
    });
  }
} catch (e) {
  send({
    hypothesisId: 'C',
    location: 'src-probe:import',
    message: 'import fail',
    data: { name: e && e.name, message: e && e.message, stack: String(e && e.stack || '').slice(0, 1000) }
  });
}
