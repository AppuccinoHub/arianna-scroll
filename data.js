/* Italian with Arianna: Level 1 feed. Sessions 1-4 unlock in order; Canzoni (songs) are open from the start.
   Question card: id, type (dance|karaoke|vlog|photo), vibe, emoji, scene, en (what to say),
   captions[3] (Italian choices), correct (0-based), note (shown after a correct pick),
   nudge (gentle wrong-answer line), image (720x1280, 9:16), optional video (muted 9:16 loop; image = poster),
   optional song (sticker label), optional clip (30 s Apple Music preview, tap to play) and lyrics.
   kind "asks": Nonna asks (ask + askEn); she picks the Italian answer. kind "says": she picks the Italian Nonna uses.
   type "lyricq": song question (see quiz() below). Song card: type "song", title, artist, clip (auto-plays), lyrics.
   Lyric line: t = seconds into the preview (or a list of times when the line repeats). */

/* Official 30-second previews from the Apple iTunes Search API. Streamed, never re-hosted. */
const CLIPS = {
  mammaMaria: {
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/17/0e/45/170e451d-1c23-0c2c-3cba-b0e9fd463334/mzaf_3263007319808945670.plus.aac.p.m4a",
    trackViewUrl: "https://music.apple.com/us/album/mamma-maria/1717851044?i=1717851045&uo=4",
    track: "Mamma Maria", artist: "Ricchi e Poveri", label: "Mamma Maria"
  },
  carosone: {
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/fc/bb/4a/fcbb4a83-e480-cd9c-7fbc-b69f1c9d497f/mzaf_3997446673501789321.plus.aac.p.m4a",
    trackViewUrl: "https://music.apple.com/us/album/tu-vuo-fa-lamericano/253148071?i=253148072&uo=4",
    track: "Tu vuò fà l'americano", artist: "Renato Carosone", label: "Tu vuò fà l'americano"
  },
  blue: {
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/5c/2a/4f/5c2a4f09-ac01-be90-d6b2-a0b94bd82b7e/mzaf_3916619128344794117.plus.aac.p.m4a",
    trackViewUrl: "https://music.apple.com/us/album/blue-da-ba-dee-gabry-ponte-video-edit/257424513?i=257425447&uo=4",
    track: "Blue (Da Ba Dee)", artist: "Eiffel 65", label: "Blue (Da Ba Dee)"
  },
  saraPerche: {
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/7b/2f/cb/7b2fcb1b-0288-c551-7330-c676d186e06c/mzaf_6433311904750505108.plus.aac.p.m4a",
    trackViewUrl: "https://music.apple.com/us/album/sar%C3%A0-perch%C3%A9-ti-amo/1722506113?i=1722506116&uo=4",
    track: "Sarà perché ti amo", artist: "Ricchi e Poveri", label: "Sarà perché ti amo"
  },
  pedro: {
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/50/6b/de/506bdef4-5995-6bec-9ea8-5e6b24c95da5/mzaf_3997043884043443495.plus.aac.p.m4a",
    trackViewUrl: "https://music.apple.com/us/album/pedro/1736775759?i=1736776071&uo=4",
    track: "Pedro", artist: "Jaxomy, Agatino Romero & Raffaella Carrà", label: "Pedro"
  },
  ciaoCiao: {
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/8e/0f/dc/8e0fdcd0-bc23-9b03-9314-ada441f8fe29/mzaf_16104247834775033303.plus.aac.p.m4a",
    trackViewUrl: "https://music.apple.com/us/album/ciao-ciao/1606945973?i=1606945974&uo=4",
    track: "Ciao ciao", artist: "La Rappresentante di Lista", label: "Ciao ciao"
  },
  volare: {
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/64/a8/cd/64a8cd4a-2574-e61c-a421-2586223856fd/mzaf_14153851157952754832.plus.aac.p.m4a",
    trackViewUrl: "https://music.apple.com/us/album/nel-blu-dipinto-di-blu-aka-volare/201492972?i=201494417&uo=4",
    track: "Nel blu dipinto di blu (Volare)", artist: "Domenico Modugno", label: "Volare"
  },
  italiano: {
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/4c/a9/cd/4ca9cd79-0752-a2b3-5ff1-742956529063/mzaf_3941072632085591655.plus.aac.p.m4a",
    trackViewUrl: "https://music.apple.com/us/album/litaliano/1329256164?i=1329256166&uo=4",
    track: "L'italiano", artist: "Toto Cutugno", label: "L'italiano"
  },
  shivers: {
    url: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/a8/9f/a5/a89fa5e9-8a3b-77bb-e081-866067d3f213/mzaf_13889707114574366771.plus.aac.p.m4a",
    trackViewUrl: "https://music.apple.com/us/album/shivers/1581087024?i=1581087034&uo=4",
    track: "Shivers", artist: "Ed Sheeran", label: "Shivers"
  }
};

/* Karaoke excerpts: ONLY lines actually sung inside each 30 s preview (checked with speech-to-text).
   t = seconds into the preview. Each word: [text as sung, English meaning, how to say it]. A line with no words = music break. */
