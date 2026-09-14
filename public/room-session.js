(() => {
  const nativeFetch = window.fetch.bind(window);
  const STORAGE_KEY = 'eggverse-room-sessions-v1';

  function loadSessions() {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  }
  function saveSessions(sessions) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); } catch {}
  }
  function requestBody(options) {
    try { return typeof options?.body === 'string' ? JSON.parse(options.body) : null; } catch { return null; }
  }
  function codeFromPath(pathname) {
    return pathname.match(/^\/api\/rooms\/([A-Z0-9]{6})(?:\/|$)/i)?.[1]?.toUpperCase() || null;
  }
  async function capture(response, request, url) {
    if (!response.ok) return response;
    const copy = response.clone();
    const payload = await copy.json().catch(() => null);
    if (!payload?.sessionToken || !payload?.code) return response;
    const data = requestBody(request);
    const sessions = loadSessions();
    sessions[payload.code] = {
      code: payload.code,
      sessionToken: payload.sessionToken,
      playerId: data?.player?.id || data?.playerId || sessions[payload.code]?.playerId,
      gameSlug: data?.gameSlug || payload.gameSlug,
      savedAt: Date.now(),
    };
    saveSessions(sessions);
    return response;
  }

  window.fetch = async (input, options = {}) => {
    const href = typeof input === 'string' ? input : input?.url;
    const url = new URL(href, location.origin);
    const method = String(options.method || 'GET').toUpperCase();
    const code = codeFromPath(url.pathname);
    const sessions = loadSessions();
    const session = code ? sessions[code] : null;

    if (method === 'POST' && /\/join$/.test(url.pathname) && session?.sessionToken) {
      const data = requestBody(options) || {};
      const reconnectUrl = url.pathname.replace(/\/join$/, '/reconnect');
      const reconnect = await nativeFetch(reconnectUrl, {
        ...options,
        body: JSON.stringify({ player:data.player, sessionToken:session.sessionToken }),
      });
      if (reconnect.ok) return capture(reconnect, options, new URL(reconnectUrl, location.origin));
      if (reconnect.status !== 403 && reconnect.status !== 404) return reconnect;
      delete sessions[code];
      saveSessions(sessions);
    }

    const response = await nativeFetch(input, options);
    const captured = await capture(response, options, url);

    if (method === 'GET' && code && session?.sessionToken && url.pathname === `/api/rooms/${code}` && response.ok) {
      nativeFetch(`/api/rooms/${code}/heartbeat`, {
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({ playerId:session.playerId, sessionToken:session.sessionToken }),
      }).catch(() => {});
    }

    return captured;
  };
})();
