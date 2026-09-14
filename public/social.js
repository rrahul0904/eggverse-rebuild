(() => {
  const PROFILE_KEY = 'eggverse-rebuild-profile-v2';
  let mountedPath = '';
  let lastSubmitted = '';
  let refreshTimer = null;

  function profile() {
    try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); } catch { return {}; }
  }
  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'\"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  }
  async function api(path, options = {}) {
    const response = await fetch(path, { headers:{'content-type':'application/json'}, ...options });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Request failed');
    return payload;
  }
  function gameSlug() { return location.pathname.match(/^\/games\/([a-z0-9-]+)$/)?.[1] || null; }

  async function mountChallenge() {
    const slug = gameSlug();
    const page = document.querySelector('.game-page');
    if (!slug || !page || page.querySelector('[data-challenge-card]')) return;

    const card = document.createElement('section');
    card.className = 'challenge-card';
    card.dataset.challengeCard = 'true';
    card.innerHTML = '<span class="eyebrow">Daily challenge</span><h2>Loading today’s board…</h2>';
    page.appendChild(card);

    try {
      const challenge = await api(`/api/challenges/${slug}`);
      const board = await api(`/api/leaderboards/${slug}?challenge=${encodeURIComponent(challenge.id)}&limit=8`);
      renderChallenge(card, challenge, board);
    } catch (error) {
      card.innerHTML = `<span class="eyebrow">Daily challenge</span><h2>Challenge unavailable</h2><p>${escapeHtml(error.message)}</p>`;
    }
  }

  function renderChallenge(card, challenge, board) {
    const rows = board.entries.length
      ? board.entries.map((entry, index) => `<li><span><b>${index + 1}</b>${escapeHtml(entry.name)}</span><strong>${entry.score}</strong></li>`).join('')
      : '<li class="empty-score">No scores yet. Crack the board first.</li>';
    card.innerHTML = `<div class="challenge-heading"><div><span class="eyebrow">Daily challenge</span><h2>Beat ${challenge.target}.</h2><p>Same daily board for everyone playing this game.</p></div><button data-copy-challenge>Copy challenge</button></div><ol class="leaderboard-list">${rows}</ol><p class="score-note">Community scores are client-submitted; room races remain server-authoritative.</p>`;
    card.querySelector('[data-copy-challenge]')?.addEventListener('click', async () => {
      const url = `${location.origin}${location.pathname}?challenge=${encodeURIComponent(challenge.id)}`;
      try { await navigator.clipboard.writeText(url); card.querySelector('[data-copy-challenge]').textContent = 'Copied'; } catch {}
    });
  }

  async function submitFinishedRun() {
    const slug = gameSlug();
    const message = document.querySelector('#arcade-message')?.textContent || '';
    const match = message.match(/Run complete\s*[—-]\s*(\d+)\s+points/i);
    if (!slug || !match) return;
    const p = profile();
    if (!p.id || !p.name) return;
    const key = `${slug}:${p.gamesPlayed}:${match[1]}`;
    if (key === lastSubmitted) return;
    lastSubmitted = key;

    try {
      const challenge = await api(`/api/challenges/${slug}`);
      const board = await api(`/api/leaderboards/${slug}`, {
        method:'POST',
        body:JSON.stringify({ challengeId:challenge.id, score:Number(match[1]), player:{ id:p.id, name:p.name, eggStyle:p.eggStyle || 0 } }),
      });
      const card = document.querySelector('[data-challenge-card]');
      if (card) renderChallenge(card, challenge, board);
    } catch {}
  }

  function scan() {
    const path = `${location.pathname}${location.search}`;
    if (mountedPath !== path) {
      mountedPath = path;
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(mountChallenge, 0);
    } else {
      mountChallenge();
    }
    submitFinishedRun();
  }

  new MutationObserver(scan).observe(document.documentElement, { childList:true, subtree:true, characterData:true });
  window.addEventListener('popstate', scan);
  scan();
})();
