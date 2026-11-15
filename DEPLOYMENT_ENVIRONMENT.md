# CampusFix environment variables

## Local development

Create `.env.local` on your own computer. Never upload it to GitHub or share its contents in chat.

Use the Firebase web configuration values already used by `src/firebase/config.ts` (the `VITE_FIREBASE_*` variables). For server-side AI routes, configure the server-side OpenAI secret in your local `.env.local` and in Vercel Project Settings → Environment Variables. Do not prefix the OpenAI key with `VITE_`.

`FIREBASE_WEB_API_KEY` and `FIREBASE_PROJECT_ID` are only needed if the server-side API implementation reads those exact names. Check `api/ai.ts` before setting them.

## GitHub

`.env`, `.env.local`, and other `.env.*` files are ignored by `.gitignore`. Commit `.env.example` with placeholder values only.

## Vercel

Set production secrets in Vercel Project Settings → Environment Variables, then redeploy. Never commit secrets to the repository.
