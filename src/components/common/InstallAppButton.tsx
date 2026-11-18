import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function handleInstall() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    setShowHelp(true);
  }

  return (
    <>
      <button className="install-app-button" onClick={handleInstall} type="button">
        <span aria-hidden="true">＋</span> Install App
      </button>

      {showHelp && (
        <div className="install-help-backdrop" role="presentation" onClick={() => setShowHelp(false)}>
          <section
            className="install-help"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-help-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="install-help__close" type="button" onClick={() => setShowHelp(false)} aria-label="Close install instructions">×</button>
            <p className="public-kicker">CAMPUSFIX APP</p>
            <h2 id="install-help-title">Install CampusFix</h2>
            {isIOS() ? (
              <p>On iPhone or iPad, tap the <strong>Share</strong> button in Safari, then choose <strong>Add to Home Screen</strong>.</p>
            ) : (
              <p>Open CampusFix in a supported browser and use the browser's <strong>Install CampusFix</strong> or <strong>Add to Home screen</strong> option. If the option is not shown yet, refresh the page and try again over HTTPS.</p>
            )}
            <button className="btn btn--primary" type="button" onClick={() => setShowHelp(false)}>Got it</button>
          </section>
        </div>
      )}
    </>
  );
}
