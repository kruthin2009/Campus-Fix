import { Link } from "react-router-dom";

type Section = { title: string; body: string[] };

const policies: Record<string, { title: string; intro: string; sections: Section[] }> = {
  privacy: {
    title: "Privacy Policy",
    intro: "This project-level privacy policy explains how CampusFix may handle information used to operate campus complaint and maintenance services. Replace the placeholders with the deploying university or organization's approved details before production publication.",
    sections: [
      { title: "Information processed", body: ["Depending on the deployed configuration, CampusFix may process account name, email and role; complaint title, category, tower or location, room or area, description, priority and status; assignment and status history; notifications; technical/security information; and optional complaint photographs."] },
      { title: "Why information is used", body: ["Information is used for authentication, complaint handling, assignment to authorized personnel, status communication, operational records, security, troubleshooting and appropriate aggregate campus-service reporting."] },
      { title: "Role-based access", body: ["Students, workers and administrators should receive only the information and functions required for their roles. Public visitors must not receive private student or complaint records."] },
      { title: "Optional photographs", body: ["Complaint photographs are optional. A complaint must be submitted successfully without a photograph. Upload only relevant images and avoid unnecessary faces, identity documents, personal records or other sensitive material."] },
      { title: "Public information", body: ["Public pages should use only non-identifying operational information. Student names, admission numbers, private emails, phone numbers, private complaint descriptions, private room information and private photographs must not be displayed publicly."] },
      { title: "Third-party services", body: ["The final production policy must list only services actually enabled, such as Firebase for authentication/database or Vercel for hosting. Update this section whenever production services change."] },
      { title: "Cookies and local storage", body: ["Necessary browser storage may support authentication, session behavior and preferences. Optional analytics should be controlled by the site's consent choice."] },
      { title: "Retention", body: ["Actual retention periods for accounts, complaints, photographs, audit/security records and analytics must be approved by the deploying organization. CampusFix does not invent retention periods in this policy."] },
      { title: "Security", body: ["CampusFix should use HTTPS, authentication, role-based authorization, Firestore security rules and appropriate validation. These controls reduce risk but cannot guarantee absolute security. Private service credentials must never be placed in client-side code."] },
      { title: "Privacy requests", body: ["The deploying organization should publish a verified process for applicable access, correction, deletion or other privacy requests, including an official contact and any required identity-verification process."] },
      { title: "Students under 18", body: ["If students under 18 use the service, the deploying organization should obtain specific privacy and legal review for the actual student population and applicable requirements rather than relying on a generic age rule."] },
      { title: "Contact and changes", body: ["Privacy contact: [Official Privacy Email]. Support contact: [Official Support Email]. Material changes should trigger a policy review and an updated effective date."] },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro: "The rules for using CampusFix as a student, worker, or administrator. Draft — pending organizational review.",
    sections: [
      { title: "1. Acceptance of these terms", body: ["By creating or using a CampusFix account, you agree to these Terms & Conditions and to the Acceptable Use Rules. CampusFix is provided by [Official University/Organization Name] for use by its students, maintenance staff, and administrators."] },
      { title: "2. Accounts", body: ["Student accounts are created through the public sign-up page and always start with the \"student\" role — public sign-up can never create an administrative or worker account. Administrative and worker (operations) accounts are created and assigned separately by an administrator, outside the public sign-up flow. You are responsible for keeping your login credentials confidential and for all activity under your account. You must provide accurate information when creating your account (for example, your real room number and student ID) so complaints can be routed and resolved correctly."] },
      { title: "3. Password security", body: ["Choose a strong password and do not share it with anyone else, including roommates or friends. If you believe your account has been compromised, change your password immediately and notify the organization."] },
      { title: "4. Submitting complaints", body: ["Submit genuine maintenance issues, described accurately, with the correct tower, room, and category. A photo is always optional — you are never required to attach one to submit a complaint. Do not submit knowingly false, exaggerated, or duplicate complaints in order to manipulate priority, response time, or another user's workload. Do not use the complaint description or title field to submit content unrelated to a genuine maintenance issue."] },
      { title: "5. Photos", body: ["If you choose to attach a photo, it must relate to the maintenance issue being reported. Do not upload photos that are unnecessary, unrelated, contain other people without their knowledge/consent, or that are otherwise inappropriate. See Acceptable Use for more detail. Photo upload may be unavailable depending on the organization's configuration; complaints must still submit normally in that case."] },
      { title: "6. Responsibilities by role", body: ["Students: Submit genuine, accurately described complaints; provide correct location information; and use your own account only. Workers (operations): Act on assigned complaints in good faith and update status accurately; only record work you actually performed in resolution notes; and do not access complaints or accounts outside your assigned scope. Administrators: Manage towers, departments, teams, and user roles responsibly; assign complaints fairly and in a timely manner; and do not use administrative access to view or share user data outside the legitimate operation of CampusFix."] },
      { title: "7. Service availability", body: ["CampusFix is provided on an \"as available\" basis. [Official University/Organization Name] does not guarantee uninterrupted or error-free operation. Planned maintenance, unplanned outages, and outages caused by third-party providers (Firebase, Vercel) may occasionally make CampusFix temporarily unavailable."] },
      { title: "8. CampusFix is NOT an emergency service", body: ["CampusFix is a maintenance complaint tracking tool. It is NOT an emergency service and must not be used to report fires, medical emergencies, security threats, or any situation requiring an immediate emergency response. In an emergency, contact your local emergency number and/or your institution's emergency/security office directly — do not rely on a CampusFix complaint to get an urgent response."] },
      { title: "9. Prohibited activity", body: ["Attempting to access another user's account or data without authorization. Attempting to bypass, disable, or probe Firebase Authentication or Firestore Security Rules. Uploading malicious files or content designed to exploit or disrupt the service. Submitting spam, automated, or bulk complaints. Attempting to overload or deliberately degrade the service (e.g. via scripted mass submissions). Scraping or automated bulk-extraction of complaint or user data."] },
      { title: "10. Account suspension", body: ["[Official University/Organization Name] may suspend or deactivate an account that violates these terms or the Acceptable Use Rules, including accounts used to submit false complaints, attempt unauthorized access, or otherwise abuse the platform."] },
      { title: "11. Changes to the service and these terms", body: ["Features, workflows, and these terms may change over time as CampusFix is developed further. Continued use of CampusFix after a change to these terms constitutes acceptance of the updated terms."] },
      { title: "12. Termination", body: ["You may stop using CampusFix at any time. The organization may terminate or suspend access for violation of these terms, for a user who is no longer affiliated with the institution, or as otherwise required by its policies."] },
      { title: "13. Contact", body: ["Questions about these terms: [Technical Support Email]"] },
    ],
  },
  rules: {
    title: "Rules Only",
    intro: "Operational rules for safe, fair and responsible use of CampusFix. This page intentionally contains rules only and no signature or approval section.",
    sections: [
      { title: "Account rules", body: ["Use only your own CampusFix account. Never share credentials, impersonate another user, or attempt to access another account."] },
      { title: "Complaint rules", body: ["Submit genuine, accurate and relevant campus maintenance complaints. Use the correct tower, room or area, category and description. Do not knowingly submit false, exaggerated, duplicate or automated complaints."] },
      { title: "Photo rules", body: ["Photos are optional. Upload only relevant images. Do not upload unnecessary faces, identity documents, personal records, malicious files or material you do not have the right to share."] },
      { title: "Role and access rules", body: ["Students may access their own records. Workers may access complaints within their assigned scope. Administrators may perform authorized operational management. Do not attempt to bypass Firebase Authentication or Firestore Security Rules."] },
      { title: "Privacy rules", body: ["Do not disclose student information, complaint details, room information, photos or other private records outside legitimate CampusFix operations."] },
      { title: "Security rules", body: ["Do not probe, disable, bypass or interfere with CampusFix security controls. Do not upload malware or attempt unauthorized access, scraping, bulk extraction or deliberate service disruption."] },
      { title: "Worker rules", body: ["Workers must act only on assigned work, record accurate progress and resolution notes, and avoid accessing or sharing information outside their authorized scope."] },
      { title: "Administrator rules", body: ["Administrators must manage users, towers, departments, teams and assignments responsibly and use privileged access only for legitimate CampusFix operations."] },
      { title: "Emergency rule", body: ["CampusFix is not an emergency service. Fires, medical emergencies, security threats and other urgent situations must be reported through the institution's official emergency channels."] },
      { title: "Enforcement", body: ["Violations may result in account suspension, removal of access or other action under the deploying organization's applicable policies and procedures."] },
    ],
  },
  acceptable: {
    title: "Acceptable Use & Security Rules",
    intro: "These rules apply to everyone using CampusFix and are intended to protect users, campus operations and complaint information.",
    sections: [
      { title: "Account rule", body: ["Use only your own account. Never share credentials or attempt to access another user's account."] },
      { title: "Least privilege", body: ["Access only the information and functions required for your assigned role."] },
      { title: "Complaint integrity", body: ["Submit accurate, relevant campus-service information and do not intentionally manipulate complaint records."] },
      { title: "Privacy", body: ["Never publish private student or complaint information on public pages or external channels."] },
      { title: "Photo rule", body: ["Photos are optional. Upload only relevant images and avoid unnecessary personal data, IDs, documents or faces."] },
      { title: "Admin rule", body: ["Create workers, assignments, departments and role changes only when authorized by the institution."] },
      { title: "Worker rule", body: ["Use complaint data only for assigned or otherwise authorized campus work."] },
      { title: "Security", body: ["Do not bypass Firebase Authentication, Firestore rules, route protection or other authorization controls."] },
      { title: "Abuse prevention", body: ["No spam, malicious uploads, automated flooding, credential abuse or deliberate disruption."] },
      { title: "Incident reporting", body: ["Report suspected account compromise, unauthorized access or security incidents to the official IT/security contact."] },
    ],
  },
  security: {
    title: "Security & Incident Response",
    intro: "CampusFix uses layered controls, but no web application can guarantee absolute security. Security responsibilities are shared by the application operator, administrators and users.",
    sections: [
      { title: "Core controls", body: ["Use HTTPS, Firebase Authentication, role-based authorization, Firestore security rules, input validation and secure deployment configuration."] },
      { title: "Secrets", body: ["Service-account credentials, private API keys and other secrets must never be committed to frontend source code or exposed to browser users."] },
      { title: "Detect", body: ["Identify suspected account compromise, unauthorized access, data exposure, malicious uploads or unusual behavior."] },
      { title: "Contain", body: ["Restrict affected accounts or services as appropriate while preserving information needed for investigation."] },
      { title: "Assess", body: ["Determine affected systems and data and escalate to the organization's responsible IT, security, privacy or leadership contacts as required."] },
      { title: "Recover", body: ["Restore service, rotate credentials where necessary and remediate the underlying issue."] },
      { title: "Review", body: ["Document lessons learned, corrective actions and policy or technical changes."] },
      { title: "Official contact", body: ["Security/IT contact: [Official Security or IT Email]. This placeholder must be replaced before production publication."] },
    ],
  },
  cookies: {
    title: "Cookie & Analytics Notice",
    intro: "CampusFix should use only the browser storage and analytics needed for the deployed configuration.",
    sections: [
      { title: "Necessary storage", body: ["Necessary local storage or browser storage may support authentication/session behavior, theme preference and other essential application functions."] },
      { title: "Optional analytics", body: ["Optional analytics should load only after the user's affirmative consent where the deployment requires consent. Users should be able to decline optional analytics."] },
      { title: "Analytics restrictions", body: ["Analytics must not receive complaint descriptions, student names, admission numbers, phone numbers, private room information, private photographs or other sensitive complaint content."] },
      { title: "Service changes", body: ["The policy must be updated if additional cookies, trackers, analytics providers or advertising technologies are introduced."] },
    ],
  },
  retention: {
    title: "Data Handling & Retention",
    intro: "CampusFix should retain information only according to periods approved by the deploying organization. This page deliberately does not invent retention periods.",
    sections: [
      { title: "Account data", body: ["Name, email, role and related account records should be retained only for the period approved by the institution and applicable requirements."] },
      { title: "Complaint records", body: ["Complaint details, assignments, status history and operational records should follow the institution's approved retention schedule."] },
      { title: "Photographs", body: ["Optional complaint photographs should follow the same approved operational and privacy retention process as the associated complaint, unless the institution specifies otherwise."] },
      { title: "Audit and security records", body: ["Security and audit records should be retained for the period approved by the responsible security or compliance function."] },
      { title: "Analytics", body: ["Analytics data, if enabled, should follow the provider configuration and the institution's approved privacy and retention requirements."] },
      { title: "Deletion and disposal", body: ["When an approved retention period ends, data should be deleted, anonymized or otherwise disposed of using an authorized process, subject to legitimate legal, security or operational holds."] },
      { title: "Approval fields", body: ["Approved retention periods: [To be completed by the deploying organization]. Data governance owner: [Name/Role]. Review date: [DD/MM/YYYY]."] },
    ],
  },
  accessibility: {
    title: "Accessibility Statement",
    intro: "CampusFix is intended to be usable by students, staff and workers across desktop and mobile devices.",
    sections: [
      { title: "Design approach", body: ["The interface uses readable typography, clear hierarchy, visible focus states, form labels, meaningful status text and responsive layouts."] },
      { title: "Keyboard access", body: ["Interactive controls should remain reachable and understandable using keyboard navigation. Focus indicators should remain visible."] },
      { title: "Images", body: ["Informative images should have meaningful alternative text. Decorative images should not create unnecessary screen-reader noise."] },
      { title: "Color and status", body: ["Important status information should not depend on color alone. Contrast should be checked across light and dark themes."] },
      { title: "Motion", body: ["Non-essential animation should respect reduced-motion preferences where supported by the device or browser."] },
      { title: "Feedback", body: ["Accessibility feedback can be sent to [Official Support/Accessibility Email]. The deploying organization should replace this placeholder before publication."] },
    ],
  },
  requests: {
    title: "Privacy Requests & Contact",
    intro: "This page provides the operational structure for privacy-related requests. The deploying organization must insert its official contacts and approved process.",
    sections: [
      { title: "Request types", body: ["Depending on applicable requirements, users may have processes for requesting access, correction, deletion or clarification regarding their information."] },
      { title: "How to contact", body: ["Privacy email: [Official Privacy Email]. Support email: [Official Support Email]. Address: [Official Organization Address]."] },
      { title: "Verification", body: ["The organization should use an appropriate identity-verification process before disclosing or changing personal information."] },
      { title: "Review and response", body: ["The organization should define its approved review, escalation and response process, including any applicable timelines."] },
      { title: "Security incidents", body: ["Suspected account compromise or security incidents should be reported through the official IT/security channel rather than through a normal complaint."] },
    ],
  },
};

export function PolicyPage({ type }: { type: keyof typeof policies }) {
  const policy = policies[type];
  return (
    <main className="legal-page">
      <div className="legal-shell">
        <div className="legal-navrow">
          <Link to="/" className="legal-back">← Back to CampusFix</Link>
          <Link to="/policies" className="legal-back">All policies</Link>
        </div>
        <p className="public-kicker">CAMPUSFIX · POLICY & GOVERNANCE</p>
        <h1>{policy.title}</h1>
        <p className="legal-updated">V1.10.2 · Last reviewed October 2026</p>
        <div className="legal-intro">{policy.intro}</div>
        {policy.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.body.map((p) => <p key={p}>{p}</p>)}
          </section>
        ))}
        <div className="legal-note"><strong>Important:</strong> This is a project-level website policy template. Replace placeholders with the deploying organization's approved details before final publication.</div>
      </div>
    </main>
  );
}


