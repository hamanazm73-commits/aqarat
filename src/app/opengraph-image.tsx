import { ImageResponse } from "next/og";

export const alt = "Online Office — Real Estate in Kurdistan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Generated social-share card. Latin text only (Satori has no Arabic glyphs
// without a bundled font), which is fine for a link preview.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          color: "white",
          fontFamily: "sans-serif",
          background:
            "linear-gradient(135deg, #0b0c0f 0%, #191b20 55%, #2b2e35 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "90px",
              height: "90px",
              borderRadius: "22px",
              background: "rgba(255,255,255,0.16)",
            }}
          >
            <svg
              width="52"
              height="52"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e6b64c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 22V4l6-2 6 2v18" />
              <path d="M2 22h20" />
              <path d="M10 8h4" />
              <path d="M10 12h4" />
              <path d="M10 16h4" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: "42px", fontWeight: 700 }}>
            Online Office
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "44px",
            fontSize: "70px",
            fontWeight: 800,
            lineHeight: 1.1,
            maxWidth: "960px",
          }}
        >
          Find your dream home in Kurdistan
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "28px",
            fontSize: "34px",
            opacity: 0.9,
          }}
        >
          Houses · Apartments · Villas · Land — for sale &amp; rent
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "46px",
            fontSize: "28px",
            opacity: 0.85,
          }}
        >
          homeskurdistan.com
        </div>
      </div>
    ),
    { ...size },
  );
}
