(() => {
  'use strict';

  const DATA = window.ARIANNA_SCROLL;
  if (!DATA) {
    console.error('Arianna Scroll: data.js missing');
    return;
  }

  const UNLOCK_EVERY = DATA.unlockEvery || 13;
  const DEFAULT_NAME = DATA.defaultName || 'Arianna';

  const STORAGE = {
    progress: 'ariannaScroll.progress.v1',
    mute: 'ariannaScroll.muted',
    nick: 'ariannaScroll.nickname',
  };

  const $ = (id) => document.getElementById(id);

  const state = {
    nick: localStorage.getItem(STORAGE.nick) || DEFAULT_NAME,
    // Sound ON by default (personal device)
    muted: localStorage.getItem(STORAGE.mute) === '1',
    unlockedChunk: 1,
    clearsTowardUnlock: 0,
    cards: [],
    index: 0,
    firstTryCorrect: 0,
    attempted: {},
    answeredOk: {},
    tipOpen: {},
  };

  let audioCtx = null;

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE.progress);
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p.unlockedChunk === 1 || p.unlockedChunk === 2) state.unlockedChunk = p.unlockedChunk;
      if (typeof p.clearsTowardUnlock === 'number') state.clearsTowardUnlock = p.clearsTowardUnlock;
    } catch (_) {}
  }

  function saveProgress() {
    localStorage.setItem(
      STORAGE.progress,
      JSON.stringify({
        unlockedChunk: state.unlockedChunk,
        clearsTowardUnlock: state.clearsTowardUnlock,
      })
    );
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showScreen(el) {
    document.querySelectorAll('.screen').forEach((s) => {
      const on = s === el;
      s.classList.toggle('active', on);
      if (on) s.removeAttribute('hidden');
      else s.setAttribute('hidden', '');
    });
    const home = $('btnHome');
    if (home) home.hidden = el === $('screenHome') || el === $('screenNick');
    const phone = $('phone');
    if (phone) phone.classList.toggle('play-mode', el === $('screenPlay'));
  }

  function beep(ok) {
    if (state.muted) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g);
      g.connect(audioCtx.destination);
      o.type = 'sine';
      o.frequency.value = ok ? 720 : 300;
      g.gain.value = 0.045;
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.16);
      o.stop(audioCtx.currentTime + 0.18);
    } catch (_) {}
  }

  function updateMuteUI() {
    if (!$('btnMute')) return;
    $('btnMute').textContent = state.muted ? '🔇' : '🔊';
    $('btnMute').setAttribute('aria-label', state.muted ? 'Unmute sound' : 'Mute sound');
  }

  function refreshHome() {
    const hello = $('homeHello');
    if (hello) hello.textContent = 'Ciao, ' + state.nick + ' 💛';
    const soft = $('homeSoft');
    if (soft) {
      soft.textContent =
        state.unlockedChunk >= 2
          ? 'More phrases unlocked · keep scrolling'
          : '~8–10 min · dance + photo dumps';
    }
    if ($('headerSubtitle')) $('headerSubtitle').textContent = state.nick + ' · For You';
  }

  function showHome() {
    refreshHome();
    showScreen($('screenHome'));
  }

  function showNick() {
    showScreen($('screenNick'));
    const input = $('nickInput');
    if (input) {
      input.value = state.nick === DEFAULT_NAME ? DEFAULT_NAME : state.nick;
      setTimeout(() => {
        input.focus();
        input.select();
      }, 40);
    }
  }

  function commitNick() {
    const input = $('nickInput');
    const name = ((input && input.value) || '').trim().slice(0, 24) || DEFAULT_NAME;
    state.nick = name;
    localStorage.setItem(STORAGE.nick, name);
    showHome();
  }

  function sessionCards() {
    // Chunk 1 always; chunk 2 once silently unlocked (or if already unlocked)
    const all = DATA.cards || [];
    const c1 = all.filter((c) => c.chunk === 1);
    const c2 = all.filter((c) => c.chunk === 2);
    if (state.unlockedChunk >= 2) return c1.concat(c2);
    // First session: mostly chunk 1, tease a couple chunk-2 after unlock mid-session via live unlock
    return c1.concat(c2);
  }

  function beginPlay() {
    state.cards = sessionCards();
    state.index = 0;
    state.firstTryCorrect = 0;
    state.attempted = {};
    state.answeredOk = {};
    state.tipOpen = {};
    if ($('headerSubtitle')) $('headerSubtitle').textContent = state.nick + ' · scrolling';
    showScreen($('screenPlay'));
    renderFeed();
    updateNav();
    requestAnimationFrame(() => scrollToIndex(0, false));
  }

  function visibleCards() {
    // Soft gate: before unlock, only show chunk 1 (+ keep answering)
    if (state.unlockedChunk >= 2) return state.cards;
    return state.cards.filter((c) => c.chunk === 1);
  }

  function renderFeed() {
    const feed = $('feed');
    feed.innerHTML = '';
    const list = visibleCards();
    state._visible = list;
    list.forEach((card, i) => feed.appendChild(buildCardEl(card, i)));
  }

  function buildCardEl(card, i) {
    const art = document.createElement('article');
    art.className = 'feed-card';
    art.dataset.index = String(i);
    art.dataset.id = card.id;

    const visual = document.createElement('div');
    visual.className = 'card-visual';
    visual.innerHTML = '<div class="glow"></div><div class="card-shade"></div>';

    if (card.image) {
      const img = document.createElement('img');
      img.className = 'card-photo';
      img.alt = '';
      img.decoding = 'async';
      img.loading = i < 2 ? 'eager' : 'lazy';
      img.src = card.image + '?v=1';
      img.addEventListener('error', () => {
        img.hidden = true;
      });
      visual.insertBefore(img, visual.querySelector('.card-shade'));
    }

    const body = document.createElement('div');
    body.className = 'card-body';
    body.innerHTML =
      '<div class="vibe-row"><span class="vibe-tag">' +
      escapeHtml(card.emoji || '✨') +
      ' ' +
      escapeHtml(card.vibe || '') +
      '</span></div><p class="culture">' +
      escapeHtml(card.culture || '') +
      '</p>';

    const row = document.createElement('div');
    row.className = 'caption-row';
    row.setAttribute('role', 'group');
    row.setAttribute('aria-label', 'Choose the line');
    (card.captions || []).forEach((text, ci) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'caption-btn';
      b.textContent = text;
      b.dataset.idx = String(ci);
      b.addEventListener('click', () => onCaption(card, ci, art));
      row.appendChild(b);
    });

    const fb = document.createElement('div');
    fb.className = 'feedback';
    fb.hidden = true;
    fb.setAttribute('role', 'status');
    fb.setAttribute('aria-live', 'polite');

    const tipBtn = document.createElement('button');
    tipBtn.type = 'button';
    tipBtn.className = 'tip-btn-inline';
    tipBtn.textContent = 'Tip';
    tipBtn.hidden = !card.tip;
    const tipPanel = document.createElement('div');
    tipPanel.className = 'tip-panel';
    tipPanel.hidden = true;
    tipBtn.addEventListener('click', () => {
      const open = tipPanel.hidden;
      tipPanel.hidden = !open;
      if (open) tipPanel.textContent = card.tip || '';
    });

    art.appendChild(visual);
    art.appendChild(body);
    art.appendChild(row);
    art.appendChild(fb);
    art.appendChild(tipBtn);
    art.appendChild(tipPanel);

    if (state.answeredOk[card.id]) {
      lockCorrect(art, card);
    }

    return art;
  }

  function lockCorrect(art, card) {
    art.querySelectorAll('.caption-btn').forEach((b, i) => {
      b.disabled = true;
      if (i === card.correct) b.classList.add('correct-flash');
    });
    const fb = art.querySelector('.feedback');
    if (fb) {
      fb.hidden = false;
      fb.className = 'feedback ok';
      fb.textContent = '✨ ' + (card.captions[card.correct] || 'Brava!');
    }
  }

  function onCaption(card, ci, art) {
    if (state.answeredOk[card.id]) return;
    const btns = art.querySelectorAll('.caption-btn');
    const fb = art.querySelector('.feedback');
    const firstTry = !state.attempted[card.id];
    state.attempted[card.id] = true;

    if (ci === card.correct) {
      if (firstTry) state.firstTryCorrect += 1;
      state.answeredOk[card.id] = true;
      btns.forEach((b, i) => {
        b.disabled = true;
        b.classList.remove('wrong-flash');
        if (i === card.correct) b.classList.add('correct-flash');
      });
      fb.hidden = false;
      fb.className = 'feedback ok';
      fb.textContent = '✨ Nice — ' + card.captions[card.correct];
      beep(true);
      onClear();
      updateNav();
      // Auto-advance softly
      setTimeout(() => {
        const list = state._visible || visibleCards();
        const idx = list.findIndex((c) => c.id === card.id);
        if (idx >= 0 && idx < list.length - 1) {
          scrollToIndex(idx + 1, true);
        } else if (idx === list.length - 1) {
          // If chunk 2 just unlocked mid-feed, re-render to append
          if (state.unlockedChunk >= 2 && list.length < state.cards.length) {
            const prevId = card.id;
            renderFeed();
            const anew = state._visible || [];
            const ni = anew.findIndex((c) => c.id === prevId);
            scrollToIndex(Math.min(ni + 1, anew.length - 1), true);
          } else {
            finishSession();
          }
        }
      }, 650);
    } else {
      // Friendly nudge — stay until right
      btns.forEach((b) => b.classList.remove('wrong-flash'));
      if (btns[ci]) {
        btns[ci].classList.add('wrong-flash');
        setTimeout(() => btns[ci].classList.remove('wrong-flash'), 450);
      }
      fb.hidden = false;
      fb.className = 'feedback soft';
      fb.textContent = card.nudge || 'Almost — try another 💛';
      beep(false);
    }
  }

  function onClear() {
    state.clearsTowardUnlock += 1;
    if (state.unlockedChunk < 2 && state.clearsTowardUnlock >= UNLOCK_EVERY) {
      state.unlockedChunk = 2;
      // Silent unlock — no flashy counter; soft toast optional
      flashTip('New vibes unlocked · keep scrolling ✨', 2200);
    }
    saveProgress();
  }

  function finishSession() {
    const title = $('endTitle');
    const blurb = $('endBlurb');
    if (title) title.textContent = 'Brava, ' + state.nick + '!';
    if (blurb) {
      blurb.textContent =
        state.firstTryCorrect > 0
          ? 'You locked ' +
            state.firstTryCorrect +
            ' on the first try. Dance world + Italian — same scroll.'
          : 'You scrolled your world — Italian came along for the ride.';
    }
    showScreen($('screenEnd'));
  }

  function updateNav() {
    const list = state._visible || visibleCards();
    if ($('feedPos')) $('feedPos').textContent = state.index + 1 + ' / ' + list.length;
    if ($('btnPrev')) $('btnPrev').disabled = state.index <= 0;
    if ($('btnNext')) $('btnNext').disabled = state.index >= list.length - 1;
  }

  function scrollToIndex(i, smooth) {
    const feed = $('feed');
    const list = state._visible || visibleCards();
    state.index = Math.max(0, Math.min(i, list.length - 1));
    const el = feed.children[state.index];
    if (el) el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
    updateNav();
  }

  function onFeedScroll() {
    const feed = $('feed');
    const cards = feed.querySelectorAll('.feed-card');
    if (!cards.length) return;
    const top = feed.scrollTop;
    let best = 0;
    let bestDist = Infinity;
    cards.forEach((c, i) => {
      const d = Math.abs(c.offsetTop - top);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    if (best !== state.index) {
      state.index = best;
      updateNav();
    }
  }

  function flashTip(text, ms) {
    const t = $('tipToast');
    if (!t) return;
    t.textContent = text;
    t.hidden = false;
    clearTimeout(flashTip._timer);
    flashTip._timer = setTimeout(() => {
      t.hidden = true;
    }, ms || 2800);
  }

  // Wire UI
  function init() {
    loadProgress();
    updateMuteUI();
    refreshHome();
    showHome();

    $('btnStart').addEventListener('click', () => {
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      beginPlay();
    });
    $('btnNick').addEventListener('click', showNick);
    $('btnNickGo').addEventListener('click', commitNick);
    $('nickInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') commitNick();
    });
    $('btnHome').addEventListener('click', showHome);
    $('btnAgain').addEventListener('click', beginPlay);
    $('btnEndHome').addEventListener('click', showHome);

    $('btnMute').addEventListener('click', () => {
      state.muted = !state.muted;
      localStorage.setItem(STORAGE.mute, state.muted ? '1' : '0');
      updateMuteUI();
      if (!state.muted) beep(true);
    });

    $('btnTip').addEventListener('click', () => {
      flashTip(
        'Scroll like TikTok. Tap the Italian that matches the vibe. Wrong? Soft nudge — stay until it clicks.',
        3200
      );
    });

    $('btnPrev').addEventListener('click', () => scrollToIndex(state.index - 1, true));
    $('btnNext').addEventListener('click', () => {
      const list = state._visible || visibleCards();
      if (state.index >= list.length - 1) {
        const allDone = list.every((c) => state.answeredOk[c.id]);
        if (allDone) finishSession();
        else flashTip('Finish this one first 💛', 1600);
        return;
      }
      scrollToIndex(state.index + 1, true);
    });

    $('feed').addEventListener('scroll', onFeedScroll, { passive: true });

    // Keyboard for Chromebook
    document.addEventListener('keydown', (e) => {
      if (!$('screenPlay').classList.contains('active')) return;
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        scrollToIndex(state.index + 1, true);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        scrollToIndex(state.index - 1, true);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
