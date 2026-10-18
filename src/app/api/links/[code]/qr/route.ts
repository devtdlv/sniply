import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveQrShortUrl } from "@/lib/qr";
import { generateQrPngBuffer } from "@/lib/qr-png";
import { parseRouteCode } from "@/lib/route-code";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { code } = await context.params;
  const trimmed = parseRouteCode(code);

  if (!trimmed) {
    return NextResponse.json({ error: "Short link not found" }, { status: 404 });
  }

  try {
    const link = await prisma.link.findUnique({
      where: { code: trimmed },
      select: { code: true },
    });

    if (!link) {
      return NextResponse.json({ error: "Short link not found" }, { status: 404 });
    }

    const target = resolveQrShortUrl(link.code, { request });
    if (!target.ok) {
      return NextResponse.json({ error: "Could not generate QR code" }, { status: 400 });
    }

    const png = await generateQrPngBuffer(target.shortUrl);
    const safeName = link.code.replace(/[^a-zA-Z0-9_-]/g, "_");

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="sniply-${safeName}.png"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not generate QR code" },
      { status: 500 },
    );
  }
}
