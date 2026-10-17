import { beforeEach, describe, expect, it, vi } from "vitest";

const { findManyMock, countMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  countMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    link: {
      findMany: findManyMock,
      count: countMock,
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    click: {
      create: vi.fn(),
    },
  },
}));

import { listLinks } from "@/lib/links";

describe("listLinks", () => {
  beforeEach(() => {
    findManyMock.mockReset();
    countMock.mockReset();
  });

  it("lists links with click counts and newest ordering by default", async () => {
    findManyMock.mockResolvedValue([
      {
        id: "1",
        code: "abc1234",
        destination: "https://example.com",
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
        _count: { clicks: 3 },
      },
    ]);
    countMock.mockResolvedValue(1);

    const result = await listLinks({
      search: "",
      sort: "newest",
      page: 1,
      pageSize: 10,
    });

    expect(findManyMock).toHaveBeenCalledWith({
      where: undefined,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: 0,
      take: 10,
      select: {
        id: true,
        code: true,
        destination: true,
        createdAt: true,
        _count: { select: { clicks: true } },
      },
    });
    expect(result).toMatchObject({
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      items: [
        {
          id: "1",
          code: "abc1234",
          destination: "https://example.com",
          clickCount: 3,
        },
      ],
    });
  });

  it("searches by destination or short code", async () => {
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);

    await listLinks({
      search: "docs",
      sort: "newest",
      page: 1,
      pageSize: 10,
    });

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { destination: { contains: "docs", mode: "insensitive" } },
            { code: { contains: "docs", mode: "insensitive" } },
          ],
        },
      }),
    );
    expect(countMock).toHaveBeenCalledWith({
      where: {
        OR: [
          { destination: { contains: "docs", mode: "insensitive" } },
          { code: { contains: "docs", mode: "insensitive" } },
        ],
      },
    });
  });

  it("supports oldest and most_clicked sorts", async () => {
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);

    await listLinks({
      search: "",
      sort: "oldest",
      page: 1,
      pageSize: 10,
    });
    expect(findManyMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      }),
    );

    await listLinks({
      search: "",
      sort: "most_clicked",
      page: 1,
      pageSize: 10,
    });
    expect(findManyMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        orderBy: [
          { clicks: { _count: "desc" } },
          { createdAt: "desc" },
          { id: "desc" },
        ],
      }),
    );
  });

  it("applies pagination skip/take and totalPages", async () => {
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(25);

    const result = await listLinks({
      search: "",
      sort: "newest",
      page: 3,
      pageSize: 10,
    });

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      }),
    );
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(3);
  });

  it("returns totalPages 0 when there are no matches", async () => {
    findManyMock.mockResolvedValue([]);
    countMock.mockResolvedValue(0);

    const result = await listLinks({
      search: "none",
      sort: "newest",
      page: 1,
      pageSize: 10,
    });

    expect(result.total).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.items).toEqual([]);
  });
});
