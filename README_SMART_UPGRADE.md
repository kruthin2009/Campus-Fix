# CampusFix Smart Upgrade

This package is based on the CampusFix Worker Firestore Permission Fix build.

## Added
- Admin Smart Center with live Firestore operational metrics.
- Explainable AI-assisted complaint triage (runs locally, no API key required).
- Potential duplicate complaint detection based on location/text similarity.
- Predictive-maintenance signals from complaint history.
- QR reporting link workflow (copyable HTTPS entry URL for QR generation).
- Existing real-time complaint subscriptions and notification system remain intact.
- Existing authentication, admin/student/worker routing and Firestore security rules are preserved.

## Important production notes
- The triage engine is deterministic/local rather than a hosted LLM. It is intentionally safe to deploy without an AI secret.
- The QR panel provides the exact HTTPS link to encode. A real QR image can be generated with any QR encoder; no external QR service is embedded.
- True push notifications require FCM/service-worker setup and browser permission. The existing in-app Firestore notification system remains available.
- Multi-college tenancy requires a schema migration and tenant-aware Firestore rules; it is not silently enabled because that would risk existing campus data isolation.
