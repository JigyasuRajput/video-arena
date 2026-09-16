"use client";

import type { ReadonlyURLSearchParams } from "next/navigation";

import { frameFromSample, type Frame } from "@/components/create/use-frames";
import { snapImageSettings, type ImageSettings } from "@/lib/create/settings";
import { DEFAULT_IMAGE_MODEL, getImageModel, type ImageModel } from "@/lib/models";
import { getSample, type Aspect } from "@/lib/samples";
import { peekDraft } from "@/lib/store/draft";

/** Same shape as the video page's prefill, one kind down. */
export type ImagePrefill = {
  prompt: string;
  settings: ImageSettings;
  refs: Frame[];
  autostart: boolean;
};

const ASPECTS = new Set<string>(["16:9", "9:16", "1:1", "4:5", "3:4"]);

export function defaultImageSettings(
  model: ImageModel = DEFAULT_IMAGE_MODEL,
): ImageSettings {
  return snapImageSettings(model, {
    model: model.id,
    aspect: "1:1",
    quality: "standard",
    resolution: "1K",
    count: 2,
  }).next;
}

export function readImagePrefill(params: ReadonlyURLSearchParams): ImagePrefill {
  // Same hand-off as the video page: the library parks a whole request here
  // rather than trying to express one in a URL.
  const draft = peekDraft("image");
  if (draft && draft.request.kind === "image") {
    const request = draft.request;
    const model = getImageModel(request.model) ?? DEFAULT_IMAGE_MODEL;
    return {
      prompt: request.prompt,
      settings: snapImageSettings(model, {
        model: model.id,
        aspect: request.aspect,
        quality: request.quality,
        resolution: request.resolution,
        count: request.count,
      }).next,
      refs: draft.thumbs.refs
        .slice(0, model.maxRefs)
        .map((src) => ({ previewUrl: src, thumb: src, isObjectUrl: false })),
      autostart: draft.autostart,
    };
  }

  const model = getImageModel(params.get("model") ?? "") ?? DEFAULT_IMAGE_MODEL;

  let prompt = params.get("prompt") ?? "";
  let aspect = params.get("aspect");
  const refs: Frame[] = [];

  // ?remix= on this page means: same idea, and use the image itself as the
  // first reference rather than as a start frame.
  const remix = getSample(params.get("remix") ?? "");
  if (remix) {
    if (!prompt) prompt = remix.prompt;
    if (!aspect) aspect = remix.aspect;
    if (model.maxRefs > 0) refs.push(frameFromSample(remix));
  }

  return {
    prompt: prompt.slice(0, 1500),
    settings: snapImageSettings(model, {
      model: model.id,
      aspect: aspect && ASPECTS.has(aspect) ? (aspect as Aspect) : "1:1",
      quality: "standard",
      resolution: "1K",
      count: 2,
    }).next,
    refs,
    autostart: params.get("autostart") === "1",
  };
}
