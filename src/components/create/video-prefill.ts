"use client";

import type { ReadonlyURLSearchParams } from "next/navigation";

import { frameFromSample, type Frame } from "@/components/create/use-frames";
import { snapVideoSettings, type VideoSettings } from "@/lib/create/settings";
import {
  DEFAULT_VIDEO_MODEL,
  getVideoModel,
  nearestDuration,
  type VideoModel,
} from "@/lib/models";
import { getSample, type Aspect } from "@/lib/samples";

/**
 * Everything the video page can be linked into.
 *
 * Read once, as the initial state of the form - not in an effect. Reading it
 * later would mean rendering the defaults first and overwriting them, which is
 * both a visible flash and a set-state-in-effect.
 */

export type VideoPrefill = {
  prompt: string;
  settings: VideoSettings;
  startFrame: Frame | null;
  /** Shows the removable "from remix" tag. */
  fromRemix: boolean;
  autostart: boolean;
};

const ASPECTS = new Set<string>(["16:9", "9:16", "1:1", "4:5", "3:4"]);

export function defaultVideoSettings(model: VideoModel = DEFAULT_VIDEO_MODEL): VideoSettings {
  return snapVideoSettings(model, {
    model: model.id,
    duration: 5,
    aspect: "16:9",
    resolution: "720p",
    audio: model.audio,
  }).next;
}

export function readVideoPrefill(params: ReadonlyURLSearchParams): VideoPrefill {
  const model = getVideoModel(params.get("model") ?? "") ?? DEFAULT_VIDEO_MODEL;

  let prompt = params.get("prompt") ?? "";
  let startFrame: Frame | null = null;
  let fromRemix = false;

  let duration = Number(params.get("duration"));
  let aspect = params.get("aspect");

  // ?remix= carries the most context, so it goes first and the explicit params
  // below can still override anything it set.
  const remix = getSample(params.get("remix") ?? "");
  if (remix) {
    fromRemix = true;
    if (!prompt) prompt = remix.prompt;
    if (!aspect) aspect = remix.aspect;
    if (!duration && remix.durationSec) duration = remix.durationSec;
    startFrame = frameFromSample(remix);
  }

  // ?startFrame= is the Animate hand-off from the image page.
  const handOff = getSample(params.get("startFrame") ?? "");
  if (handOff) startFrame = frameFromSample(handOff);

  const wanted: VideoSettings = {
    model: model.id,
    duration: Number.isFinite(duration) && duration > 0 ? duration : 5,
    aspect: aspect && ASPECTS.has(aspect) ? (aspect as Aspect) : "16:9",
    resolution: "720p",
    audio: model.audio,
  };
  // Nearest allowed duration rather than the model's first, so a 10s remix
  // doesn't silently become 4s.
  wanted.duration = nearestDuration(model.durations, wanted.duration);

  return {
    prompt: prompt.slice(0, 1500),
    settings: snapVideoSettings(model, wanted).next,
    startFrame,
    fromRemix,
    autostart: params.get("autostart") === "1",
  };
}

/**
 * Strip the params once they've been read, so a refresh doesn't fire a second
 * generation. `history.replaceState` rather than router.replace: Next would
 * re-run the route and reset scroll for no reason.
 */
export function clearPrefillParams(): void {
  const url = new URL(window.location.href);
  let touched = false;
  for (const key of ["prompt", "model", "duration", "aspect", "autostart", "remix", "startFrame"]) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      touched = true;
    }
  }
  if (!touched) return;
  const query = url.searchParams.toString();
  window.history.replaceState(null, "", `${url.pathname}${query ? `?${query}` : ""}`);
}