const LYRICS = {
  mammaMaria: [
    { t: 0.0, w: [["…mamma", "mom", "MAHM-mah"], ["Maria,", "Maria (a name)", "mah-REE-ah"], ["ma-", "just part of the sing-along “ma-ma-ma”", "mah"]] },
    { t: 2.48, w: [["Nel", "in the", "nel"], ["mio", "my", "MEE-oh"], ["futuro", "future", "foo-TOO-roh"], ["che", "what (che cosa = what)", "keh"], ["cosa", "thing (che cosa = what)", "KOH-zah"], ["c'è?", "there is", "cheh"]] },
    { t: 5.9, w: [["Sarebbe", "it would be", "sah-REB-beh"], ["bello", "nice", "BEL-loh"], ["se", "if", "seh"], ["fossi", "I were", "FOHS-see"], ["un", "a", "oon"], ["re", "king", "reh"]] },
    { t: 8.66, w: [["Così", "so / that way", "koh-ZEE"], ["la", "the", "lah"], ["bionda", "blonde (girl)", "bee-OHN-dah"], ["americana", "American (girl)", "ah-meh-ree-KAH-nah"]] },
    { t: 13.0, w: [["O", "either / or", "oh"], ["si", "herself (si innamora = she falls in love)", "see"], ["innamora", "falls in love", "een-nah-MOH-rah"], ["o", "or", "oh"], ["la", "her", "lah"], ["trasformo", "I turn (change)", "trahs-FOR-moh"], ["in", "into", "een"], ["rana", "frog", "RAH-nah"]] },
    { t: 16.38, w: [["Io", "I", "EE-oh"], ["muoio", "I'm dying (here: I'm dying to know!)", "MWOH-yoh"], ["dalla", "of the", "DAHL-lah"], ["curiosità", "curiosity", "koo-ree-oh-zee-TAH"]] },
    { t: 19.2, w: [] }
  ],
  carosone: [
    { t: 0.0, w: [["Tu", "you", "too"], ["vuò", "Neapolitan for “vuoi”: you want", "vwoh"], ["fà", "Neapolitan for “fare”: to act / to do", "fah"], ["l'americano", "the American", "lah-meh-ree-KAH-noh"]] },
    { t: 1.32, w: [["'Mericano,", "short for “americano”: American", "meh-ree-KAH-noh"], ["'mericano", "short for “americano”: American", "meh-ree-KAH-noh"]] },
    { t: 3.96, w: [["Siente", "Neapolitan for “senti”: listen", "SYEN-teh"], ["a", "to", "ah"], ["mme,", "Neapolitan for “me”", "mmeh"], ["chi", "who", "kee"], ["t''o", "Neapolitan for “te lo”: it … you", "toh"], ["ffa", "Neapolitan for “fa”: makes", "ffah"], ["fà?", "Neapolitan for “fare”: do", "fah"]] },
    { t: 7.18, w: [] },
    { t: 23.1, w: [["Chi", "who", "kee"], ["te", "to you", "teh"], ["li", "them", "lee"], ["dà?", "gives", "dah"], ["La", "the", "lah"], ["borsetta", "purse (little bag)", "bor-SET-tah"], ["di", "of", "dee"], ["mammà!", "Neapolitan / old-style for “mamma”: mom", "mahm-MAH"]] },
    { t: 26.2, w: [["Tu", "you", "too"], ["vuò", "Neapolitan for “vuoi”: you want", "vwoh"], ["fà", "Neapolitan for “fare”: to act / to do", "fah"], ["l'americano", "the American", "lah-meh-ree-KAH-noh"]] },
    { t: 27.86, w: [["'Mericano,", "short for “americano”: American", "meh-ree-KAH-noh"], ["'mericano", "short for “americano”: American", "meh-ree-KAH-noh"]] }
  ],
  saraPerche: [
    { t: [0.96, 16.6], w: [["E", "and", "eh"], ["vola,", "it flies (vola vola = up, up and away)", "VOH-lah"], ["vola,", "it flies", "VOH-lah"], ["si", "everyone (si sa = everyone knows)", "see"], ["sa", "knows", "sah"]] },
    { t: [3.1, 18.98], w: [["sempre", "always / ever", "SEM-preh"], ["più", "more", "pyoo"], ["in", "in", "een"], ["alto", "high (in alto = up high)", "AHL-toh"], ["si", "we (si va = we go)", "see"], ["va", "go", "vah"]] },
    { t: [5.1, 20.94], w: [["E", "and", "eh"], ["vola,", "it flies", "VOH-lah"], ["vola", "it flies", "VOH-lah"], ["con", "with", "kohn"], ["me", "me", "meh"]] },
    { t: [7.1, 22.98], w: [["il", "the", "eel"], ["mondo", "world", "MOHN-doh"], ["è", "is", "eh"], ["matto", "crazy", "MAHT-toh"], ["perché…", "because…", "pehr-KEH"]] },
    { t: [8.7, 24.6], w: [["e", "and", "eh"], ["se", "if", "seh"], ["l'amore", "love", "lah-MOH-reh"], ["non", "not", "nohn"], ["c'è,", "there is (non c'è = isn't there)", "cheh"], ["basta", "it's enough", "BAHS-tah"], ["una", "one / a", "OO-nah"], ["sola", "single", "SOH-lah"], ["canzone", "song", "kahn-TSOH-neh"]] },
    { t: [13.14, 28.96], w: [["per", "to", "pehr"], ["far", "make (short for “fare”)", "fahr"], ["confusione", "confusion (a happy mess)", "kohn-foo-ZYOH-neh"], ["fuori", "outside", "FWOH-ree"], ["e", "and", "eh"], ["dentro", "inside", "DEN-troh"], ["di", "of", "dee"], ["te", "you", "teh"]] }
  ],
  /* Lines 5-8 of the verse (13-25 s) are skipped (♪). The preview ends just as “praticamente…” starts, so that line isn't shown. */
  pedro: [
    { t: 0.0, w: [["Passeggio", "I stroll (I walk around)", "pahs-SED-joh"], ["tutta", "all", "TOOT-tah"], ["sola", "alone (girl form)", "SOH-lah"], ["per", "through", "pehr"], ["le", "the", "leh"], ["strade", "streets", "STRAH-deh"]] },
    { t: 3.6, w: [["guardando", "looking at", "gwar-DAHN-doh"], ["attentamente", "carefully", "aht-ten-tah-MEN-teh"], ["i", "the", "ee"], ["monumenti", "monuments", "moh-noo-MEN-tee"]] },
    { t: 6.88, w: [["La", "the", "lah"], ["classica", "typical", "KLAHS-see-kah"], ["straniera", "foreigner / tourist (girl)", "strah-NYEH-rah"], ["con", "with", "kohn"], ["un'aria", "a look (an air)", "oo-NAH-ryah"], ["strana", "strange", "STRAH-nah"]] },
    { t: 10.0, w: [["che", "who", "keh"], ["gira", "wanders around", "JEE-rah"], ["stanca", "tired (girl form)", "STAHN-kah"], ["tutta", "the whole", "TOOT-tah"], ["la", "the", "lah"], ["città", "city", "cheet-TAH"]] },
    { t: 13.24, w: [] },
    { t: 25.68, w: [["Pedro,", "Pedro (a name)", "PEH-droh"], ["Pedro,", "Pedro (a name)", "PEH-droh"], ["Pedro,", "Pedro (a name)", "PEH-droh"], ["Pedro,", "Pedro (a name)", "PEH-droh"], ["Pedro,", "Pedro (a name)", "PEH-droh"], ["Pè", "short for Pedro", "peh"]] }
  ],
  /* The 4th chorus line (15-19 s) has a rude word, so it's ♪. */
  ciaoCiao: [
    { t: 0.0, w: [["Ti", "you (to you)", "tee"], ["saluto", "I say bye to", "sah-LOO-toh"], ["con", "with", "kohn"], ["amore", "love", "ah-MOH-reh"]] },
    { t: 3.02, w: [["Con", "with", "kohn"], ["le", "the", "leh"], ["mani,", "hands", "MAH-nee"], ["con", "with", "kohn"], ["le", "the", "leh"], ["mani,", "hands", "MAH-nee"], ["con", "with", "kohn"], ["le", "the", "leh"], ["mani,", "hands", "MAH-nee"], ["ciao", "bye (or hi!)", "chow"], ["ciao", "bye", "chow"]] },
    { t: 7.16, w: [["Con", "with", "kohn"], ["i", "the", "ee"], ["piedi,", "feet", "PYEH-dee"], ["con", "with", "kohn"], ["i", "the", "ee"], ["piedi,", "feet", "PYEH-dee"], ["con", "with", "kohn"], ["i", "the", "ee"], ["piedi,", "feet", "PYEH-dee"], ["ciao", "bye (or hi!)", "chow"], ["ciao", "bye", "chow"]] },
    { t: 11.22, w: [["E", "and", "eh"], ["con", "with", "kohn"], ["la", "the", "lah"], ["testa,", "head", "TES-tah"], ["con", "with", "kohn"], ["il", "the", "eel"], ["petto,", "chest", "PET-toh"], ["con", "with", "kohn"], ["il", "the", "eel"], ["cuore,", "heart", "KWOH-reh"], ["ciao", "bye (or hi!)", "chow"], ["ciao", "bye", "chow"]] },
    { t: 15.34, w: [] }
  ],
  volare: [
    { t: [1.4, 21.4], w: [["Nel", "in the", "nel"], ["blu,", "blue", "bloo"], ["dipinto", "painted", "dee-PEEN-toh"], ["di", "with", "dee"], ["blu,", "blue", "bloo"]] },
    { t: [5.9, 24.32], w: [["felice", "happy", "feh-LEE-cheh"], ["di", "to", "dee"], ["stare", "be", "STAH-reh"], ["lassù", "up there", "lahs-SOO"]] },
    { t: 8.5, w: [["Volare,", "to fly", "voh-LAH-reh"], ["oh", "oh", "oh"], ["oh", "oh", "oh"]] },
    { t: 14.8, w: [["cantare,", "to sing", "kahn-TAH-reh"], ["oh", "oh", "oh"], ["oh", "oh", "oh"], ["oh", "oh", "oh"], ["oh", "oh", "oh"]] },
    { t: 27.04, w: [["E", "and", "eh"], ["volavo,", "I was flying", "voh-LAH-voh"], ["volavo", "I was flying", "voh-LAH-voh"], ["felice…", "happy", "feh-LEE-cheh"]] }
  ],
  /* English song: each word shows its ITALIAN + how to say the Italian. The "I love it when you do it like that /
     when you're close up" part is ♪ (romantic), so the hook line starts at "give me the shivers". */
  blue: [
    { t: [3.54, 18.34], w: [["I'm", "sono (io sono = I am)", "SOH-noh"], ["blue,", "blu", "bloo"], ["da", "just a fun sound (no meaning!)", "dah"], ["ba", "just a fun sound", "bah"], ["dee", "just a fun sound", "dee"], ["da", "just a fun sound", "dah"], ["ba", "just a fun sound", "bah"], ["di", "just a fun sound", "dee"]] }
  ],
  italiano: [
    { t: 2.82, w: [["Buongiorno", "good morning (hello!)", "bwon-JOR-noh"], ["Italia,", "Italy", "ee-TAH-lyah"], ["con", "with", "kohn"], ["i", "the", "ee"], ["tuoi", "your", "TWOH-ee"], ["artisti", "artists", "ar-TEE-stee"]] },
    { t: 6.6, w: [["con", "with", "kohn"], ["troppa", "too much", "TROHP-pah"], ["America", "America", "ah-MEH-ree-kah"], ["sui", "on the", "SOO-ee"], ["manifesti", "posters", "mah-nee-FEH-stee"]] },
    { t: 10.68, w: [["con", "with", "kohn"], ["le", "the", "leh"], ["canzoni,", "songs", "kahn-TSOH-nee"], ["con", "with", "kohn"], ["amore,", "love", "ah-MOH-reh"], ["con", "with", "kohn"], ["il", "the", "eel"], ["cuore", "heart", "KWOH-reh"]] },
    { t: 18.72, w: [["Buongiorno", "good morning (hello!)", "bwon-JOR-noh"], ["Italia,", "Italy", "ee-TAH-lyah"], ["buongiorno", "good morning", "bwon-JOR-noh"], ["Maria", "Maria (a name)", "mah-REE-ah"]] },
    { t: 22.62, w: [["con", "with", "kohn"], ["gli", "the", "lyee"], ["occhi", "eyes", "OHK-kee"], ["pieni", "full", "PYEH-nee"], ["di", "of", "dee"], ["malinconia", "a soft, dreamy sadness", "mah-leen-koh-NEE-ah"]] }
  ],
  shivers: [
    { t: 0.0, w: [["I", "io", "EE-oh"], ["wanna", "voglio (I want to)", "VOH-lyoh"], ["stay", "restare", "reh-STAH-reh"], ["up", "sveglia (stay up = restare sveglia)", "ZVEH-lyah"], ["all", "tutto", "TOOT-toh"], ["day", "il giorno", "eel JOR-noh"], ["and", "e", "eh"], ["all", "tutta", "TOOT-tah"], ["night", "la notte", "lah NOHT-teh"]] },
    { t: 3.44, w: [["Yeah,", "sì", "see"], ["you", "tu", "too"], ["got", "mi fai (you got me singing = mi fai cantare)", "mee FAH-ee"], ["me", "mi (me)", "mee"], ["singing", "cantare", "kahn-TAH-reh"], ["like…", "tipo…", "TEE-poh"]] },
    { t: [5.46, 18.6], w: [] },
    { t: [10.08, 23.7], w: [["give", "dare (give me = dammi)", "DAH-reh"], ["me", "mi (dammi = give me)", "mee"], ["the", "i", "ee"], ["shivers", "i brividi", "ee BREE-vee-dee"]] },
    { t: [11.14, 24.76], w: [["Oh", "oh", "oh"], ["baby,", "tesoro", "teh-ZOH-roh"], ["you", "tu", "too"], ["wanna", "vuoi (you want to)", "VWOH-ee"], ["dance", "ballare", "bahl-LAH-reh"], ["'til", "fino a", "FEE-noh ah"], ["the", "la", "lah"], ["sunlight", "la luce del sole", "lah LOO-cheh del SOH-leh"], ["cracks", "spunta (the sun comes up = spunta il sole)", "SPOON-tah"]] },
    { t: [14.98, 28.66], w: [["And", "e", "eh"], ["when", "quando", "KWAHN-doh"], ["they", "loro", "LOH-roh"], ["say", "dicono", "DEE-koh-noh"], ["the", "la", "lah"], ["party's", "la festa è", "lah FES-tah eh"], ["over,", "finita", "fee-NEE-tah"], ["then", "allora", "ahl-LOH-rah"], ["we'll", "noi (we will)", "NOH-ee"], ["bring", "portare", "por-TAH-reh"], ["it", "la (it = the party)", "lah"], ["right", "subito", "SOO-bee-toh"], ["back", "indietro (bring it back = riportarla)", "een-DYEH-troh"]] }
  ]
};

