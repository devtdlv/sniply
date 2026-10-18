import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isReservedCode } from "@/lib/codes";
import { resolveQrShortUrl } from "@/lib/qr";
import { generateQrPngBuffer } from "@/lib/qr-png";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { code } = await context.params;
  const trimmed = code.trim();

  if (!trimmed || isReservedCode(trimmed)) {
    return NextResponse.json({ error: "Short link not found" }, { status: 404 });
  }

  const link = await prisma.link.findUnique({
    where: { code: trimmed },
    select: { code: true },
  });

  if (!link) {
    return NextResponse.json({ error: "Short link not found" }, { status: 404 });
  }

  const target = resolveQrShortUrl(link.code, { request });
  if (!target.ok) {
    return NextResponse.json({ error: target.error }, { status: 400 });
  }

  try {
    const png = await generateQrPngBuffer(target.shortUrl);
    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="sniply-${link.code}.png"`,
        "Cache-Control": "no-store",
        "X-QR-Target": target.shortUrl,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not generate QR code" },
      { status: 500 },
    );
  }
}
