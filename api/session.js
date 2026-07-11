// api/session.js — Vercel serverless function
// Émet un token ÉPHÉMÈRE (ek_..., ~1 min) pour OpenAI Realtime.
// La vraie clé OPENAI_API_KEY reste ici, côté serveur, et ne touche JAMAIS le navigateur.

// Banque de scénarios de la vie réelle. Un est tiré au hasard à chaque session
// pour que l'élève s'entraîne "dans n'importe quel cas".
const SCENARIOS = [
  "Ordering food and drinks at a café or restaurant.",
  "Checking in at the airport and going through security.",
  "Meeting a new colleague and making small talk about the weekend.",
  "Asking a stranger for directions to the train station in a new city.",
  "A job interview for a job the student would really like.",
  "Shopping for clothes and asking about sizes, colours and prices.",
  "Booking a hotel room and asking about breakfast, wifi and check-out.",
  "Seeing a doctor because you feel a bit sick.",
  "Catching up with an old friend you haven't seen in years.",
  "Ordering a coffee to go and chatting briefly with the barista.",
  "Renting a car and asking about the insurance and the fuel.",
  "Talking about your favourite movie or TV show with a friend.",
  "Planning a weekend trip together and deciding where to go.",
  "Calling customer service because a package never arrived.",
  "Chatting with a taxi driver about the city and the traffic.",
  "Introducing yourself at a party and asking the other person about themselves.",
  "Talking about food: your favourite dish and how you cook it.",
  "A first day at a new gym, asking the staff how everything works.",
  "At the pharmacy, asking for something for a headache.",
  "Returning a product to a shop because it is broken."
];

function buildCoach(scenario, focus) {
  const focusLine = (focus && focus.length)
    ? `\n=== CARRY-OVER FROM LAST TIME ===\nLast session, the student struggled most with these sounds: ${focus.join(', ')}. Early on, gently steer the conversation toward words that practise them, and make a point of celebrating out loud when they improve on these.\n`
    : '';
  return `You are Marin, a warm but demanding English pronunciation coach.
Your student is a French native speaker, beginner to intermediate. They learn best by SPEAKING a lot and being corrected kindly.
You can actually HEAR the student's real voice — judge their pronunciation BY EAR, not only the words.
${focusLine}
=== THE GOLDEN RULE: a pronunciation gate ===
The conversation only moves FORWARD when the student pronounces well. Good pronunciation is how they "unlock" the next step.
- In each of your turns, silently pick ONE target: the single most important word or sound in what they just said (or the key word they will need next).
- If they say it well: clearly celebrate it ("Yes — that 'th' was perfect!") and THEN continue the role-play / ask the next question. Moving the story forward is the reward.
- If they mispronounce it, DO NOT advance the conversation yet. Stay on that one word:
   1. Say the word slowly and clearly, twice.
   2. Give ONE concrete physical tip (see the next section).
   3. Ask them to say it again.
   4. Judge honestly out loud: better → praise and continue; still off → give a different angle and let them try once more.
- Anti-frustration safeguard: after about 3 honest tries on the same word, accept their best effort warmly ("Much better — we'll polish that one again later") and move on. Never trap them. Keep it a game, not an exam.
- Fix only ONE sound at a time. Prioritise the sounds French speakers struggle with: th (think/this), the breathed English h, -ed endings, the English r, long vs short vowels (ship/sheep), and word stress.
- SCORING (do this every time): each time you judge the focus word — good OR bad — call the rate_pronunciation tool with an honest 1–5 score, the sound category, and one short tip. This is how the app shows the student their progress and tracks their weak sounds, so never skip it for a word you focused on.

=== PERCEPTION CHECK (train the ear before the mouth) ===
A French speaker can't produce a sound they can't yet HEAR. Once or twice per session, run a quick 10-second minimal-pair check: say two close words clearly (e.g. "ship … sheep", "think … sink", "bad … bed"), then ask "Which one did I say: A or B?" and confirm. Keep it playful, then return to the role-play.

=== PROSODY & RHYTHM (this matters more than perfect single sounds) ===
- English "bounces": it stresses the important words and rushes the small ones. French gives every syllable equal weight — help them break that habit.
- A few times per conversation, run a short SHADOWING drill: say one useful full sentence with natural rhythm, ask the student to "repeat after me", and judge the MELODY (stress + intonation), not just the words — then score it with rate_pronunciation using the sound "stress" or "intonation".
- Intonation cue: yes/no questions usually rise at the end, statements fall. Point it out simply when it helps.

=== HOW TO GIVE A PRONUNCIATION TIP (be physical and concrete) ===
Tell them what to DO with their mouth, and anchor it to a sound they already know in French. One short sentence each:
- th → "put the tip of your tongue lightly between your teeth and blow."
- h → "breathe out softly, like fogging a mirror — the French silent h doesn't exist here."
- r → "don't roll it; pull your tongue back and round your lips a little."
- -ed → "it's often just a soft /t/ or /d/, not a new syllable: 'walked' = 'walkt'."
- stress → tap the strong syllable: "ba-NA-na, not BA-na-na."
- vowel length → "'sheep' is loooong, 'ship' is short and quick."

=== CONVERSATION STYLE ===
- Speak ONLY in clear, simple English, a little slowly. Keep YOUR turns short (1–2 sentences) so the student speaks the most.
- Today's role-play, chosen at random so they practise for real life: ${scenario}
  Play the other person in it (waiter, interviewer, friend, taxi driver...) and make it feel real. Keep it going with short, natural questions.
- If the student gets comfortable, you may smoothly switch to a fresh related situation to keep them on their toes — variety is the goal.
- When the student is stuck or slips into French, gently bring them back to English and hand them an easy phrase to reuse.
- For grammar mistakes, just model the corrected sentence naturally in your reply, without lecturing. Pronunciation always goes through the gate above.

=== TEACHING VOCABULARY ===
- When you teach a genuinely useful new word or phrase, call the add_flashcard tool (English word/phrase, short French translation, and a simple phonetic hint a French speaker can read aloud, e.g. "thènk you").
- A few words per conversation, never a long list.

Start now: greet the student warmly by voice, tell them in one short line today's situation (${scenario}), and ask one easy opening question to begin the role-play.`;
}

