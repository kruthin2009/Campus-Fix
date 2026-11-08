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