/* Every song is a mini sequence: LISTEN (song card) → NOTICE (2 quick questions from the lines she just heard,
   with a 🔁 replay of that line) → USE (the phrase in a real-life sentence). One question per screen, scored like
   the other cards. Fields: step (notice|use), en (the question), line (lyric line; "___" = missing word), hl (word to
   highlight), snip [from, to] (seconds in the 30 s preview), answerLang ("en" when the choices are English). */
function quiz(song, clip, qs) {
  return qs.map((q, i) => Object.assign({
    id: song + "q" + (i + 1), type: "lyricq", emoji: q.step === "use" ? "💬" : "🎧",
    vibe: q.step === "use" ? "Use it" : "Notice", songOf: song, clip: clip
  }, q));
}
const SONGQ = {
  mammaMaria: quiz("m01", CLIPS.mammaMaria, [
    { step: "notice", en: "What does “rana” mean?", line: "O si innamora o la trasformo in rana", hl: "rana", snip: [12.9, 16.4],
      answerLang: "en", captions: ["a queen", "a frog", "a ring"], correct: 1,
      note: "rana = frog 🐸", nudge: "Almost 💛 it's a little green animal that jumps. Try again." },
    { step: "notice", en: "Which word is missing?", line: "Sarebbe bello se fossi un ___", snip: [5.8, 8.7],
      captions: ["re", "cane", "gelato"], correct: 0,
      note: "un re = a king 👑 · se fossi un re = if I were a king", nudge: "Listen again 🎧 he wants to wear a crown! Try again." },
    { step: "use", scene: "Nonna says she has a surprise for you.", en: "I'm dying to know, Nonna!",
      captions: ["Muoio dalla fame, nonna!", "Muori dalla curiosità, nonna!", "Muoio dalla curiosità, nonna!"], correct: 2,
      note: "Muoio dalla curiosità = I'm dying to know (just like the song!)", nudge: "Almost 🎁 it's YOU who's curious, not hungry. Try again." }
  ]),
  carosone: quiz("k3", CLIPS.carosone, [
    { step: "notice", en: "What does “la borsetta” mean?", line: "Chi te li dà? La borsetta di mammà!", hl: "borsetta", snip: [23.0, 26.2],
      answerLang: "en", captions: ["the purse", "the bike", "the hat"], correct: 0,
      note: "la borsetta = the purse 👛 (mammà = mom)", nudge: "Almost 💛 Mom keeps her money in it. Try again." },
    { step: "notice", en: "Which word is missing?", line: "Tu vuò fà l'___", snip: [0.0, 3.9],
      captions: ["italiano", "americano", "napoletano"], correct: 1,
      note: "l'americano = the American 🇺🇸 · Tu vuò fà l'americano = you want to act American", nudge: "Listen again 🎧 it's in the song's name! Try again." },
    { step: "use", scene: "Your friend looks hot and tired. Offer her a treat.", en: "Do you want a gelato?",
      captions: ["Voglio un gelato!", "Hai un gelato?", "Vuoi un gelato?"], correct: 2,
      note: "Vuoi…? = do you want…? (vuò in Neapolitan)", nudge: "Almost 🍦 you're asking HER what she wants. Try again." }
  ]),
  saraPerche: quiz("k4", CLIPS.saraPerche, [
    { step: "notice", en: "What does “il mondo” mean?", line: "il mondo è matto perché…", hl: "il mondo", snip: [5.0, 8.7],
      answerLang: "en", captions: ["the moon", "the world", "the sea"], correct: 1,
      note: "il mondo = the world 🌍 (matto = crazy)", nudge: "Almost 🌍 it's where we all live. Try again." },
    { step: "notice", en: "Which word is missing?", line: "E vola vola con ___", snip: [5.0, 7.1],
      captions: ["me", "te", "noi"], correct: 0,
      note: "con me = with me", nudge: "Listen again 🎧 fly with… who? Try again." },
    { step: "use", scene: "You want your friend to follow you to the garden.", en: "Come with me!",
      captions: ["Vengo con te!", "Vieni con te!", "Vieni con me!"], correct: 2,
      note: "Vieni con me! = come with me! (con me, like the song)", nudge: "Close 💛 SHE comes with YOU. Try again." }
  ]),
  pedro: quiz("k5", CLIPS.pedro, [
    { step: "notice", en: "What does “le strade” mean?", line: "Passeggio tutta sola per le strade", hl: "le strade", snip: [0.0, 3.6],
      answerLang: "en", captions: ["the stars", "the shops", "the streets"], correct: 2,
      note: "le strade = the streets (una strada = a street)", nudge: "Almost 💛 she's walking along them. Try again." },
    { step: "notice", en: "Which word is missing?", line: "che gira ___ tutta la città", snip: [9.9, 13.2],
      captions: ["stanca", "sola", "bella"], correct: 0,
      note: "stanca = tired (girl form, like Sono stanca!)", nudge: "Listen again 🎧 she's been walking all day. Try again." },
    { step: "use", scene: "You walked all over the city today. Tell Nonna how you feel.", en: "I'm tired, Nonna!",
      captions: ["Sei stanca, nonna!", "Sono stanca, nonna!", "Sono stanco, nonna!"], correct: 1,
      note: "Sono stanca = I'm tired (girls say stanca)", nudge: "So close 😴 it's about you, and girls end it with -a. Try again." }
  ]),
  ciaoCiao: quiz("k6", CLIPS.ciaoCiao, [
    { step: "notice", en: "What does “le mani” mean?", line: "Con le mani, con le mani, con le mani, ciao ciao", hl: "le mani", snip: [3.0, 7.1],
      answerLang: "en", captions: ["the hands", "the feet", "the eyes"], correct: 0,
      note: "le mani = the hands 👋 (like Lavati le mani!)", nudge: "Almost 👋 you wave with them. Try again." },
    { step: "notice", en: "Which word is missing?", line: "E con la testa, con il petto, con il ___, ciao ciao", snip: [11.2, 15.3],
      captions: ["piede", "cuore", "naso"], correct: 1,
      note: "il cuore = the heart ❤️", nudge: "Listen again 🎧 it's where love lives. Try again." },
    { step: "use", scene: "The video call with Nonna is ending. Wave bye!", en: "Bye bye, Nonna! I love you!",
      captions: ["Buongiorno, nonna! Ti voglio bene!", "Ciao ciao, nonna! Mi chiamo Arianna!", "Ciao ciao, nonna! Ti voglio bene!"], correct: 2,
      note: "Ciao ciao = bye bye · Ti voglio bene = I love you", nudge: "Almost 💛 say bye, and tell her you love her. Try again." }
  ]),
  volare: quiz("k7", CLIPS.volare, [
    { step: "notice", en: "What does “volare” mean?", line: "Volare, oh oh", hl: "Volare", snip: [8.3, 14.6],
      answerLang: "en", captions: ["to sing", "to fly", "to swim"], correct: 1,
      note: "volare = to fly 🕊️ (cantare = to sing)", nudge: "Almost 🕊️ birds do it. Try again." },
    { step: "notice", en: "Which color is missing?", line: "Nel ___, dipinto di blu", snip: [1.2, 5.9],
      captions: ["rosso", "verde", "blu"], correct: 2,
      note: "blu = blue 💙 · dipinto di blu = painted blue", nudge: "Listen again 🎧 look up at the sky! Try again." },
    { step: "use", scene: "Nonna asks what you like to do.", en: "I like singing!",
      captions: ["Mi piace cantare!", "Mi piace volare!", "Ti piace cantare?"], correct: 0,
      note: "Mi piace cantare = I like singing 🎤", nudge: "Almost 🎤 you like to SING, and it's about you. Try again." }
  ]),
  blue: quiz("k9", CLIPS.blue, [
    { step: "notice", en: "“I'm” in Italian is…", line: "I'm blue, da ba dee da ba di", hl: "I'm", snip: [3.3, 6.2],
      captions: ["Sono", "Ho", "Sei"], correct: 0,
      note: "I'm = sono (Sono Arianna! Sono americana!)", nudge: "Almost 💙 think of “Sono Arianna”. Try again." },
    { step: "notice", en: "Which color is missing? Pick it in Italian!", line: "I'm ___, da ba dee da ba di", snip: [18.1, 21.2],
      captions: ["giallo", "blu", "rosa"], correct: 1,
      note: "blu = blue 💙 (giallo = yellow · rosa = pink)", nudge: "Listen again 🎧 it's the song's name! Try again." },
    { step: "use", scene: "A friend asks about your favorite color.", en: "My favorite color is blue!",
      captions: ["Il tuo colore preferito è il blu!", "Il mio colore preferito è il rosso!", "Il mio colore preferito è il blu!"], correct: 2,
      note: "Il mio colore preferito è il blu = my favorite color is blue", nudge: "Almost 💙 it's YOUR favorite, and it's blue. Try again." }
  ]),
  italiano: quiz("k10", CLIPS.italiano, [
    { step: "notice", en: "What does “gli occhi” mean?", line: "con gli occhi pieni di malinconia", hl: "occhi", snip: [22.4, 26.0],
      answerLang: "en", captions: ["the ears", "the hands", "the eyes"], correct: 2,
      note: "gli occhi = the eyes 👀", nudge: "Almost 💛 you see with them! Try again." },
    { step: "notice", en: "Which word is missing?", line: "con le ___, con amore, con il cuore", snip: [10.5, 14.2],
      captions: ["canzoni", "scarpe", "stelle"], correct: 0,
      note: "le canzoni = the songs 🎶 (una canzone = a song)", nudge: "Listen again 🎧 what do singers sing? Try again." },
    { step: "use", scene: "You land in Rome and step off the plane. Say it like Toto!", en: "Good morning, Italy!",
      captions: ["Buonanotte, Italia!", "Buongiorno, Italia!", "Arrivederci, Italia!"], correct: 1,
      note: "Buongiorno, Italia! = good morning, Italy! ☀️", nudge: "Almost ☀️ you just arrived, and it's morning. Try again." }
  ]),
  shivers: quiz("k8", CLIPS.shivers, [
    { step: "notice", en: "“dance” in Italian is…", line: "Oh baby, you wanna dance 'til the sunlight cracks", hl: "dance", snip: [11.1, 14.9],
      captions: ["cantare", "ballare", "dormire"], correct: 1,
      note: "ballare = to dance 💃 (bahl-LAH-reh)", nudge: "Almost 💃 cantare is to sing. Try again." },
    { step: "notice", en: "“night” in Italian is…", line: "I wanna stay up all day and all night", hl: "night", snip: [0.0, 3.4],
      captions: ["la notte", "il giorno", "la sera"], correct: 0,
      note: "la notte = the night 🌙 (buonanotte = good night!)", nudge: "Listen again 🎧 think of buona-notte. Try again." },
    { step: "use", scene: "Party time! Tell your friend your plan.", en: "I want to dance all night!",
      captions: ["Voglio cantare tutta la notte!", "Vuoi ballare tutta la notte?", "Voglio ballare tutta la notte!"], correct: 2,
      note: "Voglio ballare tutta la notte = I want to dance all night", nudge: "Almost 💃 it's YOU, and you want to DANCE. Try again." }
  ])
};

