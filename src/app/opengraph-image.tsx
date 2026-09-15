import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} · ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Static OG card so the live link looks right when it's pasted somewhere.
 * Deliberately built from primitives - no remote fonts or images, so it can't
 * fail at build time.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0b",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 1.6 21.5 7v10L12 22.4 2.5 17V7L12 1.6Z"
              stroke="#d7ff3a"
              strokeWidth="1.9"
              strokeLinejoin="round"
            />
            <path d="M10.1 8.3 16.4 12l-6.3 3.7V8.3Z" fill="#d7ff3a" />
          </svg>
          <div style={{ fontSize: 34, color: "#f4f4f5", letterSpacing: -0.5 }}>
            video arena
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 82,
              fontWeight: 800,
              color: "#f4f4f5",
              letterSpacing: -2.5,
              lineHeight: 1.02,
              textTransform: "uppercase",
            }}
          >
            Make videos
          </div>
          <div
            style={{
              fontSize: 82,
              fontWeight: 800,
              color: "#d7ff3a",
              letterSpacing: -2.5,
              lineHeight: 1.02,
              textTransform: "uppercase",
            }}
          >
            from a single prompt
          </div>
          <div style={{ marginTop: 26, fontSize: 28, color: "#a1a1aa" }}>
            Generation is simulated · demo samples from Pexels
          </div>
        </div>
      </div>
    ),
    size,
  );
}
