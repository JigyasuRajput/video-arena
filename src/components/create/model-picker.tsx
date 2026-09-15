"use client";

import * as React from "react";
import { Check, Search, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import {
  Popover,
  PopoverContent,
  PopoverItem,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Model list, one component for both catalogues.
 *
 * The two catalogues have different capability fields, so the pages flatten
 * theirs into `tags` (short badges) and `meta` (tiny capability chips) rather
 * than this knowing about durations or image counts.
 */
export type PickerModel = {
  id: string;
  name: string;
  blurb: string;
  badge?: "Top" | "New";
  /** Extra badges, e.g. "Audio". */
  tags?: string[];
  /** Tiny chips - supported durations, resolutions, that sort of thing. */
  meta?: string[];
};

export function ModelPicker({
  models,
  value,
  onChange,
  size = "md",
  className,
}: {
  models: PickerModel[];
  value: string;
  onChange: (id: string) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = models.find((model) => model.id === value) ?? models[0];
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? models.filter(
        (model) =>
          model.name.toLowerCase().includes(needle) ||
          model.blurb.toLowerCase().includes(needle),
      )
    : models;

  return (
    <Popover
      onOpenChange={(open) => {
        if (!open) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Chip
          size={size}
          icon={<Sparkles />}
          chevron
          className={className}
          aria-label={`Model: ${selected?.name ?? "none"}`}
        >
          {selected?.name ?? "Model"}
        </Chip>
      </PopoverTrigger>

      <PopoverContent
        className="w-[min(22rem,calc(100vw-2rem))] p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="size-3.5 shrink-0 text-text-faint" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search models"
            aria-label="Search models"
            className="w-full bg-transparent text-base text-text placeholder:text-text-faint focus:outline-none"
          />
        </div>

        <div className="max-h-[min(22rem,60vh)] overflow-y-auto p-1.5">
          {visible.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-text-faint">
              No model matches “{query.trim()}”.
            </p>
          ) : (
            visible.map((model) => (
              <PopoverItem
                key={model.id}
                selected={model.id === value}
                onClick={() => onChange(model.id)}
                className="items-start gap-3 py-2.5"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-text">{model.name}</span>
                    {model.badge && (
                      <Badge variant="pink" size="xs">
                        {model.badge}
                      </Badge>
                    )}
                    {model.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" size="xs">
                        {tag}
                      </Badge>
                    ))}
                  </span>
                  <span className="mt-0.5 block text-sm leading-snug text-text-faint">
                    {model.blurb}
                  </span>
                  {model.meta && model.meta.length > 0 && (
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {model.meta.map((item) => (
                        <span
                          key={item}
                          className="tabular rounded-full bg-surface-3 px-1.5 py-0.5 text-xs text-text-muted"
                        >
                          {item}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
                {model.id === value && (
                  <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                )}
              </PopoverItem>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
