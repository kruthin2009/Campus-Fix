# V1.10.2 Final Announcements Fix Checklist

- [x] `announcements` Firestore reads require an authenticated CampusFix user profile (`hasUser()`).
- [x] `admin` and `administrative` roles can create, update and delete announcements.
- [x] Student Portal has `/student/announcements`.
- [x] Administrative Portal has `/admin/announcements`.
- [x] Add Announcement remains in the Administrative Portal.
- [x] Error message now identifies the V1.10.2 rules deployment and profile requirement.
- [x] Deployment helper included: `DEPLOY_FIREBASE_V1.10.2.ps1`.
- [x] Firebase project alias is `campusfix-52445`.

## Required one-time deployment

From the extracted project folder in PowerShell:

```powershell
firebase login
firebase use campusfix-52445
firebase deploy --only firestore:rules,storage
```

Then sign out/in to CampusFix and test both announcement pages.
