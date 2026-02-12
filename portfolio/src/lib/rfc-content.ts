import fs from "fs";
import path from "path";

export function getRfcContent(slug: string): string {
  const filePath = path.join(process.cwd(), "content", "rfcs", `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `RFC content file not found: content/rfcs/${slug}.md — check that the slug in src/lib/rfcs.ts matches a .md file in content/rfcs/`
    );
  }
  return fs.readFileSync(filePath, "utf-8");
}
