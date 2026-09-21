/**
 * AGORA LENS - DATA LOADER
 *
 * Swaps the bundled dataset for the published snapshot before the app boots.
 *
 * js/data.js still ships with the site and is the fallback. If the snapshot is
 * missing, stale-but-cached, or the network is down, the site renders the
 * bundled records rather than an empty page — on a civic safety platform, last
 * known data beats no data, provided it is labelled.
 *
 * Exposes window.agoraDataReady, a promise app.js waits on. It always resolves;
 * a failed fetch is a fallback, not an error state.
 */

(function () {
  const SNAPSHOT_URL = 'data/agora.json';
  const FETCH_TIMEOUT_MS = 6000;

  // Keys the app reads off AGORA_DATA. A snapshot missing any of them is
  // treated as malformed rather than partially applied — half-swapped data
  // would render a page that is subtly wrong, which is worse than one that is
  // visibly old.
  const REQUIRED_KEYS = ['locations', 'incidents', 'metrics', 'electionYears'];

  function isUsable(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return false;
    if (!REQUIRED_KEYS.every(key => key in snapshot)) return false;
    if (!Array.isArray(snapshot.incidents)) return false;
    if (!snapshot.locations || typeof snapshot.locations !== 'object') return false;
    return true;
  }

  async function fetchSnapshot() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(SNAPSHOT_URL, {
        signal: controller.signal,
        // The service worker serves this network-first, so a cached copy is
        // still returned when offline.
        cache: 'no-cache'
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (err) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  window.agoraDataReady = (async () => {
    const snapshot = await fetchSnapshot();

    if (!isUsable(snapshot)) {
      window.AGORA_DATA_SOURCE = { kind: 'bundled', generatedAt: null };
      return window.AGORA_DATA;
    }

    // The bundled object keeps any keys the snapshot does not carry yet, so a
    // backend that has not caught up with every field still renders.
    window.AGORA_DATA = Object.assign({}, window.AGORA_DATA, snapshot);
    window.AGORA_DATA_SOURCE = { kind: 'snapshot', generatedAt: snapshot.generatedAt ?? null };

    return window.AGORA_DATA;
  })();
})();