/* Song cards used both as in-session song breaks and in Canzoni (same card, same questions). */
const SONGCARDS = {
  m01: {
    id: "m01", type: "song", emoji: "🎶", vibe: "Song break · Nonna's favorite",
    scene: "Nonna's favorite song! Listen, sing along, tap any word.",
    title: "Mamma Maria", artist: "Ricchi e Poveri",
    image: "images/m01-vinyl-pink.jpg",
    clip: CLIPS.mammaMaria,
    lyrics: LYRICS.mammaMaria
  },
  k4: { id: "k4", type: "song", emoji: "🌅", vibe: "Song break · Sanremo, 1981", image: "images/k-sara-vernazza.jpg",
    scene: "Everybody in Italy knows this one! Sing along.", title: "Sarà perché ti amo", artist: "Ricchi e Poveri",
    clip: CLIPS.saraPerche, lyrics: LYRICS.saraPerche },
  k7: { id: "k7", type: "song", emoji: "🕊️", vibe: "Song break · 1958 classic", image: "images/k-volare-sky.jpg",
    scene: "The most famous Italian song ever! Sing “Volare!”", title: "Volare (Nel blu dipinto di blu)", artist: "Domenico Modugno",
    clip: CLIPS.volare, lyrics: LYRICS.volare },
  k10: { id: "k10", type: "song", emoji: "🇮🇹", vibe: "Song break · Sanremo, 1983", image: "images/k-italiano-flag.jpg",
    scene: "“Buongiorno Italia!” Toto says good morning to all of Italy. Tap any word!", title: "L'italiano", artist: "Toto Cutugno",
    clip: CLIPS.italiano, lyrics: LYRICS.italiano }
};

