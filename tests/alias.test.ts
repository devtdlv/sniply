import { beforeEach, describe, expect, it, vi } from "vitest";

const { createMock, findUniqueMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    link: {
      create: createMock,
      findUnique: findUniqueMock,
    },
    click: {
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/validate-url", () => ({
  validateDestinationUrl: vi.fn(async (raw: string) => {
    if (!raw.startsWith("http")) {
      return { ok: false as const, error: "Only http and https URLs are allowed" };
    }
    return {
      ok: true as const,
      url: new URL(raw),
      normalized: raw,
    };
  }),
}));

import { createLink } from "@/lib/links";

describe("alias conflicts", () => {
  beforeEach(() => {
    createMock.mockReset();
    findUniqueMock.mockReset();
  });

  it("creates a link with a custom alias", async () => {
    createMock.mockResolvedValue({
      id: "link_1",
      code: "docs",
      destination: "https://example.com/docs",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const result = await createLink({
      destination: "https://example.com/docs",
      alias: "docs",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.link.code).toBe("docs");
    }
    expect(createMock).toHaveBeenCalledWith({
      data: {
        code: "docs",
        destination: "https://example.com/docs",
      },
    });
  });

  it("returns 409 when the alias is already taken", async () => {
    createMock.mockRejectedValue({
      code: "P2002",
      message: "Unique constraint failed",
    });

    const result = await createLink({
      destination: "https://example.com",
      alias: "taken",
    });

    expect(result).toEqual({
      ok: false,
      failure: { status: 409, error: "This alias is already in use" },
    });
  });

  it("returns 400 for invalid aliases before touching the database", async () => {
    const result = await createLink({
      destination: "https://example.com",
      alias: "!!",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.status).toBe(400);
    }
    expect(createMock).not.toHaveBeenCalled();
  });
});
