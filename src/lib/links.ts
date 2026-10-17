import { prisma } from "@/lib/prisma";
import {
  generateShortCode,
  isReservedCode,
  validateAlias,
} from "@/lib/codes";
import { validateDestinationUrl } from "@/lib/validate-url";

const MAX_CODE_ATTEMPTS = 8;

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "P2002"
  );
}

export type CreateLinkInput = {
  destination: string;
  alias?: string;
};

export type CreateLinkSuccess = {
  id: string;
  code: string;
  destination: string;
  createdAt: Date;
};

export type CreateLinkFailure = {
  status: 400 | 409;
  error: string;
};

export type CreateLinkResult =
  | { ok: true; link: CreateLinkSuccess }
  | { ok: false; failure: CreateLinkFailure };

export type ResolveLinkResult =
  | { ok: true; id: string; code: string; destination: string }
  | { ok: false; status: 400 | 404; error: string };

export async function createLink(
  input: CreateLinkInput,
): Promise<CreateLinkResult> {
  const validation = await validateDestinationUrl(input.destination);
  if (!validation.ok) {
    return { ok: false, failure: { status: 400, error: validation.error } };
  }

  const hasAlias =
    typeof input.alias === "string" && input.alias.trim().length > 0;

  if (hasAlias) {
    const aliasResult = validateAlias(input.alias!);
    if (!aliasResult.ok) {
      return { ok: false, failure: { status: 400, error: aliasResult.error } };
    }

    try {
      const link = await prisma.link.create({
        data: {
          code: aliasResult.alias,
          destination: validation.normalized,
        },
      });

      return {
        ok: true,
        link: {
          id: link.id,
          code: link.code,
          destination: link.destination,
          createdAt: link.createdAt,
        },
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return {
          ok: false,
          failure: { status: 409, error: "This alias is already in use" },
        };
      }
      throw error;
    }
  }

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const code = generateShortCode();
    if (isReservedCode(code)) continue;

    try {
      const link = await prisma.link.create({
        data: {
          code,
          destination: validation.normalized,
        },
      });

      return {
        ok: true,
        link: {
          id: link.id,
          code: link.code,
          destination: link.destination,
          createdAt: link.createdAt,
        },
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        continue;
      }
      throw error;
    }
  }

  return {
    ok: false,
    failure: {
      status: 400,
      error: "Could not allocate a unique short code. Please try again.",
    },
  };
}

export async function resolveLink(code: string): Promise<ResolveLinkResult> {
  const normalized = code.trim();

  if (!normalized) {
    return { ok: false, status: 400, error: "Short code is required" };
  }

  if (isReservedCode(normalized)) {
    return { ok: false, status: 404, error: "Short link not found" };
  }

  const link = await prisma.link.findUnique({
    where: { code: normalized },
    select: { id: true, code: true, destination: true },
  });

  if (!link) {
    return { ok: false, status: 404, error: "Short link not found" };
  }

  return { ok: true, ...link };
}

export async function recordClick(linkId: string): Promise<void> {
  await prisma.click.create({
    data: { linkId },
  });
}
