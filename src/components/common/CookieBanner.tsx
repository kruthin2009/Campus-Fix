import { useEffect, useState } from "react";

const KEY = "campusfix-analytics-choice";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!localStorage.getItem(KEY));
  }, []);

  if (!visible) return null;

  const choose = (value: "accepted" | "declined") => {
    localStorage.setItem(KEY, value);
    window.dispatchEvent(new CustomEvent("campusfix-analytics-choice", { detail: value }));
    setVisible(false);
  };

  return (
    <aside className="cookie-banner" aria-label="Analytics preference">
      <div>
        <strong>One small privacy choice</strong>
        <p>CampusFix can use optional analytics to understand general site usage and performance. No complaint content is used for this purpose.</p>
      </div>
      <div className="cookie-banner__actions">
        <button className="btn btn--secondary btn--sm" onClick={() => choose("declined")}>Not now</button>
        <button className="btn btn--primary btn--sm" onClick={() => choose("accepted")}>Allow analytics</button>
      </div>
    </aside>
  );
}
