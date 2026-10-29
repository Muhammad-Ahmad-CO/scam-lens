# ScamLens

**What it is:** Paste any shady SMS or WhatsApp message (or upload a screenshot or voice note). ScamLens shows you the traps in the message and tells you what to do, in your own language.

**What it is not:** It never gives financial or legal advice, and it never says a message is "safe".

## Run it on your computer

1. Install Node.js (version 18 or newer).
2. Open a terminal in this folder and run:
   ```
   npm install
   ```
3. Copy `.env.example` to a new file named `.env.local`, then open `.env.local` and put in your real keys.
4. Start the app:
   ```
   npm run dev
   ```
5. Open http://localhost:3000 in your browser.

## Test the AI connection

After your keys are set, open this page in your browser:

```
http://localhost:3000/api/hello
```

If the keys work, you get back `{"status":"ok","model":"..."}`. If a key is missing or wrong, you get a clear error message instead.

## Vercel setup (deploy)

1. Push this folder to a new public GitHub repo (paste files with the GitHub web editor — never type a full file path after a pre-filled link, and watch out for the leading dot on `.github`).
2. On Vercel, import the repo.
3. In the Vercel dashboard, go to Settings → Environment Variables and add:
   - `AI_PROVIDER` = `meta` or `baseten`
   - `META_API_KEY` = your Meta API key (needed when `AI_PROVIDER=meta`)
   - `BASETEN_API_KEY` = your Baseten API key (needed when `AI_PROVIDER=baseten`)
   - `BASETEN_MODEL` = `meta-models/muse-spark-open` (default if empty)
4. Deploy. Keys stay server-side — they are never sent to the browser.

## Project plan

- Day 1: scaffold + provider test (`/api/hello`) — this folder.
- Day 2: text pipeline — paste message → Spark analysis → verdict card.
- Day 3: photo and voice-note inputs.
- Day 4: "scam anatomy" explainer image + recheck.
