(() => {
  'use strict';
  const DATA = window.ARIANNA_PREVIEW;
  if (!DATA) { console.error('Arianna Scroll preview: data.js missing'); return; }

  const STORAGE = { mute: 'ariannaScroll.preview.muted' };
  const $ = (id) => document.getElementById(id);
  const state = {
    muted: localStorage.getItem(STORAGE.mute) === '1', // sound ON by default
    cards: DATA.cards || [],
    index: 0,
    firstTry: 0,
    attempted: {},
    ok: {},
  };
  let audioCtx = null;
  // Single tap: correct pick → "Brava!" + new-phrase note → auto-advance after ~1.2 s.
  const AUTO_ADVANCE_MS = 1200;
  let advanceTimer = null;
  function cancelAutoAdvance() {
    if (advanceTimer) clearTimeout(advanceTimer);
    advanceTimer = null;
  }
  // The Mamma Maria card: once the song has been started, never auto-advance (let it play).
  function songPlaying(art) {
    return !!(art && art.querySelector('iframe.yt-frame'));
  }

  function showScreen(el) {
    document.querySelectorAll('.screen').forEach((s) => {
      const on = s === el;
      s.classList.toggle('active', on);
      if (on) s.removeAttribute('hidden'); else s.setAttribute('hidden', '');
    });
    $('btnHome').hidden = el === $('screenHome');
    $('phone').classList.toggle('play-mode', el === $('screenPlay'));
  }

  function tone(freq, when, dur, vol) {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = 'sine'; o.frequency.value = freq;
    const t = audioCtx.currentTime + when;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function beep(ok) {
    if (state.muted) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      if (ok) { tone(660, 0, 0.12, 0.05); tone(880, 0.1, 0.18, 0.05); }
      else tone(320, 0, 0.16, 0.035);
    } catch (_) {}
  }
  function updateMuteUI() {
    $('btnMute').textContent = state.muted ? '🔇' : '🔊';
    $('btnMute').setAttribute('aria-label', state.muted ? 'Unmute sound' : 'Mute sound');
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function buildCard(card, i) {
    const art = el('article', 'feed-card');
    art.dataset.index = String(i);
    art.dataset.id = card.id;

    const frame = el('div', 'card-visual');
    const img = el('img', 'card-photo');
    img.alt = '';
    img.decoding = 'async';
    img.loading = i < 2 ? 'eager' : 'lazy';
    img.width = 720; img.height = 1280;
    img.src = card.image + '?v=p1';
    frame.appendChild(img);
    frame.appendChild(el('div', 'card-shade'));

    if (card.yt || card.listen) {
      const box = el('div', 'song-box');
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
        });
        box.appendChild(b);
      } else {
        const a = el('a', 'listen-link', '▶ Listen on YouTube ↗');
        a.href = card.listen.url; a.target = '_blank'; a.rel = 'noopener';
        box.appendChild(a);
      }
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
    row.setAttribute('aria-label', 'Choose the Italian');
    const fb = el('div', 'feedback');
    fb.hidden = true;
    fb.setAttribute('role', 'status');
    fb.setAttribute('aria-live', 'polite');
    card.captions.forEach((text, ci) => {
      const b = el('button', 'caption-btn', text);
      b.type = 'button';
      b.lang = 'it';
      b.dataset.idx = String(ci);
      b.addEventListener('click', () => pick(card, ci, art));
      row.appendChild(b);
    });
    inner.appendChild(body);
    inner.appendChild(row);
    inner.appendChild(fb);
    frame.appendChild(inner);
    art.appendChild(frame);
    return art;
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
      btns.forEach((b, i) => { b.disabled = i !== card.correct; b.classList.remove('wrong-flash'); if (i === card.correct) b.classList.add('correct-flash'); });
      fb.hidden = false;
      fb.className = 'feedback ok';
      fb.replaceChildren(document.createTextNode('✨ Brava!'), el('span', 'new-phrase', '🆕 New phrase: ' + card.note));
      beep(true);
      updateNav();
      const idx = state.cards.findIndex((c) => c.id === card.id);
      cancelAutoAdvance();
      if (card.yt && songPlaying(art)) {
        fb.appendChild(el('span', 'new-phrase', '🎶 Enjoy the song, tap ↓ when you’re ready'));
        return;
      }
      advanceTimer = setTimeout(() => {
        advanceTimer = null;
        if (!$('screenPlay').classList.contains('active')) return;
        if (state.index !== idx) return; // she already moved on (↓ / swipe)
        if (card.yt && songPlaying(art)) return; // started the song during the pause
        if (idx < state.cards.length - 1) scrollToIndex(idx + 1, true);
        else if (state.cards.every((c) => state.ok[c.id])) finish();
      }, AUTO_ADVANCE_MS);
    } else {
      btns.forEach((b) => b.classList.remove('wrong-flash'));
      const b = btns[ci];
      if (b) { void b.offsetWidth; b.classList.add('wrong-flash'); setTimeout(() => b.classList.remove('wrong-flash'), 450); }
      fb.hidden = false;
      fb.className = 'feedback soft';
      fb.textContent = card.nudge || 'Almost, try another 💛';
      beep(false);
    }
  }

  function finish() {
    cancelAutoAdvance();
    $('endBlurb').textContent = 'All ' + state.cards.length + ' done, ' + state.firstTry + ' on the first try. Ci vediamo presto! 💙';
    showScreen($('screenEnd'));
  }

  function renderFeed() {
    const feed = $('feed');
    feed.replaceChildren(...state.cards.map(buildCard));
  }
  function beginPlay() {
    cancelAutoAdvance();
    state.index = 0; state.firstTry = 0; state.attempted = {}; state.ok = {};
    $('headerSubtitle').textContent = 'Arianna · scrolling';
    showScreen($('screenPlay'));
    renderFeed();
    updateNav();
    requestAnimationFrame(() => scrollToIndex(0, false));
  }
  function updateNav() {
    $('feedPos').textContent = state.index + 1 + ' / ' + state.cards.length;
    $('btnPrev').disabled = state.index <= 0;
  }
  function scrollToIndex(i, smooth) {
    state.index = Math.max(0, Math.min(i, state.cards.length - 1));
    const c = $('feed').children[state.index];
    if (c) $('feed').scrollTo({ top: c.offsetTop, behavior: smooth ? 'smooth' : 'auto' });
    updateNav();
  }
  function onFeedScroll() {
    const feed = $('feed');
    const h = feed.clientHeight || 1;
    const best = Math.round(feed.scrollTop / h);
    if (best !== state.index && best >= 0 && best < state.cards.length) { state.index = best; updateNav(); }
  }
  function flashTip(text, ms) {
    const t = $('tipToast');
    t.textContent = text; t.hidden = false;
    clearTimeout(flashTip._t);
    flashTip._t = setTimeout(() => { t.hidden = true; }, ms || 2000);
  }

  function init() {
    updateMuteUI();
    $('btnStart').addEventListener('click', () => {
      if (!state.muted) { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch (_) {} }
      beginPlay();
    });
    $('btnHome').addEventListener('click', () => { cancelAutoAdvance(); $('headerSubtitle').textContent = 'For You'; showScreen($('screenHome')); });
    $('btnAgain').addEventListener('click', beginPlay);
    $('btnEndHome').addEventListener('click', () => showScreen($('screenHome')));
    $('btnMute').addEventListener('click', () => {
      state.muted = !state.muted;
      localStorage.setItem(STORAGE.mute, state.muted ? '1' : '0');
      updateMuteUI();
      if (!state.muted) beep(true);
    });
    $('btnPrev').addEventListener('click', () => scrollToIndex(state.index - 1, true));
    $('btnNext').addEventListener('click', () => {
      if (state.index >= state.cards.length - 1) {
        if (state.cards.every((c) => state.ok[c.id])) finish();
        else flashTip('Tap the Italian first 💛', 1600);
        return;
      }
      scrollToIndex(state.index + 1, true);
    });
    $('feed').addEventListener('scroll', onFeedScroll, { passive: true });
    document.addEventListener('keydown', (e) => {
      if (!$('screenPlay').classList.contains('active')) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); scrollToIndex(state.index + 1, true); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); scrollToIndex(state.index - 1, true); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
