"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { ShieldAlert, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-surface-soft px-4 py-10 font-open-sans"
      style={{
        paddingTop: "max(2.5rem, var(--safe-top))",
        paddingBottom: "max(2.5rem, var(--safe-bottom))",
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-surface-muted bg-surface p-6 shadow-[var(--shadow-raised-3)] sm:p-10">
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-primary">
            <ShieldAlert className="h-7 w-7" />
          </span>
          <h1 className="font-inter text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            AdminHub
          </h1>
          <p className="mt-2 font-open-sans text-sm text-ink-soft">
            Sign in to the control panel
          </p>
        </div>

        <form className="mt-8 space-y-4" action={formAction}>
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block font-inter text-sm font-semibold text-ink"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="admin@example.com"
              className="h-12 w-full rounded-xl border-[1.5px] border-surface-muted bg-surface-soft px-4 font-open-sans text-sm text-ink placeholder:text-ink-ghost focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-ghost)] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block font-inter text-sm font-semibold text-ink"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="h-12 w-full rounded-xl border-[1.5px] border-surface-muted bg-surface-soft px-4 font-open-sans text-sm text-ink placeholder:text-ink-ghost focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-ghost)] focus:outline-none"
            />
          </div>

          {state?.error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-error-ghost p-3"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-error" />
              <p className="font-open-sans text-sm font-semibold text-error">
                {state.error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="min-h-12 w-full rounded-xl bg-primary font-inter text-sm font-semibold text-ink shadow-[var(--shadow-primary-glow)] transition-all duration-150 hover:bg-primary-dim active:scale-[0.97] disabled:bg-surface-muted disabled:text-ink-ghost disabled:shadow-none"
          >
            {isPending ? "Authenticating…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
