## V2.0.5 — Final usability, AI severity and account recovery pass

- Mobile portal top bar and dashboard spacing improved; controls wrap safely on narrow screens.
- Theme-aware AI suggestion surfaces and readable success/error/info toast notifications added for both light and dark themes.
- Complaint submission now attempts AI classification automatically and saves the returned category and priority. If the AI endpoint is unavailable, submission continues with the student's chosen values and shows a clear notice.
- Forgot-password route retained and reset-email screen copy/autofill improved; Firebase Authentication continues to send the secure reset email.
- Firestore student self-registration rules now constrain profile fields and validate required student profile values; student self-updates cannot change account identity or role.
- Existing portal features, complaint workflow, navigation and branding are retained.
- Local production build and live Firebase deployment must be run against the target environment before release sign-off.

# CampusFix — Version history

## V2.0.4 — Policy Draft Integration & Theme Contrast Refinement
- Integrates a visible controlled-draft status across policy pages and the policy center.
- Replaces stale V1.10.2 policy review labels with the supplied documentation preparation date (08 November 2026).
- Clarifies that launch checklist entries are verification tasks, not completed certifications.
- Preserves unresolved institution/contact placeholders and does not invent retention periods, effective dates, legal approvals or security certifications.
- Improves dark/light theme contrast tokens, policy-page readability, form/control surfaces and keyboard focus visibility through theme-aware CSS overrides.
- Makes theme preference storage failure-tolerant; the selected theme still applies for the current session when local storage is unavailable.
- Updates application release labels and package metadata to V2.0.4.
- Verification status: source-level edits prepared. Production build, cross-browser visual review, live Firebase/rules testing and deployment are not yet verified.

## V2.0.2 — Homepage Refresh & Windows Secret-Scan Fix
- Retains the V2.0.1 public homepage and visual refresh.
- Fixes the secret-scan self-exclusion so it works on both Windows and POSIX paths by comparing normalized absolute paths.
- Updates package metadata and release labels to V2.0.2.
- Verification: secret scan, release-structure check, and internal route check pass in the packaging environment. A full TypeScript/Vite build and live Firebase testing still require local dependency installation and environment access.

## V2.0.1 — Public Homepage & Visual Identity Refresh
- Rebuilt the public root page as a proper product homepage with a clear value proposition, responsive navigation, workflow overview, public live-data summary, role-based workspace entry points, and policy links.
- Replaced the previous generic landing-page styling with a cohesive visual system: slate/navy foundations, blue and mint accents, stronger typography, refined cards, and responsive spacing.
- Ensured `/` always renders the public homepage. Signed-in users can use the role-aware workspace CTA; protected portal routes and role authorization remain in place.
- Updated portal navigation, login release label, footer, package metadata, and release check to V2.0.1.
- No sample complaint counts or performance values are hard-coded. Live metrics remain dependent on the public Firestore snapshot.
- Verification: secret scan, release-structure check, and internal route check pass. Production build and live Firebase/browser testing remain pending.

## V2.0.0 — Final Integration & Release Package
- Integrated the V1.11.0–V1.18.0 feature work and release checks.
- Package was prepared, but production build and Firebase verification were not certified.

## V1.18.0 — UI & Branding
- Shared design tokens, portal chrome, navigation, forms, tables, landing-page surfaces, and responsive refinements.

## V1.17.0 — Security & Reliability
- Firebase Storage and Firestore rules refinements. Emulator and production verification remained pending.

## V1.11.0–V1.16.0 — Feature phases
- Student experience, worker portal, admin command centre, AI advisory integration, descriptive predictive insights, and campus intelligence work. Refer to the phase changelog files for scope and verification boundaries.


## V2.0.4 hotfix — Admin reopen-request imports
- Fixed missing imports for `listReopenRequests`, `reviewReopenRequest`, and the `ReopenRequest` type in `AdminComplaintDetailPage.tsx`.
- No runtime behavior or unrelated features changed.
- Production build must be rerun locally after dependency installation.


## V2.0.6 — Final Worker, Media & AI News Release
- Added worker-facing announcements and maintenance schedule views, plus a dedicated latest AI news feed sourced through a cached serverless RSS endpoint.
- Added worker dashboard quick links and workflow guidance; administrators can target announcements to everyone, students or workers. Student and worker announcement views filter by audience and active dates.
- Made selected complaint and completion photos fail visibly if storage fails instead of silently discarding the selected image. Images are validated and resized/compressed to WebP where supported before upload.
- Storage locations: student evidence at `reports/{studentUid}/{timestamp}-{filename}`; worker completion evidence at `reports/{reportId}/completion-{timestamp}-{filename}`. The existing Storage rules enforce student ownership and worker/team assignment.
- Added a 15-minute shared cache for the AI news RSS endpoint and long-lived caching for immutable uploaded images.
- Verification boundary: source edits and static release checks only; production TypeScript/Vite build, Firebase Storage/Firestore emulator tests, real-device upload tests and Vercel deployment must be completed in the project environment. No zero-lag guarantee is made.


## V2.0.7 — Runtime, API and Theme Reliability Hotfix
- Service worker now bypasses API routes and no longer caches the application HTML shell or arbitrary GET responses; this prevents stale application bundles and cached SPA responses from breaking AI/news JSON parsing.
- AI and AI-news clients now validate response bodies before parsing and show actionable endpoint errors rather than raw JSON parser exceptions.
- Refined the shared light/dark design tokens to use softer slate surfaces and restrained blue accents instead of near-black/white extremes.
- Admin reopen-request imports were already present in the supplied source; the service-worker update strategy addresses stale deployed bundles as a likely cause of the browser runtime showing an older missing-function error.

- Firestore reopen-request reads now permit the owner of the parent complaint to query their own request subcollection; this fixes a rules/query mismatch where the client filters by pending status but Firestore rules required an additional requestedBy filter. Admin review remains role-restricted.
