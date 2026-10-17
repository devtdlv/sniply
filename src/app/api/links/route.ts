import { NextResponse } from "next/server";
import { createLink } from "@/lib/links";

type CreateBody = {
  destination?: unknown;
  alias?: unknown;
};

function appOrigin(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return new URL(request.url).origin;
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

  const origin = appOrigin(request);
  const shortUrl = `${origin}/${result.link.code}`;

  return NextResponse.json(
    {
      id: result.link.id,
      code: result.link.code,
      destination: result.link.destination,
      shortUrl,
      createdAt: result.link.createdAt.toISOString(),
    },
    { status: 201 },
  );
}
