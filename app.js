(() => {
  'use strict';
  const DATA = window.ARIANNA_APP;
  if (!DATA) { console.error('Italian with Arianna: data.js missing'); return; }

  const KEY = 'ariannaScroll.app.v1';
  const SHARE_URL = DATA.shareUrl || 'https://appuccinohub.github.io/arianna-scroll/';
  // Single tap: correct pick → "Brava!" + new-phrase note → auto-advance after ~1.2 s.
  const AUTO_ADVANCE_MS = 1200;
  const $ = (id) => document.getElementById(id);
  const SONGS = DATA.songs || [];
  const isSongSet = (s) => SONGS.indexOf(s) >= 0;
  const sessionById = (id) => DATA.sessions.find((s) => s.id === id) || SONGS.find((s) => s.id === id) || DATA.sessions[0];
  const reduceMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

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
  const isUnlocked = (id) => id === DATA.sessions[0].id || !!saved.unlocked[id] || SONGS.some((s) => s.id === id);
  const prevTitle = (s) => { const i = DATA.sessions.indexOf(s); return i > 0 ? DATA.sessions[i - 1].title : DATA.sessions[0].title; };

  /* ---------- play state ---------- */
  const state = { session: null, cards: [], index: 0, firstTry: 0, attempted: {}, ok: {} };
  let advanceTimer = null;
  function cancelAutoAdvance() {
    if (advanceTimer) clearTimeout(advanceTimer);
    advanceTimer = null;
  }
  // Once a song clip has been started on a card, never auto-advance (let it play).
  function clipPlaying(card) {
    return !!(card && card.clip && card.type !== 'lyricq' && player && !player.paused && player.dataset.card === card.id);
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
    if (!play) $('topTitle').textContent = screen === $('screenSongs') ? 'Canzoni 🎶' : 'Italian with Arianna';
    if (!play) pauseVideos();
    if (screen !== $('screenEnd')) { clearTimeout(confetti._t); $('confetti').replaceChildren(); }
    clearTimeout(toast._t); $('toast').hidden = true;
  }

  /* ---------- start screen ---------- */
  function renderHome() {
    const picker = $('picker');
    picker.replaceChildren();
    if (!isUnlocked(saved.selected) || !DATA.sessions.some((s) => s.id === saved.selected)) saved.selected = DATA.sessions[0].id;
    DATA.sessions.forEach((s) => {
      const open = isUnlocked(s.id);
      const b = el('button', 'sess-btn' + (open ? '' : ' locked'));
      b.type = 'button';
      b.dataset.session = s.id;
      b.setAttribute('aria-pressed', String(saved.selected === s.id));
      const p = saved.progress[s.id];
      const doneCount = p ? Object.keys(p.ok || {}).length : 0;
      let sub;
      if (!open) sub = '🔒 Finish ' + prevTitle(s);
      else if (p && doneCount) sub = doneCount + ' / ' + s.cards.length + ' done';
      else if (saved.done[s.id]) sub = '⭐ ' + (saved.best[s.id] || 0) + ' / ' + s.cards.length + ' best';
      else sub = s.cards.length + ' cards';
      b.append(el('span', 's-name', s.emoji + ' ' + s.title), el('span', 's-sub', sub));
      b.setAttribute('aria-label', s.title + (open ? ', ' + sub : ', locked. Finish ' + prevTitle(s) + ' to unlock'));
      b.addEventListener('click', () => {
        if (!open) { sound('wrong'); toast('Finish ' + prevTitle(s) + ' to unlock ' + s.title + ' 🔒', 2000); return; }
        saved.selected = s.id; persist(); sound('tap'); renderHome();
      });
      if (saved.justUnlocked && s.id === saved.justUnlocked) b.classList.add('unlocked-pop');
      picker.appendChild(b);
    });
    if (SONGS.length) {
      const k = el('button', 'sess-btn sess-songs');
      k.type = 'button';
      const doneSongs = SONGS.filter((x) => saved.done[x.id]).length;
      const ksub = doneSongs ? '⭐ ' + doneSongs + ' / ' + SONGS.length + ' songs learned' : SONGS.length + ' songs · open anytime';
      k.append(el('span', 's-name', '🎶 Canzoni'), el('span', 's-sub', ksub));
      k.setAttribute('aria-label', 'Canzoni, songs: ' + ksub);
      k.addEventListener('click', () => { sound('tap'); primeAudio(); showSongs(); });
      picker.appendChild(k);
    }
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

  /* ---------- Canzoni list ---------- */
  function showSongs() {
    cancelAutoAdvance(); stopClip(); hideBubble();
    const list = $('songList');
    list.replaceChildren();
    SONGS.forEach((k) => {
      const b = el('button', 'song-row');
      b.type = 'button';
      b.dataset.song = k.id;
      const n = k.cards.filter((c) => c.type !== 'song').length;
      const st = saved.done[k.id] ? '⭐ ' + (saved.best[k.id] || 0) + '/' + n : saved.progress[k.id] ? '▶ keep going' : 'new';
      const txt = el('span', 'sr-text');
      txt.append(el('span', 'sr-title', k.title), el('span', 'sr-artist', k.artist));
      b.append(el('span', 'sr-emoji', k.emoji), txt, el('span', 'sr-state' + (saved.done[k.id] ? ' done' : ''), st));
      b.setAttribute('aria-label', k.title + ' by ' + k.artist + ': ' + st);
      b.addEventListener('click', () => { primeAudio(); if (!saved.muted) { try { ctx(); } catch (_) {} } startSession(k.id, !!saved.done[k.id] && !saved.progress[k.id]); });
      list.appendChild(b);
    });
    showScreen($('screenSongs'));
    $('songsTitle').focus({ preventScroll: true });
  }

  /* ---------- muted card videos: only the card on screen plays ---------- */
  function pauseVideos(except) {
    document.querySelectorAll('#feed video').forEach((v) => { if (v !== except) { try { v.pause(); } catch (_) {} } });
  }
  function playVideoOn(i) {
    const art = $('feed').children[i];
    const v = art && art.querySelector('video');
    pauseVideos(v);
    if (!v || reduceMotion() || !$('screenPlay').classList.contains('active')) return;
    v.muted = true; v.preload = 'auto';
    const pr = v.play();
    if (pr && pr.catch) pr.catch(() => {});
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
    const rb = art.querySelector('.replay-btn');
    if (rb) {
      rb.textContent = st === 'playing' ? '❚❚ Pause' : st === 'blocked' ? '🎧 Tap to hear it' : '🔁 Hear it again';
      rb.setAttribute('aria-pressed', String(st === 'playing'));
    }
    const hint = art.querySelector('.song-hint');
    if (hint) hint.textContent = songHint(card, st === 'ended');
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
  // Song questions: replay just the line (card.snip = [from, to] seconds) from the same Apple preview.
  let snipEnd = null;
  function playSnippet(card) {
    if (!player || !card.clip || !card.snip) return;
    if (player.dataset.card === card.id && !player.paused) { player.pause(); return; }
    if (saved.muted) { saved.muted = false; persist(); updateMuteUI(); }
    if (player.dataset.card && player.dataset.card !== card.id) stopClip();
    const from = card.snip[0];
    snipEnd = { id: card.id, to: card.snip[1] };
    if (player.dataset.card !== card.id) {
      player.src = card.clip.url + '#t=' + from;
      player.dataset.card = card.id;
    } else {
      try { player.currentTime = from; } catch (_) {}
    }
    player.muted = false;
    let pr;
    try { pr = player.play(); } catch (e) { setClipState(card.id, 'blocked'); return; }
    if (pr && pr.catch) pr.catch(() => { if (player.dataset.card === card.id && player.paused) setClipState(card.id, 'blocked'); });
  }
  function songHint(card, ended) {
    const more = card && card.type === 'song' && state.cards.some((c) => c.songOf === card.id);
    if (more) return ended ? 'Now 3 quick questions! Swipe up ↑' : 'Then 3 quick questions · swipe up ↑';
    return ended ? 'That was the clip! Swipe up when you\u2019re ready ↑' : 'Swipe up when you\u2019re ready ↑';
  }
  const lineStart = (ln, t) => { const ts = Array.isArray(ln.t) ? ln.t : [ln.t]; let best = -1; ts.forEach((x) => { if (x <= t + 0.15 && x > best) best = x; }); return best; };
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
    snipEnd = null;
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
    if (t >= 0) { let best = -1; card.lyrics.forEach((ln, i) => { const st = lineStart(ln, t); if (st >= 0 && st >= best) { best = st; k = i; } }); }
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
    player.addEventListener('pause', () => { const id = player.dataset.card; if (id && snipEnd && snipEnd.id === id) setClipState(id, 'idle'); });
    player.addEventListener('timeupdate', () => {
      if (!player.dataset.card) return;
      if (snipEnd && snipEnd.id === player.dataset.card && player.currentTime >= snipEnd.to) { player.pause(); return; }
      syncLyrics(player.dataset.card, player.currentTime);
    });
  }

  /* word bubbles: tap an Italian lyric word → English meaning + how to say it */
  function showBubble(btn, word, en, say, toItalian) {
    const b = $('wordBubble');
    const w = word.replace(/^[…"¿¡]+|[,.!?;:…]+$/g, '').replace(/^'(?![a-z])/i, '');
    if (toItalian) {
      // English song: show the ITALIAN for the word, and how to say the Italian.
      b.replaceChildren(el('strong', null, w), document.createTextNode(' → 🇮🇹 '), el('span', 'wb-it', en));
      if (say) b.appendChild(el('span', 'wb-say', 'Say it in Italian: ' + say));
    } else {
      b.replaceChildren(el('strong', null, w), document.createTextNode(' = ' + en));
      if (say) b.appendChild(el('span', 'wb-say', 'How do you say it? ' + say));
    }
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
    const toIt = card.lyricsLang === 'en';
    box.setAttribute('aria-label', toIt ? 'Lyrics: tap a word to see it in Italian' : 'Lyrics: tap a word to see what it means');
    box.dataset.on = '-2';
    const list = el('div', 'ly-list');
    card.lyrics.forEach((ln) => {
      const line = el('p', 'ly-line');
      line.lang = toIt ? 'en' : 'it';
      if (!ln.w.length) { line.classList.add('ly-break'); line.textContent = '♪ ♪ ♪'; line.setAttribute('aria-label', 'music'); }
      ln.w.forEach(([word, en, say], i) => {
        const b = el('button', 'w', word);
        b.type = 'button';
        b.setAttribute('aria-label', word + (toIt ? ', in Italian: ' : ': ') + en);
        b.addEventListener('click', (e) => { e.stopPropagation(); showBubble(b, word, en, say, toIt); });
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
    foot.append(buildCredit(card), el('span', 'song-hint', songHint(card, false)));
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
    art.setAttribute('aria-label', 'Card ' + (i + 1) + ' of ' + state.cards.length + (card.type === 'song' ? ': song' : ''));

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
    if (card.video) {
      // Short muted 9:16 loop (poster = the photo underneath). Only the card on screen plays; see playVideoOn().
      const v = document.createElement('video');
      v.className = 'card-photo card-video';
      v.muted = true; v.defaultMuted = true; v.setAttribute('muted', '');
      v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
      v.loop = true; v.preload = 'none';
      v.setAttribute('disablepictureinpicture', ''); v.setAttribute('disableremoteplayback', '');
      v.setAttribute('aria-hidden', 'true'); v.tabIndex = -1;
      v.poster = card.image + '?v=3';
      v.src = card.video + '?v=8';
      v.addEventListener('error', () => v.remove());
      frame.appendChild(v);
    }
    frame.appendChild(el('div', 'card-shade'));

    if (card.clip && card.type !== 'lyricq') {
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
    if (card.songTitle) vibe.appendChild(el('span', 'song-sticker', '🎶 ' + card.songTitle));
    body.appendChild(vibe);
    if (card.scene) body.appendChild(el('p', 'scene', card.scene));
    let groupLabel = 'Choose the Italian for: ' + card.en;
    if (card.kind === 'asks') {
      // Nonna asks (video-call bubble). English only on request; she answers in Italian.
      const nb = el('div', 'nonna-bubble');
      nb.append(el('span', 'nb-who', '👵 Nonna'));
      const q = el('p', 'nb-text', card.ask); q.lang = 'it';
      nb.appendChild(q);
      const mean = el('button', 'nb-mean', 'What does it mean?');
      mean.type = 'button';
      mean.setAttribute('aria-expanded', 'false');
      const en = el('span', 'nb-en', '= ' + card.askEn);
      en.hidden = true;
      mean.addEventListener('click', () => { en.hidden = !en.hidden; mean.setAttribute('aria-expanded', String(!en.hidden)); mean.textContent = en.hidden ? 'What does it mean?' : 'Hide meaning'; sound('tap'); });
      nb.append(mean, en);
      body.appendChild(nb);
      body.appendChild(el('p', 'en-label', 'Answer Nonna in Italian'));
      groupLabel = 'Choose your Italian answer to: ' + card.ask;
    } else if (card.kind === 'says') {
      // Nonna dice: what she wants (English) → pick the Italian she says. The bubble shows it big once found.
      const nb = el('div', 'nonna-bubble nb-reveal');
      nb.hidden = true;
      nb.append(el('span', 'nb-who', '👵 Nonna dice…'));
      const q = el('p', 'nb-text', card.captions[card.correct]); q.lang = 'it';
      nb.appendChild(q);
      body.appendChild(nb);
      body.appendChild(el('p', 'en-label', 'What does Nonna say in Italian?'));
      body.appendChild(el('p', 'en-line', card.en));
      groupLabel = 'Choose what Nonna says in Italian for: ' + card.en;
    } else if (card.type === 'lyricq') {
      const toIt = card.songLang === 'en';
      if (card.line) {
        const lq = el('div', 'lyric-q');
        const line = el('p', 'lq-line');
        line.lang = toIt ? 'en' : 'it';
        const parts = card.line.split('___');
        if (parts.length > 1) {
          line.append(document.createTextNode(parts[0]), el('span', 'lq-blank', '?'), document.createTextNode(parts[1]));
          line.setAttribute('aria-label', card.line.replace('___', 'blank'));
        } else if (card.hl && card.line.indexOf(card.hl) >= 0) {
          const k = card.line.indexOf(card.hl);
          line.append(document.createTextNode(card.line.slice(0, k)), el('mark', 'lq-hl', card.hl), document.createTextNode(card.line.slice(k + card.hl.length)));
        } else line.textContent = card.line;
        lq.appendChild(line);
        if (card.snip) {
          const rb = el('button', 'replay-btn', '🔁 Hear it again');
          rb.type = 'button';
          rb.setAttribute('aria-pressed', 'false');
          rb.setAttribute('aria-label', 'Hear this line again');
          rb.addEventListener('click', () => playSnippet(card));
          lq.appendChild(rb);
        }
        body.appendChild(lq);
      }
      body.appendChild(el('p', 'en-label', card.step === 'use' ? 'Say it in Italian' : toIt ? 'Find the Italian' : 'Listen & notice'));
      body.appendChild(el('p', 'en-line', card.en));
      groupLabel = card.en;
    } else {
      body.appendChild(el('p', 'en-label', 'Say it in Italian'));
      body.appendChild(el('p', 'en-line', card.en));
    }

    const row = el('div', 'caption-row');
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', groupLabel);
    card.captions.forEach((text, ci) => {
      const b = el('button', 'caption-btn', text);
      b.type = 'button';
      b.lang = card.answerLang === 'en' ? 'en' : 'it';
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
    fb.replaceChildren(document.createTextNode('✨ Brava!'), el('span', 'fb-sub', '🆕 ' + (card.type === 'lyricq' && card.step !== 'use' ? '' : 'New phrase: ') + card.note));
    const nb = art.querySelector('.nb-reveal');
    if (nb) nb.hidden = false;
  }
  // Small celebration on every correct pick (a quick sparkle burst from the answer).
  function sparkle(btn) {
    if (reduceMotion() || !btn) return;
    const app = $('app').getBoundingClientRect();
    const r = btn.getBoundingClientRect();
    const box = el('div', 'sparkles');
    box.style.left = (r.left - app.left + r.width / 2) + 'px';
    box.style.top = (r.top - app.top + r.height / 2) + 'px';
    const glyphs = ['✨', '⭐', '💖', '🎉', '✨', '💛', '⭐', '✨'];
    glyphs.forEach((g, k) => {
      const sp = el('i', null, g);
      const ang = (k / glyphs.length) * Math.PI * 2;
      sp.style.setProperty('--dx', Math.round(Math.cos(ang) * 70) + 'px');
      sp.style.setProperty('--dy', Math.round(Math.sin(ang) * 50 - 30) + 'px');
      box.appendChild(sp);
    });
    $('app').appendChild(box);
    setTimeout(() => box.remove(), 900);
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
      sparkle(btns[ci]);
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
    playVideoOn(i);
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
    $('topTitle').textContent = (isSongSet(state.session) ? '🎶 ' : '') + state.session.title + ' · ' + (state.index + 1) + '/' + n;
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
    if (!isSongSet(s)) saved.selected = s.id;
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
    stopClip(); hideBubble(); pauseVideos();
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
    const song = isSongSet(s);
    const list = song ? SONGS : DATA.sessions;
    const nextS = list[list.indexOf(s) + 1];
    let unlockedNow = false;
    if (!song && nextS && !saved.unlocked[nextS.id]) { saved.unlocked[nextS.id] = true; unlockedNow = true; saved.justUnlocked = nextS.id; }
    if (!song && nextS) saved.selected = nextS.id;
    persist();

    $('endTitle').textContent = song ? 'Brava, Arianna! 🎶' : 'Brava, Arianna! 🎉';
    $('endScore').textContent = score + ' of ' + n + ' on the first try!';
    const stars = score >= n ? 3 : score >= Math.ceil(n * 0.7) ? 2 : 1;
    $('endStars').textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    $('endBlurb').textContent = song ? (score >= n ? 'Perfetto! You learned “' + s.title + '”! 🎶' : 'You learned “' + s.title + '”! Sing it to Nonna 🎶')
      : score >= n ? 'Perfetto! Every single one. Ci vediamo presto! 💖'
      : 'All ' + n + ' questions done. Ci vediamo presto! 💖';
    $('unlockBox').hidden = !unlockedNow;
    if (unlockedNow) {
      const nq = nextS.cards.filter(isQ).length;
      $('unlockText').replaceChildren(el('strong', null, nextS.title + ' unlocked!'), el('br'), document.createTextNode(nq + ' new cards are waiting ' + nextS.emoji));
    }
    // Next step: next session / next song; after the last session, the songs.
    endNext = nextS ? () => startSession(nextS.id, !!saved.done[nextS.id]) : (!song && SONGS.length ? showSongs : null);
    $('btnNextSession').hidden = !endNext;
    $('btnNextSession').textContent = nextS ? (song ? 'Next song: ' + nextS.title + ' ▶' : 'Start ' + nextS.title + ' ▶') : '🎶 Try the Canzoni ▶';
    $('btnSongs').hidden = !song;
    $('btnReplay').className = endNext ? 'soft-btn' : 'primary-btn';
    $('btnReplay').textContent = '↺ Replay ' + (song ? 'this song' : s.title);
    showScreen($('screenEnd'));
    $('endTitle').focus({ preventScroll: true });
    sound('win');
    if (unlockedNow) sound('unlock');
    confetti();
  }

  let endNext = null;
  function confetti() {
    const box = $('confetti');
    box.replaceChildren();
    if (reduceMotion()) return;
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
    $('btnNextSession').addEventListener('click', () => { primeAudio(); if (endNext) endNext(); });
    $('btnSongs').addEventListener('click', showSongs);
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