window.ARIANNA_APP = {
  version: 1,
  shareUrl: "https://appuccinohub.github.io/arianna-scroll/",
  sessions: [
    {
      id: "s1", title: "Session 1", emoji: "🌸", blurb: "Level 1 · ciao, grazie, prego + 2 song breaks",
      cards: [
        {
          id: "p02",
          tip: "Buongiorno = good morning or good afternoon. It's always polite to say it every morning, because Italians are really sociable!", type: "karaoke", emoji: "🎤", vibe: "Karaoke · with Nonna",
          scene: "Morning with Nonna. Say good morning first!",
          en: "Good morning, Nonna!",
          captions: ["Buongiorno, nonna!", "Buonanotte, nonna!", "Arrivederci, nonna!"],
          correct: 0,
          note: "Buongiorno = good morning",
          nudge: "Almost ☀️ it's morning, not bedtime. Try again.",
          image: "images/c02-karaoke-nonna.jpg"
        },
        {
          id: "a01",
          type: "vlog",
          emoji: "🥐",
          vibe: "Vlog · the bakery",
          scene: "You walk into a bakery. Greet the baker politely.",
          en: "Hello! (polite)",
          captions: ["Grazie!", "Salve!", "Arrivederci!"],
          correct: 1,
          note: "Salve = hello (polite, any time of day)",
          tip: "Salve is great with grown-ups you don't know. With friends, just say Ciao!",
          nudge: "Almost 💛 you just walked IN, so say hello. Try again.",
          image: "images/a01-bakery.jpg"
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
          image: "images/c07-disco-blue.jpg",
          clip: CLIPS.blue
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
          id: "p04", type: "dance", emoji: "👯", vibe: "Dance · duet",
          scene: "Duet with a new friend. First time meeting!",
          en: "Nice to meet you!",
          captions: ["Prego!", "Piacere!", "Per favore!"],
          correct: 1,
          note: "Piacere = nice to meet you",
          nudge: "Soft miss 🍋 that one's for manners. Try again.",
          image: "images/c04-dance-duet.jpg"
        },
        SONGCARDS.m01,
        ...SONGQ.mammaMaria,
        {
          id: "t03", type: "vlog", emoji: "🛶", vibe: "Vlog · Venice",
          scene: "Filming by the canal. Someone asks where you're from.",
          en: "I'm American!",
          captions: ["Sono canadese!", "Sono americana!", "Sono inglese!"],
          correct: 1,
          note: "Sono americana = I'm American (girls say americana) · canadese = Canadian · inglese = English",
          nudge: "Almost 🛶 you're from America! Try again.",
          image: "images/t03-vlog-venice.jpg"
        },
        {
          id: "s08", type: "vlog", emoji: "🍦", vibe: "Vlog · gelato run",
          scene: "At the gelato counter. Your turn to order!",
          en: "A gelato, please!",
          captions: ["Un gelato, per favore!", "Due gelati, per favore!", "Un gelato, piacere!"],
          correct: 0,
          note: "Per favore = please",
          nudge: "Almost 🍦 just ONE gelato, and say please. Try again.",
          image: "images/s08-vlog-gelato-order.jpg"
        },
        {
          id: "a02",
          type: "vlog",
          emoji: "💧",
          vibe: "Vlog · café stop",
          scene: "Hot day in the piazza. Ask the waiter for some water.",
          en: "A water, please!",
          captions: ["Un'acqua, piacere!", "Un gelato, per piacere!", "Un'acqua, per piacere!"],
          correct: 2,
          note: "Per piacere = please (just like per favore)",
          tip: "3 ways to say please: per favore, per piacere, per cortesia (extra polite).",
          nudge: "Almost 💧 you want WATER, and you say please. Try again.",
          image: "images/a02-water.jpg"
        },
        {
          id: "a03",
          type: "photo",
          emoji: "🎁",
          vibe: "Photo dump · a surprise",
          scene: "Your best friend gives you a surprise present!",
          en: "Thank you so much!",
          captions: ["Prego!", "Per favore!", "Grazie mille!"],
          correct: 2,
          note: "Grazie = thanks · Grazie mille / Molte grazie = thanks so much!",
          nudge: "So close 🎁 you're saying THANK YOU. Try again.",
          image: "images/a03-gift.jpg"
        },
        {
          id: "t05",
          tip: "Someone says Grazie? You answer Prego!", type: "karaoke", emoji: "🎤", vibe: "Karaoke · duet",
          scene: "You pass the mic. Your friend says “Grazie!”",
          en: "You're welcome!",
          captions: ["Prego!", "Piacere!", "Per favore!"],
          correct: 0,
          note: "Prego = you're welcome",
          nudge: "Soft miss 🎤 she said thanks, so answer her. Try again.",
          image: "images/t05-karaoke-lesson.jpg"
        },
        {
          id: "r01",
          type: "dance",
          emoji: "🔁",
          vibe: "Review · new friend",
          scene: "Review time! You meet a new friend after school.",
          en: "Hi! I'm Arianna. Nice to meet you!",
          captions: ["Ciao! Sono Arianna. Piacere!", "Ciao! Sei Arianna. Piacere!", "Ciao! Sono Arianna. Prego!"],
          correct: 0,
          note: "Sono Arianna = I'm Arianna · Piacere = nice to meet you",
          nudge: "Almost 💛 it's YOU, and you're happy to meet her. Try again.",
          image: "images/s10-vlog-school-wave.jpg"
        },
        SONGCARDS.k4,
        ...SONGQ.saraPerche,
        {
          id: "a04",
          type: "vlog",
          emoji: "🚪",
          vibe: "Vlog · manners",
          scene: "Nonna's friend is at the door. Invite her in!",
          en: "Please, come in!",
          captions: ["Grazie!", "Piacere!", "Prego!"],
          correct: 2,
          note: "Prego! = please, come in / go ahead (Prego's 2nd job!)",
          tip: "Prego has 2 jobs: “you're welcome” AND “please, come in / go ahead”.",
          nudge: "Almost 🚪 it's the same word as “you're welcome”! Try again.",
          image: "images/a04-door.jpg"
        },
        {
          id: "a05",
          type: "photo",
          emoji: "🥦",
          vibe: "Dinner · seconds?",
          scene: "Nonna offers you more broccoli, but you're full!",
          en: "No, thank you!",
          captions: ["No, grazie!", "Sì, grazie!", "No, prego!"],
          correct: 0,
          note: "Sì = yes · No = no · No, grazie = no, thank you",
          nudge: "Almost 🥦 you're full, so it's NO, and you say thanks. Try again.",
          image: "images/a05-broccoli.jpg"
        },
        {
          id: "a06",
          type: "vlog",
          emoji: "🚌",
          vibe: "Vlog · on the bus",
          scene: "Oops! The bus stops fast and you bump into a lady.",
          en: "Sorry! (to a grown-up)",
          captions: ["Mi scusi!", "Salve!", "Prego!"],
          correct: 0,
          note: "Mi scusi = sorry / excuse me (polite)",
          tip: "Grown-ups you don't know: Mi scusi. Family and friends: Scusa!",
          nudge: "Almost 💛 you bumped into her, so say sorry. Try again.",
          image: "images/a06-bus.jpg"
        },
        {
          id: "a07",
          type: "vlog",
          emoji: "🧣",
          vibe: "Vlog · in the street",
          scene: "You pick up a lady's scarf. She says: “Grazie mille!”",
          en: "Don't mention it! (polite)",
          captions: ["Mi scusi!", "Si figuri!", "Buonanotte!"],
          correct: 1,
          note: "Si figuri = don't mention it (polite)",
          tip: "With friends and family, say Figurati!",
          nudge: "Almost 🧣 she thanked you. Tell her it was nothing! Try again.",
          image: "images/a07-scarf.jpg"
        },
        {
          id: "a08",
          type: "photo",
          emoji: "🥛",
          vibe: "Kitchen · oops!",
          scene: "Oops! You spill your milk at Nonna's table.",
          en: "Sorry, Nonna!",
          captions: ["Salve, nonna!", "Prego, nonna!", "Scusa, nonna!"],
          correct: 2,
          note: "Scusa = sorry (with family and friends)",
          nudge: "Almost 🥛 you spilled it, so say sorry. Try again.",
          image: "images/a08-spill.jpg"
        },
        {
          id: "a09",
          type: "vlog",
          emoji: "🍝",
          vibe: "Vlog · restaurant",
          scene: "The waiter talks super fast. You didn't catch it!",
          en: "Can you repeat, please? (polite)",
          captions: ["Posso ripetere, per cortesia?", "Può ripetere, piacere?", "Può ripetere, per cortesia?"],
          correct: 2,
          note: "Può ripetere? = can you repeat? · per cortesia = please (polite)",
          nudge: "Almost 💛 you want HIM to say it again, and say please. Try again.",
          image: "images/a09-waiter.jpg"
        },
        {
          id: "a10",
          type: "vlog",
          emoji: "👋",
          vibe: "Review · leaving the bakery",
          scene: "You've got your pastries. Time to leave the bakery!",
          en: "Thanks a lot, goodbye!",
          captions: ["Grazie mille, buonanotte!", "Grazie mille, arrivederci!", "Prego, arrivederci!"],
          correct: 1,
          note: "Arrivederci = goodbye (polite)",
          tip: "Ciao is for friends and family. With grown-ups you don't know, say Arrivederci!",
          nudge: "Almost 👋 say thanks, then goodbye. Try again.",
          image: "images/a10-pastries.jpg"
        }
      ]
    },
    {
      id: "s2", title: "Session 2", emoji: "🍋", blurb: "Level 2 · names, where you're from, age + 2 song breaks",
      cards: [
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
          id: "p05", type: "vlog", emoji: "🚗", vibe: "Road trip · 1950s vibes",
          song: "Tu vuò fà l'americano · Renato Carosone",
          scene: "Cruising in a vintage Fiat 500 with Carosone on. A friend leans in: come stai?",
          en: "I'm good, thanks!",
          captions: ["Male, grazie!", "Bene, prego!", "Bene, grazie!"],
          correct: 2,
          note: "Bene, grazie = good, thanks",
          nudge: "Almost 💛 you're GOOD, and you say thanks. Try again.",
          image: "images/c05-fiat500.jpg",
          clip: CLIPS.carosone,
          lyrics: LYRICS.carosone
        },
        {
          id: "b01",
          type: "dance",
          emoji: "🛝",
          vibe: "Park · new friend",
          scene: "A new girl joins your dance group. Ask her name!",
          en: "What's your name?",
          captions: ["Come stai?", "Come ti chiami?", "Come mi chiamo?"],
          correct: 1,
          note: "Come ti chiami? = what's your name? (friends and family)",
          nudge: "Almost 💛 you want her NAME. Try again.",
          image: "images/b01-park.jpg"
        },
        {
          id: "b02",
          kind: "asks",
          who: "👧 New friend",
          type: "dance",
          emoji: "👋",
          vibe: "Park · new friend",
          scene: "Now she asks you!",
          ask: "E tu, come ti chiami?",
          askEn: "And you, what's your name?",
          captions: ["Mi chiami Arianna!", "Mi chiamo Arianna!", "Ti chiami Arianna!"],
          correct: 1,
          note: "Mi chiamo… = my name is…",
          tip: "Literally “I call myself”, from chiamarsi (to be called).",
          nudge: "Almost 💛 it's YOUR name: mi chiamo. Try again.",
          image: "images/b02-friends.jpg"
        },
        {
          id: "p06", type: "dance", emoji: "🪩", vibe: "Dance · Pedro trend",
          song: "Pedro · Jaxomy, Agatino Romero & Raffaella Carrà",
          scene: "The Pedro TikTok dance is on. Caption your dance.",
          en: "Hi, I'm Arianna, and I'm dancing!",
          captions: ["Ciao, sono Arianna e ballo!", "Ciao, sei Arianna e balli!", "Arrivederci, sono Arianna e ballo!"],
          correct: 0,
          note: "Sono = I am · Ballo = I dance",
          nudge: "Close 💛 it's about you, and you're saying hi. Try again.",
          image: "images/k-pedro-dance.jpg",
          clip: CLIPS.pedro
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
        SONGCARDS.k7,
        ...SONGQ.volare,
        {
          id: "b03",
          kind: "asks",
          who: "👵 Nonna's friend",
          type: "photo",
          emoji: "🤝",
          vibe: "Meeting Nonna's friend",
          scene: "Nonna introduces you to her friend, Signora Rosa.",
          ask: "Piacere, Arianna!",
          askEn: "Nice to meet you, Arianna!",
          captions: ["Mi piace!", "Piacere mio!", "Prego mio!"],
          correct: 1,
          note: "Piacere mio = the pleasure is mine",
          nudge: "Almost 💛 she's happy to meet you. Say it back! Try again.",
          image: "images/b03-handshake.jpg"
        },
        {
          id: "b04",
          type: "vlog",
          emoji: "🏫",
          vibe: "School · new teacher",
          scene: "First day with a new teacher. Ask her name politely.",
          en: "What's your name? (polite)",
          captions: ["Come ti chiami?", "Come sta?", "Come si chiama?"],
          correct: 2,
          note: "Come si chiama? = what's your name? (polite, for grown-ups)",
          tip: "Not sure if formal or informal? Use formal. But with Nonna and family, use tu: Come ti chiami? / Di dove sei?",
          nudge: "Almost 💛 she's a grown-up you just met, so be polite. Try again.",
          image: "images/b04-teacher.jpg"
        },
        {
          id: "b05",
          type: "photo",
          emoji: "🏖️",
          vibe: "Beach · new friend",
          scene: "At the beach you meet a girl your age with a new accent.",
          en: "Where are you from? (to a friend)",
          captions: ["Di dove sei?", "Dove sei?", "Di dov'è?"],
          correct: 0,
          note: "Di dove sei? = where are you from? (friends and family)",
          nudge: "Almost 🏖️ she's your age, so use tu, and ask where she's FROM. Try again.",
          image: "images/b05-beach.jpg"
        },
        {
          id: "b06",
          kind: "asks",
          who: "👧 New friend",
          type: "photo",
          emoji: "🇺🇸",
          vibe: "Beach · new friend",
          scene: "She asks you the same thing!",
          ask: "E tu, di dove sei?",
          askEn: "And you, where are you from?",
          captions: ["Sono canadese!", "Sono inglese!", "Sono americana!"],
          correct: 2,
          note: "Sono americana = I'm American (girls say americana) · canadese = Canadian · inglese = English",
          nudge: "Almost 🇺🇸 you're from America! Try again.",
          image: "images/b06-beach-friends.jpg"
        },
        {
          id: "b07",
          type: "vlog",
          emoji: "🏨",
          vibe: "Hotel · check-in",
          scene: "The hotel lady has an accent you don't know. Ask her politely.",
          en: "Where are you from? (polite)",
          captions: ["Dov'è?", "Di dov'è?", "Di dove sei?"],
          correct: 1,
          note: "Di dov'è? = where are you from? (polite) · Dov'è? = where is it?",
          nudge: "Almost 🏨 she's a grown-up, so be polite, and ask where she's FROM. Try again.",
          image: "images/b07-hotel.jpg"
        },
        {
          id: "r02",
          kind: "asks",
          who: "👩 The neighbor",
          type: "vlog",
          emoji: "🔁",
          vibe: "Review · the neighbor",
          scene: "Review! Nonna's neighbor stops you one morning.",
          ask: "Buongiorno! Come ti chiami?",
          askEn: "Good morning! What's your name?",
          captions: ["Buonanotte! Mi chiamo Arianna.", "Buongiorno! Mi chiamo Arianna.", "Buongiorno! Ti chiami Arianna."],
          correct: 1,
          note: "Buongiorno = good morning · Mi chiamo… = my name is…",
          nudge: "Almost ☀️ it's morning, and it's YOUR name. Try again.",
          image: "images/r02-neighbor.jpg"
        },
        SONGCARDS.k10,
        ...SONGQ.italiano,
        {
          id: "b08",
          type: "photo",
          emoji: "🎈",
          vibe: "Party · new friend",
          scene: "At your cousin's birthday party you meet a new girl. Ask how old she is!",
          en: "How old are you?",
          captions: ["Quanti anni hai?", "Quanti anni sei?", "Come ti chiami?"],
          correct: 0,
          note: "Quanti anni hai? = how old are you? (literally: how many years do you have?)",
          nudge: "Almost 🎈 in Italian you HAVE years. Try again.",
          image: "images/b08-party.jpg"
        },
        {
          id: "s09", type: "photo", emoji: "🎂", vibe: "Photo dump · birthday",
          scene: "Birthday video call! Nonna asks the big question.",
          kind: "asks", ask: "Quanti anni hai?", askEn: "How old are you?",
          captions: ["Sono dodici anni!", "Hai dodici anni!", "Ho dodici anni!"],
          correct: 2,
          note: "Ho dodici anni = I'm 12 (in Italian you HAVE your years)",
          nudge: "So close 🎂 in Italian you HAVE your age, and it's yours. Try again.",
          image: "images/s09-photo-birthday.jpg"
        },
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
          id: "t08", type: "photo", emoji: "🍨", vibe: "Photo dump · gelato break",
          scene: "Gelato break with your friend. She holds hers out: want a taste?",
          en: "Yes, please!",
          captions: ["Sì, per favore!", "No, per favore!", "No, grazie!"],
          correct: 0,
          note: "Sì, per favore = yes, please",
          nudge: "Almost 🍨 you DO want some, so say yes and ask nicely. Try again.",
          image: "images/t08-photo-gelato-friend.jpg"
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
    },
    {
      id: "s3", title: "Session 3", emoji: "💬", blurb: "Parliamo! Talk with Nonna",
      cards: [
        {
          id: "u01", kind: "asks", type: "vlog", emoji: "📱", vibe: "Video call · Nonna",
          scene: "Video call with Nonna! She waves hello.",
          ask: "Ciao, tesoro! Come stai?", askEn: "Hi, sweetie! How are you?",
          captions: ["Mi chiamo Arianna!", "Bene, grazie, nonna!", "A domani, nonna!"],
          correct: 1,
          note: "Come stai? = how are you? · Bene, grazie = good, thanks",
          nudge: "Almost 💛 Nonna asked how you ARE. Try again.",
          image: "images/v-s3-nonna-call.jpg", video: "videos/v-s3-nonna-call.mp4"
        },
        {
          id: "u02", kind: "asks", type: "vlog", emoji: "🍽️", vibe: "Video call · after lunch",
          scene: "You just finished a big lunch. Nonna calls.",
          ask: "Hai mangiato?", askEn: "Did you eat?",
          captions: ["Sì, nonna!", "Piacere, nonna!", "Buonanotte, nonna!"],
          correct: 0,
          note: "Hai mangiato? = did you eat? · Sì = yes",
          nudge: "Close 🍝 she asked if you ate, and you did! Try again.",
          image: "images/v-s3-call-girl.jpg", video: "videos/v-s3-call-girl.mp4"
        },
        {
          id: "u03", kind: "asks", type: "vlog", emoji: "🍝", vibe: "Kitchen · pasta time",
          scene: "Nonna's pasta is almost ready, and you're really hungry!",
          ask: "Vuoi la pasta?", askEn: "Do you want some pasta?",
          captions: ["No, grazie!", "Piacere, nonna!", "Sì, grazie!"],
          correct: 2,
          note: "Vuoi…? = do you want…? · Sì, grazie = yes, thanks",
          nudge: "Almost 💛 you're hungry, so say yes, and thank her. Try again.",
          image: "images/v-s3-pasta-pot.jpg", video: "videos/v-s3-pasta-pot.mp4"
        },
        {
          id: "u04", type: "vlog", emoji: "💌", vibe: "Video call · far away",
          scene: "Nonna lives far away. Tell her how you feel.",
          en: "I miss you, Nonna!",
          captions: ["Ti manco, nonna?", "Mi manchi, nonna!", "Piacere, nonna!"],
          correct: 1,
          note: "Mi manchi = I miss you",
          nudge: "So close 💌 YOU miss HER. Try again.",
          image: "images/u04-call-wave.jpg"
        },
        {
          id: "u05", kind: "asks", type: "photo", emoji: "🎒", vibe: "After school",
          scene: "You just got home from school. Nonna calls.",
          ask: "Come va la scuola?", askEn: "How's school going?",
          captions: ["Buonasera!", "Ho dodici anni!", "Bene!"],
          correct: 2,
          note: "Come va la scuola? = how's school? · Bene! = good!",
          nudge: "Nice try 🎒 she asked how school is going. Try again.",
          image: "images/u05-school.jpg"
        },
        {
          id: "u06", kind: "asks", type: "photo", emoji: "🍰", vibe: "Dessert · tiramisù",
          scene: "Nonna made tiramisù. You take the first bite.",
          ask: "Ti piace?", askEn: "Do you like it?",
          captions: ["Sì, è buonissimo!", "Sì, sono stanca!", "Sì, prego!"],
          correct: 0,
          note: "Ti piace? = do you like it? · È buonissimo = it's delicious",
          nudge: "Almost 🍰 you love it! Tell her it's yummy. Try again.",
          image: "images/u06-tiramisu.jpg"
        },
        {
          id: "u07", kind: "asks", type: "vlog", emoji: "🥣", vibe: "Kitchen · snack time",
          scene: "You skipped your snack and your tummy is rumbling.",
          ask: "Hai mangiato?", askEn: "Did you eat?",
          captions: ["Sì, grazie!", "No, ho fame!", "Piacere!"],
          correct: 1,
          note: "No, ho fame = no, I'm hungry (in Italian you HAVE hunger)",
          nudge: "Close 💛 you haven't eaten, and your tummy is rumbling. Try again.",
          image: "images/v-s3-nonna-cooking.jpg", video: "videos/v-s3-nonna-cooking.mp4"
        },
        {
          id: "u08", kind: "asks", type: "dance", emoji: "🩰", vibe: "Dance class",
          scene: "You had dance class today.",
          ask: "Cosa hai fatto oggi?", askEn: "What did you do today?",
          captions: ["Ho fame!", "Ho dodici anni!", "Ho ballato!"],
          correct: 2,
          note: "Cosa hai fatto oggi? = what did you do today? · Ho ballato = I danced",
          nudge: "Almost 💃 what did you DO today? Try again.",
          image: "images/u08-ballet.jpg"
        },
        {
          id: "u09", type: "photo", emoji: "🍅", vibe: "Kitchen · taste test",
          scene: "Nonna lets you taste her tomato sauce (il sugo).",
          en: "It's delicious, Nonna!",
          captions: ["È buonissimo, nonna!", "È bellissimo, nonna!", "Buonanotte, nonna!"],
          correct: 0,
          note: "È buonissimo = it's delicious (super good!)",
          nudge: "Almost 😋 it TASTES great. Try again.",
          image: "images/u09-sugo.jpg"
        },
        {
          id: "u10", type: "photo", emoji: "😴", vibe: "Long day",
          scene: "Long day! You can hardly keep your eyes open.",
          en: "I'm tired.",
          captions: ["Sono stanco.", "Sono stanca.", "Sei stanca."],
          correct: 1,
          note: "Sono stanca = I'm tired (girls say stanca)",
          nudge: "So close 😴 it's about you, and girls end it with -a. Try again.",
          image: "images/u10-yawn.jpg"
        },
        {
          id: "u11", type: "photo", emoji: "💕", vibe: "Big cuddle",
          scene: "One big cuddle before you go.",
          en: "I love you, Nonna!",
          captions: ["Grazie, nonna!", "Ti piace, nonna?", "Ti voglio bene, nonna!"],
          correct: 2,
          note: "Ti voglio bene = I love you (for family)",
          nudge: "Almost 💕 tell her you love her. Try again.",
          image: "images/u11-cuddle.jpg"
        }
      ]
    },
    {
      id: "s4", title: "Session 4", emoji: "👵", blurb: "Nonna dice… Understand Nonna",
      cards: [
        {
          id: "n01", kind: "says", type: "vlog", emoji: "👋", vibe: "Kitchen · Nonna calls",
          scene: "Nonna is cooking and waves you over.",
          en: "Come here!",
          captions: ["Vieni qui!", "Vai a casa!", "Siediti qui!"],
          correct: 0,
          note: "Vieni qui! = come here! (vieni = come · qui = here)",
          nudge: "Almost 💛 she wants you to COME to her. Try again.",
          image: "images/v-s4-kitchen-helper.jpg", video: "videos/v-s4-kitchen-helper.mp4"
        },
        {
          id: "n02", kind: "says", type: "photo", emoji: "🪑", vibe: "Dinner · your seat",
          scene: "Dinner's ready and there's a chair just for you.",
          en: "Sit down!",
          captions: ["Svegliati!", "Siediti!", "Alzati!"],
          correct: 1,
          note: "Siediti! = sit down! (svegliati = wake up · alzati = stand up)",
          nudge: "Close 🪑 she wants you in the chair. Try again.",
          image: "images/n02-sit.jpg"
        },
        {
          id: "n03", kind: "says", type: "vlog", emoji: "🧼", vibe: "Before dinner",
          scene: "Before dinner, Nonna points to the sink.",
          en: "Wash your hands!",
          captions: ["Lavati la faccia!", "Asciugati le mani!", "Lavati le mani!"],
          correct: 2,
          note: "Lavati le mani! = wash your hands! (le mani = hands)",
          nudge: "Almost 🧼 it's your HANDS, and you WASH them. Try again.",
          image: "images/v-s4-wash-hands.jpg", video: "videos/v-s4-wash-hands.mp4"
        },
        {
          id: "n04", kind: "says", type: "vlog", emoji: "🍽️", vibe: "Dinner time",
          scene: "The table is set. Nonna calls everyone.",
          en: "Come to the table!",
          captions: ["Vieni a tavola!", "Vieni a letto!", "Vai a scuola!"],
          correct: 0,
          note: "Vieni a tavola! = come to the table! (dinner's ready)",
          nudge: "Almost 🍽️ it's time to eat. Try again.",
          image: "images/v-s4-table.jpg", video: "videos/v-s4-table.mp4"
        },
        {
          id: "n05", kind: "says", type: "vlog", emoji: "🍝", vibe: "Dinner · spaghetti",
          scene: "A big plate of spaghetti, just for you.",
          en: "Eat!",
          captions: ["Bevi!", "Mangia!", "Dormi!"],
          correct: 1,
          note: "Mangia! = eat! (bevi = drink · dormi = sleep)",
          nudge: "Almost 🍝 the spaghetti is waiting. Try again.",
          image: "images/v-s4-spaghetti.jpg", video: "videos/v-s4-spaghetti.mp4"
        },
        {
          id: "n06", kind: "says", type: "photo", emoji: "🍪", vibe: "Kitchen · hot cookies",
          scene: "The cookies are still hot! Nonna stops you.",
          en: "Wait!",
          captions: ["Vieni!", "Corri!", "Aspetta!"],
          correct: 2,
          note: "Aspetta! = wait!",
          nudge: "Almost 🍪 she wants you to stop for a moment. Try again.",
          image: "images/n06-cookies.jpg"
        },
        {
          id: "n07", kind: "says", type: "photo", emoji: "🥖", vibe: "Kitchen · busy hands",
          scene: "Nonna's hands are covered in dough. She points at something.",
          en: "Get me that thing!",
          captions: ["Prendimi quella cosa!", "Prendi questa cosa!", "Dammi quel libro!"],
          correct: 0,
          note: "Prendimi quella cosa! = get me that thing! (prendi + mi = get for me)",
          nudge: "Close 🥖 she wants THAT thing, for HER. Try again.",
          image: "images/n07-dough.jpg"
        },
        {
          id: "n08", kind: "says", type: "photo", emoji: "🧥", vibe: "Going out",
          scene: "It's cold outside and you're heading out.",
          en: "Put on your jacket!",
          captions: ["Togliti la giacca!", "Mettiti la giacca!", "Mettiti le scarpe!"],
          correct: 1,
          note: "Mettiti la giacca! = put on your jacket! (togliti = take it off)",
          nudge: "Almost 🧥 it's cold, so put your jacket ON. Try again.",
          image: "images/n08-jacket.jpg"
        },
        {
          id: "n09", kind: "says", type: "vlog", emoji: "🚪", vibe: "Ding-dong!",
          scene: "Ding-dong! Someone's at the door.",
          en: "Open the door!",
          captions: ["Chiudi la porta!", "Apri la finestra!", "Apri la porta!"],
          correct: 2,
          note: "Apri la porta! = open the door! (chiudi = close · la finestra = the window)",
          nudge: "Almost 🚪 OPEN it, and it's the door. Try again.",
          image: "images/v-s4-door.jpg", video: "videos/v-s4-door.mp4"
        },
        {
          id: "n10", kind: "says", type: "photo", emoji: "😘", vibe: "Hello, Nonna!",
          scene: "You arrive at Nonna's house. She opens her arms.",
          en: "Come here, give me a kiss!",
          captions: ["Vieni qui, dammi un bacio!", "Vieni qui, dammi la mano!", "Vai lì, dammi un bacio!"],
          correct: 0,
          note: "Dammi un bacio! = give me a kiss! (da' + mi = give me)",
          nudge: "Close 😘 come HERE, and it's a kiss. Try again.",
          image: "images/n10-kiss.jpg"
        },
        {
          id: "n11", kind: "says", type: "vlog", emoji: "🌙", vibe: "Bedtime",
          scene: "It's late. You're falling asleep, and Nonna whispers…",
          en: "Sweet dreams!",
          captions: ["Buona giornata!", "Sogni d'oro!", "Buon appetito!"],
          correct: 1,
          note: "Sogni d'oro! = sweet dreams! (literally “golden dreams”) 🌙",
          nudge: "Almost 🌙 it's bedtime, not breakfast or lunch. Try again.",
          image: "images/v-s4-bedtime.jpg", video: "videos/v-s4-bedtime.mp4"
        }
      ]
    }
  ],
  /* Canzoni 🎶: open from the start. Each song = its own mini sequence (listen → 2 notice → 1 use). */
  songs: [
    { id: "k1", title: "Mamma Maria", artist: "Ricchi e Poveri", emoji: "🎶", cards: [SONGCARDS.m01].concat(SONGQ.mammaMaria) },
    { id: "k4", title: "Sarà perché ti amo", artist: "Ricchi e Poveri", emoji: "🌅", cards: [SONGCARDS.k4].concat(SONGQ.saraPerche) },
    { id: "k7", title: "Volare", artist: "Domenico Modugno", emoji: "🕊️", cards: [SONGCARDS.k7].concat(SONGQ.volare) },
    { id: "k3", title: "Tu vuò fà l'americano", artist: "Renato Carosone", emoji: "🚗", cards: [
      { id: "k3", type: "song", emoji: "🚗", vibe: "Canzoni · Naples, 1956", imageFrom: "p05",
        scene: "A 1950s classic from Naples. Tap any word!", title: "Tu vuò fà l'americano", artist: "Renato Carosone",
        clip: CLIPS.carosone, lyrics: LYRICS.carosone }].concat(SONGQ.carosone) },
    { id: "k9", title: "Blue (Da Ba Dee)", artist: "Eiffel 65", emoji: "💙", cards: [
      { id: "k9", type: "song", emoji: "💙", vibe: "Canzoni · Italian band, English song", imageFrom: "p07", lyricsLang: "en",
        scene: "Eiffel 65 are from Turin, Italy! Tap a word to see it in ITALIAN.", title: "Blue (Da Ba Dee)", artist: "Eiffel 65",
        clip: CLIPS.blue, lyrics: LYRICS.blue }].concat(SONGQ.blue) },
    { id: "k5", title: "Pedro", artist: "Jaxomy, Agatino Romero & Raffaella Carrà", emoji: "🪩", cards: [
      { id: "k5", type: "song", emoji: "🪩", vibe: "Canzoni · the viral remix", image: "images/k-pedro-dance.jpg",
        scene: "Raffaella Carrà's 1980 hit, remixed for TikTok. Tap any word!", title: "Pedro", artist: "Jaxomy, Agatino Romero & Raffaella Carrà",
        clip: CLIPS.pedro, lyrics: LYRICS.pedro }].concat(SONGQ.pedro) },
    { id: "k10", title: "L'italiano", artist: "Toto Cutugno", emoji: "🇮🇹", cards: [SONGCARDS.k10].concat(SONGQ.italiano) },
    { id: "k6", title: "Ciao ciao", artist: "La Rappresentante di Lista", emoji: "👋", cards: [
      { id: "k6", type: "song", emoji: "👋", vibe: "Canzoni · Sanremo, 2022", image: "images/k-ciao-sunset.jpg",
        scene: "Wave ciao ciao with your hands, your feet… Tap any word!", title: "Ciao ciao", artist: "La Rappresentante di Lista",
        clip: CLIPS.ciaoCiao, lyrics: LYRICS.ciaoCiao }].concat(SONGQ.ciaoCiao) },
    { id: "k8", title: "Shivers", artist: "Ed Sheeran", emoji: "🎸", cards: [
      { id: "k8", type: "song", emoji: "🎸", vibe: "Canzoni · English song", image: "images/k-shivers-guitar.jpg", lyricsLang: "en",
        scene: "An English song! Tap any word to see it in ITALIAN.", title: "Shivers", artist: "Ed Sheeran",
        clip: CLIPS.shivers, lyrics: LYRICS.shivers }].concat(SONGQ.shivers) }
  ]
};

/* Song pictures that belong to Session 1 cards stay in one place (their Session 1 card), so the Canzoni copies
   and the song questions always use the same picture. */
(function linkImages(app) {
  const byId = (id) => app.sessions.flatMap((s) => s.cards).find((c) => c.id === id);
  const all = app.sessions.flatMap((s) => s.cards).concat(app.songs.flatMap((s) => s.cards));
  all.forEach((c) => { if (c.imageFrom && byId(c.imageFrom)) c.image = byId(c.imageFrom).image; });
  const songCard = (id) => all.find((c) => c.type === "song" && c.id === id);
  all.forEach((c) => {
    const sc = c.songOf && songCard(c.songOf);
    if (sc) { c.image = sc.image; c.songTitle = sc.title; c.songLang = sc.lyricsLang || "it"; }
  });
})(window.ARIANNA_APP);
