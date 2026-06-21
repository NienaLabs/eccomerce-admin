"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-soft px-4 py-12 sm:px-6 lg:px-8 font-open-sans">
      <div className="w-full max-w-md space-y-8 bg-surface p-10 rounded-2xl shadow-xl border border-surface-muted">
        <div className="flex flex-col items-center">
          <ShieldAlert className="h-12 w-12 text-primary mb-4" />
          <h2 className="text-center text-3xl font-bold tracking-tight text-ink font-inter">
            Admin<span className="text-primary">Hub</span>
          </h2>
          <p className="mt-2 text-center text-sm text-ink-soft">
            Sign in to access the control panel
          </p>
        </div>
        <form className="mt-8 space-y-6" action={formAction}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">
                Email address
              </label>
              <input
                name="email"
                type="email"
                required
                className="relative block w-full rounded-lg border border-surface-deep bg-surface px-4 py-3 text-ink placeholder-ink-ghost focus:z-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                required
                className="relative block w-full rounded-lg border border-surface-deep bg-surface px-4 py-3 text-ink placeholder-ink-ghost focus:z-10 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          {state?.error && (
            <div className="rounded-md bg-error-ghost p-4">
              <p className="text-sm text-error font-bold">{state.error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="group relative flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-bold text-ink hover:bg-primary-dim focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Authenticating..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
