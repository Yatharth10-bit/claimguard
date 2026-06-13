import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: "linear-gradient(135deg, #10182d 0%, #2468c9 55%, #14b8a6 100%)",
          color: "white",
          fontSize: 18,
          fontWeight: 800,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        G
      </div>
    ),
    { ...size },
  );
}