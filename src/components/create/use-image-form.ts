"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  frameFromFile,
  frameFromSample,
  releaseFrame,
  type Frame,
} from "@/components/create/use-frames";
import type { ImagePrefill } from "@/components/create/image-prefill";
import { snapImageSettings, type ImageSettings } from "@/lib/create/settings";
import type { ImageRequest } from "@/lib/generation/types";
import { DEFAULT_IMAGE_MODEL, getImageModel } from "@/lib/models";
import type { Sample } from "@/lib/samples";
import type { Generation } from "@/lib/store/library";
import type { GenerationThumbs } from "@/lib/store/use-generation-queue";

export type ImageForm = ReturnType<typeof useImageForm>;

/** The image bar's state. Same job as useVideoForm, fewer moving parts. */
export function useImageForm(prefill: ImagePrefill) {
  const [prompt, setPrompt] = React.useState(prefill.prompt);
  const [settings, setSettings] = React.useState<ImageSettings>(prefill.settings);
  const [refs, setRefs] = React.useState<Frame[]>(prefill.refs);

  const liveUrls = React.useRef<Set<string>>(new Set());
  React.useEffect(() => {
    const urls = liveUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const model = getImageModel(settings.model) ?? DEFAULT_IMAGE_MODEL;

  const drop = React.useCallback((frame: Frame | null | undefined) => {
    if (frame?.isObjectUrl) liveUrls.current.delete(frame.previewUrl);
    releaseFrame(frame);
  }, []);

  const setModel = React.useCallback(
    (id: string) => {
      const next = getImageModel(id);
      if (!next) return;

      const { next: snapped, messages } = snapImageSettings(next, settings);
      setSettings(snapped);

      if (refs.length > next.maxRefs) {
        setRefs((current) => {
          current.slice(next.maxRefs).forEach(drop);
          return current.slice(0, next.maxRefs);
        });
        messages.push(
          next.maxRefs === 0
            ? `${next.name} takes no reference images, removed them`
            : `${next.name} takes ${next.maxRefs}, dropped the extra reference images`,
        );
      }

      if (messages.length > 0) {
        toast(messages[0], {
          description: messages.slice(1).join(" · ") || undefined,
        });
      }
    },
    [drop, refs.length, settings],
  );

  const setSetting = React.useCallback(
    <K extends keyof ImageSettings>(key: K, value: ImageSettings[K]) => {
      setSettings((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const addRefFile = React.useCallback(
    (file: File) => {
      void (async () => {
        const frame = await frameFromFile(file);
        if (frame.isObjectUrl) liveUrls.current.add(frame.previewUrl);
        setRefs((current) =>
          current.length >= model.maxRefs ? current : [...current, frame],
        );
      })();
    },
    [model.maxRefs],
  );

  /**
   * "Use as reference" on a result tile.
   *
   * Decided against a state updater here - the toasts are side effects, and
   * updaters can run more than once.
   */
  const addSampleRef = React.useCallback(
    (sample: Sample) => {
      if (model.maxRefs === 0) {
        toast(`${model.name} doesn't take reference images`);
        return;
      }
      if (refs.length >= model.maxRefs) {
        toast(`That's the ${model.maxRefs} references ${model.name} allows`);
        return;
      }
      if (refs.some((frame) => frame.fromSampleId === sample.id)) {
        toast("Already in the references");
        return;
      }
      setRefs((current) => [...current, frameFromSample(sample)]);
      toast.success("Added as a reference");
    },
    [model.maxRefs, model.name, refs],
  );

  const removeRef = React.useCallback(
    (index: number) => {
      setRefs((current) => {
        drop(current[index]);
        return current.filter((_, i) => i !== index);
      });
    },
    [drop],
  );

  const reuse = React.useCallback(
    (generation: Generation) => {
      if (generation.request.kind !== "image") return;
      const request = generation.request;
      const next = getImageModel(request.model) ?? DEFAULT_IMAGE_MODEL;

      setPrompt(request.prompt);
      setSettings(
        snapImageSettings(next, {
          model: next.id,
          aspect: request.aspect,
          quality: request.quality,
          resolution: request.resolution,
          count: request.count,
        }).next,
      );
      setRefs((current) => {
        current.forEach(drop);
        return generation.thumbs.refs.map((src) => ({
          previewUrl: src,
          thumb: src,
          isObjectUrl: false,
        }));
      });
      toast.success("Settings loaded into the bar");
    },
    [drop],
  );

  const toRequest = React.useCallback(
    (seed?: number): ImageRequest => ({
      kind: "image",
      model: settings.model,
      prompt: prompt.trim(),
      aspect: settings.aspect,
      quality: settings.quality,
      resolution: settings.resolution,
      count: settings.count,
      refCount: refs.length,
      ...(seed === undefined ? {} : { seed }),
    }),
    [prompt, refs.length, settings],
  );

  const thumbs = React.useMemo<GenerationThumbs>(
    () => ({ refs: refs.map((ref) => ref.thumb).filter(Boolean) }),
    [refs],
  );

  return {
    prompt,
    setPrompt,
    settings,
    setSetting,
    model,
    setModel,
    refs,
    addRefFile,
    addSampleRef,
    removeRef,
    reuse,
    toRequest,
    thumbs,
  };
}
