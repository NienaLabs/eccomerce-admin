"use client";

import { cn } from "@/lib/utils";

/**
 * Every screen opened with a hand-rolled `h1` + `p` block at slightly different
 * sizes and margins. This is that block, once. The title steps down on mobile —
 * `text-3xl` eats a third of a 375px screen before any content appears.
 */
export function PageHeader({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 font-inter text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {icon}
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl font-open-sans text-sm text-ink-soft">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex flex-shrink-0 gap-2">{action}</div>}
    </div>
  );
}
