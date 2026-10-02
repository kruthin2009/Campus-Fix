# CampusFix V1.10.2 — Final QA Report

## Release scope
This release includes the final requested administrative-role, announcements, dark-theme, policy-navigation, tower-photo, PWA-installation and version-visibility updates.

## Automated/static checks
| Check | Result |
|---|---|
| package.json version | PASS — 1.10.2 |
| package-lock version | PASS — 1.10.2 |
| TypeScript/TSX parser | PASS — 64 files, 0 parse diagnostics |
| Secret scan | PASS |
| Internal route/link checker | PASS |
| Administrative role type | PASS |
| Administrative route protection | PASS |
| Add Administrator name + email workflow | PASS |
| Dedicated Administrative Announcements page | PASS |
| Announcement Firestore read rule for signed-in users | PASS |
| Firestore administrative role privilege | PASS |
| Storage administrative role privilege | PASS |
| Policy routes | PASS |
| Version visible in public home | PASS |
| Version visible in signed-in portal | PASS |
| Dark-theme readability overrides | PASS |
| PWA 192x192 icon | PASS |
| PWA 512x512 icon | PASS |

## Important deployment check
A full production `npm run build` was not executed in this environment because dependency installation could not complete. The release therefore does not claim a production-build PASS. Run `npm ci && npm run build` on the deployment machine before publishing.

## Firebase rules
The package contains updated `firestore.rules` and `storage.rules`. The rules are not deployed from this environment because the Firebase CLI/authentication is not available here. Deploy with:

```powershell
firebase login
firebase use campusfix-52445
firebase deploy --only firestore:rules,storage
```

## Administrative account behavior
Existing `admin` accounts remain supported. New accounts created from **Administrative Portal → Settings → Add Administrator** receive the `administrative` role. The form requires only name and email. A random temporary Firebase password is generated internally and a Firebase password-reset email is sent to the new administrator.

## Student announcements
After the Firestore rules are deployed, signed-in students can read the `announcements` collection. The dedicated Administrative Portal announcement screen writes announcements through the administrative role.

## Policy navigation
Public and signed-in footers expose Policy Center, Privacy, Terms and Rules. The full Policy Center also links to security, cookies/analytics, data retention, accessibility, privacy requests and governance.
