import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  parseListQuery,
} from "@/lib/list-query";

describe("parseListQuery", () => {
  it("applies defaults for an empty query", () => {
    expect(parseListQuery({})).toEqual({
      ok: true,
      query: {
        search: "",
        sort: "newest",
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
      },
    });
  });

  it("accepts search via q or search", () => {
    expect(parseListQuery({ q: " docs " })).toMatchObject({
      ok: true,
      query: { search: "docs" },
    });
    expect(parseListQuery({ search: "abc" })).toMatchObject({
      ok: true,
      query: { search: "abc" },
    });
  });

  it("accepts supported sort values", () => {
    for (const sort of ["newest", "oldest", "most_clicked"] as const) {
      const result = parseListQuery({ sort });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.query.sort).toBe(sort);
    }
  });

  it("rejects invalid sort values", () => {
    const result = parseListQuery({ sort: "popular" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/sort must be/i);
  });

  it("rejects non-positive page and pageSize", () => {
    expect(parseListQuery({ page: "0" }).ok).toBe(false);
    expect(parseListQuery({ page: "-1" }).ok).toBe(false);
    expect(parseListQuery({ page: "abc" }).ok).toBe(false);
    expect(parseListQuery({ pageSize: "0" }).ok).toBe(false);
  });

  it("rejects pageSize above the maximum", () => {
    const result = parseListQuery({ pageSize: String(MAX_PAGE_SIZE + 1) });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/at most/i);
  });

  it("parses URLSearchParams", () => {
    const params = new URLSearchParams({
      q: "example",
      sort: "oldest",
      page: "2",
      pageSize: "20",
    });

    expect(parseListQuery(params)).toEqual({
      ok: true,
      query: {
        search: "example",
        sort: "oldest",
        page: 2,
        pageSize: 20,
      },
    });
  });
});
