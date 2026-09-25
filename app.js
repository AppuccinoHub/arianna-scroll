(() => {
  'use strict';
  const DATA = window.ARIANNA_APP;
  if (!DATA) { console.error('Italian with Arianna: data.js missing'); return; }

  const KEY = 'ariannaScroll.app.v1';
  const SHARE_URL = DATA.shareUrl || 'https://appuccinohub.github.io/arianna-scroll/';
  // Single tap: correct pick → "Brava!" + new-phrase note → auto-advance after ~1.2 s.
  const AUTO_ADVANCE_MS = 1200;
  const $ = (id) => document.getElementById(id);
  const sessionById = (id) => DATA.sessions.find((s) => s.id === id) || DATA.sessions[0];

  /* ---------- saved data (localStorage) ---------- */
  function load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { d = null; }
    d = d && typeof d === 'object' ? d : {};
    d.muted = !!d.muted;                      // sound ON by default
    d.unlocked = d.unlocked || {};
    d.progress = d.progress || {};
    d.best = d.best || {};
    d.done = d.done || {};
    d.selected = d.selected || 's1';
    return d;
  }
  const saved = load();
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (_) {} }
  const isUnlocked = (id) => id === DATA.sessions[0].id || !!saved.unlocked[id];

  /* ---------- play state ---------- */
  const state = { session: null, cards: [], index: 0, firstTry: 0, attempted: {}, ok: {} };
  let advanceTimer = null;
  function cancelAutoAdvance() {
    if (advanceTimer) clearTimeout(advanceTimer);
    advanceTimer = null;
  }
  // The Mamma Maria card: once the song has been started, never auto-advance (let it play).
  function songPlaying(art) {
    return !!(art && art.querySelector('iframe.yt-frame'));
  }
  function saveProgress() {
    if (!state.session) return;
    saved.progress[state.session.id] = { index: state.index, ok: state.ok, attempted: state.attempted, firstTry: state.firstTry };
    persist();
  }

  /* ---------- sound (WebAudio chimes) ---------- */
  let audioCtx = null;
  function ctx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function tone(freq, when, dur, vol, type) {
    const c = audioCtx;
    const o = c.createOscillator();
    const g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = type || 'sine'; o.frequency.value = freq;
    const t = c.currentTime + when;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.03);
  }
  function sound(kind) {
    if (saved.muted) return;
    try {
      ctx();
      if (kind === 'ok') { tone(784, 0, 0.16, 0.06); tone(1047, 0.09, 0.22, 0.06); tone(1319, 0.18, 0.3, 0.035, 'triangle'); }
      else if (kind === 'wrong') { tone(330, 0, 0.14, 0.04, 'triangle'); tone(294, 0.1, 0.18, 0.035, 'triangle'); }
      else if (kind === 'win') { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.11, 0.3, 0.05, i % 2 ? 'triangle' : 'sine')); }
      else if (kind === 'unlock') { [880, 1175, 1568].forEach((f, i) => tone(f, 0.7 + i * 0.09, 0.35, 0.04, 'triangle')); }
      else if (kind === 'tap') { tone(988, 0, 0.1, 0.04); }
    } catch (_) {}
  }
  function updateMuteUI() {
    $('muteIcon').textContent = saved.muted ? '🔇' : '🔊';
    $('btnMute').setAttribute('aria-label', saved.muted ? 'Sound is off. Turn sound on' : 'Sound is on. Mute sound');
    $('btnMute').setAttribute('aria-pressed', saved.muted ? 'true' : 'false');
  }

  /* ---------- helpers ---------- */
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function toast(text, ms) {
    const t = $('toast');
    t.textContent = text; t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.hidden = true; }, ms || 2200);
  }
  function showScreen(screen) {
    document.querySelectorAll('.screen').forEach((s) => {
      const on = s === screen;
      s.classList.toggle('active', on);
      if (on) s.removeAttribute('hidden'); else s.setAttribute('hidden', '');
    });
    const play = screen === $('screenPlay');
    $('btnHome').hidden = screen === $('screenHome');
    $('dots').hidden = !play;
    if (!play) $('topTitle').textContent = 'Italian with Arianna';
    if (screen !== $('screenEnd')) { clearTimeout(confetti._t); $('confetti').replaceChildren(); }
  }

  /* ---------- start screen ---------- */
  function renderHome() {
    const picker = $('picker');
    picker.replaceChildren();
    if (!isUnlocked(saved.selected)) saved.selected = DATA.sessions[0].id;
    DATA.sessions.forEach((s) => {
      const open = isUnlocked(s.id);
      const b = el('button', 'sess-btn' + (open ? '' : ' locked'));
      b.type = 'button';
      b.dataset.session = s.id;
      b.setAttribute('aria-pressed', String(saved.selected === s.id));
      const p = saved.progress[s.id];
      const doneCount = p ? Object.keys(p.ok || {}).length : 0;
      let sub;
      if (!open) sub = '🔒 Finish Session 1';
      else if (p && doneCount) sub = doneCount + ' / ' + s.cards.length + ' done';
      else if (saved.done[s.id]) sub = '⭐ ' + (saved.best[s.id] || 0) + ' / ' + s.cards.length + ' best';
      else sub = s.cards.length + ' cards';
      b.append(el('span', 's-name', s.emoji + ' ' + s.title), el('span', 's-sub', sub));
      b.setAttribute('aria-label', s.title + (open ? '' : ', locked. Finish Session 1 to unlock') + (open ? ', ' + sub : ''));
      b.addEventListener('click', () => {
        if (!open) { sound('wrong'); toast('Finish Session 1 to unlock Session 2 🔒'); return; }
        saved.selected = s.id; persist(); sound('tap'); renderHome();
      });
      if (saved.justUnlocked && s.id === saved.justUnlocked) b.classList.add('unlocked-pop');
      picker.appendChild(b);
    });
    saved.justUnlocked = null;
    const s = sessionById(saved.selected);
    const p = saved.progress[s.id];
    const started = p && (Object.keys(p.attempted || {}).length > 0 || p.index > 0);
    $('btnStart').textContent = started ? 'Keep going ▶' : 'Start ▶';
    $('btnStart').setAttribute('aria-label', (started ? 'Keep going with ' : 'Start ') + s.title);
    $('btnStartOver').hidden = !started;
    $('resumeLine').hidden = !started;
    if (started) $('resumeLine').textContent = s.title + ': you\u2019re on card ' + (Math.min(p.index, s.cards.length - 1) + 1) + ' of ' + s.cards.length + ' 💛';
    $('homeSoft').textContent = s.cards.length + ' quick cards · ' + (saved.muted ? 'sound off 🔇' : 'sound on 🔊');
    persist();
  }

  /* ---------- cards ---------- */
  function buildSongBox(card, art, box) {
    box.replaceChildren();
    if (card.yt) {
      const b = el('button', 'play-song', '▶ Tap to play the song');
      b.type = 'button';
      b.addEventListener('click', () => {
        const f = document.createElement('iframe');
        f.className = 'yt-frame';
        f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(card.yt.id) + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
        f.title = card.yt.title + ' (YouTube)';
        f.allow = 'autoplay; encrypted-media; picture-in-picture';
        f.referrerPolicy = 'strict-origin-when-cross-origin';
        f.allowFullscreen = true;
        const link = el('a', 'listen-link', 'Listen on YouTube ↗');
        link.href = 'https://www.youtube.com/watch?v=' + card.yt.id;
        link.target = '_blank'; link.rel = 'noopener';
        box.replaceChildren(f, link);
        // Started the song during the pause after "Brava!" → stay here and let it play.
        if (state.ok[card.id]) { cancelAutoAdvance(); addEnjoy(art); }
      });
      box.appendChild(b);
    } else if (card.listen) {
      const a = el('a', 'listen-link', '▶ Listen on YouTube ↗');
      a.href = card.listen.url; a.target = '_blank'; a.rel = 'noopener';
      box.appendChild(a);
    }
  }
  function addEnjoy(art) {
    const fb = art.querySelector('.feedback');
    if (!fb || fb.querySelector('.enjoy')) return;
    fb.appendChild(el('span', 'fb-sub enjoy', '🎶 Enjoy the song, tap ↓ when you\u2019re ready'));
  }
  function stopSongsExcept(keep) {
    document.querySelectorAll('#feed .feed-card').forEach((art, i) => {
      if (i === keep || !art.querySelector('iframe.yt-frame')) return;
      const card = state.cards[i];
      const box = art.querySelector('.song-box');
      if (card && box) buildSongBox(card, art, box);
    });
  }

  function buildCard(card, i) {
    const art = el('article', 'feed-card');
    art.dataset.index = String(i);
    art.dataset.id = card.id;
    art.setAttribute('aria-label', 'Card ' + (i + 1) + ' of ' + state.cards.length);

    const bg = el('img', 'card-bg');
    bg.alt = ''; bg.setAttribute('aria-hidden', 'true');
    bg.decoding = 'async'; bg.loading = i < 2 ? 'eager' : 'lazy';
    bg.src = card.image + '?v=1';
    art.appendChild(bg);

    const frame = el('div', 'card-visual');
    const img = el('img', 'card-photo');
    img.alt = card.scene || '';
    img.decoding = 'async';
    img.loading = i < 2 ? 'eager' : 'lazy';
    img.width = 720; img.height = 1280;
    img.src = card.image + '?v=1';
    frame.appendChild(img);
    frame.appendChild(el('div', 'card-shade'));

    if (card.yt || card.listen) {
      const box = el('div', 'song-box');
      buildSongBox(card, art, box);
      frame.appendChild(box);
    }

    const inner = el('div', 'card-inner');
    const body = el('div', 'card-body');
    const vibe = el('div', 'vibe-row');
    vibe.appendChild(el('span', 'vibe-tag', (card.emoji || '✨') + ' ' + (card.vibe || '')));
    if (card.song) vibe.appendChild(el('span', 'song-sticker', '🎶 ' + card.song));
    body.appendChild(vibe);
    if (card.scene) body.appendChild(el('p', 'scene', card.scene));
    body.appendChild(el('p', 'en-label', 'Say it in Italian'));
    body.appendChild(el('p', 'en-line', card.en));

    const row = el('div', 'caption-row');
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', 'Choose the Italian for: ' + card.en);
    card.captions.forEach((text, ci) => {
      const b = el('button', 'caption-btn', text);
      b.type = 'button';
      b.lang = 'it';
      b.dataset.idx = String(ci);
      b.addEventListener('click', () => pick(card, ci, art));
      row.appendChild(b);
    });
    const fb = el('div', 'feedback');
    fb.hidden = true;
    fb.setAttribute('role', 'status');
    fb.setAttribute('aria-live', 'polite');
    inner.append(body, row, fb);
    frame.appendChild(inner);
    art.appendChild(frame);
    if (state.ok[card.id]) showCorrect(card, art);
    return art;
  }

  function showCorrect(card, art) {
    const btns = art.querySelectorAll('.caption-btn');
    btns.forEach((b, i) => { b.disabled = i !== card.correct; b.classList.remove('wrong'); if (i === card.correct) { b.classList.add('correct'); b.setAttribute('aria-disabled', 'true'); } });
    const fb = art.querySelector('.feedback');
    fb.hidden = false;
    fb.className = 'feedback ok';
    fb.replaceChildren(document.createTextNode('✨ Brava!'), el('span', 'fb-sub', '🆕 New phrase: ' + card.note));
  }

  function pick(card, ci, art) {
    if (state.ok[card.id]) return;
    const btns = art.querySelectorAll('.caption-btn');
    const fb = art.querySelector('.feedback');
    const first = !state.attempted[card.id];
    state.attempted[card.id] = true;
    if (ci === card.correct) {
      if (first) state.firstTry += 1;
      state.ok[card.id] = true;
      showCorrect(card, art);
      sound('ok');
      updateNav();
      saveProgress();
      const idx = state.cards.findIndex((c) => c.id === card.id);
      cancelAutoAdvance();
      if (card.yt && songPlaying(art)) { addEnjoy(art); return; }
      advanceTimer = setTimeout(() => {
        advanceTimer = null;
        if (!$('screenPlay').classList.contains('active')) return;
        if (state.index !== idx) return; // she already moved on (↓ / swipe)
        if (card.yt && songPlaying(art)) return; // started the song during the pause
        goNext();
      }, AUTO_ADVANCE_MS);
    } else {
      btns.forEach((b) => b.classList.remove('wrong'));
      const b = btns[ci];
      if (b) { void b.offsetWidth; b.classList.add('wrong'); setTimeout(() => b.classList.remove('wrong'), 450); }
      fb.hidden = false;
      fb.className = 'feedback soft';
      fb.textContent = card.nudge || 'Almost, try another 💛';
      sound('wrong');
      saveProgress();
    }
  }

  const allDone = () => state.cards.every((c) => state.ok[c.id]);
  const firstOpen = () => state.cards.findIndex((c) => !state.ok[c.id]);
  function goNext() {
    if (state.index < state.cards.length - 1) { scrollToIndex(state.index + 1, true); return; }
    if (allDone()) { finish(); return; }
    const k = firstOpen();
    toast('One more to go! Card ' + (k + 1) + ' 💛', 1800);
    scrollToIndex(k, true);
  }

  /* ---------- feed / navigation ---------- */
  function renderDots() {
    const d = $('dots');
    d.replaceChildren(...state.cards.map(() => el('span', 'dot')));
    d.setAttribute('aria-valuemax', String(state.cards.length));
  }
  function updateNav() {
    const n = state.cards.length;
    const done = state.cards.filter((c) => state.ok[c.id]).length;
    $('dots').querySelectorAll('.dot').forEach((dot, i) => {
      dot.classList.toggle('done', !!state.ok[state.cards[i].id]);
      dot.classList.toggle('here', i === state.index);
    });
    $('dots').setAttribute('aria-valuenow', String(done));
    $('dots').setAttribute('aria-valuetext', done + ' of ' + n + ' done, on card ' + (state.index + 1));
    $('topTitle').textContent = state.session.title + ' · ' + (state.index + 1) + '/' + n;
    $('btnPrev').disabled = state.index <= 0;
  }
  function setIndex(i) {
    if (i === state.index) return;
    state.index = i;
    $('swipeHint').hidden = true;
    stopSongsExcept(i);
    updateNav();
    saveProgress();
  }
  // While a button/auto-advance scroll is animating, don't let in-between positions change the card.
  let scrollLock = { target: -1, until: 0 };
  function scrollToIndex(i, smooth) {
    i = Math.max(0, Math.min(i, state.cards.length - 1));
    const c = $('feed').children[i];
    if (c) {
      scrollLock = { target: smooth ? i : -1, until: Date.now() + 1000 };
      $('feed').scrollTo({ top: c.offsetTop, behavior: smooth ? 'smooth' : 'auto' });
    }
    setIndex(i);
    updateNav();
  }
  function onFeedScroll() {
    const feed = $('feed');
    if (scrollLock.target >= 0) {
      const t = feed.children[scrollLock.target];
      if (Date.now() > scrollLock.until || !t || Math.abs(feed.scrollTop - t.offsetTop) < 2) scrollLock.target = -1;
      else return;
    }
    const h = feed.clientHeight || 1;
    const best = Math.round(feed.scrollTop / h);
    if (best !== state.index && best >= 0 && best < state.cards.length) setIndex(best);
  }

  function startSession(id, fresh) {
    cancelAutoAdvance();
    const s = sessionById(id);
    saved.selected = s.id;
    let p = saved.progress[s.id];
    if (fresh || !p) p = { index: 0, ok: {}, attempted: {}, firstTry: 0 };
    state.session = s;
    state.cards = s.cards;
    state.index = Math.max(0, Math.min(p.index || 0, s.cards.length - 1));
    state.ok = Object.assign({}, p.ok);
    state.attempted = Object.assign({}, p.attempted);
    state.firstTry = p.firstTry || 0;
    saveProgress();
    showScreen($('screenPlay'));
    $('feed').replaceChildren(...state.cards.map(buildCard));
    renderDots();
    updateNav();
    const idx = state.index;
    requestAnimationFrame(() => {
      const c = $('feed').children[idx];
      $('feed').scrollTo({ top: c ? c.offsetTop : 0, behavior: 'auto' });
      updateNav();
    });
    if (!saved.hinted) {
      saved.hinted = true; persist();
      $('swipeHint').hidden = false;
      setTimeout(() => { $('swipeHint').hidden = true; }, 4000);
    }
  }

  function goHome() {
    cancelAutoAdvance();
    stopSongsExcept(-1);
    if (state.session && $('screenPlay').classList.contains('active')) saveProgress();
    showScreen($('screenHome'));
    renderHome();
    $('btnStart').focus({ preventScroll: true });
  }

  /* ---------- end screen ---------- */
  function finish() {
    cancelAutoAdvance();
    stopSongsExcept(-1);
    const s = state.session;
    const n = state.cards.length;
    const score = state.firstTry;
    saved.best[s.id] = Math.max(saved.best[s.id] || 0, score);
    saved.done[s.id] = true;
    delete saved.progress[s.id];
    const nextS = DATA.sessions[DATA.sessions.indexOf(s) + 1];
    let unlockedNow = false;
    if (nextS && !saved.unlocked[nextS.id]) { saved.unlocked[nextS.id] = true; unlockedNow = true; saved.justUnlocked = nextS.id; }
    if (nextS) saved.selected = nextS.id;
    persist();

    $('endScore').textContent = score + ' of ' + n + ' on the first try!';
    const stars = score >= n ? 3 : score >= Math.ceil(n * 0.7) ? 2 : 1;
    $('endStars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    $('endBlurb').textContent = score >= n ? 'Perfetto! Every single one. Ci vediamo presto! 💖'
      : 'All ' + n + ' cards done. Ci vediamo presto! 💖';
    $('unlockBox').hidden = !unlockedNow;
    $('btnNextSession').hidden = !nextS;
    if (nextS) $('btnNextSession').textContent = 'Start ' + nextS.title + ' ▶';
    $('btnReplay').className = nextS ? 'soft-btn' : 'primary-btn';
    $('btnReplay').textContent = '↺ Replay ' + s.title;
    showScreen($('screenEnd'));
    $('endTitle').focus({ preventScroll: true });
    sound('win');
    if (unlockedNow) sound('unlock');
    confetti();
  }

  function confetti() {
    const box = $('confetti');
    box.replaceChildren();
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const colors = ['#ff8fb1', '#ffd6e7', '#9fd6f5', '#fff3b0', '#f4c93d', '#6fd3a0', '#c9b6ff'];
    for (let i = 0; i < 90; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', (Math.random() * 120 - 60).toFixed(0) + 'px');
      p.style.animationDuration = (2.2 + Math.random() * 1.8).toFixed(2) + 's';
      p.style.animationDelay = (Math.random() * 0.6).toFixed(2) + 's';
      if (i % 3 === 0) p.style.borderRadius = '50%';
      box.appendChild(p);
    }
    clearTimeout(confetti._t);
    confetti._t = setTimeout(() => box.replaceChildren(), 5000);
  }

  async function share() {
    const payload = { title: 'Italian with Arianna 🇮🇹', text: 'Scroll, tap, and learn Italian! Ciao! 🍦', url: SHARE_URL };
    if (navigator.share) {
      try { await navigator.share(payload); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(SHARE_URL); toast('Link copied! 💌 Paste it to share.'); return; }
    } catch (_) {}
    try {
      const ta = document.createElement('textarea');
      ta.value = SHARE_URL; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      if (ok) { toast('Link copied! 💌 Paste it to share.'); return; }
    } catch (_) {}
    toast('Share this link: ' + SHARE_URL, 5000);
  }

  /* ---------- wiring ---------- */
  function fixHeight() {
    // Older browsers without dvh: size to the visible area so Safari's toolbar never hides the answers.
    if (window.CSS && CSS.supports && CSS.supports('height', '100dvh')) return;
    document.documentElement.style.setProperty('--app-h', window.innerHeight + 'px');
  }

  function init() {
    fixHeight();
    window.addEventListener('resize', fixHeight);
    updateMuteUI();
    renderHome();

    $('btnStart').addEventListener('click', () => {
      if (!saved.muted) { try { ctx(); } catch (_) {} }
      startSession(saved.selected, false);
    });
    $('btnStartOver').addEventListener('click', () => {
      if (!saved.muted) { try { ctx(); } catch (_) {} }
      delete saved.progress[saved.selected];
      startSession(saved.selected, true);
    });
    $('btnHome').addEventListener('click', goHome);
    $('btnEndHome').addEventListener('click', goHome);
    $('btnReplay').addEventListener('click', () => startSession(state.session.id, true));
    $('btnNextSession').addEventListener('click', () => {
      const nextS = DATA.sessions[DATA.sessions.indexOf(state.session) + 1];
      if (nextS) startSession(nextS.id, false);
    });
    $('btnShare').addEventListener('click', share);
    $('btnMute').addEventListener('click', () => {
      saved.muted = !saved.muted;
      persist();
      updateMuteUI();
      if ($('screenHome').classList.contains('active')) renderHome();
      if (!saved.muted) sound('tap');
    });
    $('btnPrev').addEventListener('click', () => scrollToIndex(state.index - 1, true));
    $('btnNext').addEventListener('click', () => {
      if (state.index >= state.cards.length - 1) {
        if (allDone()) finish();
        else { const k = firstOpen(); toast('Tap the Italian first 💛', 1600); if (k !== state.index) scrollToIndex(k, true); }
        return;
      }
      scrollToIndex(state.index + 1, true);
    });
    $('feed').addEventListener('scroll', onFeedScroll, { passive: true });
    document.addEventListener('keydown', (e) => {
      if (!$('screenPlay').classList.contains('active') || e.altKey || e.ctrlKey || e.metaKey) return;
      const k = e.key;
      if (k === 'ArrowDown' || k === 'PageDown') { e.preventDefault(); $('btnNext').click(); }
      else if (k === 'ArrowUp' || k === 'PageUp') { e.preventDefault(); scrollToIndex(state.index - 1, true); }
      else if (/^[1-3]$/.test(k) || /^[abc]$/i.test(k)) {
        const ci = /\d/.test(k) ? Number(k) - 1 : k.toLowerCase().charCodeAt(0) - 97;
        const art = $('feed').children[state.index];
        const b = art && art.querySelectorAll('.caption-btn')[ci];
        if (b && !b.disabled) { e.preventDefault(); b.focus({ preventScroll: true }); b.click(); }
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && $('screenPlay').classList.contains('active')) saveProgress();
    });

    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
      window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
