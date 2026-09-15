"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { Clock, Film, Ratio, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverItem,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePrefersReducedMotion } from "@/components/explore/use-reduced-motion";
import {
  DEFAULT_VIDEO_MODEL,
  VIDEO_MODELS,
  nearestDuration,
} from "@/lib/models";
import type { Aspect, Sample } from "@/lib/samples";

export function Hero({ backdrop }: { backdrop?: Sample }) {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();

  const [modelId, setModelId] = React.useState(DEFAULT_VIDEO_MODEL.id);
  const [prompt, setPrompt] = React.useState("");
  const [videoReady, setVideoReady] = React.useState(false);

  const model = VIDEO_MODELS.find((m) => m.id === modelId) ?? DEFAULT_VIDEO_MODEL;
  const [duration, setDuration] = React.useState(model.durations[0]);
  const [aspect, setAspect] = React.useState<Aspect>(model.aspects[0]);

  // Snap unsupported values when the model changes. Same rule as spec 05.
  const selectModel = (id: string) => {
    const next = VIDEO_MODELS.find((m) => m.id === id);
    if (!next) return;
    setModelId(id);
    if (!next.durations.includes(duration)) {
      setDuration(nearestDuration(next.durations, duration));
    }
    if (!next.aspects.includes(aspect)) setAspect(next.aspects[0]);
  };

  const canGenerate = prompt.trim().length >= 3;

  const submit = () => {
    if (!canGenerate) return;
    const params = new URLSearchParams({
      prompt: prompt.trim(),
      model: modelId,
      duration: String(duration),
      aspect,
      autostart: "1",
    });
    router.push(`/create/video?${params.toString()}`);
  };

  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      {/* Backdrop: poster first, video fades in once it can actually play.
          Under reduced motion the video never mounts. */}
      {backdrop && (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          {backdrop.poster && (
            <Image
              src={backdrop.poster}
              alt=""
              fill
              priority
              sizes="100vw"
              className="scale-105 object-cover blur-[2px]"
            />
          )}
          {!reducedMotion && (
            <video
              src={backdrop.src}
              poster={backdrop.poster}
              muted
              loop
              playsInline
              autoPlay
              preload="auto"
              onCanPlay={() => setVideoReady(true)}
              className={cn(
                "absolute inset-0 h-full w-full scale-105 object-cover blur-[2px] transition-opacity duration-700",
                videoReady ? "opacity-100" : "opacity-0",
              )}
            />
          )}
          {/* Two layers: a flat knock-down so text stays readable over any
              frame, then a gradient that lands the bottom edge on --bg so the
              hero blends into the page instead of ending on a hard line. */}
          <div className="absolute inset-0 bg-bg/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/55 to-bg" />
        </div>
      )}

      <div className="container-page py-16 sm:py-24">
        <h1 className="display max-w-4xl text-3xl sm:text-4xl">
          Make videos
          <br />
          <span className="text-accent">from a single prompt</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-text-muted">
          Describe the shot you want. Pick a model, a length and a shape. This
          demo returns a stock clip instead of calling a model — everything else
          works exactly as it would.
        </p>

        {/* Compact version of the create-page prompt bar. */}
        <div className="mt-8 max-w-3xl rounded-lg border border-border bg-surface/90 p-3 shadow-[var(--shadow-pop)] backdrop-blur-xl">
          <label htmlFor="hero-prompt" className="sr-only">
            Describe the shot
          </label>
          <textarea
            id="hero-prompt"
            rows={2}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                submit();
              }
            }}
            placeholder="Describe the shot. Subject, action, camera, light..."
            className={cn(
              "w-full resize-none bg-transparent px-2 py-1.5 text-lg text-text",
              "placeholder:text-text-faint focus:outline-none",
            )}
          />

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Chip size="sm" icon={<Sparkles />} chevron>
                  {model.name}
                </Chip>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <PopoverHeader>
                  <PopoverTitle>Model</PopoverTitle>
                </PopoverHeader>
                {VIDEO_MODELS.map((option) => (
                  <PopoverItem
                    key={option.id}
                    selected={option.id === modelId}
                    onClick={() => selectModel(option.id)}
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">{option.name}</span>
                      <span className="text-sm text-text-faint">
                        {option.blurb}
                      </span>
                    </span>
                  </PopoverItem>
                ))}
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Chip size="sm" icon={<Clock />} chevron>
                  {duration}s
                </Chip>
              </PopoverTrigger>
              <PopoverContent className="w-40">
                <PopoverHeader>
                  <PopoverTitle>Duration</PopoverTitle>
                </PopoverHeader>
                {model.durations.map((option) => (
                  <PopoverItem
                    key={option}
                    selected={option === duration}
                    onClick={() => setDuration(option)}
                  >
                    <span className="tabular">{option}s</span>
                  </PopoverItem>
                ))}
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Chip size="sm" icon={<Ratio />} chevron>
                  {aspect}
                </Chip>
              </PopoverTrigger>
              <PopoverContent className="w-40">
                <PopoverHeader>
                  <PopoverTitle>Aspect ratio</PopoverTitle>
                </PopoverHeader>
                {model.aspects.map((option) => (
                  <PopoverItem
                    key={option}
                    selected={option === aspect}
                    onClick={() => setAspect(option)}
                  >
                    {option}
                  </PopoverItem>
                ))}
              </PopoverContent>
            </Popover>

            <Button
              variant="primary"
              size="sm"
              className="ml-auto"
              disabled={!canGenerate}
              onClick={submit}
            >
              <Film /> Generate
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
