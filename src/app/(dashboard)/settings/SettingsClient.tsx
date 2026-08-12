"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Settings as SettingsIcon,
  Save,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
  Rocket,
  Banknote,
} from "lucide-react";
import { clientApi, type SystemSetting } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextInput } from "@/components/ui/Filters";
import { useFeedback } from "@/components/ui/Feedback";

/**
 * Settings that don't have a dedicated screen.
 *
 * `maintenance_mode`, `min_app_version` and `vendor_registration` moved to
 * Releases, and `platform_commission` is edited on Commissions. Editing the
 * same key from two places meant one screen silently went stale, so those keys
 * are linked out to rather than duplicated.
 */
const OWNED_ELSEWHERE: Record<string, { screen: string; href: string }> = {
  maintenance_mode: { screen: "Releases", href: "/releases" },
  min_app_version: { screen: "Releases", href: "/releases" },
  vendor_registration: { screen: "Releases", href: "/releases" },
  platform_commission: { screen: "Commissions", href: "/commissions" },
};

const humanise = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function SettingsClient({
  initialSettings,
}: {
  initialSettings: SystemSetting[];
}) {
  const { toast } = useFeedback();

  const [settings, setSettings] = useState<SystemSetting[]>(initialSettings);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialSettings.map((s) => [s.key, s.value]))
  );

  const save = async (key: string, value: string) => {
    setBusyKey(key);
    try {
      const res = await clientApi(`/admin/settings/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        // The backend rejects out-of-range values, and the admin needs to see
        // *why* — not just that it failed.
        toast(
          typeof detail?.detail === "string" ? detail.detail : "Could not save that value.",
          "error"
        );
        return;
      }
      const updated: SystemSetting = await res.json();
      setSettings((current) => current.map((s) => (s.key === key ? updated : s)));
      setValues((current) => ({ ...current, [key]: updated.value }));
      toast(`${humanise(key)} saved.`, "success");
    } catch {
      toast("Network error — nothing was saved.", "error");
    } finally {
      setBusyKey(null);
    }
  };

  const isBoolean = (setting: SystemSetting) =>
    setting.value === "true" || setting.value === "false";

  const editable = settings.filter((s) => !OWNED_ELSEWHERE[s.key]);
  const elsewhere = settings.filter((s) => OWNED_ELSEWHERE[s.key]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Settings"
        icon={<SettingsIcon className="h-6 w-6 text-ink-muted sm:h-7 sm:w-7" />}
        description="Global configuration values."
      />

      {editable.length === 0 ? (
        <EmptyState
          icon={<SettingsIcon className="h-10 w-10" />}
          title="Nothing to configure here"
          message="Every setting the backend exposes has its own dedicated screen."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
          {editable.map((setting) => {
            const boolean = isBoolean(setting);
            const enabled = setting.value === "true";
            const changed = values[setting.key] !== setting.value;
            const busy = busyKey === setting.key;

            return (
              <div
                key={setting.key}
                className="flex flex-col gap-3 rounded-xl border border-surface-muted bg-surface p-4 shadow-[var(--shadow-raised-1)] sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-inter text-base font-bold text-ink">
                      {humanise(setting.key)}
                    </h3>
                    {setting.description && (
                      <p className="mt-1 font-open-sans text-sm text-ink-soft">
                        {setting.description}
                      </p>
                    )}
                    <p className="mt-1 font-mono text-xs text-ink-ghost">{setting.key}</p>
                  </div>

                  {boolean && (
                    <button
                      type="button"
                      onClick={() => save(setting.key, enabled ? "false" : "true")}
                      disabled={busy}
                      aria-pressed={enabled}
                      aria-label={`${humanise(setting.key)}: ${enabled ? "on" : "off"}`}
                      className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${
                        enabled ? "text-ink" : "text-ink-ghost hover:text-ink-soft"
                      }`}
                    >
                      {enabled ? (
                        <ToggleRight className="h-8 w-8" />
                      ) : (
                        <ToggleLeft className="h-8 w-8" />
                      )}
                    </button>
                  )}
                </div>

                {!boolean && (
                  <div className="flex items-center gap-2">
                    <TextInput
                      value={values[setting.key] ?? ""}
                      onChange={(e) =>
                        setValues({ ...values, [setting.key]: e.target.value })
                      }
                      aria-label={humanise(setting.key)}
                      className="font-mono"
                    />
                    <Button
                      onClick={() => save(setting.key, values[setting.key])}
                      disabled={!changed || busy}
                      aria-label={`Save ${humanise(setting.key)}`}
                      className="flex-shrink-0 !px-4"
                      icon={<Save className="h-4 w-4" />}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {elsewhere.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-inter text-base font-bold text-ink">Managed elsewhere</h2>
          <p className="font-open-sans text-sm text-ink-soft">
            These have dedicated screens with the context and confirmations they need.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {Object.entries(
              elsewhere.reduce<Record<string, string[]>>((acc, setting) => {
                const { screen } = OWNED_ELSEWHERE[setting.key];
                acc[screen] = [...(acc[screen] ?? []), setting.key];
                return acc;
              }, {})
            ).map(([screen, keys]) => (
              <Link
                key={screen}
                href={OWNED_ELSEWHERE[keys[0]].href}
                className="flex min-h-14 items-center gap-3 rounded-xl border border-surface-muted bg-surface p-3 transition-colors hover:border-primary-border hover:bg-surface-soft"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-soft text-ink-muted">
                  {screen === "Releases" ? (
                    <Rocket className="h-5 w-5" />
                  ) : (
                    <Banknote className="h-5 w-5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-inter text-sm font-semibold text-ink">
                    {screen}
                  </span>
                  <span className="block truncate font-mono text-xs text-ink-muted">
                    {keys.join(", ")}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-ink-muted" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
