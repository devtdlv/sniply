import { describe, expect, it } from "vitest";
import {
  ALIAS_MAX_LENGTH,
  ALIAS_MIN_LENGTH,
  CODE_ALPHABET,
  GENERATED_CODE_LENGTH,
  generateShortCode,
  isReservedCode,
  validateAlias,
} from "@/lib/codes";

describe("generateShortCode", () => {
  it("returns the default length using only alphabet characters", () => {
    const code = generateShortCode();
    expect(code).toHaveLength(GENERATED_CODE_LENGTH);
    for (const char of code) {
      expect(CODE_ALPHABET.includes(char)).toBe(true);
    }
  });

  it("supports custom lengths", () => {
    expect(generateShortCode(12)).toHaveLength(12);
  });

  it("produces varying outputs across calls", () => {
    const samples = new Set(
      Array.from({ length: 20 }, () => generateShortCode()),
    );
    expect(samples.size).toBeGreaterThan(1);
  });
});

describe("validateAlias", () => {
  it("accepts valid aliases", () => {
    expect(validateAlias("docs")).toEqual({ ok: true, alias: "docs" });
    expect(validateAlias("  my_link-1  ")).toEqual({
      ok: true,
      alias: "my_link-1",
    });
  });

  it("rejects too-short or too-long aliases", () => {
    expect(validateAlias("ab").ok).toBe(false);
    expect(validateAlias("a".repeat(ALIAS_MAX_LENGTH + 1)).ok).toBe(false);
    expect(validateAlias("a".repeat(ALIAS_MIN_LENGTH)).ok).toBe(true);
  });

  it("rejects invalid characters", () => {
    const result = validateAlias("bad alias!");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/letters, numbers/i);
    }
  });

  it("rejects reserved aliases", () => {
    const result = validateAlias("api");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/reserved/i);
    }
  });
});

describe("isReservedCode", () => {
  it("matches reserved values case-insensitively", () => {
    expect(isReservedCode("API")).toBe(true);
    expect(isReservedCode("_next")).toBe(true);
    expect(isReservedCode("readable")).toBe(false);
  });
});
