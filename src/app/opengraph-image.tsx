import { ImageResponse } from "next/og";

export const alt = "Sniply — short links with clear insights";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background:
            "linear-gradient(145deg, #E8F5F0 0%, #EEF2F4 42%, #E3EEF8 100%)",
          color: "#132029",
          fontFamily: "ui-sans-serif, system-ui, Segoe UI, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              backgroundColor: "#0B6E4F",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: 48,
              fontWeight: 700,
              letterSpacing: "-0.04em",
            }}
          >
            S
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                fontSize: 56,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
              }}
            >
              Sniply
            </div>
            <div style={{ fontSize: 26, color: "#5A6B7A" }}>
              Short links. Clear insights.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 40,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
              maxWidth: 900,
            }}
          >
            Shorten links, track clicks, and share QR codes.
          </div>
          <div style={{ fontSize: 24, color: "#5A6B7A", maxWidth: 820 }}>
            A clean local dashboard for URL shortening and click analytics.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