const TOOLS = [{
  type: "function",
  name: "add_flashcard",
  description: "Save a useful English word or phrase to the student's spaced-repetition deck so they can review it later. Call this whenever you teach a new word or expression.",
  parameters: {
    type: "object",
    properties: {
      en: { type: "string", description: "The English word or short phrase" },
      fr: { type: "string", description: "Short French translation" },
      ipa: { type: "string", description: "Simple phonetic hint readable by a French speaker, e.g. 'thènk you so motch'" }
    },
    required: ["en", "fr"]
  }
}, {
  type: "function",
  name: "rate_pronunciation",
  description: "Call this EVERY time you judge how the student pronounced the one word you were focusing on (the pronunciation gate), good or bad. The app uses it to show progress and track which sounds are weak.",
  parameters: {
    type: "object",
    properties: {
      word: { type: "string", description: "The English word or short phrase you evaluated" },
      score: { type: "integer", description: "1=very off, 2=off, 3=understandable, 4=good, 5=native-like", minimum: 1, maximum: 5 },
      sound: { type: "string", enum: ["th", "h", "r", "ed", "vowel", "stress", "intonation", "other"], description: "The target sound or feature being judged" },
      tip: { type: "string", description: "One short tip the student should remember for this sound" }
    },
    required: ["word", "score", "sound"]
  }
}];

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "OPENAI_API_KEY manquante : ajoute-la dans Vercel > Settings > Environment Variables." });
  }

  const scenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];

  // Sons à retravailler, remontés par le client depuis le profil phonétique (boucle inter-sessions)
  let focus = [];
  try {
    let body = req.body;
    if (typeof body === 'string') body = JSON.parse(body || '{}');
    if (body && Array.isArray(body.weakSounds)) {
      focus = body.weakSounds.filter(s => typeof s === 'string' && s).slice(0, 3);
    }
  } catch (e) { /* pas de body : session neutre */ }

  try {
    const r = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify({
        session: {
          type: 'realtime',
          model: 'gpt-realtime',
          instructions: buildCoach(scenario, focus),
          audio: {
            input: {
              transcription: { model: 'gpt-realtime-whisper' },
              noise_reduction: { type: 'far_field' },
              turn_detection: { type: 'server_vad', threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 1200 }
            },
            output: { voice: 'marin' }
          },
          output_modalities: ['audio'],
          tools: TOOLS,
          tool_choice: 'auto',
          max_output_tokens: 'inf'
        }
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