export function GovernancePage() {
  const controls = [
    "Privacy Policy published and reviewed", "Terms & Conditions published and reviewed", "No private secrets in frontend/source control",
    "HTTPS and security headers enabled", "Analytics consent handled before optional analytics", "Page titles and descriptions configured",
    "Social preview image configured", "CampusFix favicon configured", "Public sitemap and robots.txt configured",
    "Meaningful image alternative text", "Images optimized for delivery", "Page-load performance reviewed",
    "Color contrast and keyboard focus reviewed", "Mobile responsiveness reviewed", "Custom 404 page",
    "Internal and footer links checked", "Important forms validated", "Lightweight complaint abuse protection",
    "Analytics restricted from sensitive complaint data", "One clear primary public call to action"
  ];
  return <main className="legal-page"><div className="legal-shell"><div className="legal-navrow"><Link to="/" className="legal-back">← Back to CampusFix</Link><Link to="/policies" className="legal-back">Policy Center</Link></div><p className="public-kicker">CAMPUSFIX · GOVERNANCE</p><h1>Website Launch & Governance Standard</h1><p className="legal-updated">V1.10.2 · October 2026</p><div className="legal-intro">This page records the operational launch controls used for CampusFix. Each item should be verified against the actual production deployment before release.</div><section><h2>20-Point Launch Standard</h2><ol className="policy-checklist">{controls.map((c,i)=><li key={c}><span>{String(i+1).padStart(2,"0")}</span>{c}</li>)}</ol></section><section><h2>Version History</h2><p><strong>V1.10.2 · October 2026</strong> — consolidated policy and governance set for CampusFix, including privacy, terms, security, data handling, accessibility, analytics and launch controls.</p></section><div className="legal-note"><strong>Important:</strong> This is a project-level governance template. It is not legal advice and does not itself constitute government approval, certification or institutional authorization.</div></div></main>;
}

