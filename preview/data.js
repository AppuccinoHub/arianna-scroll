/* Arianna Scroll — PREVIEW batch (tonight's 7 cards, one feed).
   Each card: id, type (dance|karaoke|vlog), vibe, emoji, song (sticker label), en, captions[], correct (0-based),
   note (shown after a correct pick), nudge (soft wrong-answer line), image, yt (tap-to-play embed id) or listen (link). */
window.ARIANNA_PREVIEW = {
  version: 1,
  defaultName: "Arianna",
  cards: [
    {
      id: "p01", type: "dance", emoji: "💃", vibe: "Dance · intro video",
      scene: "Your intro video. Big smile, first beat.",
      en: "Hi! My name is Arianna.",
      captions: ["Ciao! Ti chiami Arianna.", "Ciao! Mi chiamo Arianna.", "Arrivederci! Mi chiamo Arianna."],
      correct: 1,
      note: "Mi chiamo… = my name is…",
      nudge: "So close 💛 it's about YOUR name. Try again.",
      image: "images/c01-dance-intro.jpg"
    },
    {
      id: "p02", type: "karaoke", emoji: "🎤", vibe: "Karaoke · with Nonna",
      song: "Mamma Maria · Ricchi e Poveri",
      scene: "Singing along with Nonna. Say good morning first!",
      en: "Good morning, Nonna!",
      captions: ["Buongiorno, nonna!", "Buonanotte, nonna!", "Arrivederci, nonna!"],
      correct: 0,
      note: "Buongiorno = good morning",
      nudge: "Almost ☀️ it's morning, not bedtime. Try again.",
      image: "images/c02-karaoke-nonna.jpg",
      yt: { id: "-QJ_hXoE6q8", title: "Mamma Maria", channel: "Ricchi E Poveri - Topic (official audio)" }
    },
    {
      id: "p03", type: "vlog", emoji: "📹", vibe: "Vlog · in the piazza",
      scene: "Filming in the piazza. Flip the camera on your cousin.",
      en: "How are you?",
      captions: ["Come ti chiami?", "Dove sei?", "Come stai?"],
      correct: 2,
      note: "Come stai? = how are you?",
      nudge: "Nice try 💛 you're asking how she IS. One more go.",
      image: "images/c03-vlog-piazza.jpg"
    },
    {
      id: "p04", type: "dance", emoji: "👯", vibe: "Dance · duet",
      scene: "Duet with a new friend. First time meeting!",
      en: "Nice to meet you!",
      captions: ["Prego!", "Piacere!", "Per favore!"],
      correct: 1,
      note: "Piacere = nice to meet you",
      nudge: "Soft miss 🍋 that one's for manners. Try again.",
      image: "images/c04-dance-duet.jpg"
    },
    {
      id: "p05", type: "karaoke", emoji: "🎤", vibe: "Karaoke · mic check",
      song: "Tu vuò fà l'americano · Renato Carosone",
      scene: "Mic in hand. Someone asks how you are.",
      en: "I'm good, thanks!",
      captions: ["Male, grazie!", "Bene, prego!", "Bene, grazie!"],
      correct: 2,
      note: "Bene, grazie = good, thanks",
      nudge: "Almost 💛 you're GOOD, and you say thanks. Try again.",
      image: "images/c05-karaoke-mic.jpg",
      listen: { url: "https://www.youtube.com/watch?v=ARRKNB07Ixc", title: "Tu vuo' fa' l'americano (2007 Remastered)", channel: "Renato Carosone - Topic" }
    },
    {
      id: "p06", type: "dance", emoji: "💃", vibe: "Dance · trend",
      song: "Malàtia · Ciccio Merolla",
      scene: "The Neapolitan hit is on. Caption your dance.",
      en: "Hi, I'm Arianna, and I'm dancing!",
      captions: ["Ciao, sono Arianna e ballo!", "Ciao, sei Arianna e balli!", "Arrivederci, sono Arianna e ballo!"],
      correct: 0,
      note: "Sono = I am · Ballo = I dance",
      nudge: "Close 💛 it's about you, and you're saying hi. Try again.",
      image: "images/c06-dance-malatia.jpg"
    },
    {
      id: "p07", type: "dance", emoji: "💙", vibe: "Dance · finale",
      song: "Blue (Da Ba Dee) · Eiffel 65",
      scene: "Evening party, last dance. Say hi to the whole room.",
      en: "Good evening, everyone! I'm Arianna.",
      captions: ["Buonanotte a tutti! Sono Arianna.", "Buonasera a tutti! Sono Arianna.", "Buonasera a tutti! Sei Arianna."],
      correct: 1,
      note: "Buonasera a tutti = good evening, everyone",
      nudge: "Almost 🌙 the party's just starting, and it's YOU. Try again.",
      image: "images/c07-dance-finale.jpg",
      listen: { url: "https://www.youtube.com/watch?v=68ugkg9RePc", title: "Eiffel 65 - Blue (Da Ba Dee) [Gabry Ponte Ice Pop Mix] (Original Video with subtitles)", channel: "Bliss Corporation" }
    }
  ]
};
