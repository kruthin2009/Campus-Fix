# CampusFix V1.10.2 — Final Deployment Notes

## Included fixes
- Dark-theme text/readability corrections.
- Administrative Portal label and role support.
- New `administrative` role alongside legacy `admin`.
- Add Administrator form requires only name + email; a Firebase password-reset email is sent.
- Dedicated Administrative Portal > Announcements page.
- Student announcement read access in Firestore rules.
- Tower photo support retained.
- Policy Center routes and footer links verified.
- V1.10.2 visible on public home, signed-in portal header/footer, policy pages and release metadata.
- PWA manifest/service worker/icons retained.

## Firebase rules deployment
From the project directory, after installing/authenticating the Firebase CLI:

```powershell
firebase login
firebase use campusfix-52445
firebase deploy --only firestore:rules,storage
```

The rules file now treats both `admin` and `administrative` as privileged administrative roles. The `announcements` collection is readable by signed-in users and writable only by administrative users.

## Website deployment
For a Vercel deployment:

```powershell
npm ci
npm run build
vercel --prod
```

Or use the connected GitHub/Vercel project and deploy the commit after the local build passes.

## Required environment variables
Copy `.env.example` to `.env` locally and configure the same values in the production host, including `VITE_FIREBASE_STORAGE_BUCKET` because tower-photo uploads use Firebase Storage.

## First administrator setup
An existing `admin` or `administrative` user opens **Administrative Portal → Settings → Add Administrator**, enters the new administrator's name and email, and confirms. The new Firestore profile receives role `administrative`; Firebase sends the password-reset email.

## Student announcements
After deploying `firestore.rules`, a signed-in student can open **Student Portal → Announcements**. If an older deployment still shows “Firebase denied this operation”, sign out/in once and clear the old service-worker cache by refreshing the deployed site.

## Policies
Public routes:
- `/policies`
- `/privacy`
- `/terms`
- `/policies/rules`
- `/security`
- `/cookies`
- `/data-retention`
- `/accessibility`
- `/privacy-requests`
- `/policies/governance`

## QA performed for this release
- 64 TS/TSX source files parsed with 0 TypeScript parser diagnostics.
- Secret scan passed.
- Internal route/link check passed.
- PWA 192×192 and 512×512 icons verified.
- Package version and lockfile checked as 1.10.2.
- Administrative role checks and routes inspected.
- Firestore and Storage rules inspected for administrative role support.
- Policy routes and public/signed-in navigation links inspected.

A full production `npm run build` was not executed in this environment because the provided environment could not complete dependency installation. Run `npm ci && npm run build` on the deployment machine before publishing.
