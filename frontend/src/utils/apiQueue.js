/** Shared serial queue for all API traffic (fetch + axios) — reduces Hostinger process bursts. */
let fetchQueue = Promise.resolve();

export const FETCH_GAP_MS = 200;

export const runQueued = (fn) => {
  const run = fetchQueue.then(fn, fn);
  fetchQueue = run.then(
    () => new Promise((r) => setTimeout(r, FETCH_GAP_MS)),
    () => new Promise((r) => setTimeout(r, FETCH_GAP_MS))
  );
  return run;
};
