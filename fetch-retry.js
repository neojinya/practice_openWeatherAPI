// == fetch を自動リトライ対応に差し替え（await対応ブラウザ版）==
(() => {
  const g = (typeof window !== 'undefined') ? window : globalThis;
  if (!g.fetch) return;

  const originalFetch = g.fetch.bind(g);

  function fetchWithRetry(input, init = {}, opts = {}) {
    const {
      retries = 5,
      backoff = 1000,
      retryOn = [429, 500, 502, 503, 504],
    } = opts;

    // async関数の中でawaitを使う
    async function attempt() {
      for (let i = 0; i <= retries; i++) {
        try {
          const res = await originalFetch(input, init);
          if (!retryOn.includes(res.status)) return res;
          if (i === retries) return res;

          let delay = backoff * Math.pow(2, i);
          const ra = res.headers?.get?.('retry-after');
          const sec = ra ? parseInt(ra, 10) : NaN;
          if (!Number.isNaN(sec)) delay = Math.max(delay, sec * 1000);

          await new Promise(r => setTimeout(r, delay));
        } catch (e) {
          if (i === retries) throw e;
          const delay = backoff * Math.pow(2, i);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    return attempt();
  }

  // グローバル fetch を差し替え
  g.fetch = (input, init) => fetchWithRetry(input, init);
})();
