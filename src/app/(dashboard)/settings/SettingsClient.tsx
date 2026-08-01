"use client";

import { useState } from "react";
import { Settings, ShieldAlert, Smartphone, Percent, ToggleLeft, ToggleRight, Save, CheckCircle2 } from "lucide-react";
import { API_BASE_URL, type SystemSetting } from "@/lib/api";

export function SettingsClient({ initialSettings, token }: { initialSettings: SystemSetting[]; token: string }) {
  const [settings, setSettings] = useState<SystemSetting[]>(initialSettings);
  const [loading, setLoading] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local state for text/number inputs before saving
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const vals: Record<string, string> = {};
    initialSettings.forEach(s => vals[s.key] = s.value);
    return vals;
  });

  const getSetting = (key: string) => settings.find(s => s.key === key);

  const showSaved = (key: string) => {
    setSavedKey(key);
    setTimeout(() => setSavedKey(null), 2500);
  };

  // The backend rejects out-of-range values (e.g. a commission of 500%), and the
  // admin needs to see *why*, not just that it failed.
  const showError = (key: string, message?: string) => {
    setErrorKey(key);
    setErrorMessage(message ?? null);
    setTimeout(() => { setErrorKey(null); setErrorMessage(null); }, 5000);
  };

  const handleToggle = async (key: string) => {
    const setting = getSetting(key);
    if (!setting) return;

    const newValue = setting.value === "true" ? "false" : "true";
    
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/settings/${key}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ value: newValue }),
      });
      if (!res.ok) throw new Error("Failed to update setting");
      
      const updated = await res.json();
      setSettings(settings.map(s => s.key === key ? updated : s));
      setFormValues({ ...formValues, [key]: updated.value });
      showSaved(key);
    } catch {
      showError(key);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveValue = async (key: string) => {
    const newValue = formValues[key];
    if (newValue === undefined) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/admin/settings/${key}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ value: newValue }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        const message = typeof detail?.detail === "string" ? detail.detail : undefined;
        showError(key, message);
        return;
      }

      const updated = await res.json();
      setSettings(settings.map(s => s.key === key ? updated : s));
      showSaved(key);
    } catch {
      showError(key);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, val: string) => {
    setFormValues(prev => ({ ...prev, [key]: val }));
  };

  // Helper to render toggle switches
  const renderToggle = (key: string, title: string, icon: React.ReactNode, danger: boolean = false) => {
    const setting = getSetting(key);
    if (!setting) return null;
    const isEnabled = setting.value === "true";

    return (
      <div className={`p-6 rounded-xl border flex flex-col gap-3 ${danger ? 'bg-error-ghost border-error-ghost' : 'bg-surface border-surface-muted'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-start">
            <div className={`p-2 rounded-lg mr-4 ${danger ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'}`}>
              {icon}
            </div>
            <div>
              <h3 className={`text-lg font-bold font-inter ${danger ? 'text-error' : 'text-ink'}`}>{title}</h3>
              <p className={`text-sm mt-1 ${danger ? 'text-error/80' : 'text-ink-soft'}`}>{setting.description}</p>
            </div>
          </div>
          <button 
            onClick={() => handleToggle(key)}
            disabled={loading}
            aria-pressed={isEnabled}
            className={`flex items-center justify-center transition-colors disabled:opacity-50 ${isEnabled ? (danger ? 'text-error' : 'text-primary') : 'text-ink-muted hover:text-ink-soft'}`}
          >
            {isEnabled ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
          </button>
        </div>
        {savedKey === key && (
          <div className="flex items-center text-xs text-success font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Saved successfully
          </div>
        )}
        {errorKey === key && (
          <div className="flex items-center text-xs text-error font-bold">
            {errorMessage ?? "Failed to save. Please try again."}
          </div>
        )}
      </div>
    );
  };

  // Helper to render value inputs
  const renderInput = (key: string, title: string, icon: React.ReactNode) => {
    const setting = getSetting(key);
    if (!setting) return null;
    
    const hasChanged = formValues[key] !== setting.value;

    return (
      <div className="p-6 rounded-xl border border-surface-muted bg-surface flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start">
            <div className="p-2 rounded-lg bg-surface-muted text-ink-muted mr-4">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-bold font-inter text-ink">{title}</h3>
              <p className="text-sm mt-1 text-ink-soft">{setting.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input 
              type="text" 
              value={formValues[key] || ""}
              onChange={(e) => handleInputChange(key, e.target.value)}
              className="border-surface-muted rounded-md shadow-sm focus:border-primary focus:ring-primary text-ink w-full sm:w-32 text-right font-mono"
            />
            <button 
              onClick={() => handleSaveValue(key)}
              disabled={!hasChanged || loading}
              title="Save"
              className={`p-2 rounded-md transition-colors ${hasChanged ? 'bg-primary text-surface hover:bg-primary-dim' : 'bg-surface-muted text-ink-muted cursor-not-allowed'}`}
            >
              <Save className="w-5 h-5" />
            </button>
          </div>
        </div>
        {savedKey === key && (
          <div className="flex items-center text-xs text-success font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Saved successfully
          </div>
        )}
        {errorKey === key && (
          <div className="flex items-center text-xs text-error font-bold">
            {errorMessage ?? "Failed to save. Please try again."}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-inter tracking-tight text-ink flex items-center">
          <Settings className="w-8 h-8 mr-3 text-ink-muted" />
          Global App Settings
        </h1>
        <p className="text-ink-soft mt-1">
          Configure platform-wide settings, feature flags, and developer rules.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold font-inter border-b border-surface-muted pb-2">Feature Flags</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderToggle("vendor_registration", "Vendor Registration", <Settings className="w-6 h-6" />)}
          {renderToggle("maintenance_mode", "Maintenance Mode", <ShieldAlert className="w-6 h-6" />, true)}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold font-inter border-b border-surface-muted pb-2 mt-8">Global Variables</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {renderInput("platform_commission", "Platform Commission (%)", <Percent className="w-6 h-6" />)}
          {renderInput("commission_payment_due_days", "Commission Payment Window (days)", <Percent className="w-6 h-6" />)}
          {renderInput("min_app_version", "Minimum App Version", <Smartphone className="w-6 h-6" />)}
        </div>
      </div>
    </div>
  );
}
