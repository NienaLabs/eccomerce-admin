"use client";

import { useState } from "react";
import {
  Rocket,
  ShieldAlert,
  Smartphone,
  Store,
  Save,
  CheckCircle2,
  TriangleAlert,
  Power,
} from "lucide-react";
import { clientApi, type SystemSetting } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TextInput } from "@/components/ui/Filters";
import { useFeedback } from "@/components/ui/Feedback";
import { cn } from "@/lib/utils";

/**
 * Ops console for the three settings that change how the *shipped apps* behave.
 *
 * These lived in the generic Settings list next to cosmetic values, which made
 * flipping maintenance mode — an action that takes the entire storefront and
 * vendor app offline — look no weightier than editing a label. Here each one
 * states its blast radius and destructive flips are confirmed.
 */

const KEYS = {
  maintenance: "maintenance_mode",
  minVersion: "min_app_version",
  vendorRegistration: "vendor_registration",
} as const;

export function ReleasesClient({
  initialSettings,
}: {
  initialSettings: SystemSetting[];
}) {
  const { toast, confirm } = useFeedback();
  const [settings, setSettings] = useState<SystemSetting[]>(initialSettings);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [versionInput, setVersionInput] = useState(
    () => initialSettings.find((s) => s.key === KEYS.minVersion)?.value ?? ""
  );

  const get = (key: string) => settings.find((s) => s.key === key);
  const isOn = (key: string) => get(key)?.value === "true";

  const patch = async (key: string, value: string) => {
    setBusyKey(key);
    try {
      const res = await clientApi(`/admin/settings/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        toast(
          typeof detail?.detail === "string" ? detail.detail : "Could not save that.",
          "error"
        );
        return false;
      }
      const updated: SystemSetting = await res.json();
      setSettings((current) => current.map((s) => (s.key === key ? updated : s)));
      return true;
    } catch {
      toast("Network error — the setting was not changed.", "error");
      return false;
    } finally {
      setBusyKey(null);
    }
  };

  const maintenance = get(KEYS.maintenance);
  const vendorRegistration = get(KEYS.vendorRegistration);
  const minVersion = get(KEYS.minVersion);

  const maintenanceOn = isOn(KEYS.maintenance);

  const toggleMaintenance = async () => {
    const goingDown = !maintenanceOn;
    const ok = await confirm({
      title: goingDown ? "Take the platform offline?" : "Bring the platform back online?",
      message: goingDown
        ? "Every shopper and vendor will be locked out of the apps and shown the maintenance screen until you turn this off. In-flight orders are not cancelled, but nobody can place or fulfil one."
        : "Shoppers and vendors regain full access to the apps immediately.",
      confirmLabel: goingDown ? "Take offline" : "Bring online",
      destructive: goingDown,
    });
    if (!ok) return;

    const saved = await patch(KEYS.maintenance, goingDown ? "true" : "false");
    if (saved) {
      toast(
        goingDown ? "Platform is now in maintenance mode." : "Platform is back online.",
        goingDown ? "warning" : "success"
      );
    }
  };

  const toggleVendorRegistration = async () => {
    const turningOff = isOn(KEYS.vendorRegistration);
    const ok = await confirm({
      title: turningOff ? "Close vendor registration?" : "Open vendor registration?",
      message: turningOff
        ? "New vendors will not be able to apply. Existing vendors and pending applications are unaffected."
        : "Anyone with an account will be able to apply to become a vendor.",
      confirmLabel: turningOff ? "Close registration" : "Open registration",
      destructive: turningOff,
    });
    if (!ok) return;

    const saved = await patch(KEYS.vendorRegistration, turningOff ? "false" : "true");
    if (saved) {
      toast(
        turningOff ? "Vendor registration closed." : "Vendor registration open.",
        "success"
      );
    }
  };

  const saveVersion = async () => {
    const value = versionInput.trim();
    if (!value) {
      toast("Enter a version, e.g. 1.4.0", "warning");
      return;
    }
    const ok = await confirm({
      title: `Force update to ${value}?`,
      message:
        "Anyone running an older build is blocked at launch until they update. Get the release live in the stores before you raise this — otherwise you lock users out of an update that does not exist yet.",
      confirmLabel: "Set minimum version",
      destructive: true,
    });
    if (!ok) return;

    const saved = await patch(KEYS.minVersion, value);
    if (saved) toast(`Minimum app version is now ${value}.`, "success");
  };

  const versionChanged = minVersion ? versionInput.trim() !== minVersion.value : false;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Releases"
        icon={<Rocket className="h-6 w-6 text-ink-muted sm:h-7 sm:w-7" />}
        description="Controls that change how the shipped apps behave. Each one reaches every device."
      />

      {maintenanceOn && (
        <div className="flex items-start gap-3 rounded-xl border border-error bg-error-ghost p-4">
          <TriangleAlert className="mt-0.5 h-5 w-5 flex-shrink-0 text-error" />
          <div>
            <p className="font-inter text-sm font-bold text-error">
              The platform is offline right now
            </p>
            <p className="mt-0.5 font-open-sans text-sm text-error/80">
              Shoppers and vendors are seeing the maintenance screen. Nobody can place
              or fulfil an order.
            </p>
          </div>
        </div>
      )}

      {/* ── Maintenance mode ── */}
      {maintenance && (
        <section
          className={cn(
            "rounded-xl border p-4 sm:p-6",
            maintenanceOn ? "border-error bg-error-ghost" : "border-surface-muted bg-surface"
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg",
                  maintenanceOn ? "bg-error/10 text-error" : "bg-surface-muted text-ink-muted"
                )}
              >
                <ShieldAlert className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    className={cn(
                      "font-inter text-base font-bold sm:text-lg",
                      maintenanceOn ? "text-error" : "text-ink"
                    )}
                  >
                    Maintenance mode
                  </h2>
                  <Badge tone={maintenanceOn ? "error" : "success"}>
                    {maintenanceOn ? "Offline" : "Live"}
                  </Badge>
                </div>
                <p
                  className={cn(
                    "mt-1 max-w-xl font-open-sans text-sm",
                    maintenanceOn ? "text-error/80" : "text-ink-soft"
                  )}
                >
                  {maintenance.description ||
                    "Locks every shopper and vendor out of the apps and shows the maintenance screen instead."}
                </p>
              </div>
            </div>

            <Button
              variant={maintenanceOn ? "primary" : "destructive"}
              onClick={toggleMaintenance}
              disabled={busyKey === KEYS.maintenance}
              icon={<Power className="h-4 w-4" />}
              className="flex-shrink-0"
            >
              {busyKey === KEYS.maintenance
                ? "Saving…"
                : maintenanceOn
                  ? "Bring online"
                  : "Take offline"}
            </Button>
          </div>
        </section>
      )}

      {/* ── Minimum app version ── */}
      {minVersion && (
        <section className="rounded-xl border border-surface-muted bg-surface p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-muted">
              <Smartphone className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-inter text-base font-bold text-ink sm:text-lg">
                Minimum app version
              </h2>
              <p className="mt-1 max-w-xl font-open-sans text-sm text-ink-soft">
                {minVersion.description ||
                  "Builds older than this are blocked at launch until the user updates."}
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <TextInput
                  value={versionInput}
                  onChange={(e) => setVersionInput(e.target.value)}
                  placeholder="1.4.0"
                  inputMode="decimal"
                  aria-label="Minimum app version"
                  className="font-mono sm:max-w-[180px]"
                />
                <Button
                  onClick={saveVersion}
                  disabled={!versionChanged || busyKey === KEYS.minVersion}
                  icon={<Save className="h-4 w-4" />}
                  className="sm:w-auto"
                >
                  {busyKey === KEYS.minVersion ? "Saving…" : "Set version"}
                </Button>
              </div>

              <p className="mt-2 flex items-center gap-1.5 font-open-sans text-xs text-ink-muted">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Currently enforcing{" "}
                <span className="font-mono font-semibold text-ink">
                  {minVersion.value || "none"}
                </span>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Vendor registration ── */}
      {vendorRegistration && (
        <section className="rounded-xl border border-surface-muted bg-surface p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-muted">
                <Store className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-inter text-base font-bold text-ink sm:text-lg">
                    Vendor registration
                  </h2>
                  <Badge tone={isOn(KEYS.vendorRegistration) ? "success" : "neutral"}>
                    {isOn(KEYS.vendorRegistration) ? "Open" : "Closed"}
                  </Badge>
                </div>
                <p className="mt-1 max-w-xl font-open-sans text-sm text-ink-soft">
                  {vendorRegistration.description ||
                    "Controls whether new vendors can apply. Existing vendors are unaffected."}
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={toggleVendorRegistration}
              disabled={busyKey === KEYS.vendorRegistration}
              className="flex-shrink-0"
            >
              {busyKey === KEYS.vendorRegistration
                ? "Saving…"
                : isOn(KEYS.vendorRegistration)
                  ? "Close registration"
                  : "Open registration"}
            </Button>
          </div>
        </section>
      )}

      {!maintenance && !minVersion && !vendorRegistration && (
        <div className="rounded-xl border border-dashed border-surface-muted bg-surface p-8 text-center">
          <p className="font-inter text-sm font-semibold text-ink">
            No release settings found
          </p>
          <p className="mt-1 font-open-sans text-sm text-ink-muted">
            The backend didn&apos;t return <code>maintenance_mode</code>,{" "}
            <code>min_app_version</code> or <code>vendor_registration</code>.
          </p>
        </div>
      )}
    </div>
  );
}
