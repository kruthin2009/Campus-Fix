import { useEffect } from "react";

const KEY = "campusfix-analytics-choice";
const SCRIPT_ID = "campusfix-vercel-analytics";

function loadAnalytics() {
  if (document.getElementById(SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.defer = true;
  script.src = "/_vercel/insights/script.js";
  document.head.appendChild(script);
}

export function AnalyticsLoader() {
  useEffect(() => {
    if (localStorage.getItem(KEY) === "accepted") loadAnalytics();

    const onChoice = (event: Event) => {
      const choice = (event as CustomEvent<string>).detail;
      if (choice === "accepted") loadAnalytics();
    };

    window.addEventListener("campusfix-analytics-choice", onChoice);
    return () => window.removeEventListener("campusfix-analytics-choice", onChoice);
  }, []);

  return null;
}
