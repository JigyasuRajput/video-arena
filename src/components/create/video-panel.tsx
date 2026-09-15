"use client";

import { cn } from "cn";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  Clock,
  Film,
  Images,
  MonitorPlay,
  Ratio,
  Volume2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { UploadSlot } from "@/components/ui/upload-slot";
import { AspectIcon } from "@/components/create/aspect-icon";
import { ChipSelect } from "@/components/create/chip-select";
import { Hint } from "@/components/create/hint";
import { ModelPicker } from "@/components/create/model-picker";
import { PromptBox } from "@/components/create/prompt-box";
import type { VideoForm } from "@/components/create/use-video-form";
import { unsupportedReason } from "@/lib/create/settings";
import { VIDEO_MODELS } from "@/lib/models";

const ALL_ASPECTS = ["16:9", "9:16", "1:1"] as const;

/** Catalogue -> picker shape. The picker doesn't know what a duration is. */
const PICKER_MODELS = VIDEO_MODELS.map((model) => ({
  id: model.id,
  name: model.name,
  blurb: model.blurb,
  badge: model.badge,
  tags: model.audio ? ["Audio"] : undefined,
  meta: model.durations.map((duration) => `${duration}s`),
}));

export function VideoPanel({
  form,
  onGenerate,
  canGenerate,
  pending,
}: {
  form: VideoForm;
  onGenerate: () => void;
  canGenerate: boolean;
  pending: boolean;
}) {
  const { model, settings } = form;

  const endFrameReason = model.endFrame
    ? undefined
    : unsupportedReason(model.name, "an end frame");
  const refsReason =
    model.maxRefs > 0 ? undefined : unsupportedReason(model.name, "reference images");

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      {/* Start / end frames ------------------------------------------------ */}
      <section>
        <h2 className="text-xs font-semibold tracking-wide text-text-faint uppercase">
          Frames
        </h2>
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <UploadSlot
            label="Start frame"
            previewUrl={form.startFrame?.previewUrl}
            onSelect={(file) => form.pickFrame("start", file)}
            onClear={() => form.clearFrame("start")}
            onError={(message) => toast.error(message)}
          />

          <Hint text={endFrameReason} wrap={!model.endFrame}>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={form.swapFrames}
              disabled={!model.endFrame}
              aria-label="Swap start and end frames"
            >
              <ArrowLeftRight />
            </Button>
          </Hint>

          <Hint text={endFrameReason} wrap={!model.endFrame}>
            <UploadSlot
              label="End frame"
              previewUrl={form.endFrame?.previewUrl}
              disabled={!model.endFrame}
              onSelect={(file) => form.pickFrame("end", file)}
              onClear={() => form.clearFrame("end")}
              onError={(message) => toast.error(message)}
            />
          </Hint>
        </div>

        {form.fromRemix && (
          <div className="mt-2 flex items-center gap-1.5">
            <Badge variant="accentSoft">from remix</Badge>
            <button
              type="button"
              onClick={form.clearRemix}
              aria-label="Remove the remix start frame"
              className={cn(
                "inline-flex size-5 items-center justify-center rounded-full",
                "text-text-faint transition-colors hover:bg-surface-3 hover:text-text",
              )}
            >
              <X className="size-3" />
            </button>
          </div>
        )}
      </section>

      {/* References -------------------------------------------------------- */}
      <section>
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-text-faint uppercase">
            References
          </h2>
          <Images className="size-3 text-text-faint" aria-hidden="true" />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((index) => {
            const disabled = index >= model.maxRefs;
            const reason = disabled
              ? model.maxRefs === 0
                ? refsReason
                : `${model.name} takes at most ${model.maxRefs} reference image${model.maxRefs === 1 ? "" : "s"}.`
              : undefined;
            return (
              <Hint key={index} text={reason} wrap={disabled}>
                <UploadSlot
                  label={`Reference ${index + 1}`}
                  size="sm"
                  disabled={disabled}
                  previewUrl={form.refs[index]?.previewUrl}
                  onSelect={(file) => form.pickRef(index, file)}
                  onClear={() => form.clearRef(index)}
                  onError={(message) => toast.error(message)}
                />
              </Hint>
            );
          })}
        </div>
      </section>

      {/* Prompt ------------------------------------------------------------ */}
      <section className="rounded-md border border-border bg-surface-2/60 p-3">
        <PromptBox
          id="video-prompt"
          label="Describe the shot"
          value={form.prompt}
          onChange={form.setPrompt}
          onSubmit={onGenerate}
          placeholder="Describe the shot. Subject, action, camera, light..."
          rows={4}
        />
      </section>

      {/* Model ------------------------------------------------------------- */}
      <section>
        <h2 className="text-xs font-semibold tracking-wide text-text-faint uppercase">
          Model
        </h2>
        <div className="mt-2">
          <ModelPicker
            models={PICKER_MODELS}
            value={settings.model}
            onChange={form.setModel}
            className="w-full justify-between"
          />
          <p className="mt-1.5 text-sm leading-snug text-text-faint">{model.blurb}</p>
        </div>
      </section>

      {/* Settings chips ----------------------------------------------------- */}
      <section className="flex flex-wrap items-center gap-2">
        <ChipSelect
          title="Duration"
          icon={<Clock />}
          size="sm"
          width="w-40"
          value={settings.duration}
          onChange={(value) => form.setSetting("duration", value)}
          display={`${settings.duration}s`}
          options={model.durations.map((duration) => ({
            value: duration,
            label: `${duration}s`,
          }))}
        />

        <ChipSelect
          title="Resolution"
          icon={<MonitorPlay />}
          size="sm"
          width="w-40"
          value={settings.resolution}
          onChange={(value) => form.setSetting("resolution", value)}
          options={model.resolutions.map((resolution) => ({
            value: resolution,
            label: resolution,
          }))}
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

        <Hint
          text={model.audio ? undefined : unsupportedReason(model.name, "audio")}
          wrap={!model.audio}
        >
          <label
            className={cn(
              "inline-flex h-8 items-center gap-2 rounded-full border border-border bg-surface-2 px-3 text-sm",
              !model.audio && "opacity-40",
            )}
          >
            <Volume2 className="size-3.5 text-text-faint" aria-hidden="true" />
            <span className="text-text">Audio</span>
            <Switch
              size="sm"
              checked={settings.audio}
              disabled={!model.audio}
              onCheckedChange={(checked) => form.setSetting("audio", checked)}
              aria-label="Generate audio"
            />
          </label>
        </Hint>
      </section>

      {/* Generate (desktop). Mobile gets the docked bar instead. ------------ */}
      <Button
        variant="primary"
        size="lg"
        className="hidden w-full lg:inline-flex"
        disabled={!canGenerate}
        loading={pending}
        onClick={onGenerate}
      >
        <Film /> Generate
      </Button>
    </div>
  );
}
