import { Link } from "react-router-dom";

export function PrivacyPolicyPage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link to="/" className="legal-back">← Back to CampusFix</Link>
        <p className="public-kicker">CAMPUSFIX</p>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">V1.10.2 · Last updated: October 2026</p>
        <section><h2>What CampusFix stores</h2><p>CampusFix stores account information and complaint information needed to operate the campus maintenance service. Depending on the role, this can include your name, email, admission or worker details, tower, complaint description, status and optional complaint photos.</p></section>
        <section><h2>Why we use it</h2><p>We use this information to authenticate users, route complaints, assign work, show complaint status and maintain an operational record.</p></section>
        <section><h2>Who can see complaint information</h2><p>Access is controlled by the user's CampusFix role and Firestore security rules. Public pages should only expose non-identifying operational statistics and activity.</p></section>
        <section><h2>Photos</h2><p>Complaint photos are optional. A complaint can be submitted without a photo. If photo storage is enabled, selected images are uploaded only when the user chooses to attach one.</p></section>
        <section><h2>Analytics</h2><p>CampusFix may use privacy-conscious deployment analytics to understand page performance and general usage. Analytics should not be used to collect sensitive complaint content.</p></section>
        <section><h2>Your choices</h2><p>You can choose whether to allow optional analytics in the site notice. For account or data questions, contact the campus administrator responsible for CampusFix.</p></section>
        <p className="legal-note">This page is a project-level privacy notice, not legal advice. The university or deploying organization should review and customize it before production use.</p>
      </div>
    </main>
  );
}
