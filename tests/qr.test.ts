import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { toDataUrlMock, toBufferMock } = vi.hoisted(() => ({
  toDataUrlMock: vi.fn(async (text: string) => `data:image/png;base64,${Buffer.from(text).toString("base64")}`),
  toBufferMock: vi.fn(async (text: string) => Buffer.from(text, "utf8")),
}));

vi.mock("qrcode", () => ({
  default: {
    toDataURL: toDataUrlMock,
    toBuffer: toBufferMock,
  },
}));

import { resolveQrShortUrl } from "@/lib/qr";
import { generateQrDataUrl } from "@/lib/qr-encode";
import { generateQrPngBuffer } from "@/lib/qr-png";

describe("resolveQrShortUrl", () => {
  const original = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = original;
    }
  });

  it("builds the short URL for a code from NEXT_PUBLIC_APP_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(resolveQrShortUrl("docs")).toEqual({
      ok: true,
      shortUrl: "http://localhost:3000/docs",
    });
  });

  it("rejects empty codes and short URL mismatches", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    expect(resolveQrShortUrl("").ok).toBe(false);
    expect(
      resolveQrShortUrl("docs", {
        expectedShortUrl: "http://localhost:3000/other",
      }).ok,
    ).toBe(false);
  });
});

describe("QR payload correctness", () => {
  beforeEach(() => {
    toDataUrlMock.mockClear();
    toBufferMock.mockClear();
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  });

  it("encodes the resolved short URL in PNG and data URL generators", async () => {
    const target = resolveQrShortUrl("portfolio");
    expect(target.ok).toBe(true);
    if (!target.ok) return;

    await generateQrDataUrl(target.shortUrl);
    await generateQrPngBuffer(target.shortUrl);

    expect(toDataUrlMock).toHaveBeenCalledWith(
      "http://localhost:3000/portfolio",
      expect.any(Object),
    );
    expect(toBufferMock).toHaveBeenCalledWith(
      "http://localhost:3000/portfolio",
      expect.objectContaining({ type: "png" }),
    );
  });
});
