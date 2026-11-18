# CampusFix deployment environment

CampusFix uses Firebase Authentication, Cloud Firestore and Firebase Storage directly from the browser.

Configure these Vite environment variables in local `.env.local` and in Vercel for each deployment environment:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

There are no AI provider keys or AI server endpoints in this release. The complaint category and priority are selected manually.

After changing Vercel environment variables, trigger a new deployment. Confirm Firebase Authentication authorized domains include the deployed hostname. Review and deploy the checked-in Firestore and Storage rules separately using the Firebase CLI.


## Remove old AI environment variables
This application release does not read AI provider credentials. Remove obsolete `AI_*`, `OPENAI_*`, `GEMINI_*`, and `ANTHROPIC_*` entries from the local `.env.local` file and from the Vercel project's Development, Preview, and Production environment settings. Keep the `VITE_FIREBASE_*` settings required by the Firebase client. Do not commit `.env.local`. Redeploy after changing Vercel settings.
