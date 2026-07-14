# washee — `/booking` (mvp v0)

The live booking funnel at **`/booking`** on the landing site. A customer taps **Book a wash**,
enters their **phone** and **address**, and the booking is delivered to the ops **Telegram** group.

Delivery goes through a **serverless function** (`../api/book.js`) so the bot token stays
server-side and **never ships to the browser**:

```
Browser  ──POST /api/book { phone, address, lang, tier }──►  /api/book (Vercel)  ──►  Telegram
                                                    reads WASHEE_BOT_TOKEN / WASHEE_CHAT_ID (env)
```

It shares state with the landing page through `localStorage`:

- **Language** (`washee.lang`, EN/VI) carries over from the landing toggle — a header toggle here
  too, auto-detected from the browser on first visit. The message notes the customer's language
  (`🗣 Language: VI/EN`) so ops knows which language to call back in.
- **Currency** (`washee.currency`, VND/USD) is read only to price a pre-selected wash on screen.
- **Tier** — a landing tier CTA can pre-select a wash by linking here with **`?tier=glow`** or
  **`?tier=plus`**. The picked wash + price shows above the form and the server adds a
  `🧼 Wash: Glow Plus (400k₫)` line (always native VND for ops). With no `?tier`, it's the generic funnel.

## Configuration (Vercel env)

The function needs two env vars — set them in **Vercel → Project → Settings → Environment
Variables** for production:

| Var | Value |
|-----|-------|
| `WASHEE_BOT_TOKEN` | BotFather HTTP API token |
| `WASHEE_CHAT_ID` | destination chat id (the "Washee" ops group, e.g. `-5507928337`) |

For **local development**, copy `../.env.example` → `../.env` (landing root, git-ignored) and fill
it in; `vercel dev` loads it automatically.

If the env vars are missing, `/api/book` returns `500 { error: "not_configured" }` and the page
shows a friendly "Booking unavailable" notice instead of sending.

## Run locally

The booking **send** needs the serverless function, so run it under Vercel:

```sh
cd landing
npm i -g vercel      # once
vercel dev           # serves the static site + /api/book, open http://localhost:3000/booking/
```

Static-only preview (UI, i18n, tier chip — **no** live send) also works with any static server:

```sh
cd landing && python3 -m http.server 8848   # http://localhost:8848/booking/
```

## Deploy

Push the `landing` repo and import it into Vercel (framework preset: **Other**, no build step).
Vercel serves the static files and turns `api/*.js` into serverless functions automatically. Set
the two env vars above and the site goes live — no token in the client, nothing to generate.

## Security

The bot token is a **server-side secret** (Vercel env var), never exposed in page source. `.env`
is git-ignored; only `.env.example` (empty markers) is committed. Rotate the token anytime via
BotFather → `/revoke`. The washee Go backend also has a server-side Telegram notifier
(`../../backend/internal/notify/telegram.go`) for the full product.
