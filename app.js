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
  // Once a song clip has been started on a card, never auto-advance (let it play).
  function clipPlaying(card) {
    return !!(card && card.clip && player && !player.paused && player.dataset.card === card.id);
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
    clearTimeout(toast._t); $('toast').hidden = true;
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
        if (!open) { sound('wrong'); toast('Finish Session 1 to unlock Session 2 🔒', 2000); return; }
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

  /* ---------- song clips (Apple Music 30 s previews, one shared <audio>) ---------- */
  const player = document.getElementById('songPlayer');
  let primed = false;
  function primeAudio() {
    // Called from the Start tap: play the shared element once (muted) so iOS allows later programmatic play().
    if (primed || !player) return;
    const first = DATA.sessions.flatMap((s) => s.cards).find((c) => c.clip);
    if (!first) return;
    primed = true;
    try {
      player.muted = true;
      if (!player.dataset.card) { player.src = first.clip.url; player.dataset.card = ''; }
      const pr = player.play();
      const done = () => { if (!player.dataset.card) { player.pause(); try { player.currentTime = 0; } catch (_) {} } player.muted = false; };
      if (pr && pr.then) pr.then(done).catch(() => { player.muted = false; primed = false; });
      else done();
    } catch (_) { player.muted = false; primed = false; }
  }
  const artFor = (id) => document.querySelector('#feed .feed-card[data-id="' + id + '"]');
  const cardById = (id) => state.cards.find((c) => c.id === id);
  function setClipState(id, st) {
    const art = id && artFor(id);
    if (!art) return;
    art.dataset.clip = st; // idle | playing | paused | blocked | ended | muted
    art.classList.toggle('is-playing', st === 'playing');
    const card = cardById(id);
    const big = art.querySelector('.song-toggle');
    if (big) {
      big.textContent = st === 'playing' ? '❚❚ Pause' : st === 'blocked' ? 'Tap to play 🎶' : st === 'ended' ? '↺ Play again' : st === 'muted' ? '🔇 Sound is off · tap to play' : '▶ Play';
      big.setAttribute('aria-pressed', String(st === 'playing'));
      big.classList.toggle('big-blocked', st === 'blocked' || st === 'muted');
    }
    const pill = art.querySelector('.clip-pill');
    if (pill && card) {
      pill.querySelector('.clip-ico').textContent = st === 'playing' ? '❚❚' : '▶';
      pill.setAttribute('aria-pressed', String(st === 'playing'));
      pill.setAttribute('aria-label', (st === 'playing' ? 'Pause ' : 'Play ') + card.clip.label + ' (30-second clip)');
    }
    const hint = art.querySelector('.song-hint');
    if (hint) hint.textContent = st === 'ended' ? 'That was the clip! Swipe up when you\u2019re ready ↑' : 'Swipe up when you\u2019re ready ↑';
    const lyr = art.querySelector('.lyrics');
    if (lyr && art.dataset.type !== 'song') lyr.hidden = !(st === 'playing' || st === 'paused');
  }
  function playClip(card, auto) {
    if (!player || !card || !card.clip) return;
    if (saved.muted) {
      if (auto) { setClipState(card.id, 'muted'); return; }
      saved.muted = false; persist(); updateMuteUI();
    }
    if (player.dataset.card && player.dataset.card !== card.id) stopClip();
    if (player.dataset.card !== card.id) {
      player.src = card.clip.url;
      player.dataset.card = card.id;
    }
    player.muted = false;
    let pr;
    try { pr = player.play(); } catch (e) { setClipState(card.id, 'blocked'); return; }
    if (pr && pr.catch) pr.catch((e) => { if (player.dataset.card === card.id && player.paused) setClipState(card.id, 'blocked'); });
    // Started the clip during the pause after "Brava!" → stay here and let it play.
    if (state.ok[card.id] && card.type !== 'song' && state.cards[state.index] === card) { cancelAutoAdvance(); addEnjoy(artFor(card.id)); }
  }
  function toggleClip(card) {
    if (player.dataset.card === card.id && !player.paused) player.pause();
    else playClip(card, false);
  }
  function stopClip() {
    if (!player) return;
    const id = player.dataset.card;
    if (!id) return; // nothing loaded (e.g. the silent iOS unlock is still running)
    try { player.pause(); } catch (_) {}
    if (id) { player.removeAttribute('src'); try { player.load(); } catch (_) {} }
    player.dataset.card = '';
    if (id) { setClipState(id, 'idle'); syncLyrics(id, -1); }
  }
  function addEnjoy(art) {
    const fb = art && art.querySelector('.feedback');
    if (!fb || fb.hidden || fb.querySelector('.enjoy')) return;
    fb.appendChild(el('span', 'fb-sub enjoy', '🎶 Enjoy the song, tap ↓ when you\u2019re ready'));
  }
  function syncLyrics(id, t) {
    const art = artFor(id);
    const box = art && art.querySelector('.lyrics');
    if (!box) return;
    const card = cardById(id);
    let k = -1;
    if (t >= 0) card.lyrics.forEach((ln, i) => { if (ln.t <= t + 0.15) k = i; });
    if (String(k) === box.dataset.on) return;
    box.dataset.on = String(k);
    const lines = box.querySelectorAll('.ly-line');
    lines.forEach((l, i) => { l.classList.toggle('on', i === k); l.classList.toggle('past', i < k); });
    const list = box.querySelector('.ly-list');
    const cur = lines[Math.max(0, k)];
    if (list && cur) list.style.transform = 'translateY(' + (-Math.max(0, cur.offsetTop - (box.clientHeight - cur.offsetHeight) / 2)) + 'px)';
  }
  let rafId = 0;
  function lyricLoop() {
    cancelAnimationFrame(rafId);
    const id = player.dataset.card;
    if (!id || player.paused) return;
    syncLyrics(id, player.currentTime);
    rafId = requestAnimationFrame(lyricLoop);
  }
  if (player) {
    player.addEventListener('playing', () => { if (player.dataset.card) { setClipState(player.dataset.card, 'playing'); lyricLoop(); } });
    player.addEventListener('pause', () => { const id = player.dataset.card; if (id && !player.ended) setClipState(id, 'paused'); });
    player.addEventListener('ended', () => { const id = player.dataset.card; if (id) { setClipState(id, 'ended'); syncLyrics(id, 99); } });
    player.addEventListener('timeupdate', () => { if (player.dataset.card) syncLyrics(player.dataset.card, player.currentTime); });
  }

  /* word bubbles: tap an Italian lyric word → English meaning + how to say it */
  function showBubble(btn, word, en, say) {
    const b = $('wordBubble');
    b.replaceChildren(el('strong', null, word.replace(/^[…'"¿¡]+|[,.!?;:…]+$/g, '')), document.createTextNode(' = ' + en));
    if (say) b.appendChild(el('span', 'wb-say', 'How do you say it? ' + say));
    b.hidden = false;
    const app = $('app').getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    const bw = Math.min(260, app.width - 20);
    b.style.width = bw + 'px';
    let x = r.left + r.width / 2 - app.left - bw / 2;
    x = Math.max(10, Math.min(x, app.width - bw - 10));
    b.style.left = x + 'px';
    const h = b.offsetHeight;
    let y = r.top - app.top - h - 10;
    if (y < 10) y = r.bottom - app.top + 10;
    b.style.top = y + 'px';
    clearTimeout(showBubble._t);
    showBubble._t = setTimeout(hideBubble, 4500);
  }
  function hideBubble() { const b = $('wordBubble'); if (b) b.hidden = true; }

  function buildLyrics(card, compact) {
    const box = el('div', 'lyrics' + (compact ? ' compact' : ''));
    box.setAttribute('aria-label', 'Lyrics: tap a word to see what it means');
    box.dataset.on = '-2';
    const list = el('div', 'ly-list');
    card.lyrics.forEach((ln) => {
      const line = el('p', 'ly-line');
      line.lang = 'it';
      if (!ln.w.length) { line.classList.add('ly-break'); line.textContent = '♪ ♪ ♪'; line.setAttribute('aria-label', 'music'); }
      ln.w.forEach(([word, en, say], i) => {
        const b = el('button', 'w', word);
        b.type = 'button';
        b.setAttribute('aria-label', word + ': ' + en);
        b.addEventListener('click', (e) => { e.stopPropagation(); showBubble(b, word, en, say); });
        line.appendChild(b);
        if (i < ln.w.length - 1) line.appendChild(document.createTextNode(' '));
      });
      list.appendChild(line);
    });
    box.appendChild(list);
    return box;
  }
  function buildCredit(card) {
    const a = el('a', 'clip-credit', 'Preview via Apple Music');
    a.href = card.clip.trackViewUrl; a.target = '_blank'; a.rel = 'noopener';
    return a;
  }

  function buildSongCard(card, i, art) {
    const frame = el('div', 'card-visual song-frame');
    const inner = el('div', 'song-inner');
    const vibe = el('div', 'vibe-row');
    vibe.appendChild(el('span', 'vibe-tag song-vibe', card.emoji + ' ' + card.vibe));
    const disc = el('div', 'disc-wrap');
    disc.setAttribute('aria-hidden', 'true');
    const rec = el('div', 'record');
    const label = el('img', 'record-label');
    label.src = card.image + '?v=3'; label.alt = ''; label.decoding = 'async';
    rec.appendChild(label);
    disc.appendChild(rec);
    const eq = el('div', 'eq');
    for (let k = 0; k < 7; k++) eq.appendChild(el('span'));
    disc.appendChild(eq);
    disc.appendChild(el('span', 'note n1', '♪'));
    disc.appendChild(el('span', 'note n2', '♫'));
    disc.appendChild(el('span', 'note n3', '♪'));
    const title = el('h3', 'song-title', card.title + ' · ' + card.artist);
    const scene = el('p', 'song-scene', card.scene);
    const lyr = buildLyrics(card, false);
    const btn = el('button', 'song-toggle', '▶ Play');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Play or pause ' + card.title);
    btn.addEventListener('click', () => toggleClip(card));
    const foot = el('div', 'song-foot');
    foot.append(buildCredit(card), el('span', 'song-hint', 'Swipe up when you\u2019re ready ↑'));
    inner.append(vibe, disc, title, scene, lyr, btn, foot);
    frame.appendChild(inner);
    art.appendChild(frame);
    return art;
  }

  /* ---------- cards ---------- */
  function buildCard(card, i) {
    const art = el('article', 'feed-card');
    art.dataset.index = String(i);
    art.dataset.id = card.id;
    art.dataset.type = card.type;
    art.setAttribute('aria-label', 'Card ' + (i + 1) + ' of ' + state.cards.length + (card.type === 'song' ? ': song break' : ''));

    const bg = el('img', 'card-bg');
    bg.alt = ''; bg.setAttribute('aria-hidden', 'true');
    bg.decoding = 'async'; bg.loading = i < 2 ? 'eager' : 'lazy';
    bg.src = card.image + '?v=3';
    art.appendChild(bg);
    if (card.type === 'song') return buildSongCard(card, i, art);

    const frame = el('div', 'card-visual');
    const img = el('img', 'card-photo');
    img.alt = card.scene || '';
    img.decoding = 'async';
    img.loading = i < 2 ? 'eager' : 'lazy';
    img.width = 720; img.height = 1280;
    img.src = card.image + '?v=3';
    frame.appendChild(img);
    frame.appendChild(el('div', 'card-shade'));

    if (card.clip) {
      const box = el('div', 'song-box');
      const pill = el('button', 'clip-pill');
      pill.type = 'button';
      pill.append(el('span', 'clip-ico', '▶'), el('span', 'clip-name', card.clip.label + ' 🎶'));
      const mini = el('span', 'eq mini');
      for (let k = 0; k < 4; k++) mini.appendChild(el('span'));
      pill.appendChild(mini);
      pill.setAttribute('aria-label', 'Play ' + card.clip.label + ' (30-second clip)');
      pill.setAttribute('aria-pressed', 'false');
      pill.addEventListener('click', () => toggleClip(card));
      box.append(pill, buildCredit(card));
      if (card.lyrics) { const ly = buildLyrics(card, true); ly.hidden = true; box.appendChild(ly); }
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
      if (clipPlaying(card)) { addEnjoy(art); return; }
      advanceTimer = setTimeout(() => {
        advanceTimer = null;
        if (!$('screenPlay').classList.contains('active')) return;
        if (state.index !== idx) return; // she already moved on (↓ / swipe)
        if (clipPlaying(card)) return; // started the song during the pause
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

  const isQ = (c) => c.type !== 'song';
  const allDone = () => state.cards.every((c) => !isQ(c) || state.ok[c.id]);
  const firstOpen = () => state.cards.findIndex((c) => isQ(c) && !state.ok[c.id]);
  function onCardShown(i) {
    const c = state.cards[i];
    if (player && player.dataset.card && (!c || player.dataset.card !== c.id)) stopClip();
    hideBubble();
    if (c && c.type === 'song') {
      state.ok[c.id] = true; // song break counts in the progress dots once seen
      if ($('screenPlay').classList.contains('active')) playClip(c, true);
    }
  }
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
    onCardShown(i);
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
    stopClip(); hideBubble();
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
      onCardShown(idx);
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
    stopClip(); hideBubble();
    if (state.session && $('screenPlay').classList.contains('active')) saveProgress();
    showScreen($('screenHome'));
    renderHome();
    $('btnStart').focus({ preventScroll: true });
  }

  /* ---------- end screen ---------- */
  function finish() {
    cancelAutoAdvance();
    stopClip(); hideBubble();
    const s = state.session;
    const n = state.cards.filter(isQ).length;
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
      : 'All ' + n + ' questions done. Ci vediamo presto! 💖';
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
      primeAudio();
      if (!saved.muted) { try { ctx(); } catch (_) {} }
      startSession(saved.selected, false);
    });
    $('btnStartOver').addEventListener('click', () => {
      primeAudio();
      if (!saved.muted) { try { ctx(); } catch (_) {} }
      delete saved.progress[saved.selected];
      startSession(saved.selected, true);
    });
    $('btnHome').addEventListener('click', goHome);
    $('btnEndHome').addEventListener('click', goHome);
    $('btnReplay').addEventListener('click', () => { primeAudio(); startSession(state.session.id, true); });
    $('btnNextSession').addEventListener('click', () => {
      const nextS = DATA.sessions[DATA.sessions.indexOf(state.session) + 1];
      if (nextS) startSession(nextS.id, false);
    });
    $('btnShare').addEventListener('click', share);
    $('btnMute').addEventListener('click', () => {
      saved.muted = !saved.muted;
      persist();
      updateMuteUI();
      if (saved.muted && player && !player.paused) player.pause();
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
    $('feed').addEventListener('scroll', () => { hideBubble(); onFeedScroll(); }, { passive: true });
    document.addEventListener('click', (e) => { if (!e.target.closest('.w') && !e.target.closest('#wordBubble')) hideBubble(); });
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
