# CampusFix V2.0.6 — Final Worker, Media & AI News Release

## Included
- Existing student, worker and administrator portals and complaint workflows retained.
- Worker dashboard quick links, workflow guidance, worker-targeted announcements and maintenance schedule view.
- Latest AI news headline feed through a cached serverless RSS endpoint; original publisher links are shown.
- Complaint and completion image uploads validate type/size, optimize large images where supported, and surface upload failures instead of silently dropping selected photos.
- Student announcement feed is limited to active all-campus/student notices; worker feed is limited to active all-campus/worker notices.
- Administrator announcement form supports everyone, students only or workers only.

## Image storage
- Student attachments: `reports/{studentUid}/{timestamp}-{filename}`.
- Worker completion evidence: `reports/{reportId}/completion-{timestamp}-{filename}`.
- Firebase Storage is the file store. Firestore stores the resulting download URL on the complaint/resolution record.
- Confirm the Firebase Storage bucket setting in Vercel and deploy the included `storage.rules` to the intended Firebase project.

## AI news
- `/api/ai-news` retrieves Google News RSS results and uses a 15-minute shared cache.
- The feed is dependent on an external provider. If unavailable, the rest of CampusFix remains usable.

## Deploy
```powershell
npm ci
npm run check:release
npm run check:links
npm run build
firebase use
firebase deploy --only firestore:rules,storage
```

Configure the existing server-side AI provider credential and Firebase project settings in Vercel. Never expose private credentials through client-side `VITE_` variables. After successful build and rules tests, deploy through the configured production branch.

## Verification boundary
Source edits are packaged. Full TypeScript/Vite build, live Firebase Storage and Firestore tests, mobile device QA and Vercel production deployment are not certified from this packaging environment. A zero-lag guarantee is not technically possible; validate performance on real devices and campus network conditions.
