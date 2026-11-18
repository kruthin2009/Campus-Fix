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

      <section className="public-hero v2-hero editorial-hero">
        <div className="v2-hero-grid" aria-hidden="true" />
        <div className="public-hero__content v2-hero-copy">
          <div className="v2-eyebrow"><span className="v2-eyebrow-dot" /> CAMPUS SERVICE MANAGEMENT <span className="v2-version">V2.1.1</span></div>
          <h1>A campus that<br /><em>works better.</em></h1>
          <p className="public-hero__text">Something needs fixing? Tell us what happened, where it happened, and follow the people working on it. CampusFix keeps the request and its updates in one place.</p>
          <div className="v2-hero-actions">
            <Link className="v2-button v2-button--primary" to={portalHref}>{portalLabel}<span aria-hidden="true">↗</span></Link>
            <a className="v2-button v2-button--secondary" href="#platform">Explore the platform<span aria-hidden="true">↓</span></a>
          </div>
          <div className="v2-proof-row"><span><b>✓</b> One place to report</span><span><b>✓</b> Clear ownership</span><span><b>✓</b> Updates you can follow</span></div>
        </div>

        <div className="editorial-hero-art" aria-label="Illustration of the CampusFix request process">
          <div className="editorial-art-kicker">A SIMPLE, CONNECTED WORKFLOW</div>
          <div className="editorial-flow">
            <div className="editorial-flow-step"><span>01</span><div><b>Report an issue</b><small>Describe the concern and its location</small></div><i>↗</i></div>
            <div className="editorial-flow-line" />
            <div className="editorial-flow-step"><span>02</span><div><b>Assign responsibility</b><small>Route the request to the right team</small></div><i>↗</i></div>
            <div className="editorial-flow-line" />
            <div className="editorial-flow-step"><span>03</span><div><b>Record progress</b><small>Keep notes and status updates together</small></div><i>↗</i></div>
            <div className="editorial-flow-line" />
            <div className="editorial-flow-step"><span>04</span><div><b>Review the outcome</b><small>Keep a clear record of completed work</small></div><i>✓</i></div>
          </div>
          <p className="editorial-art-note">One request. A clear owner. A visible path forward.</p>
        </div>
        <div className="v2-hero-bottom"><span>BUILT FOR CAMPUS COMMUNITIES</span><span>REPORT <i>·</i> ASSIGN <i>·</i> RESOLVE <i>·</i> REVIEW</span></div>
      </section>

      <section className="v2-feature-band editorial-section" id="platform">
        <div className="v2-section-intro"><p className="public-kicker">THE PLATFORM</p><h2>Less chasing.<br /><em>More clarity.</em></h2><p>CampusFix brings everyday campus maintenance requests into one organised process, helping students and campus teams stay aligned from report to resolution.</p></div>
        <div className="editorial-platform-list">
          <article><span>01</span><div><h3>Structured reporting</h3><p>Capture the location, category, description, and optional photo evidence in one request.</p></div></article>
          <article><span>02</span><div><h3>Clear responsibility</h3><p>Give administrators a consistent way to review requests and assign the appropriate team.</p></div></article>
          <article><span>03</span><div><h3>Progress visibility</h3><p>Keep status changes, work notes, and completion details connected to the original request.</p></div></article>
          <article><span>04</span><div><h3>Campus-wide communication</h3><p>Share announcements and important operational information through dedicated workspaces.</p></div></article>
        </div>
      </section>

      <section className="editorial-process-section" id="how-it-works">
        <div className="editorial-section-heading"><p className="public-kicker">HOW CAMPUSFIX WORKS</p><h2>A straightforward process,<br /><em>from start to finish.</em></h2></div>
        <div className="editorial-process-grid">
          <article><span>STEP 01</span><h3>Submit</h3><p>A student records the issue, selects its location, and provides useful details.</p></article>
          <article><span>STEP 02</span><h3>Review & assign</h3><p>Administration reviews the request and assigns responsibility to a worker or team.</p></article>
          <article><span>STEP 03</span><h3>Work & update</h3><p>The assigned worker records progress and updates the request as work continues.</p></article>
          <article><span>STEP 04</span><h3>Close the loop</h3><p>The outcome is recorded so the student and relevant teams can refer back to it.</p></article>
        </div>
      </section>

      <section className="v2-roles-section editorial-roles" id="portals">
        <div className="v2-roles-heading"><p className="public-kicker">THREE CONNECTED WORKSPACES</p><h2>One campus.<br /><em>Clear responsibilities.</em></h2><p>Each role gets a focused workspace for the tasks it is responsible for.</p></div>
        <div className="editorial-role-list">
          <Link to="/login"><span>01 / STUDENT</span><div><h3>Students</h3><p>Raise complaints, follow updates, view history, and review completed work.</p></div><b>↗</b></Link>
          <Link to="/login"><span>02 / ADMINISTRATION</span><div><h3>Administration</h3><p>Coordinate campus operations, manage teams, review requests, and publish announcements.</p></div><b>↗</b></Link>
          <Link to="/login"><span>03 / OPERATIONS</span><div><h3>Workers</h3><p>Review assigned work, record progress, and submit completion details.</p></div><b>↗</b></Link>
        </div>
      </section>

      <section className="editorial-trust-section">
        <div><p className="public-kicker">BUILT WITH ACCOUNTABILITY IN MIND</p><h2>Clear access.<br /><em>Responsible use.</em></h2><p>CampusFix provides dedicated role-based workspaces and publishes platform policies so users can understand how the service is intended to be used.</p></div>
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
