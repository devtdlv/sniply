import { describe, expect, it, vi } from "vitest";
import {
  isBlockedIp,
  validateDestinationUrl,
} from "@/lib/validate-url";

describe("isBlockedIp", () => {
  it("blocks loopback, private, link-local, and CGNAT IPv4 ranges", () => {
    expect(isBlockedIp("127.0.0.1")).toBe(true);
    expect(isBlockedIp("10.0.0.5")).toBe(true);
    expect(isBlockedIp("172.16.1.1")).toBe(true);
    expect(isBlockedIp("192.168.1.10")).toBe(true);
    expect(isBlockedIp("169.254.169.254")).toBe(true);
    expect(isBlockedIp("100.64.1.1")).toBe(true);
    expect(isBlockedIp("0.0.0.0")).toBe(true);
  });

  it("allows public IPv4 addresses", () => {
    expect(isBlockedIp("1.1.1.1")).toBe(false);
    expect(isBlockedIp("8.8.8.8")).toBe(false);
  });

  it("blocks loopback and unique-local IPv6", () => {
    expect(isBlockedIp("::1")).toBe(true);
    expect(isBlockedIp("fc00::1")).toBe(true);
    expect(isBlockedIp("fe80::1")).toBe(true);
  });

  it("blocks IPv4-mapped private addresses", () => {
    expect(isBlockedIp("::ffff:127.0.0.1")).toBe(true);
    expect(isBlockedIp("::ffff:192.168.0.1")).toBe(true);
  });
});

describe("validateDestinationUrl", () => {
  it("rejects empty, relative, and non-http schemes", async () => {
    expect((await validateDestinationUrl("")).ok).toBe(false);
    expect((await validateDestinationUrl("/relative")).ok).toBe(false);
    expect((await validateDestinationUrl("javascript:alert(1)")).ok).toBe(
      false,
    );
    expect((await validateDestinationUrl("ftp://example.com/file")).ok).toBe(
      false,
    );
  });

  it("rejects credentials and localhost hostnames", async () => {
    expect(
      (await validateDestinationUrl("https://user:pass@example.com")).ok,
    ).toBe(false);
    expect((await validateDestinationUrl("http://localhost/admin")).ok).toBe(
      false,
    );
    expect(
      (await validateDestinationUrl("http://app.localhost/path")).ok,
    ).toBe(false);
  });

  it("rejects literal private IPs without DNS", async () => {
    const resolve = vi.fn();
    const result = await validateDestinationUrl("http://192.168.0.20/x", {
      resolveAddresses: resolve,
    });
    expect(result.ok).toBe(false);
    expect(resolve).not.toHaveBeenCalled();
  });

  it("rejects hostnames that resolve to private addresses", async () => {
    const result = await validateDestinationUrl("https://evil.example", {
      resolveAddresses: async () => ["10.1.2.3"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/private/i);
    }
  });

  it("accepts https URLs that resolve to public addresses", async () => {
    const result = await validateDestinationUrl(
      "https://example.com/path?q=1",
      {
        resolveAddresses: async () => ["93.184.216.34"],
      },
    );
    expect(result).toEqual({
      ok: true,
      url: expect.any(URL),
      normalized: "https://example.com/path?q=1",
    });
  });

  it("rejects unresolvable hostnames", async () => {
    const result = await validateDestinationUrl("https://no-such-host.test", {
      resolveAddresses: async () => {
        throw new Error("ENOTFOUND");
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/resolved/i);
    }
  });
});
