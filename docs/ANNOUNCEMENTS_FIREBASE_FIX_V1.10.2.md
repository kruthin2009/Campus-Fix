# CampusFix V1.10.2 — Announcement Permission Fix

## What was corrected
- Signed-in users can READ the `announcements` collection.
- Only `admin`, `administrative`, or legacy `administrator` profiles can create, update, or delete announcements.
- The `administrator` role is accepted as a compatibility alias for existing profiles.

## Required production step
Run from the folder containing `firebase.json`:

```powershell
firebase login
firebase use campusfix-52445
firebase deploy --only firestore:rules,storage
```

Then sign out of CampusFix and sign back in. Firebase notes that rules changes can take a short time to propagate, especially to active listeners.

Do not replace the production rules with an open `allow read, write: if true` rule.


### Tower image upload fix
The Cloud Storage rules now recognize `administrator` in addition to `admin` and `administrative`. Deploy both Firestore and Storage rules. Tower images require a working Cloud Storage bucket and a Firebase project on the Blaze plan.
