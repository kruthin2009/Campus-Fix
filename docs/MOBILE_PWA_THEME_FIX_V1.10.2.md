# CampusFix V1.10.2 — Mobile/PWA Theme Fix

## Problem observed
The installed mobile/PWA screenshots showed a dark page with a light public navigation header, causing low contrast and an unfinished visual transition. The installed iPhone experience also used static browser/PWA chrome metadata, and the mobile hero dashboard illustration could crowd the headline.

## Fixes
- Added explicit dark-theme styling for the public navigation/header, brand, login button, theme toggle and install button.
- Added dynamic `theme-color` synchronization when the user switches between light and dark themes.
- Added dynamic iOS `apple-mobile-web-app-status-bar-style` synchronization.
- Added `viewport-fit=cover` and safe-area-aware layout support.
- Added an Apple touch icon link for the installed experience.
- Improved mobile hero spacing and reduced dashboard-card scale so the visual does not compete with the headline.
- Improved narrow-screen CTA layout and footer safe-area spacing.
- Made the install dialog readable in dark mode.
- Bumped the service-worker shell cache from r3 to r4 so installed PWAs can receive the new CSS/metadata instead of keeping the previous shell.
- Updated the manifest's light default theme/background colors; runtime `theme-color` is synchronized by the ThemeContext.

## Deployment
This is a source-code patch to the already deployed V1.10.2 application. After replacing the project files, push the changes to GitHub `main` and let Vercel create a new deployment. No Firebase data migration is required.

## Important PWA testing step
After deployment on iPhone, if the old installed app still shows the previous header, remove the old CampusFix Home Screen icon and add CampusFix to the Home Screen again from Safari. This ensures the updated PWA shell is installed cleanly.
