"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  frameFromFile,
  frameThumb,
  releaseFrame,
  type Frame,
} from "@/components/create/use-frames";
import type { VideoPrefill } from "@/components/create/video-prefill";
import { snapVideoSettings, type VideoSettings } from "@/lib/create/settings";
import type { VideoRequest } from "@/lib/generation/types";
import type { GenerationThumbs } from "@/lib/store/use-generation-queue";
import { getVideoModel, DEFAULT_VIDEO_MODEL, type VideoModel } from "@/lib/models";
import type { Generation } from "@/lib/store/library";

export type FrameSlot = "start" | "end";

export type VideoForm = ReturnType<typeof useVideoForm>;

/**
 * All of the video panel's state in one place, so the panel itself stays
 * presentational and the page can drive it (remix, reuse, autostart) without
 * reaching into a dozen setters.
 */
export function useVideoForm(prefill: VideoPrefill) {
  const [prompt, setPrompt] = React.useState(prefill.prompt);
  const [settings, setSettings] = React.useState<VideoSettings>(prefill.settings);
  const [startFrame, setStartFrame] = React.useState<Frame | null>(prefill.startFrame);
  const [endFrame, setEndFrame] = React.useState<Frame | null>(prefill.endFrame);
  const [refs, setRefs] = React.useState<Frame[]>(prefill.refs);
  const [fromRemix, setFromRemix] = React.useState(prefill.fromRemix);

  // Object URLs live as long as the document, which in an SPA is the whole
  // session. Track them so leaving the page doesn't strand them.
  const liveUrls = React.useRef<Set<string>>(new Set());
  React.useEffect(() => {
    const urls = liveUrls.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const model = getVideoModel(settings.model) ?? DEFAULT_VIDEO_MODEL;

  const track = React.useCallback((frame: Frame) => {
    if (frame.isObjectUrl) liveUrls.current.add(frame.previewUrl);
    return frame;
  }, []);

  const drop = React.useCallback((frame: Frame | null | undefined) => {
    if (frame?.isObjectUrl) liveUrls.current.delete(frame.previewUrl);
    releaseFrame(frame);
  }, []);

  /** Model change: snap what no longer fits, and say what moved. */
  const setModel = React.useCallback(
    (id: string) => {
      const next = getVideoModel(id);
      if (!next) return;

      const { next: snapped, messages } = snapVideoSettings(next, settings);
      setSettings(snapped);

      if (endFrame && !next.endFrame) {
        drop(endFrame);
        setEndFrame(null);
        messages.push(`${next.name} has no end frame, removed it`);
      }
      setRefs((current) => {
        if (current.length <= next.maxRefs) return current;
        current.slice(next.maxRefs).forEach(drop);
        return current.slice(0, next.maxRefs);
      });
      if (refs.length > next.maxRefs) {
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
    [drop, endFrame, refs.length, settings],
  );

  const setSetting = React.useCallback(
    <K extends keyof VideoSettings>(key: K, value: VideoSettings[K]) => {
      setSettings((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const pickFrame = React.useCallback(
    (slot: FrameSlot, file: File) => {
      void (async () => {
        const frame = track(await frameFromFile(file));
        if (slot === "start") {
          setStartFrame((current) => {
            drop(current);
            return frame;
          });
          setFromRemix(false);
        } else {
          setEndFrame((current) => {
            drop(current);
            return frame;
          });
        }
      })();
    },
    [drop, track],
  );

  const clearFrame = React.useCallback(
    (slot: FrameSlot) => {
      if (slot === "start") {
        setStartFrame((current) => {
          drop(current);
          return null;
        });
        setFromRemix(false);
      } else {
        setEndFrame((current) => {
          drop(current);
          return null;
        });
      }
    },
    [drop],
  );

  const swapFrames = React.useCallback(() => {
    setStartFrame(endFrame);
    setEndFrame(startFrame);
  }, [endFrame, startFrame]);

  const pickRef = React.useCallback(
    (index: number, file: File) => {
      void (async () => {
        const frame = track(await frameFromFile(file));
        setRefs((current) => {
          const next = current.slice();
          drop(next[index]);
          next[index] = frame;
          return next.filter(Boolean);
        });
      })();
    },
    [drop, track],
  );

  const clearRef = React.useCallback(
    (index: number) => {
      setRefs((current) => {
        drop(current[index]);
        return current.filter((_, i) => i !== index);
      });
    },
    [drop],
  );

  const clearRemix = React.useCallback(() => {
    setFromRemix(false);
    setStartFrame((current) => {
      drop(current);
      return null;
    });
  }, [drop]);

  /** Put a finished generation's settings back into the panel. */
  const reuse = React.useCallback(
    (generation: Generation) => {
      if (generation.request.kind !== "video") return;
      const request = generation.request;
      const next = getVideoModel(request.model) ?? DEFAULT_VIDEO_MODEL;

      setPrompt(request.prompt);
      setSettings(
        snapVideoSettings(next, {
          model: next.id,
          duration: request.duration,
          aspect: request.aspect,
          resolution: request.resolution,
          audio: request.audio,
        }).next,
      );

      // Thumbs are all we kept, and they are exactly what the slots need.
      const fromThumb = (src?: string): Frame | null =>
        src ? { previewUrl: src, thumb: src, isObjectUrl: false } : null;

      setStartFrame((current) => {
        drop(current);
        return fromThumb(generation.thumbs.start);
      });
      setEndFrame((current) => {
        drop(current);
        return fromThumb(generation.thumbs.end);
      });
      setRefs((current) => {
        current.forEach(drop);
        return generation.thumbs.refs
          .map(fromThumb)
          .filter((frame): frame is Frame => Boolean(frame));
      });
      setFromRemix(false);
      toast.success("Settings loaded into the panel");
    },
    [drop],
  );

  const toRequest = React.useCallback(
    (seed?: number): VideoRequest => ({
      kind: "video",
      model: settings.model,
      prompt: prompt.trim(),
      duration: settings.duration,
      aspect: settings.aspect,
      resolution: settings.resolution,
      audio: settings.audio,
      hasStartFrame: Boolean(startFrame),
      hasEndFrame: Boolean(endFrame),
      refCount: refs.length,
      ...(seed === undefined ? {} : { seed }),
    }),
    [endFrame, prompt, refs.length, settings, startFrame],
  );

  const thumbs = React.useMemo<GenerationThumbs>(
    () => ({
      start: frameThumb(startFrame),
      end: frameThumb(endFrame),
      refs: refs.map((ref) => ref.thumb).filter(Boolean),
    }),
    [endFrame, refs, startFrame],
  );

  return {
    prompt,
    setPrompt,
    settings,
    setSetting,
    model,
    setModel,
    startFrame,
    endFrame,
    refs,
    pickFrame,
    clearFrame,
    swapFrames,
    pickRef,
    clearRef,
    fromRemix,
    clearRemix,
    reuse,
    toRequest,
    thumbs,
  };
}

export type { VideoModel };
