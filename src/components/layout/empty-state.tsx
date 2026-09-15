import * as React from "react";
import { cn } from "cn";

/** Icon, title, one line, one button. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-16 text-center",
        className,
      )}
    >
      {icon && (
        <span
          className="mb-4 inline-flex size-12 items-center justify-center rounded-full bg-surface-2 text-text-faint [&_svg]:size-5"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <h2 className="text-xl font-semibold tracking-tight text-text">{title}</h2>
      {description && (
        <p className="mt-2 max-w-sm text-lg text-text-muted">{description}</p>
      )}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
