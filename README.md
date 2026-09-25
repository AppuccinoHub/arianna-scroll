# Italian with Arianna (Arianna Scroll)

A TikTok-style Italian Level 1 practice app for **Arianna**, built for her phone. Read the English line, tap the Italian that says it, swipe up for the next card.

**Live:** https://appuccinohub.github.io/arianna-scroll/

## What's where

| Path | What |
|---|---|
| `/` | The app: start screen, 2 sessions × 10 cards, end screen with confetti + share |
| `/classic/` | The original first version (kept working) |
| `/preview/` | Redirects to `/` (kept so old shared links still show the link card) |

## Editing cards

All content lives in `data.js` (`window.ARIANNA_APP.sessions[].cards[]`). Each card:

- `id`, `type` (`dance` | `karaoke` | `vlog` | `photo`), `emoji`, `vibe`, `scene`
- `en` (the English line), `captions` (3 Italian choices), `correct` (0-based index)
- `note` (shown after a correct pick), `nudge` (gentle wrong-answer line)
- `image` (720×1280, 9:16, under `images/`; credits in `images/CREDITS.md`)
- optional `song` (sticker label), `yt` (tap-to-play embed) or `listen` (YouTube link)

When you publish changes, bump the `?v=` numbers in `index.html` **and** `VERSION` + the `CORE` list in `sw.js`.

## Behaviour notes

- Correct pick → "Brava!" + new-phrase note → auto-advance after 1.2 s (skipped if she already swiped/pressed ↓, cancelled on Home/restart). On the Mamma Maria card there is no auto-advance once the song has started ("Enjoy the song, tap ↓ when you're ready").
- Progress, unlocks, best scores and mute are saved in `localStorage` under `ariannaScroll.app.v1`. Session 2 unlocks when Session 1 is finished.
- Sound is on by default (small WebAudio chimes); mute toggle top-right.
- PWA: `manifest.webmanifest`, `sw.js` (versioned cache, network-first HTML), Add to Home Screen meta for iPhone.

## Stack

Static HTML / CSS / JS on GitHub Pages from `main`.
