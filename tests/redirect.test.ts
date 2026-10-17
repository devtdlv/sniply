import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock, clickCreateMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  clickCreateMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    link: {
      findUnique: findUniqueMock,
      create: vi.fn(),
    },
    click: {
      create: clickCreateMock,
    },
  },
}));

import { recordClick, resolveLink } from "@/lib/links";

describe("redirect behavior", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    clickCreateMock.mockReset();
  });

  it("resolves a valid short code", async () => {
    findUniqueMock.mockResolvedValue({
      id: "link_1",
      code: "abc2345",
      destination: "https://example.com/a",
    });

    const result = await resolveLink("abc2345");

    expect(result).toEqual({
      ok: true,
      id: "link_1",
      code: "abc2345",
      destination: "https://example.com/a",
    });
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { code: "abc2345" },
      select: { id: true, code: true, destination: true },
    });
  });

  it("returns 404 for missing codes", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await resolveLink("missing");

    expect(result).toEqual({
      ok: false,
      status: 404,
      error: "Short link not found",
    });
  });

  it("returns 404 for reserved codes without querying", async () => {
    const result = await resolveLink("api");

    expect(result).toEqual({
      ok: false,
      status: 404,
      error: "Short link not found",
    });
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns 400 for empty codes", async () => {
    const result = await resolveLink("   ");
    expect(result).toEqual({
      ok: false,
      status: 400,
      error: "Short code is required",
    });
  });

  it("records a click event for a link", async () => {
    clickCreateMock.mockResolvedValue({ id: "click_1" });
    await recordClick("link_1");
    expect(clickCreateMock).toHaveBeenCalledWith({
      data: { linkId: "link_1" },
    });
  });
});
