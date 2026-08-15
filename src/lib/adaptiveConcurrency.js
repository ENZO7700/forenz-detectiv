// Adaptive concurrency runner: FAST WHEN HEALTHY, SAFE WHEN RATE-LIMITED.
// Začína na startConcurrency, pri úspechoch rastie až po maxConcurrency,
// pri zlyhaní (najmä 429) sa concurrency zníži. Nikdy nepadne pod 1.
export async function mapWithAdaptiveConcurrency(items, startConcurrency, maxConcurrency, worker) {
  const results = new Array(items.length);
  let concurrency = startConcurrency;
  let successStreak = 0;
  let index = 0;
  let active = 0;
  let done = 0;
  const total = items.length;

  return new Promise((resolve) => {
    const launch = () => {
      while (active < concurrency && index < total) {
        const i = index++;
        active++;
        Promise.resolve()
          .then(() => worker(items[i], i))
          .then((res) => {
            results[i] = { ok: true, res };
            successStreak++;
            if (successStreak >= 3 && concurrency < maxConcurrency) {
              concurrency = Math.min(maxConcurrency, concurrency + 1);
              successStreak = 0;
            }
          })
          .catch((err) => {
            results[i] = { ok: false, err };
            successStreak = 0;
            const status = err && (err.response && err.response.status) || err && err.status || err && err.statusCode;
            const isRateLimit = status === 429;
            concurrency = Math.max(1, Math.floor(concurrency / (isRateLimit ? 2 : 1.5)));
          })
          .finally(() => {
            active--;
            done++;
            if (done >= total) resolve(results);
            else launch();
          });
      }
    };
    launch();
  });
}