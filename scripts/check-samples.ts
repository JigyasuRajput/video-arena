/**
 * Stub. The real implementation lands in spec 02.
 *
 * It will verify the manifest against what is actually on disk: every entry has
 * its files, no orphans in public/samples, sizes under the limits, dimensions
 * and duration matching the real file (via ffprobe when present), no duplicate
 * ids, a credit plus license url on every item, and at least two samples for
 * every aspect the create forms offer.
 */
console.error(
  "samples:check is not implemented yet. See spec/02-sample-library.md.",
);
process.exit(1);
