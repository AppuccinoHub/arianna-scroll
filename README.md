# Arianna Scroll

Personal Italian scroll for **Arianna** — TikTok-style vertical feed of dance moments, photo dumps, and Italy stills. She picks the line that fits; Italian locks in. Not a textbook.

**Live:** https://appuccinohub.github.io/arianna-scroll/

## Add or swap phrases

Edit `data.js` — the `cards` array at the top of the file has a comment block with the full recipe.

Each card:

- `id`, `chunk` (1 = greetings, 2 = likes / Italy / friends)
- `vibe`, `culture`, `emoji`, `image`
- `captions` (array), `correct` (0-based index)
- `tip`, `nudge` (friendly wrong-answer line)

Put new stills in `images/`. Bump `?v=` on the script/link tags in `index.html` when you publish content changes.

## Stack

Static HTML / CSS / JS. GitHub Pages from `main` (root). Progress in `localStorage` under keys prefixed `ariannaScroll.*`.
