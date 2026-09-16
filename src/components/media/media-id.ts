/**
 * `?media=` ids for generation results.
 *
 * On Explore the param is just a sample id, which is enough because a sample
 * appears on the wall once. A generation result can't work that way: two
 * generations from the same prompt come back with the same sample, so the id
 * has to say *which card* was clicked or prev/next lands on the wrong one and
 * the panel shows another generation's settings.
 *
 * `~` is the separator because generation ids are uuids and sample ids are
 * kebab-case, so neither can contain one.
 */

const SEP = "~";

export function generationMediaId(generationId: string, index: number): string {
  return `${generationId}${SEP}${index}`;
}

export function parseGenerationMediaId(
  mediaId: string | null | undefined,
): { generationId: string; index: number } | null {
  if (!mediaId) return null;
  const at = mediaId.lastIndexOf(SEP);
  if (at <= 0) return null;

  const index = Number(mediaId.slice(at + 1));
  if (!Number.isInteger(index) || index < 0) return null;

  return { generationId: mediaId.slice(0, at), index };
}
