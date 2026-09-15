#!/usr/bin/env bash
# Stub. The real implementation lands in spec 02.
#
# It will transcode everything in samples-raw/ with ffmpeg into public/samples/:
# videos to H.264 mp4 (short side 720, crf ~28, audio stripped, +faststart,
# trimmed to 10s), a poster jpg grabbed at ~1s, and images to webp under ~400 KB.
# It prints the final size of every file and fails loudly if anything is over
# the limit.
set -euo pipefail

echo "samples:prepare is not implemented yet. See spec/02-sample-library.md." >&2
exit 1
