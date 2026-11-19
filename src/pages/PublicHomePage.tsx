import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { ThemeToggle } from "../components/common/ThemeToggle";
import { InstallAppButton } from "../components/common/InstallAppButton";
import { useAuth } from "../context/AuthContext";
import { portalHomeForRole } from "../routes/ProtectedRoute";
import { logout } from "../services/authService";
import { useToast } from "../context/ToastContext";

export function PublicHomePage() {
  const { firebaseUser, profile, status } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const portalHref = status === "profile-missing"
    ? "/profile-missing"
    : firebaseUser && profile
      ? portalHomeForRole(profile.role)
      : "/login";
  const portalLabel = firebaseUser && profile ? "Open my workspace" : "Sign in to CampusFix";

  async function handleSignOut() {
    try {
      await logout();
      navigate("/", { replace: true });
      showToast("You have been signed out.", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to sign out.", "error");
    }
  }

  return (
    <main className="public-home v2-home editorial-home">
      <nav className="public-nav v2-nav campusfix-navbar" aria-label="Main navigation">
        <Link className="public-brand campusfix-navbar__brand" to="/" aria-label="CampusFix home" onClick={() => setMobileMenuOpen(false)}>
          <span className="public-brand__mark campusfix-navbar__mark" aria-hidden="true">CF</span>
          <span className="v2-brand-copy campusfix-navbar__brand-copy">
            <strong>CampusFix</strong>
            <small>Campus operations, connected.</small>
          </span>
        </Link>

        <div className="campusfix-navbar__desktop">
          <div className="public-nav__links v2-nav-links campusfix-navbar__links">
            <a href="#platform">Platform</a>
            <a href="#how-it-works">How it works</a>
            <a href="#portals">Portals</a>
          </div>
          <div className="campusfix-navbar__actions">
            <ThemeToggle />
            <InstallAppButton />
            {firebaseUser
              ? <button type="button" className="public-nav__signout campusfix-navbar__signout" onClick={handleSignOut}>Sign out <span aria-hidden="true">↗</span></button>
              : <Link className="public-nav__login campusfix-navbar__login" to={portalHref}>Sign in <span aria-hidden="true">↗</span></Link>}
          </div>
        </div>

        <div className="campusfix-navbar__mobile-actions">
          <ThemeToggle />
          {firebaseUser
            ? <button type="button" className="public-nav__signout campusfix-navbar__mobile-signout" onClick={handleSignOut}>Sign out</button>
            : <Link className="public-nav__login campusfix-navbar__login" to={portalHref}>Sign in</Link>}
          <button
            type="button"
            className={`campusfix-navbar__menu-toggle${mobileMenuOpen ? " is-open" : ""}`}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="campusfix-mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span /><span />
          </button>
        </div>

        <div id="campusfix-mobile-navigation" className={`campusfix-navbar__mobile-menu${mobileMenuOpen ? " is-open" : ""}`} hidden={!mobileMenuOpen}>
          <a href="#platform" onClick={() => setMobileMenuOpen(false)}>Platform <span>01</span></a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it works <span>02</span></a>
          <a href="#portals" onClick={() => setMobileMenuOpen(false)}>Portals <span>03</span></a>
          <div className="campusfix-navbar__mobile-install"><InstallAppButton /></div>
        </div>
      </nav>

      <section className="public-hero v2-hero editorial-hero campusfix-hero">
        <div className="v2-hero-grid" aria-hidden="true" />
        <div className="public-hero__content v2-hero-copy campusfix-hero__copy">
          <div className="v2-eyebrow"><span className="v2-eyebrow-dot" /> CAMPUS SERVICE MANAGEMENT <span className="v2-version">V2.1.1</span></div>
          <h1>A campus that<br /><em>works better.</em></h1>
          <p className="public-hero__text">One place to report a campus issue, understand who is responsible, and follow the work through to completion. CampusFix brings students, administrators, and campus teams into one clear process.</p>
          <div className="v2-hero-actions">
            <Link className="v2-button v2-button--primary" to={portalHref}>{portalLabel}<span aria-hidden="true">↗</span></Link>
            <a className="v2-button v2-button--secondary" href="#platform">Explore CampusFix<span aria-hidden="true">↓</span></a>
          </div>
          <div className="v2-proof-row"><span><b>✓</b> Easy issue reporting</span><span><b>✓</b> Clear responsibility</span><span><b>✓</b> Visible progress</span></div>
        </div>
        <div className="editorial-hero-art campusfix-workflow" aria-label="How CampusFix handles a campus request">
          <div className="campusfix-workflow-heading">
            <span className="editorial-art-kicker">A STRAIGHTFORWARD PROCESS</span>
            <h2>One request. Four clear steps.</h2>
            <p>From the first report to the work being completed.</p>
          </div>
          <ol className="campusfix-workflow-list">
            <li><span className="campusfix-workflow-number">01</span><div><h3>Report</h3><p>Tell us what needs attention.</p></div></li>
            <li><span className="campusfix-workflow-number">02</span><div><h3>Assign</h3><p>The right team takes responsibility.</p></div></li>
            <li><span className="campusfix-workflow-number">03</span><div><h3>Update</h3><p>Progress is recorded as work moves forward.</p></div></li>
            <li><span className="campusfix-workflow-number">04</span><div><h3>Resolve</h3><p>The completed work is documented.</p></div></li>
          </ol>
        </div>
        <div className="v2-hero-bottom"><span>BUILT FOR CAMPUS COMMUNITIES</span><span>REPORT <i>·</i> ASSIGN <i>·</i> UPDATE <i>·</i> RESOLVE</span></div>
      </section>

      <section className="v2-feature-band editorial-section campusfix-platform" id="platform">
        <div className="v2-section-intro campusfix-section-intro"><p className="public-kicker">THE CAMPUSFIX PLATFORM</p><h2>Good systems make<br /><em>good work easier.</em></h2><p>Campus services work best when every request has the right details, a responsible team, and a clear record of what happens next.</p></div>
        <div className="editorial-platform-list campusfix-feature-list">
          <article><span>01</span><div><h3>Report with context</h3><p>Capture the location, category, description, and optional photo evidence in one organised request.</p></div><b aria-hidden="true">↗</b></article>
          <article><span>02</span><div><h3>Know who is responsible</h3><p>Give administrators a clear way to review requests and assign the appropriate worker or team.</p></div><b aria-hidden="true">↗</b></article>
          <article><span>03</span><div><h3>Follow every update</h3><p>Keep status changes, work notes, and completion details connected to the original request.</p></div><b aria-hidden="true">↗</b></article>
          <article><span>04</span><div><h3>Keep the campus informed</h3><p>Share announcements and important operational information through dedicated workspaces.</p></div><b aria-hidden="true">↗</b></article>
        </div>
      </section>

      <section className="editorial-process-section campusfix-process" id="how-it-works">
        <div className="editorial-section-heading campusfix-section-heading"><p className="public-kicker">HOW CAMPUSFIX WORKS</p><h2>Simple steps.<br /><em>Visible progress.</em></h2><p>Every request follows a practical path, so people know what has happened and what comes next.</p></div>
        <div className="editorial-process-grid">
          <article><span>STEP 01 / STUDENT</span><h3>Submit a request</h3><p>Record the issue, select its campus location, and provide the details the team needs.</p></article>
          <article><span>STEP 02 / ADMINISTRATION</span><h3>Review and assign</h3><p>Administration checks the request and assigns responsibility to the right worker or team.</p></article>
          <article><span>STEP 03 / OPERATIONS</span><h3>Carry out the work</h3><p>The assigned worker reviews the task, records progress, and updates its status.</p></article>
          <article><span>STEP 04 / COMPLETION</span><h3>Close the loop</h3><p>The outcome is recorded so students and relevant teams can refer back to the completed request.</p></article>
        </div>
      </section>

      <section className="v2-roles-section editorial-roles campusfix-roles" id="portals">
        <div className="v2-roles-heading campusfix-section-intro"><p className="public-kicker">PURPOSE-BUILT WORKSPACES</p><h2>One campus.<br /><em>Every role connected.</em></h2><p>Each person gets a focused workspace, with the tools and information needed to move campus requests forward.</p></div>
        <div className="editorial-role-list">
          <Link to="/login"><span>01 / STUDENT</span><div><h3>Student workspace</h3><p>Raise complaints, follow updates, view request history, and review completed work.</p></div><b aria-hidden="true">↗</b></Link>
          <Link to="/login"><span>02 / ADMINISTRATION</span><div><h3>Administrator workspace</h3><p>Coordinate campus operations, manage teams, review requests, and publish announcements.</p></div><b aria-hidden="true">↗</b></Link>
          <Link to="/login"><span>03 / OPERATIONS</span><div><h3>Worker workspace</h3><p>Review assigned work, record progress, and submit completion details.</p></div><b aria-hidden="true">↗</b></Link>
        </div>
      </section>

      <section className="editorial-trust-section campusfix-trust">
        <div><p className="public-kicker">BUILT AROUND ACCOUNTABILITY</p><h2>Clear access.<br /><em>Responsible service.</em></h2><p>CampusFix provides dedicated role-based workspaces and publishes platform policies so users can understand how the service is intended to be used.</p></div>
        <div className="editorial-policy-links">
          <Link to="/policies">Policy Center <span>↗</span></Link>
          <Link to="/privacy">Privacy <span>↗</span></Link>
          <Link to="/terms">Terms & Conditions <span>↗</span></Link>
          <Link to="/policies/rules">Platform Rules <span>↗</span></Link>
        </div>
      </section>

      <footer className="v2-footer editorial-footer">
        <Link className="public-brand" to="/"><span className="public-brand__mark">CF</span><span className="v2-brand-copy"><strong>CampusFix</strong><small>Campus operations, connected.</small></span></Link>
        <span className="v2-footer-copy">A connected approach to campus service management.</span>
        <div className="v2-footer-links"><Link to="/policies">Policies</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/policies/rules">Rules</Link></div>
        <small>V2.1.1 · © 2026 CampusFix</small>
      </footer>
    </main>
  );
}
