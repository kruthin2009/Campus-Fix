import { Link } from "react-router-dom";

export function TermsPage() {
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <Link to="/" className="legal-back">← Back to CampusFix</Link>
        <p className="public-kicker">CAMPUSFIX</p>
        <h1>Terms & Conditions</h1>
        <p className="legal-updated">V1.10.2 · Last updated: October 2026</p>
        <section><h2>Using CampusFix</h2><p>CampusFix is intended for legitimate campus maintenance reporting and operations. Users should provide accurate information and use the service only for issues they are authorized to report.</p></section>
        <section><h2>Accounts</h2><p>Users are responsible for keeping their login credentials private and for using the correct portal. Administrators control role assignment and operational access.</p></section>
        <section><h2>Complaint content</h2><p>Do not submit passwords, financial information, unnecessary personal information or unrelated content in a complaint. Photos should show the issue rather than private information whenever possible.</p></section>
        <section><h2>Service availability</h2><p>CampusFix depends on Firebase, hosting and network services. Temporary outages or maintenance may affect availability.</p></section>
        <section><h2>Administration</h2><p>The deploying campus organization decides how complaints are prioritized, assigned, escalated and closed. CampusFix does not replace official emergency or safety procedures.</p></section>
        <p className="legal-note">This project-level terms page should be reviewed and adapted by the university or deploying organization before production use.</p>
      </div>
    </main>
  );
}
