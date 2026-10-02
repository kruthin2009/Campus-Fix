# CampusFix — Human UI Pass

This version keeps the existing CampusFix functionality but tones down the "AI-generated" look.

### What changed
- More natural, campus-product wording.
- Removed unnecessary "AI", "intelligence", "predictive" and marketing-heavy labels from the admin tools.
- Calmer typography and spacing.
- Fewer gradients, glows, floating effects and oversized pills.
- More practical admin language such as **Open Requests**, **Needs Attention**, **Related Requests**, and **Recurring Issues**.
- Public homepage now reads like a real campus service rather than an AI demo.
- Existing Firebase/Auth/Firestore workflows are preserved.

### Important
The source was packaged after the visual changes. A production build could not be completed in this environment because `npm install` timed out, so run `npm install` and `npm run build` locally before deploying.
