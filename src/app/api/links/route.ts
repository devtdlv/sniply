import { NextResponse } from "next/server";
import { shortUrlForCode } from "@/lib/app-url";
import { createLink, listLinks } from "@/lib/links";
import { parseListQuery } from "@/lib/list-query";

type CreateBody = {
  destination?: unknown;
  alias?: unknown;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = parseListQuery(searchParams);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const result = await listLinks(parsed.query);

    return NextResponse.json({
      items: result.items.map((item) => ({
        id: item.id,
        code: item.code,
        destination: item.destination,
        shortUrl: shortUrlForCode(item.code, request),
        createdAt: item.createdAt.toISOString(),
        clickCount: item.clickCount,
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      sort: result.sort,
      search: result.search,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load links" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: CreateBody;

  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.destination !== "string") {
    return NextResponse.json(
      { error: "destination must be a string" },
      { status: 400 },
    );
  }

  if (body.alias !== undefined && typeof body.alias !== "string") {
    return NextResponse.json(
      { error: "alias must be a string when provided" },
      { status: 400 },
    );
  }

  try {
    const result = await createLink({
      destination: body.destination,
      alias: body.alias,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.failure.error },
        { status: result.failure.status },
      );
    }

    return NextResponse.json(
      {
        id: result.link.id,
        code: result.link.code,
        destination: result.link.destination,
        shortUrl: shortUrlForCode(result.link.code, request),
        createdAt: result.link.createdAt.toISOString(),
        clickCount: 0,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not create short link" },
      { status: 500 },
    );
  }
}
