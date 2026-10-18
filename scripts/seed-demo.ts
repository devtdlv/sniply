/**
 * Inserts fictional Sniply demo links/clicks for local UI testing and screenshots.
 *
 * Safety:
 * - Never truncates or deletes existing rows
 * - Only creates codes under the `demo-` prefix
 * - Skips occupied codes when destination does not match the demo plan
 * - Uses stable demo click IDs so re-runs do not duplicate clicks
 *
 * Usage: npm run db:seed:demo
 */

import { PrismaClient } from "@prisma/client";
import {
  buildDemoSeedPlan,
  DEMO_CODE_PREFIX,
  DEMO_CLICK_TOTAL,
  DEMO_LINK_COUNT,
  resolveDemoLinkAction,
  summarizeDemoPlan,
} from "../src/lib/demo-seed";

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  const now = new Date();
  const plan = buildDemoSeedPlan(now);
  const summary = summarizeDemoPlan(plan);

  console.log("Sniply demo seed (simulated data)");
  console.log(`- Planned links: ${summary.linkCount}`);
  console.log(`- Planned clicks: ${summary.clickCount}`);
  console.log(`- Code prefix: ${DEMO_CODE_PREFIX}`);
  console.log("");

  if (summary.linkCount !== DEMO_LINK_COUNT) {
    throw new Error(`Expected ${DEMO_LINK_COUNT} demo links in plan`);
  }
  if (summary.clickCount !== DEMO_CLICK_TOTAL) {
    throw new Error(`Expected ${DEMO_CLICK_TOTAL} demo clicks in plan`);
  }

  let createdLinks = 0;
  let reusedLinks = 0;
  let skippedLinks = 0;
  const codeToLinkId = new Map<string, string>();

  try {
    for (const link of plan.links) {
      const existing = await prisma.link.findUnique({
        where: { code: link.code },
        select: { id: true, code: true, destination: true },
      });

      const resolution = resolveDemoLinkAction({ planned: link, existing });

      if (resolution.action === "skip") {
        skippedLinks += 1;
        console.warn(
          `Skip ${link.code}: ${resolution.reason} (existing row left unchanged)`,
        );
        continue;
      }

      if (resolution.action === "reuse") {
        reusedLinks += 1;
        codeToLinkId.set(link.code, resolution.linkId);
        continue;
      }

      const createdAt = new Date(
        now.getTime() - link.createdDaysAgo * 24 * 60 * 60 * 1000,
      );

      const created = await prisma.link.create({
        data: {
          code: link.code,
          destination: link.destination,
          createdAt,
          updatedAt: createdAt,
        },
        select: { id: true },
      });

      createdLinks += 1;
      codeToLinkId.set(link.code, created.id);
    }

    const clickRows = plan.clicks
      .map((click) => {
        const linkId = codeToLinkId.get(click.code);
        if (!linkId) return null;
        return {
          id: click.id,
          linkId,
          createdAt: new Date(now.getTime() - click.createdMsAgo),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    // Batch inserts; skipDuplicates keeps the seed idempotent on click ids.
    const chunkSize = 200;
    let insertedClicks = 0;
    for (let i = 0; i < clickRows.length; i += chunkSize) {
      const chunk = clickRows.slice(i, i + chunkSize);
      const result = await prisma.click.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      insertedClicks += result.count;
    }

    console.log("Demo seed finished:");
    console.log(`- Links created: ${createdLinks}`);
    console.log(`- Links reused:  ${reusedLinks}`);
    console.log(`- Links skipped: ${skippedLinks}`);
    console.log(`- Clicks inserted this run: ${insertedClicks}`);
    console.log(
      `- Clicks already present / skipped as duplicates: ${clickRows.length - insertedClicks}`,
    );
    console.log("");
    console.log(
      "All seeded rows are fictional demo data (codes start with `demo-`).",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("Demo seed failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
