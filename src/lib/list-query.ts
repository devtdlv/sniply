export const LIST_SORTS = ["newest", "oldest", "most_clicked"] as const;
export type ListSort = (typeof LIST_SORTS)[number];

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 50;

export type ListLinksQuery = {
  search: string;
  sort: ListSort;
  page: number;
  pageSize: number;
};

export type ListQueryParseResult =
  | { ok: true; query: ListLinksQuery }
  | { ok: false; error: string };

function parsePositiveInt(
  raw: string | null,
  fallback: number,
): number | null {
  if (raw === null || raw.trim() === "") return fallback;
  if (!/^\d+$/.test(raw.trim())) return null;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 1) return null;
  return value;
}

/**
 * Parses and validates dashboard list query parameters.
 * Accepts URLSearchParams or a plain record of string values.
 */
export function parseListQuery(
  input: URLSearchParams | Record<string, string | undefined>,
): ListQueryParseResult {
  const get = (key: string): string | null => {
    if (input instanceof URLSearchParams) {
      return input.get(key);
    }
    const value = input[key];
    return value === undefined ? null : value;
  };

  const search = (get("q") ?? get("search") ?? "").trim();

  const sortRaw = (get("sort") ?? "newest").trim().toLowerCase();
  if (!LIST_SORTS.includes(sortRaw as ListSort)) {
    return {
      ok: false,
      error: `sort must be one of: ${LIST_SORTS.join(", ")}`,
    };
  }

  const page = parsePositiveInt(get("page"), 1);
  if (page === null) {
    return { ok: false, error: "page must be a positive integer" };
  }

  const pageSizeRaw = parsePositiveInt(get("pageSize"), DEFAULT_PAGE_SIZE);
  if (pageSizeRaw === null) {
    return { ok: false, error: "pageSize must be a positive integer" };
  }

  if (pageSizeRaw > MAX_PAGE_SIZE) {
    return {
      ok: false,
      error: `pageSize must be at most ${MAX_PAGE_SIZE}`,
    };
  }

  return {
    ok: true,
    query: {
      search,
      sort: sortRaw as ListSort,
      page,
      pageSize: pageSizeRaw,
    },
  };
}
