import * as React from "react";
import { cn } from "cn";

/** Uppercase display title, muted subtitle, optional action on the right. */
export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="display text-2xl text-accent sm:text-3xl">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-lg text-text-muted">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
