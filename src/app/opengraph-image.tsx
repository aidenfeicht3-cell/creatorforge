import { ImageResponse } from "next/og";

// Branded social-share card — shows up when a Snipd link is posted to
// TikTok / X / Discord / iMessage instead of a blank preview.
export const alt = "Snipd — paste a YouTube link, get 5 captioned shorts";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0a0f1f 0%, #1d4ed8 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: -1,
            opacity: 0.85,
          }}
        >
          snipd
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 24 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
            Paste a YouTube link.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 1.05,
              color: "#93c5fd",
            }}
          >
            Get 5 captioned shorts.
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 30, marginTop: 32, opacity: 0.8 }}>
          The AI clipper for solo creators · Free to start
        </div>
      </div>
    ),
    { ...size },
  );
}
