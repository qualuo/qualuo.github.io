import fs from "fs";
import path from "path";
import { rfcs, getRfcBySlug, type EnrichedRfc } from "./rfcs";

function rfcFilePath(slug: string): string {
  return path.join(process.cwd(), "content", "rfcs", `${slug}.md`);
}

export function getRfcContent(slug: string): string {
  const fp = rfcFilePath(slug);
  if (!fs.existsSync(fp)) {
    throw new Error(
      `RFC content file not found: content/rfcs/${slug}.md — check that the slug in src/lib/rfcs.ts matches a .md file in content/rfcs/`
    );
  }
  return fs.readFileSync(fp, "utf-8");
}

/** Extract description (text before first `---`) and sectionCount (`## ` headings) from markdown. */
function parseRfcMeta(markdown: string): {
  description: string;
  sectionCount: number;
} {
  const firstSeparator = markdown.indexOf("\n---");
  const description =
    firstSeparator !== -1
      ? markdown.slice(0, firstSeparator).trim()
      : markdown.split("\n\n")[0].trim();

  const sectionCount = (markdown.match(/^## /gm) || []).length;

  return { description, sectionCount };
}

/** Return a single RFC enriched with description and sectionCount from its markdown file. */
export function getEnrichedRfc(slug: string): EnrichedRfc | undefined {
  const rfc = getRfcBySlug(slug);
  if (!rfc) return undefined;

  const content = getRfcContent(slug);
  const { description, sectionCount } = parseRfcMeta(content);
  return { ...rfc, description, sectionCount };
}

/** Return all live RFCs enriched with description and sectionCount from their markdown files. */
export function getEnrichedRfcs(): EnrichedRfc[] {
  return rfcs
    .filter((r) => r.status === "live")
    .map((rfc) => {
      const content = getRfcContent(rfc.slug);
      const { description, sectionCount } = parseRfcMeta(content);
      return { ...rfc, description, sectionCount };
    });
}