export function PoliciesIndexPage() {
  const links: Array<[keyof typeof policies, string]> = [
    ["privacy", "Privacy Policy"], ["terms", "Terms & Conditions"], ["acceptable", "Acceptable Use & Security Rules"], ["security", "Security & Incident Response"], ["cookies", "Cookie & Analytics Notice"], ["retention", "Data Handling & Retention"], ["accessibility", "Accessibility Statement"], ["requests", "Privacy Requests & Contact"],
  ];
  return <main className="legal-page"><div className="legal-shell"><Link to="/" className="legal-back">← Back to CampusFix</Link><p className="public-kicker">CAMPUSFIX · POLICY CENTER</p><h1>Policies & Rules</h1><p className="legal-updated">All CampusFix website policies in one place.</p><div className="policy-link-grid">{links.map(([key, label]) => <Link key={key} to={`/policies/${key}`} className="policy-link-card"><strong>{label}</strong><span>Read policy →</span></Link>)}<Link to="/policies/governance" className="policy-link-card"><strong>Website Launch & Governance Standard</strong><span>20 controls & version history →</span></Link><Link to="/policies/rules" className="policy-link-card"><strong>Rules Only</strong><span>Usage, security & conduct rules →</span></Link></div><div className="legal-note">These policies are maintained as a project-level template and must be reviewed and customized by the deploying university or organization before final publication.</div></div></main>;
}
