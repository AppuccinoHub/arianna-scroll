/* Italian with Arianna: Level 1 feed. Two sessions of 10 cards.
   Each card: id, type (dance|karaoke|vlog|photo), vibe, emoji, scene, en (what to say),
   captions[3] (Italian choices), correct (0-based), note (shown after a correct pick),
   nudge (gentle wrong-answer line), image (720x1280, 9:16),
   optional song (sticker label), yt (tap-to-play embed) or listen (link). */
window.ARIANNA_APP = {
  version: 1,
  shareUrl: "https://appuccinohub.github.io/arianna-scroll/",
  sessions: [
    {
      id: "s1", title: "Session 1", emoji: "🌸", blurb: "Ciao, piacere, per favore",
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
          id: "p07", type: "dance", emoji: "💙", vibe: "Dance · party",
          song: "Blue (Da Ba Dee) · Eiffel 65",
          scene: "Evening party, first dance. Say hi to the whole room.",
          en: "Good evening, everyone! I'm Arianna.",
          captions: ["Buonanotte a tutti! Sono Arianna.", "Buonasera a tutti! Sono Arianna.", "Buonasera a tutti! Sei Arianna."],
          correct: 1,
          note: "Buonasera a tutti = good evening, everyone",
          nudge: "Almost 🌙 the party's just starting, and it's YOU. Try again.",
          image: "images/c07-dance-finale.jpg",
          listen: { url: "https://www.youtube.com/watch?v=68ugkg9RePc", title: "Eiffel 65 - Blue (Da Ba Dee) [Gabry Ponte Ice Pop Mix] (Original Video with subtitles)", channel: "Bliss Corporation" }
        },
        {
          id: "s08", type: "vlog", emoji: "🍦", vibe: "Vlog · gelato run",
          scene: "At the gelato counter. Your turn to order!",
          en: "A gelato, please!",
          captions: ["Un gelato, per favore!", "Un gelato, prego!", "Un gelato, piacere!"],
          correct: 0,
          note: "Per favore = please",
          nudge: "Almost 🍦 you're asking for something, so say please. Try again.",
          image: "images/s08-vlog-gelato-order.jpg"
        },
        {
          id: "s09", type: "photo", emoji: "🎂", vibe: "Photo dump · birthday",
          scene: "Birthday pic with the cake. Caption it!",
          en: "I'm twelve years old!",
          captions: ["Sono dodici anni!", "Hai dodici anni!", "Ho dodici anni!"],
          correct: 2,
          note: "Ho dodici anni = I'm 12 (in Italian you HAVE your years)",
          nudge: "So close 🎂 in Italian you HAVE your age, and it's yours. Try again.",
          image: "images/s09-photo-birthday.jpg"
        },
        {
          id: "s10", type: "vlog", emoji: "👋", vibe: "Vlog · after school",
          scene: "School's out. Wave bye to your friends.",
          en: "Bye! See you tomorrow!",
          captions: ["Ciao! A domani!", "Ciao! Buongiorno!", "Piacere! A domani!"],
          correct: 0,
          note: "A domani = see you tomorrow",
          nudge: "Almost 👋 you're leaving, so it's a goodbye. Try again.",
          image: "images/s10-vlog-school-wave.jpg"
        }
      ]
    },
    {
      id: "s2", title: "Session 2", emoji: "🍋", blurb: "Mi piace, sono americana, mia nonna",
      cards: [
        {
          id: "t01", type: "dance", emoji: "💃", vibe: "Dance · in the park",
          scene: "Dancing in the park with your best friend.",
          en: "I like dancing!",
          captions: ["Ti piace ballare?", "Non mi piace ballare!", "Mi piace ballare!"],
          correct: 2,
          note: "Mi piace… = I like…",
          nudge: "Almost 💃 you DO like it, and it's about you. Try again.",
          image: "images/t01-dance-park.jpg"
        },
        {
          id: "t02", type: "dance", emoji: "🎉", vibe: "Dance · party hats",
          scene: "Party-hat dance with a new friend. Introduce yourself!",
          en: "Nice to meet you! My name is Arianna.",
          captions: ["Piacere! Mi chiamo Arianna.", "Prego! Mi chiamo Arianna.", "Piacere! Ti chiami Arianna."],
          correct: 0,
          note: "Piacere = nice to meet you · Mi chiamo… = my name is…",
          nudge: "Close 🎉 you're meeting her, and it's YOUR name. Try again.",
          image: "images/t02-dance-duet.jpg"
        },
        {
          id: "t03", type: "vlog", emoji: "🛶", vibe: "Vlog · Venice",
          scene: "Filming by the canal. Someone asks where you're from.",
          en: "I'm American!",
          captions: ["Sono americano!", "Sono americana!", "Sei americana!"],
          correct: 1,
          note: "Sono americana = I'm American (girls say americana)",
          nudge: "So close 🛶 it's about YOU, and girls end it with -a. Try again.",
          image: "images/t03-vlog-venice.jpg"
        },
        {
          id: "t04", type: "photo", emoji: "🍦", vibe: "Photo dump · gelato",
          scene: "Gelato selfie. Caption it!",
          en: "I like gelato!",
          captions: ["Ti piace il gelato?", "Mi piace il gelato!", "Non mi piace il gelato!"],
          correct: 1,
          note: "Mi piace il gelato = I like gelato",
          nudge: "Almost 🍦 you love it, and it's about you. Try again.",
          image: "images/t04-photo-gelato.jpg"
        },
        {
          id: "t05", type: "karaoke", emoji: "🎤", vibe: "Karaoke · duet",
          scene: "You pass the mic. Your friend says “Grazie!”",
          en: "You're welcome!",
          captions: ["Prego!", "Piacere!", "Per favore!"],
          correct: 0,
          note: "Prego = you're welcome",
          nudge: "Soft miss 🎤 she said thanks, so answer her. Try again.",
          image: "images/t05-karaoke-lesson.jpg"
        },
        {
          id: "t06", type: "photo", emoji: "👵", vibe: "Photo dump · Nonna",
          scene: "Cuddles with Nonna on the porch. Who's this?",
          en: "This is my grandma!",
          captions: ["Questo è mio nonno!", "Questa è tua nonna!", "Questa è mia nonna!"],
          correct: 2,
          note: "Questa è mia nonna = this is my grandma",
          nudge: "Almost 👵 it's YOUR grandma. Try again.",
          image: "images/t06-photo-nonna.jpg"
        },
        {
          id: "t07", type: "vlog", emoji: "💕", vibe: "Vlog · with Nonna",
          scene: "Vlogging with Nonna. Ask how she is.",
          en: "Hi, Nonna! How are you?",
          captions: ["Ciao, nonna! Come ti chiami?", "Ciao, nonna! Come stai?", "Arrivederci, nonna! Come stai?"],
          correct: 1,
          note: "Come stai? = how are you?",
          nudge: "Nice try 💕 you're saying hi and asking how she IS. Try again.",
          image: "images/t07-vlog-nonna.jpg"
        },
        {
          id: "t08", type: "photo", emoji: "🍨", vibe: "Photo dump · gelato break",
          scene: "Gelato with your friend. She offers you a taste.",
          en: "Yes, please!",
          captions: ["Sì, per favore!", "Sì, prego!", "No, grazie!"],
          correct: 0,
          note: "Sì, per favore = yes, please",
          nudge: "Almost 🍨 you want some, so ask nicely. Try again.",
          image: "images/t08-photo-gelato-friend.jpg"
        },
        {
          id: "t09", type: "photo", emoji: "🌙", vibe: "Photo dump · bedtime story",
          scene: "Story time with Nonna. Lights out!",
          en: "Good night, Nonna!",
          captions: ["Buongiorno, nonna!", "Buonasera, nonna!", "Buonanotte, nonna!"],
          correct: 2,
          note: "Buonanotte = good night (at bedtime)",
          nudge: "Almost 🌙 it's time to sleep. Try again.",
          image: "images/t09-photo-bedtime.jpg"
        },
        {
          id: "t10", type: "vlog", emoji: "🌅", vibe: "Vlog · beach sunset",
          scene: "Last clip of the day at the beach. Sign off!",
          en: "Bye, everyone! See you tomorrow!",
          captions: ["Ciao a tutti! A domani!", "Buongiorno a tutti! A domani!", "Ciao a tutti! Piacere!"],
          correct: 0,
          note: "Ciao a tutti = bye, everyone · A domani = see you tomorrow",
          nudge: "Almost 🌅 you're saying bye until tomorrow. Try again.",
          image: "images/t10-vlog-beach-sunset.jpg"
        }
      ]
    }
  ]
};
