import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <span className="not-found-code">404</span>
        <h1>That page isn't here.</h1>
        <p>The link may be old, or the page may have moved. You can head back to CampusFix and continue from there.</p>
        <Link className="btn btn--primary" to="/">Go to CampusFix</Link>
      </div>
    </main>
  );
}
