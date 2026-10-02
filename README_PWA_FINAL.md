# CampusFix — Final PWA / Policy Package

## Terms & Conditions
The website `/terms` page has been updated to match the supplied CampusFix Policies & Launch Documentation (Version 1.0), including its draft/pending-organizational-review status and 13 sections.

## Phone installation
- Android/Chrome: open the deployed HTTPS CampusFix site and use **Install App** / **Add to Home screen**.
- iPhone/iPad: open CampusFix in Safari, tap **Share**, then **Add to Home Screen**.
- The package includes a web app manifest, 192px/512px icons, service worker, standalone display mode, install UI, and iOS touch-icon metadata.
- Vercel SPA rewrite is included so direct routes such as `/terms` work after deployment.

## Important
The supplied policy document states that the policies are a draft pending organizational review. The website preserves that status rather than presenting the terms as legally approved.

## Tower photo upload

Admins can now add or replace an optional photo when creating or editing a tower. The image is stored under `tower-images/{towerId}/` in Cloud Storage and displayed on the admin tower card and student tower-selection cards.

Requirements:
- Enable Cloud Storage for the Firebase project.
- Cloud Storage for Firebase currently requires the Blaze pay-as-you-go plan.
- The app accepts JPG, PNG and WebP images up to 5 MB.
- Storage rules restrict tower-image writes and deletes to admin users and require image MIME types.
