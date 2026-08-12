"use client";

/**
 * Replaces `window.alert` and `window.confirm`.
 *
 * Native dialogs are the single most out-of-place thing in an installed PWA:
 * they render as a browser chrome bubble with the origin printed in it, which
 * breaks the illusion of an app and, on Android, can be suppressed entirely.
 * `useConfirm()` is promise-based so call sites keep reading like the `confirm()`
 * they replace — just with an `await`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { Sheet } from "./Sheet";
import { Button } from "./Button";
import { useIsHydrated } from "@/hooks/useIsHydrated";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Destructive actions get the error-toned header and button. */
  destructive?: boolean;
}

interface FeedbackContextValue {
  toast: (message: string, tone?: Tone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

const TONE_STYLES: Record<Tone, { bar: string; icon: React.ReactNode }> = {
  success: {
    bar: "bg-success",
    icon: <CheckCircle2 className="h-5 w-5 text-success" />,
  },
  error: {
    bar: "bg-error",
    icon: <XCircle className="h-5 w-5 text-error" />,
  },
  warning: {
    bar: "bg-warning",
    icon: <AlertTriangle className="h-5 w-5 text-warning" />,
  },
  info: {
    bar: "bg-info",
    icon: <Info className="h-5 w-5 text-info" />,
  },
};

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  // The toast container is a portal into document.body. Gating it on
  // `typeof document !== "undefined"` renders nothing on the server but the
  // full portal on the very first client render, which is a hydration
  // mismatch — React then throws away the server tree for the whole layout.
  // Waiting for hydration makes both first renders agree.
  const hydrated = useIsHydrated();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const nextId = useRef(0);
  // Held between opening the dialog and the user answering it.
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: Tone = "info") => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, tone }]);
      // design.md §6: auto-dismiss at 3000ms.
      setTimeout(() => dismiss(id), 3000);
    },
    [dismiss]
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmState(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((answer: boolean) => {
    resolver.current?.(answer);
    resolver.current = null;
    setConfirmState(null);
  }, []);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {hydrated &&
        createPortal(
          <div
            // Top on mobile (design.md §6), bottom-right on desktop. Sits above
            // the bottom nav either way.
            className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:bottom-0 sm:right-0 sm:top-auto sm:items-end sm:p-6"
            style={{ paddingTop: "max(1rem, var(--safe-top))" }}
            role="status"
            aria-live="polite"
          >
            {toasts.map((t) => (
              <div
                key={t.id}
                className="animate-toast-in pointer-events-auto flex w-full max-w-md items-start gap-3 overflow-hidden rounded-xl border border-surface-muted bg-surface pr-2 shadow-[var(--shadow-raised-3)]"
              >
                <span className={cn("w-[3px] self-stretch rounded-full", TONE_STYLES[t.tone].bar)} />
                <span className="py-3">{TONE_STYLES[t.tone].icon}</span>
                <p className="flex-1 py-3 font-open-sans text-[13px] font-semibold text-ink">
                  {t.message}
                </p>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss"
                  className="my-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-ink-ghost transition-colors hover:bg-surface-muted hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}

      <Sheet
        open={confirmState !== null}
        onClose={() => settle(false)}
        title={confirmState?.title ?? ""}
        tone={confirmState?.destructive ? "danger" : "default"}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => settle(false)} className="sm:w-auto" block>
              {confirmState?.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              variant={confirmState?.destructive ? "destructive" : "primary"}
              onClick={() => settle(true)}
              className="sm:w-auto"
              block
            >
              {confirmState?.confirmLabel ?? "Confirm"}
            </Button>
          </>
        }
      >
        <p className="font-open-sans text-sm leading-relaxed text-ink-soft">
          {confirmState?.message}
        </p>
      </Sheet>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
}
