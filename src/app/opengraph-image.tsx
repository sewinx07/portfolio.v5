import { ImageResponse } from "next/og";

export const alt = "Taha Gmir — Creative Developer & Digital Experience Builder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f4f2ed",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 20, letterSpacing: 8, color: "#6b6d70", textTransform: "uppercase" }}>
            TAHA GMIR — PORTFOLIO
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 96,
            fontWeight: 800,
            color: "#0a0a0b",
            lineHeight: 0.95,
            letterSpacing: -3,
            textTransform: "uppercase",
          }}
        >
          Design.
          <br />
          Code. Experience.
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, color: "#6b6d70" }}>
          <span>CREATIVE DEVELOPER — DESIGNER — MOTION</span>
          <span>MMXXVI</span>
        </div>
      </div>
    ),
    size
  );
}