/* ============================================================
   Arianna Scroll — PHRASE / CARD DATA
   To add or swap phrases later:
     1. Edit the `cards` array below (or add new objects).
     2. Each card needs: id, vibe, culture, image, captions[], correct (0-based index),
        tip (optional soft hint), nudge (friendly wrong-answer line), chunk (1 or 2).
     3. Keep images under images/ and point `image` at the path.
     4. Bump ?v= on script tags in index.html when you publish a content change.
   No grammar labels. Keep it her world: dance, friends, Italy.
   ============================================================ */
window.ARIANNA_SCROLL = {
  version: 1,
  unlockEvery: 10,
  defaultName: "Arianna",
  cards: [
    /* ---- Chunk 1: greetings she half-knows ---- */
    {
      id: "a01",
      chunk: 1,
      vibe: "Morning · mirror",
      emoji: "☀️",
      culture: "First clip of the day. Wave at the camera.",
      image: "images/morning-1.jpg",
      captions: ["Ciao!", "Buonanotte", "Arrivederci"],
      correct: 0,
      tip: "Quick hello — the one you already say.",
      nudge: "Almost — try the sunny hello ☀️"
    },
    {
      id: "a02",
      chunk: 1,
      vibe: "Dance · take 1",
      emoji: "💃",
      culture: "Lights up. You hit the first beat.",
      image: "images/dance-1.jpg",
      captions: ["A dopo", "Buongiorno!", "Scusa"],
      correct: 1,
      tip: "Morning energy — good day.",
      nudge: "Soft miss — think “good morning” 🍋"
    },
    {
      id: "a03",
      chunk: 1,
      vibe: "Golden hour",
      emoji: "🌅",
      culture: "Sunset dump with friends. Soft light.",
      image: "images/dance-3.jpg",
      captions: ["Buonasera", "Buongiorno", "A domani"],
      correct: 0,
      tip: "Evening vibe — good evening.",
      nudge: "Not that one — evening hello ✨"
    },
    {
      id: "a04",
      chunk: 1,
      vibe: "Intro sticker",
      emoji: "✨",
      culture: "On-screen text for your new dance page.",
      image: "images/dance-4.jpg",
      captions: ["Mi chiamo Arianna", "Come stai?", "A presto"],
      correct: 0,
      tip: "Your name, locked in.",
      nudge: "Say who you are — Mi chiamo…"
    },
    {
      id: "a05",
      chunk: 1,
      vibe: "New friend",
      emoji: "🤝",
      culture: "Someone cute in comments. First meet energy.",
      image: "images/friends-1.jpg",
      captions: ["Non lo so", "Piacere!", "Forse"],
      correct: 1,
      tip: "Nice to meet you.",
      nudge: "Warm meet-cute line — Piacere 💛"
    },
    {
      id: "a06",
      chunk: 1,
      vibe: "Duet ask",
      emoji: "📲",
      culture: "Friend duets you mid-song.",
      image: "images/friends-2.jpg",
      captions: ["Come stai?", "Dove sei?", "Che ore sono?"],
      correct: 0,
      tip: "How are you?",
      nudge: "Check in on them — Come stai?"
    },
    {
      id: "a07",
      chunk: 1,
      vibe: "Reply energy",
      emoji: "💬",
      culture: "They asked how you are. You’re glowing.",
      image: "images/dance-2.jpg",
      captions: ["Male…", "Bene, grazie!", "Boh"],
      correct: 1,
      tip: "Good, thanks!",
      nudge: "Happy reply — Bene, grazie!"
    },
    {
      id: "a08",
      chunk: 1,
      vibe: "Pass it back",
      emoji: "🔄",
      culture: "Flip the question — keep the chat going.",
      image: "images/friends-3.jpg",
      captions: ["E tu?", "Io no", "Basta"],
      correct: 0,
      tip: "And you?",
      nudge: "Bounce it back — E tu?"
    },
    {
      id: "a09",
      chunk: 1,
      vibe: "Story reply",
      emoji: "📸",
      culture: "Someone left a voice note. Quick tap-back.",
      image: "images/music-1.jpg",
      captions: ["Ciao, come stai?", "Domani sera", "Non oggi"],
      correct: 0,
      tip: "Hello + how are you — combo you know.",
      nudge: "Hello + check-in — you got this"
    },
    {
      id: "a10",
      chunk: 1,
      vibe: "Night post",
      emoji: "🌙",
      culture: "Last story before bed. Soft bye for now.",
      image: "images/italy-3.jpg",
      captions: ["Buonasera!", "Buongiorno!", "Pranzo"],
      correct: 0,
      tip: "Evening again — lock it in.",
      nudge: "It’s night — Buonasera"
    },
    {
      id: "a11",
      chunk: 1,
      vibe: "Name drop",
      emoji: "🏷️",
      culture: "Bio line under your dance page.",
      image: "images/dance-1.jpg",
      captions: ["Mi chiamo Arianna · piacere", "Non mi piace", "Sono stanca"],
      correct: 0,
      tip: "Name + nice to meet you.",
      nudge: "Name + piacere — your signature"
    },
    {
      id: "a12",
      chunk: 1,
      vibe: "Morning again",
      emoji: "🍋",
      culture: "Same song, new morning take.",
      image: "images/morning-1.jpg",
      captions: ["Arrivederci", "Buongiorno, amici!", "Aletto"],
      correct: 1,
      tip: "Good morning, friends.",
      nudge: "Sun’s up — Buongiorno"
    },

    /* ---- Chunk 2: likes / Italy / friends (unlocks silently) ---- */
    {
      id: "a13",
      chunk: 2,
      vibe: "Trend audio",
      emoji: "🎵",
      culture: "You’re on the sound again. Truth in the caption.",
      image: "images/music-1.jpg",
      captions: ["Mi piace ballare", "Non ballo mai", "Odio la musica"],
      correct: 0,
      tip: "I like to dance.",
      nudge: "You love this — Mi piace ballare 💃"
    },
    {
      id: "a14",
      chunk: 2,
      vibe: "Playlist dump",
      emoji: "🎧",
      culture: "Photo dump: headphones + soft room light.",
      image: "images/dance-4.jpg",
      captions: ["Amo la musica", "Non ascolto", "Silenzio totale"],
      correct: 0,
      tip: "I love music.",
      nudge: "Music girl energy — Amo la musica"
    },
    {
      id: "a15",
      chunk: 2,
      vibe: "Italy days",
      emoji: "🇮🇹",
      culture: "Coast still from the trip. You miss it already.",
      image: "images/italy-1.jpg",
      captions: ["Adoro l’Italia", "Odio l’Italia", "Non so"],
      correct: 0,
      tip: "I adore Italy.",
      nudge: "Heart eyes for Italy — Adoro l’Italia"
    },
    {
      id: "a16",
      chunk: 2,
      vibe: "Right now",
      emoji: "📍",
      culture: "Story: you’re there for the summer stretch.",
      image: "images/italy-5.jpg",
      captions: ["Sono a casa", "Sono in Italia", "Sono a scuola"],
      correct: 1,
      tip: "I’m in Italy.",
      nudge: "Where are you? — Sono in Italia"
    },
    {
      id: "a17",
      chunk: 2,
      vibe: "Bestie frame",
      emoji: "👯",
      culture: "Tag her in the dump. She’s in half your clips.",
      image: "images/friends-1.jpg",
      captions: ["Questa è la mia amica", "Questo è un cane", "Quella è la scuola"],
      correct: 0,
      tip: "This is my friend.",
      nudge: "Point to her — Questa è la mia amica"
    },
    {
      id: "a18",
      chunk: 2,
      vibe: "Watch this",
      emoji: "▶️",
      culture: "Sending the 30s dance to the group chat.",
      image: "images/dance-2.jpg",
      captions: ["Guarda questo video", "Chiudi gli occhi", "Non guardare"],
      correct: 0,
      tip: "Watch this video.",
      nudge: "Share the clip — Guarda questo video"
    },
    {
      id: "a19",
      chunk: 2,
      vibe: "Gelato stop",
      emoji: "🍦",
      culture: "Piazza still. Sticky fingers. Worth it.",
      image: "images/italy-2.jpg",
      captions: ["Che bello!", "Che brutto!", "Che noia!"],
      correct: 0,
      tip: "How beautiful!",
      nudge: "Happy reaction — Che bello!"
    },
    {
      id: "a20",
      chunk: 2,
      vibe: "Suitcase mode",
      emoji: "✈️",
      culture: "Leaving for the Italy stretch. Stickers on the bag.",
      image: "images/trip-1.jpg",
      captions: ["Vado in Italia", "Resto a casa", "Niente viaggio"],
      correct: 0,
      tip: "I’m going to Italy.",
      nudge: "Trip energy — Vado in Italia"
    },
    {
      id: "a21",
      chunk: 2,
      vibe: "Dome day",
      emoji: "🏛️",
      culture: "Big landmark in frame. Tourist? Maybe. Happy? Yes.",
      image: "images/italy-4.jpg",
      captions: ["Adoro questo posto", "Odio questo posto", "Non mi interessa"],
      correct: 0,
      tip: "I love this place.",
      nudge: "Love the spot — Adoro questo posto"
    },
    {
      id: "a22",
      chunk: 2,
      vibe: "Dance truth",
      emoji: "💫",
      culture: "Caption under the trend. Keep it honest.",
      image: "images/dance-3.jpg",
      captions: ["Mi piace ballare ogni giorno", "Non ballo mai", "Solo dormo"],
      correct: 0,
      tip: "I like dancing every day.",
      nudge: "Daily dance — Mi piace ballare…"
    },
    {
      id: "a23",
      chunk: 2,
      vibe: "Friend + Italy",
      emoji: "💛",
      culture: "Her + you + the coast. Dump photo of the year.",
      image: "images/friends-2.jpg",
      captions: ["Siamo in Italia!", "Siamo a scuola", "Siamo stanchi… solo"],
      correct: 0,
      tip: "We are in Italy!",
      nudge: "Together there — Siamo in Italia"
    },
    {
      id: "a24",
      chunk: 2,
      vibe: "Night lights",
      emoji: "✨",
      culture: "City glow. Last story of the trip night.",
      image: "images/italy-3.jpg",
      captions: ["Che bella sera!", "Che brutta sera!", "Non è sera"],
      correct: 0,
      tip: "What a beautiful evening!",
      nudge: "Evening glow — Che bella sera"
    },
    {
      id: "a25",
      chunk: 2,
      vibe: "Sign-off",
      emoji: "👋",
      culture: "End of the dump. Wave to camera.",
      image: "images/friends-3.jpg",
      captions: ["Ciao, a presto!", "Mai più", "Silenzio"],
      correct: 0,
      tip: "Bye — see you soon.",
      nudge: "Warm bye — Ciao, a presto"
    },
    {
      id: "a26",
      chunk: 2,
      vibe: "Encore",
      emoji: "🔁",
      culture: "One more take. Same song. Bigger smile.",
      image: "images/dance-1.jpg",
      captions: ["Ancora! Mi piace ballare", "Basta così", "Non di nuovo"],
      correct: 0,
      tip: "Again! I like to dance.",
      nudge: "Encore energy — Ancora!"
    }
  ]
};
