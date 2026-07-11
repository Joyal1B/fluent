# Fluent

> **Talk to an English coach in real time — right in the browser.**
> Low-latency voice via the OpenAI Realtime API over **WebRTC**, with spaced-repetition (SRS) to lock in what you learn.

![webrtc](https://img.shields.io/badge/voice-WebRTC-36e0ff?labelColor=0b1220) ![realtime](https://img.shields.io/badge/OpenAI-Realtime%20API-8b5cf6?labelColor=0b1220) ![deploy](https://img.shields.io/badge/deploy-Vercel-0b1220) ![keys](https://img.shields.io/badge/API%20key-server--side%20only-brightgreen?labelColor=0b1220)

A single-page app: you speak, the model answers back in natural voice with near-zero lag. No install, no plugin — just a mic and a browser.

## How it works

```
 Browser ──WebRTC (audio)──▶ OpenAI Realtime API
    │                              ▲
    └── GET /api/session ──────────┘   ← mints a short-lived EPHEMERAL token
                                         (your real OPENAI_API_KEY never leaves the server)
```

- **`api/session.js`** — serverless endpoint that mints an ephemeral Realtime token. **The real API key stays server-side and never touches the browser.**
- **`api/translate.js`** — on-demand translation helper.
- **`index.html`** — the full client: WebRTC session, mic capture, live transcript, and the spaced-repetition layer.

## Run it

Deploy to Vercel (or any Node serverless host) and set one env var:

```
OPENAI_API_KEY = sk-...   # server-side only — never commit it
```

That's it. Open the page, allow the mic, start talking.

---

<sub>Built by **Sam The SpaceJoker** · [NullAgency.on](https://nullagency.online). No credentials in this repo — the key lives only in the host's environment variables.</sub>
