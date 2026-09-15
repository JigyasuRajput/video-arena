"use client";

import * as React from "react";
import { cn } from "cn";
import { toast } from "sonner";
import { Gauge, MonitorPlay, Plus, Ratio, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/stepper";
import { IMAGE_ACCEPT, validateImageFile } from "@/components/ui/upload-slot";
import { AspectIcon } from "@/components/create/aspect-icon";
import { ChipSelect } from "@/components/create/chip-select";
import { Hint } from "@/components/create/hint";
import { ModelPicker } from "@/components/create/model-picker";
import { PromptBox } from "@/components/create/prompt-box";
import type { ImageForm } from "@/components/create/use-image-form";
import { unsupportedReason } from "@/lib/create/settings";
import { IMAGE_MODELS } from "@/lib/models";

const ALL_ASPECTS = ["1:1", "4:5", "3:4", "16:9", "9:16"] as const;

const PICKER_MODELS = IMAGE_MODELS.map((model) => ({
  id: model.id,
  name: model.name,
  blurb: model.blurb,
  badge: model.badge,
  tags: model.maxRefs === 0 ? ["No refs"] : undefined,
  meta: [
    ...model.resolutions,
    `up to ${model.maxCount} image${model.maxCount === 1 ? "" : "s"}`,
  ],
}));

/**
 * The docked bar. Different shell from the video panel on purpose (spec 06),
 * but every control inside it is the same component the video page uses.
 */
export function ImageBar({
  form,
  onGenerate,
  canGenerate,
  pending,
}: {
  form: ImageForm;
  onGenerate: () => void;
  canGenerate: boolean;
  pending: boolean;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const { model, settings } = form;

  const refsFull = form.refs.length >= model.maxRefs;
  const refsReason =
    model.maxRefs === 0
      ? unsupportedReason(model.name, "reference images")
      : refsFull
        ? `That's the ${model.maxRefs} references ${model.name} allows.`
        : undefined;

  return (
    <div className="rounded-lg border border-border bg-surface/95 p-3 shadow-[var(--shadow-pop)] backdrop-blur-xl">
      {form.refs.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {form.refs.map((ref, index) => (
            <div key={`${ref.previewUrl}-${index}`} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- object/data URL or a local sample path */}
              <img
                src={ref.previewUrl}
                alt={`Reference ${index + 1}`}
                className="size-14 rounded-sm border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => form.removeRef(index)}
                aria-label={`Remove reference ${index + 1}`}
                className={cn(
                  "absolute -top-1.5 -right-1.5 inline-flex size-5 items-center justify-center",
                  "rounded-full border border-white/10 bg-black/70 text-white backdrop-blur-md",
                  "transition-colors outline-none hover:bg-black/90",
                  "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
                )}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={IMAGE_ACCEPT.join(",")}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            const problem = validateImageFile(file, "Reference");
            if (problem) {
              toast.error(problem);
              return;
            }
            form.addRefFile(file);
          }}
        />
        <Hint text={refsReason} wrap={Boolean(refsReason)}>
          <Button
            variant="secondary"
            size="icon"
            className="mt-0.5 shrink-0 rounded-full"
            disabled={Boolean(refsReason)}
            onClick={() => fileRef.current?.click()}
            aria-label="Add a reference image"
          >
            <Plus />
          </Button>
        </Hint>

        <PromptBox
          id="image-prompt"
          label="Describe the image you want"
          value={form.prompt}
          onChange={form.setPrompt}
          onSubmit={onGenerate}
          placeholder="Describe the image you want"
          rows={2}
          maxRows={8}
          className="flex-1"
        />

        <Button
          variant="primary"
          size="md"
          className="mt-0.5 hidden shrink-0 sm:inline-flex"
          disabled={!canGenerate}
          loading={pending}
          onClick={onGenerate}
        >
          <Sparkles /> Generate
        </Button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <ModelPicker
          models={PICKER_MODELS}
          value={settings.model}
          onChange={form.setModel}
          size="sm"
        />

        <ChipSelect
          title="Aspect ratio"
          icon={<Ratio />}
          size="sm"
          width="w-44"
          value={settings.aspect}
          onChange={(value) => form.setSetting("aspect", value)}
          options={ALL_ASPECTS.filter((aspect) => model.aspects.includes(aspect)).map(
            (aspect) => ({
              value: aspect,
              label: aspect,
              icon: <AspectIcon aspect={aspect} />,
            }),
          )}
        />

        <ChipSelect
          title="Quality"
          icon={<Gauge />}
          size="sm"
          width="w-40"
          value={settings.quality}
          onChange={(value) => form.setSetting("quality", value)}
          display={settings.quality === "high" ? "High" : "Standard"}
          disabled={model.qualities.length < 2}
          disabledReason={
            model.qualities.length < 2
              ? `${model.name} only runs at ${model.qualities[0] === "high" ? "High" : "Standard"} quality.`
              : undefined
          }
          options={model.qualities.map((quality) => ({
            value: quality,
            label: quality === "high" ? "High" : "Standard",
          }))}
        />

        <ChipSelect
          title="Resolution"
          icon={<MonitorPlay />}
          size="sm"
          width="w-40"
          value={settings.resolution}
          onChange={(value) => form.setSetting("resolution", value)}
          disabled={model.resolutions.length < 2}
          disabledReason={
            model.resolutions.length < 2
              ? `${model.name} only outputs ${model.resolutions[0]}.`
              : undefined
          }
          options={model.resolutions.map((resolution) => ({
            value: resolution,
            label: resolution,
          }))}
        />

        <Stepper
          label="Image count"
          size="sm"
          min={1}
          max={model.maxCount}
          value={settings.count}
          onValueChange={(value) => form.setSetting("count", value)}
        />
      </div>

      <Button
        variant="primary"
        size="lg"
        className="mt-2 w-full sm:hidden"
        disabled={!canGenerate}
        loading={pending}
        onClick={onGenerate}
      >
        <Sparkles /> Generate
      </Button>
    </div>
  );
}
