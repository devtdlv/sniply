import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ALIAS_MAX_LENGTH,
  isValidLinkCodeParam,
  MAX_DESTINATION_LENGTH,
} from "@/lib/codes";
import { parseRouteCode } from "@/lib/route-code";

const { createMock, findUniqueMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    link: {
      create: createMock,
      findUnique: findUniqueMock,
      findMany: vi.fn(),
      count: vi.fn(),
    },
    click: {
      create: vi.fn(),
      count: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@/lib/validate-url", () => ({
  validateDestinationUrl: vi.fn(async (raw: string) => ({
    ok: true as const,
    url: new URL(raw.startsWith("http") ? raw : `https://example.com/${raw}`),
    normalized: raw.startsWith("http") ? raw : `https://example.com/${raw}`,
  })),
}));

import { createLink, resolveLink } from "@/lib/links";

describe("isValidLinkCodeParam / parseRouteCode", () => {
  it("accepts generated-style and alias codes", () => {
    expect(isValidLinkCodeParam("abc2345")).toBe(true);
    expect(isValidLinkCodeParam("my_link-1")).toBe(true);
    expect(parseRouteCode("docs")).toBe("docs");
  });

  it("rejects empty, oversized, reserved, and unsafe characters", () => {
    expect(isValidLinkCodeParam("")).toBe(false);
    expect(isValidLinkCodeParam("../etc")).toBe(false);
    expect(isValidLinkCodeParam("a".repeat(ALIAS_MAX_LENGTH + 1))).toBe(false);
    expect(parseRouteCode("api")).toBeNull();
    expect(parseRouteCode("links")).toBeNull();
    expect(parseRouteCode("bad code")).toBeNull();
  });
});

describe("createLink destination length", () => {
  beforeEach(() => {
    createMock.mockReset();
  });

  it("rejects destinations above the max length before persistence", async () => {
    const result = await createLink({
      destination: `https://example.com/${"a".repeat(MAX_DESTINATION_LENGTH)}`,
    });

    expect(result).toEqual({
      ok: false,
      failure: {
        status: 400,
        error: `Destination URL must be at most ${MAX_DESTINATION_LENGTH} characters`,
      },
    });
    expect(createMock).not.toHaveBeenCalled();
  });
});

describe("resolveLink invalid codes", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
  });

  it("returns 404 for invalid code shapes without querying", async () => {
    const result = await resolveLink("../secret");
    expect(result).toEqual({
      ok: false,
      status: 404,
      error: "Short link not found",
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });
});
