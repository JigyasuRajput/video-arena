#!/usr/bin/env bash
#
# Turn the raw Pexels downloads in samples-raw/ into the processed files that
# actually ship in public/samples/.
#
#   bun run samples:prepare
#
# Needs ffmpeg on PATH. Reads src/data/samples.json for each item's target
# aspect, so run samples:fetch first.
#
# Everything is centre-cropped to an exact aspect before scaling. That is
# deliberate: the manifest promises exact dimensions, the masonry wall stays
# predictable, and check-samples can verify the files really match.
set -euo pipefail

MANIFEST="src/data/samples.json"
RAW_DIR="samples-raw"
OUT_DIR="public/samples"

MAX_VIDEO_BYTES=$((6 * 1024 * 1024))
MAX_IMAGE_BYTES=$((400 * 1024))
MAX_POSTER_BYTES=$((300 * 1024))
MAX_TOTAL_BYTES=$((80 * 1024 * 1024))

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found on PATH. Install it (brew install ffmpeg) and re-run." >&2
  exit 1
fi

if [ ! -f "$MANIFEST" ]; then
  echo "$MANIFEST not found. Run 'bun run samples:fetch' first." >&2
  exit 1
fi

entries="$(bun -e '
  const manifest = require("./src/data/samples.json");
  if (!Array.isArray(manifest) || manifest.length === 0) {
    console.error("manifest is empty - run samples:fetch first");
    process.exit(1);
  }
  for (const s of manifest) {
    console.log([s.id, s.kind, s.width, s.height].join("\t"));
  }
')"

mkdir -p "$OUT_DIR/videos" "$OUT_DIR/posters" "$OUT_DIR/images"

fail=0
count=0

human() { awk -v b="$1" 'BEGIN{ printf "%.1f", b/1024/1024 }'; }
bytes_of() { wc -c < "$1" | tr -d ' '; }

while IFS=$'\t' read -r id kind width height; do
  [ -z "$id" ] && continue
  count=$((count + 1))
  ar="$(awk -v w="$width" -v h="$height" 'BEGIN{ printf "%.10f", w/h }')"
  # Largest centred rectangle of the target ratio, then scale to exact size.
  crop="crop='min(iw,ih*${ar})':'min(ih,iw/${ar})'"

  if [ "$kind" = "video" ]; then
    src="$RAW_DIR/videos/$id.mp4"
    out="$OUT_DIR/videos/$id.mp4"
    poster="$OUT_DIR/posters/$id.jpg"

    if [ ! -f "$src" ]; then
      echo "  MISSING raw video: $src" >&2
      fail=1
      continue
    fi

    ffmpeg -nostdin -loglevel error -y -i "$src" \
      -t 10 \
      -vf "${crop},scale=${width}:${height}:flags=lanczos" \
      -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 28 -preset slow \
      -movflags +faststart -an \
      "$out"

    # Poster from ~1s in; -ss before -i so it seeks rather than decodes.
    ffmpeg -nostdin -loglevel error -y -ss 1 -i "$src" -frames:v 1 \
      -vf "${crop},scale=${width}:${height}:flags=lanczos" \
      -q:v 4 "$poster" 2>/dev/null \
      || ffmpeg -nostdin -loglevel error -y -i "$src" -frames:v 1 \
           -vf "${crop},scale=${width}:${height}:flags=lanczos" \
           -q:v 4 "$poster"

    vbytes="$(bytes_of "$out")"
    pbytes="$(bytes_of "$poster")"
    printf "  %-26s %sx%-9s video %6s MB  poster %6s MB\n" \
      "$id" "$width" "$height" "$(human "$vbytes")" "$(human "$pbytes")"

    if [ "$vbytes" -gt "$MAX_VIDEO_BYTES" ]; then
      echo "    OVER LIMIT: video is $(human "$vbytes") MB, cap is 6 MB" >&2
      fail=1
    fi
    if [ "$pbytes" -gt "$MAX_POSTER_BYTES" ]; then
      echo "    OVER LIMIT: poster is $(human "$pbytes") MB, cap is 0.3 MB" >&2
      fail=1
    fi
  else
    src=""
    for ext in jpg jpeg png webp; do
      if [ -f "$RAW_DIR/images/$id.$ext" ]; then src="$RAW_DIR/images/$id.$ext"; break; fi
    done
    out="$OUT_DIR/images/$id.webp"

    if [ -z "$src" ]; then
      echo "  MISSING raw image: $RAW_DIR/images/$id.(jpg|jpeg|png|webp)" >&2
      fail=1
      continue
    fi

    # Step quality down until it fits the budget rather than guessing once.
    for q in 82 74 66 58 50; do
      ffmpeg -nostdin -loglevel error -y -i "$src" \
        -vf "${crop},scale=${width}:${height}:flags=lanczos" \
        -c:v libwebp -quality "$q" "$out"
      ibytes="$(bytes_of "$out")"
      [ "$ibytes" -le "$MAX_IMAGE_BYTES" ] && break
    done

    ibytes="$(bytes_of "$out")"
    printf "  %-26s %sx%-9s image %6s MB (q=%s)\n" \
      "$id" "$width" "$height" "$(human "$ibytes")" "$q"

    if [ "$ibytes" -gt "$MAX_IMAGE_BYTES" ]; then
      echo "    OVER LIMIT: image is $(human "$ibytes") MB, cap is 0.4 MB" >&2
      fail=1
    fi
  fi
done <<< "$entries"

total="$(find "$OUT_DIR" -type f -exec cat {} + 2>/dev/null | wc -c | tr -d ' ')"
echo ""
echo "Processed $count item(s). public/samples total: $(human "$total") MB"

if [ "$total" -gt "$MAX_TOTAL_BYTES" ]; then
  echo "OVER LIMIT: total is $(human "$total") MB, cap is 80 MB" >&2
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  echo "" >&2
  echo "One or more files broke a limit. Fix before committing." >&2
  exit 1
fi

echo "Next: bun run samples:check"
