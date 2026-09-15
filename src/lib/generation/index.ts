import { mockProvider } from "@/lib/generation/mock";
import type { GenerationProvider } from "@/lib/generation/types";

/**
 * Provider selection.
 *
 * `mock` is the default and, in this build, the only value. A real provider
 * (openrouter, fal, replicate) would be a second implementation of
 * GenerationProvider registered below - nothing calling getProvider() would
 * change, which is the whole point of the interface.
 */
export function getProvider(): GenerationProvider {
  const mode = process.env.GENERATION_MODE ?? "mock";
  switch (mode) {
    // case "openrouter": return openRouterProvider;
    case "mock":
    default:
      return mockProvider;
  }
}
