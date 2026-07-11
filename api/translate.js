// api/translate.js — traduit EN -> FR une courte phrase (transcription de la coach).
// Clé côté serveur, modèle texte bon marché. Appel : GET /api/translate?q=...

export default async function handler(req, res) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return res.status(500).json({ error: 'OPENAI_API_KEY manquante' });

  const text = ((req.query && req.query.q) || '').toString().slice(0, 500);
  if (!text) return res.status(400).json({ error: 'param q requis' });

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'Translate the user message from English to natural, simple French. Output ONLY the French translation, nothing else.' },
          { role: 'user', content: text }
        ]
      })
    });
    const d = await r.json();
    if (!r.ok) return res.status(r.status).json(d);
    const fr = (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content || '').trim();
    return res.status(200).json({ fr });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
}
