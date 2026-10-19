/**
 * Rasterize Sniply brand mark PNGs using next/og (bundled with Next.js).
 * No extra dependencies.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ImageResponse } from "next/og.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const ACCENT = "#0B6E4F";

async function renderBrandPng(size) {
  const response = new ImageResponse(
    {
      type: "div",
      props: {
        style: {
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: ACCENT,
          // Soft corner hint in raster; launchers may still mask to circle/squircle
          borderRadius: Math.round(size * 0.22),
          color: "#FFFFFF",
          fontSize: Math.round(size * 0.5),
          fontWeight: 700,
          fontFamily: "ui-sans-serif, system-ui, Segoe UI, sans-serif",
          letterSpacing: "-0.04em",
          lineHeight: 1,
        },
        children: "S",
      },
    },
    { width: size, height: size },
  );

  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const outputs = [
    { path: join(root, "src", "app", "apple-icon.png"), size: 180 },
    { path: join(root, "public", "icons", "icon-192.png"), size: 192 },
    { path: join(root, "public", "icons", "icon-512.png"), size: 512 },
  ];

  for (const out of outputs) {
    mkdirSync(dirname(out.path), { recursive: true });
    const buffer = await renderBrandPng(out.size);
    if (buffer[0] !== 0x89 || buffer[1] !== 0x50) {
      throw new Error(`Invalid PNG signature for ${out.path}`);
    }
    writeFileSync(out.path, buffer);
    console.log(`Wrote ${out.path} (${buffer.length} bytes)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
