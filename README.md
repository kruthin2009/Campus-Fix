# CampusFix V2.1.0 — Campus operations

CampusFix is a role-based campus service platform for students, workers and administrators. This release removes AI-dependent features and keeps the operational workflow manual, transparent and Firebase-backed.

## Core workflows
- Student complaint submission, photo evidence, status tracking and feedback
- Worker assignments, progress updates and completion evidence
- Administrative management of towers, departments, workers, teams, complaints and users
- Announcements, notifications, maintenance schedules and operational reporting
- Light/dark themes and responsive portal layouts

## Local setup
1. Install Node.js 20.19+ or 22.12+ (Vite 8 requirement).
2. Copy `.env.example` to `.env.local` and fill in the Firebase web app configuration.
3. Run `npm ci`.
4. Run `npm run dev`.

## Release checks
Run `npm run check:release`, `npm run check:links`, and `npm run build` before deployment.

## Deployment
The frontend is designed for Vercel. Configure the Firebase `VITE_FIREBASE_*` values in the Vercel project environment for both Preview and Production as needed. Deploy Firestore and Storage rules separately using the Firebase CLI after reviewing them. Never commit `.env.local`, service-account keys or private credentials.

## Service configuration
This release does not use AI provider keys or AI service endpoints. Complaint categories and priorities are selected by the student and reviewed by administrators. The Worker Portal contains only assigned work, complaint progress, announcements and maintenance schedules.
