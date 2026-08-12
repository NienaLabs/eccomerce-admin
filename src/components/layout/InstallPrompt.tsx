"use client";

/**
 * Registers the service worker and offers the app for install.
 *
 * Registration happens here — on load, for every admin — rather than inside the
 * push-notification hook where it used to live. That hook only ran after
 * notification permission was granted, which meant a first-time visitor had no
 * service worker, and with no worker Chrome never fires `beforeinstallprompt`.
 * The app was therefore uninstallable on Android no matter what the manifest said.
 */

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useIsHydrated } from "@/hooks/useIsHydrated";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "adminhub:install-dismissed";

export function InstallPrompt() {
  const hydrated = useIsHydrated();
  // Both of these are set from event handlers, never from an effect body.
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [closed, setClosed] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Environment probes. Stable for the life of the session, so they're derived
  // at render behind the hydration guard rather than mirrored into state.
  const standalone =
    hydrated &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari predates the display-mode media query.
      (window.navigator as { standalone?: boolean }).standalone === true);

  const isIOS =
    hydrated &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as { MSStream?: unknown }).MSStream;

  const dismissed =
    closed || (hydrated && localStorage.getItem(DISMISS_KEY) === "1");

  const close = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setClosed(true);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  // Nothing to offer: not hydrated yet, already installed, previously
  // dismissed, or a browser that neither fires the event nor needs the iOS
  // instructions.
  if (!hydrated || standalone || installed || dismissed) return null;
  if (!deferred && !isIOS) return null;

  return (
    <div
      className="fixed inset-x-3 z-40 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-96"
      style={{ bottom: "calc(var(--bottom-nav-height) + var(--safe-bottom) + 0.75rem)" }}
      role="complementary"
      aria-label="Install AdminHub"
    >
      <div className="animate-toast-in flex items-start gap-3 rounded-2xl border border-surface-muted bg-surface p-4 shadow-[var(--shadow-raised-4)]">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-ink text-primary">
          <Download className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-inter text-sm font-bold text-ink">Install AdminHub</p>

          {isIOS && !deferred ? (
            <p className="mt-1 font-open-sans text-xs leading-relaxed text-ink-soft">
              Tap{" "}
              <Share
                className="inline h-3.5 w-3.5 -translate-y-px"
                aria-label="the Share button"
              />{" "}
              in Safari, then <strong className="font-semibold">Add to Home Screen</strong>.
            </p>
          ) : (
            <>
              <p className="mt-1 font-open-sans text-xs leading-relaxed text-ink-soft">
                Add it to your home screen for full-screen access and push alerts.
              </p>
              <Button size="sm" onClick={install} className="mt-3">
                Install
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={close}
          aria-label="Dismiss install prompt"
          className="-mr-1 -mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
