# CampusFix

Campus Complaint & Maintenance Management System — React + TypeScript + Vite,
running entirely on Firebase Authentication + Firestore on the **no-cost
(Spark) plan**. No Firebase Storage, no Cloud Functions, no fake data.

## Portals

- **Admin** (`/admin`) — towers, departments, workers, teams, complaints,
  notifications, users, settings.
- **Worker / Operations** (`/worker`) — assigned work, progress updates,
  completion.
- **Student** (`/student`) — select a tower, raise a complaint, track it,
  review completed work.

## 1. Firebase project setup

1. Create a project at https://console.firebase.google.com (Spark/free plan
   is sufficient — do **not** enable Storage).
2. Enable **Authentication → Sign-in method → Email/Password**.
3. Enable **Firestore Database** (production mode).
4. In Project Settings → General → "Your apps", add a Web app and copy the
   config values.
5. Copy `.env.example` to `.env` and fill in the six `VITE_FIREBASE_*`
   values.

## 2. Deploy security rules and indexes

```bash
npm install -g firebase-tools   # if you don't have it
firebase login
firebase use --add              # select your project
firebase deploy --only firestore:rules,firestore:indexes
```

`firestore.rules` and `firestore.indexes.json` are both checked in and
already wired up via `firebase.json`.

**About indexes:** the indexes file covers every query pattern the app
actually issues today (each single filter on `reports` combined with the
`createdAt` sort, plus the `users`/`notifications`/`towers`/`departments`/
`workerTeams` queries). If you combine **multiple** filters at once on the
Admin → Complaints page (e.g. tower + status + priority together), Firestore
will ask for one additional composite index the first time that exact
combination runs — this is normal Firestore behavior, not a bug, and the
error in the browser console contains a direct link to create it in one
click.

## 3. Create your first admin account

There is deliberately **no** self-service way to become an admin — a new
sign-up is always a student, and worker accounts can only be created by an
existing admin. To bootstrap the very first admin:

1. Sign up as a student (or create any account) to get a Firebase Auth UID.
2. In the Firebase Console → Firestore, open that user's document at
   `users/{uid}` and manually change `role` to `"admin"` (Console writes
   bypass Firestore rules, so this is safe and is the intended one-time
   bootstrap path).
3. Sign in — you'll land in the Admin Portal. From there, use
   **Settings → Grant Admin Access** to promote any further admins by UID
   without touching the console again.

## 4. Local development

```bash
npm install
npm run dev
```

## 5. Production build

```bash
npm run build      # tsc -b && vite build — output in dist/
npm run preview    # serve the production build locally
```

## Architecture notes

- **Photos are fully optional everywhere** (complaint photos, completion
  photos, tower photos) because this app runs without Firebase Storage. All
  photo logic is isolated in `src/services/mediaService.ts` — flipping
  `MEDIA_UPLOAD_ENABLED` to `true` and implementing `uploadImage`/
  `deleteImage` against `firebase/storage` is the *only* change needed to
  turn photo upload on later; no other file references Storage.
- **Firestore schema**: `users`, `towers`, `departments`, `workerTeams`,
  `reports` (with a `reports/{id}/updates` timeline subcollection), and
  `notifications` — see `src/types/models.ts` for the exact shape of every
  document.
- **Security model**: enforced in `firestore.rules`, matching the actual
  read/write calls in `src/services/*.ts` field-for-field (see the comments
  in the rules file for the reasoning behind each block). Every collection
  name and role string (`admin` / `operations` / `student`) used in the
  service layer was cross-checked against the rules file before this build
  was finalized.
- **Errors**: every service function funnels thrown errors through
  `src/utils/errors.ts`, which maps raw Firebase/network errors to
  user-facing copy. No screen shows a raw Firebase error message.

## What has and hasn't been verified

This was built and verified using the local toolchain:

- ✅ `npm run build` (`tsc -b` in `strict` mode, with `noUnusedLocals` /
  `noUnusedParameters` on, then `vite build`) completes with **zero**
  TypeScript errors and zero dead code.
- ✅ `oxlint` completes with zero correctness errors (the only warnings are
  a React "fast-refresh" style note on two context files and a "setState in
  effect" note on the standard `useEffect(() => { load() }, [])` data-fetch
  pattern used throughout — both are stylistic, not bugs).
- ✅ Every Firestore collection name, every document field name, and every
  role string was grepped across the service layer and cross-checked
  against `firestore.rules` for an exact match.
- ✅ Every route defined in `App.tsx` was checked against every `<Link>` /
  `navigate()` call that targets it.
- ✅ Traced by hand: a complaint can be submitted with `photoFile: null`
  through to a successful Firestore write with no code path that requires a
  photo.

- ⚠️ **Not verified**: actually running the three portals against a live
  Firebase project. This sandbox has no network access to
  `firebaseapp.com` / `googleapis.com`, so the end-to-end flows in section
  14 of the brief (sign up → raise complaint → assign → complete → review,
  and the security-rule denial cases) are correct by inspection and matched
  against the rules logic, but have not been exercised against a real
  Auth + Firestore backend. Before treating this as fully verified, run
  through the Section 14 test list yourself against your Firebase project —
  I'd recommend starting with: register a student, log in as the admin you
  bootstrapped, create a department/tower/worker/team, assign a submitted
  complaint, and confirm the worker and student see exactly what they're
  supposed to and nothing else.
