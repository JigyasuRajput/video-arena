"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Clock,
  Copy,
  Film,
  Frame,
  Image as ImageIcon,
  Maximize2,
  Ratio,
  Sparkles,
  Trash2,
  Volume2,
  Wand2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverItem,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Stepper } from "@/components/ui/stepper";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UploadSlot } from "@/components/ui/upload-slot";
import { Logo, LogoGlyph } from "@/components/layout/logo";

/* A stand-in thumbnail so UploadSlot's filled state has something to show. */
const SAMPLE_THUMB =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#2a3a12"/><stop offset="0.55" stop-color="#6b7d2a"/>
        <stop offset="1" stop-color="#d7ff3a"/>
      </linearGradient></defs>
      <rect width="160" height="120" fill="url(#g)"/>
    </svg>`,
  );

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-8">
      <div className="mb-5">
        <h2 className="display text-xl text-accent">{title}</h2>
        {hint && <p className="mt-1 text-base text-text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-2 text-xs tracking-wide text-text-faint uppercase">
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

const TOKENS = [
  ["--bg", "bg-bg"],
  ["--surface", "bg-surface"],
  ["--surface-2", "bg-surface-2"],
  ["--surface-3", "bg-surface-3"],
  ["--text", "bg-text"],
  ["--text-muted", "bg-text-muted"],
  ["--text-faint", "bg-text-faint"],
  ["--accent", "bg-accent"],
  ["--accent-hover", "bg-accent-hover"],
  ["--pink", "bg-pink"],
  ["--danger", "bg-danger"],
  ["--success", "bg-success"],
] as const;

const TYPE_SCALE = [
  ["text-xs", "12px"],
  ["text-sm", "13px"],
  ["text-base", "14px"],
  ["text-lg", "16px"],
  ["text-xl", "20px"],
  ["text-2xl", "28px"],
  ["text-3xl", "40px"],
  ["text-4xl", "64px"],
] as const;

export function UiGallery() {
  const [duration, setDuration] = React.useState(8);
  const [aspect, setAspect] = React.useState("16:9");
  const [count, setCount] = React.useState(1);
  const [quality, setQuality] = React.useState("standard");
  const [audio, setAudio] = React.useState(true);
  const [thumb, setThumb] = React.useState<string | undefined>(SAMPLE_THUMB);

  return (
    <main className="container-page py-10">
      <header className="mb-10">
        <Logo />
        <h1 className="display mt-6 text-3xl">
          Component gallery
          <br />
          <span className="text-accent">every state in one place</span>
        </h1>
        <p className="mt-3 max-w-xl text-lg text-text-muted">
          Dev only, not linked from the app, 404 in production. Hover and tab
          through things — focus rings and hover states are part of what this
          page is for.
        </p>
      </header>

      <div className="flex flex-col gap-10">
        <Section title="Tokens" hint="Dark only. One loud accent.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {TOKENS.map(([name, cls]) => (
              <div key={name} className="flex flex-col gap-1.5">
                <div
                  className={`h-14 rounded-md border border-border ${cls}`}
                />
                <code className="text-xs text-text-faint">{name}</code>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Type"
          hint="Inter for UI, Archivo for the display headings."
        >
          <div className="flex flex-col gap-3">
            {/* The 64px specimen is wider than a 375px viewport, so the label
                stacks above it on mobile and the text is allowed to break. */}
            {TYPE_SCALE.map(([cls, px]) => (
              <div
                key={cls}
                className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <code className="shrink-0 text-xs text-text-faint sm:w-24">
                  {px}
                </code>
                <span className={`${cls} min-w-0 break-words`}>
                  Describe the shot
                </span>
              </div>
            ))}
            <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
              <code className="shrink-0 text-xs text-text-faint sm:w-24">
                .display
              </code>
              <span className="display min-w-0 text-3xl break-words">
                Make videos <span className="text-accent">from a prompt</span>
              </span>
            </div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
              <code className="shrink-0 text-xs text-text-faint sm:w-24">
                .tabular
              </code>
              <span className="tabular min-w-0 text-xl break-words">
                1111 / 0000 / 8s / 10s
              </span>
            </div>
          </div>
        </Section>

        <Section title="Logo">
          <Row label="Full / glyph only / large">
            <Logo />
            <Logo glyphOnly />
            <LogoGlyph className="size-10 text-accent" />
            <div className="rounded-md bg-white p-2">
              <LogoGlyph className="size-6 text-[#0a0a0b]" />
            </div>
          </Row>
        </Section>

        <Section title="Button" hint="Four variants, three sizes, plus icons.">
          <Row label="Primary">
            <Button variant="primary" size="sm">
              Generate
            </Button>
            <Button variant="primary" size="md">
              Generate
            </Button>
            <Button variant="primary" size="lg">
              <Sparkles /> Generate
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
            <Button variant="primary" loading>
              Generating
            </Button>
          </Row>
          <Row label="Secondary">
            <Button size="sm">Reuse</Button>
            <Button>Reuse</Button>
            <Button size="lg">Reuse</Button>
            <Button disabled>Disabled</Button>
            <Button loading>Loading</Button>
          </Row>
          <Row label="Ghost">
            <Button variant="ghost" size="sm">
              Copy prompt
            </Button>
            <Button variant="ghost">Copy prompt</Button>
            <Button variant="ghost" size="lg">
              Copy prompt
            </Button>
            <Button variant="ghost" disabled>
              Disabled
            </Button>
          </Row>
          <Row label="Outline">
            <Button variant="outline" size="sm">
              Remix
            </Button>
            <Button variant="outline">Remix</Button>
            <Button variant="outline" size="lg">
              Remix
            </Button>
            <Button variant="outline" disabled>
              Disabled
            </Button>
          </Row>
          <Row label="Icon only (all have aria-labels)">
            <Button variant="ghost" size="icon-sm" aria-label="Copy">
              <Copy />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Delete">
              <Trash2 />
            </Button>
            <Button variant="secondary" size="icon" aria-label="Expand">
              <Maximize2 />
            </Button>
            <Button variant="primary" size="icon-lg" aria-label="Enhance">
              <Wand2 />
            </Button>
          </Row>
        </Section>

        <Section
          title="Chip"
          hint="The control primitive. Icon plus value, as a pill."
        >
          <Row label="Resting / active / disabled">
            <Chip icon={<Clock />}>8s</Chip>
            <Chip icon={<Ratio />} active>
              16:9
            </Chip>
            <Chip icon={<Film />} chevron>
              1080p
            </Chip>
            <Chip icon={<Volume2 />} disabled>
              No audio
            </Chip>
            <Chip size="sm" icon={<Clock />}>
              4s
            </Chip>
          </Row>
          <Row label="As a popover trigger (click it)">
            <Popover>
              <PopoverTrigger asChild>
                <Chip icon={<Clock />} chevron>
                  {duration}s
                </Chip>
              </PopoverTrigger>
              <PopoverContent className="w-44">
                <PopoverHeader>
                  <PopoverTitle>Duration</PopoverTitle>
                </PopoverHeader>
                {[4, 5, 6, 8, 10].map((value) => (
                  <PopoverItem
                    key={value}
                    selected={value === duration}
                    onClick={() => setDuration(value)}
                  >
                    <span className="tabular">{value}s</span>
                  </PopoverItem>
                ))}
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Chip icon={<Ratio />} chevron>
                  {aspect}
                </Chip>
              </PopoverTrigger>
              <PopoverContent className="w-44">
                <PopoverHeader>
                  <PopoverTitle>Aspect ratio</PopoverTitle>
                </PopoverHeader>
                {["16:9", "9:16", "1:1"].map((value) => (
                  <PopoverItem
                    key={value}
                    selected={value === aspect}
                    onClick={() => setAspect(value)}
                  >
                    {value}
                  </PopoverItem>
                ))}
              </PopoverContent>
            </Popover>
          </Row>
        </Section>

        <Section title="Badge" hint="Pink is reserved for Top / New only.">
          <Row label="Variants">
            <Badge variant="accentSoft">
              <Sparkles /> Simulated
            </Badge>
            <Badge>Demo sample</Badge>
            <Badge variant="pink">Top</Badge>
            <Badge variant="pink">New</Badge>
            <Badge variant="accent">Popular</Badge>
            <Badge variant="outline">16:9</Badge>
            <Badge variant="success">Completed</Badge>
            <Badge variant="danger">Failed</Badge>
            <Badge size="xs">xs</Badge>
          </Row>
          <Row label="Overlay (sits on media)">
            <div className="relative h-24 w-40 overflow-hidden rounded-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SAMPLE_THUMB}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute top-2 left-2 flex gap-1.5">
                <Badge variant="overlay">Demo sample</Badge>
                <Badge variant="overlay">9:16</Badge>
              </div>
            </div>
          </Row>
        </Section>

        <Section title="Card">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card padded>
              <CardTitle>Plain card</CardTitle>
              <CardDescription className="mt-1">
                Surface, thin border, 16px radius.
              </CardDescription>
            </Card>
            <Card interactive className="cursor-pointer">
              <CardHeader>
                <CardTitle>Interactive</CardTitle>
                <CardDescription>Hover me — border brightens.</CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <Badge variant="accent">Popular</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>With footer</CardTitle>
                <CardDescription>Header, content, footer.</CardDescription>
              </CardHeader>
              <CardContent className="pt-3 text-base text-text-muted">
                Body copy sits at 14px.
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="primary">
                  Action
                </Button>
                <Button size="sm" variant="ghost">
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          </div>
        </Section>

        <Section title="Popover, dropdown, tooltip, dialog">
          <Row label="Open each one">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary">Popover</Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverHeader>
                  <PopoverTitle>Demo build</PopoverTitle>
                </PopoverHeader>
                <p className="px-2 pb-2 text-sm text-text-muted">
                  Generation is simulated. Results come from a library of free
                  stock clips.
                </p>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">Dropdown</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>
                  <Copy /> Copy prompt
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Sparkles /> Regenerate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary">Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>
                Generation is simulated in this demo, the clip is a stock
                sample.
              </TooltipContent>
            </Tooltip>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Dialog (sm)</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear library?</DialogTitle>
                  <DialogDescription>
                    This removes every generation saved in this browser. It
                    can&apos;t be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="primary">Clear library</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Dialog (media)</Button>
              </DialogTrigger>
              <DialogContent size="media">
                <div className="grid gap-0 md:grid-cols-[1fr_320px]">
                  <div className="flex items-center justify-center bg-black p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={SAMPLE_THUMB}
                      alt="Sample"
                      className="max-h-[60vh] w-full rounded-md object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-3 border-l border-border p-5">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="accentSoft">Demo sample</Badge>
                      <Badge variant="outline">16:9</Badge>
                    </div>
                    <DialogTitle>Prompt idea</DialogTitle>
                    <DialogDescription>
                      Neon-lit street after rain, slow dolly forward, reflections
                      on wet asphalt, shallow depth of field.
                    </DialogDescription>
                    <div className="mt-auto flex gap-2">
                      <Button variant="primary" className="flex-1">
                        Remix
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Copy">
                        <Copy />
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </Row>
        </Section>

        <Section title="Segmented, stepper, switch, tabs">
          <Row label="Segmented">
            <Segmented
              aria-label="Quality"
              value={quality}
              onValueChange={setQuality}
              options={[
                { value: "standard", label: "Standard" },
                { value: "high", label: "High" },
              ]}
            />
            <Segmented
              aria-label="Image count"
              value={count}
              onValueChange={setCount}
              options={[1, 2, 3, 4].map((n) => ({
                value: n,
                label: n,
                srLabel: `${n} images`,
              }))}
            />
            <Segmented
              aria-label="Kind"
              size="sm"
              value={quality}
              onValueChange={setQuality}
              options={[
                { value: "standard", label: "Video", icon: <Film /> },
                { value: "high", label: "Image", icon: <ImageIcon /> },
              ]}
            />
          </Row>
          <Row label="Stepper">
            <Stepper label="Images" value={count} onValueChange={setCount} />
            <Stepper
              label="Images"
              size="sm"
              value={count}
              onValueChange={setCount}
            />
            <Stepper
              label="Images"
              value={count}
              onValueChange={setCount}
              disabled
            />
          </Row>
          <Row label="Switch">
            <span className="flex items-center gap-2 text-base">
              <Switch checked={audio} onCheckedChange={setAudio} id="audio" />
              <label htmlFor="audio">Audio {audio ? "on" : "off"}</label>
            </span>
            <Switch size="sm" defaultChecked />
            <Switch disabled />
            <Switch disabled defaultChecked />
          </Row>
          <Row label="Tabs">
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="videos">Videos</TabsTrigger>
                <TabsTrigger value="images">Images</TabsTrigger>
              </TabsList>
              <TabsContent value="all" />
            </Tabs>
            <Tabs defaultValue="explore">
              <TabsList variant="line">
                <TabsTrigger value="explore">Explore</TabsTrigger>
                <TabsTrigger value="video">Video</TabsTrigger>
                <TabsTrigger value="image">Image</TabsTrigger>
              </TabsList>
              <TabsContent value="explore" />
            </Tabs>
          </Row>
        </Section>

        <Section title="Skeleton" hint="Shimmer stops under reduced motion.">
          <div className="grid w-full gap-4 sm:grid-cols-3">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="aspect-[9/16] w-full max-w-36 rounded-lg" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-2 h-9 w-28 rounded-full" />
            </div>
          </div>
        </Section>

        <Section
          title="Upload slot"
          hint="Click, or drag an image onto one. Files stay in the browser."
        >
          <div className="grid w-full max-w-lg grid-cols-2 gap-3 sm:grid-cols-4">
            <UploadSlot
              label="Start frame"
              previewUrl={thumb}
              onSelect={() => toast.success("Picked a start frame")}
              onClear={() => setThumb(undefined)}
              onError={(message) => toast.error(message)}
              icon={<Frame />}
            />
            <UploadSlot
              label="End frame"
              onSelect={() => setThumb(SAMPLE_THUMB)}
              onError={(message) => toast.error(message)}
              icon={<Frame />}
            />
            <UploadSlot
              label="Not supported"
              disabled
              onError={(message) => toast.error(message)}
            />
            <UploadSlot
              label="Reference"
              size="sm"
              onError={(message) => toast.error(message)}
            />
          </div>
        </Section>

        <Section title="Toasts" hint="Nothing in this app uses alert().">
          <Row label="Fire one">
            <Button onClick={() => toast("Switched duration to 8s")}>
              Default
            </Button>
            <Button onClick={() => toast.success("Prompt copied")}>
              Success
            </Button>
            <Button onClick={() => toast.error("That image is over 10 MB.")}>
              Error
            </Button>
            <Button
              onClick={() =>
                toast("Generation deleted", {
                  description: "Removed from this browser.",
                  action: { label: "Undo", onClick: () => toast("Restored") },
                })
              }
            >
              With action
            </Button>
          </Row>
        </Section>
      </div>
    </main>
  );
}
