import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readmeEntries } from "./update-roadmaps.js";

export const supportingDocuments = ["profile/docs/architecture.md"];

export type LinkReport = {
  documentCount: number;
  referenceCount: number;
  problems: string[];
};

const attributeReference = /\b(src|srcset|href)="([^"]*)"/g;
const markdownReference = /!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;

function isExternal(reference: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(reference);
}

function localPath(reference: string): string {
  return decodeURIComponent(reference.split("#")[0].split("?")[0]);
}

function srcsetCandidates(value: string): string[] {
  return value.split(",").map((candidate) => candidate.trim().split(/\s+/)[0]).filter(Boolean);
}

export function extractLocalReferences(markdown: string): string[] {
  const references: string[] = [];
  for (const match of markdown.matchAll(attributeReference)) {
    references.push(...(match[1] === "srcset" ? srcsetCandidates(match[2]) : [match[2]]));
  }
  for (const match of markdown.matchAll(markdownReference)) references.push(match[1]);
  return references.filter((reference) => reference && !isExternal(reference) && localPath(reference) !== "");
}

function localeOfDocument(file: string): string | null {
  return readmeEntries.find((entry) => entry.file === file)?.locale ?? null;
}

export async function verifyProfileLinks(root: string): Promise<LinkReport> {
  const documents = [...readmeEntries.map(({ file }) => file), ...supportingDocuments];
  const problems: string[] = [];
  let referenceCount = 0;

  for (const file of documents) {
    const fullPath = path.join(root, file);
    if (!existsSync(fullPath)) {
      problems.push(file + ": document is missing.");
      continue;
    }
    const markdown = await readFile(fullPath, "utf8");
    const locale = localeOfDocument(file);

    for (const reference of extractLocalReferences(markdown)) {
      referenceCount += 1;
      const resolved = path.resolve(path.dirname(fullPath), localPath(reference));
      if (!resolved.startsWith(root + path.sep)) {
        problems.push(file + ": " + reference + " points outside the repository.");
      } else if (!existsSync(resolved)) {
        problems.push(file + ": " + reference + " does not exist.");
      }
      const localizedAsset = /\/assets\/locales\/([^/]+)\//.exec(reference);
      if (locale && localizedAsset && localizedAsset[1] !== locale) {
        problems.push(file + ": " + reference + " uses the " + localizedAsset[1] + " asset instead of " + locale + ".");
      }
    }

    if (locale) {
      for (const other of readmeEntries) {
        if (other.file === file) continue;
        const target = path.relative(path.dirname(fullPath), path.join(root, other.file)).split(path.sep).join("/");
        const expected = target.startsWith(".") ? target : "./" + target;
        if (!markdown.includes('href="' + expected + '"')) {
          problems.push(file + ": language switcher is missing " + expected + ".");
        }
      }
    }
  }

  return { documentCount: documents.length, referenceCount, problems };
}

async function main(): Promise<void> {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
  const report = await verifyProfileLinks(root);
  if (report.problems.length > 0) {
    for (const problem of report.problems) console.error("Broken link: " + problem);
    process.exitCode = 1;
    return;
  }
  console.log("Verified " + report.referenceCount + " local references across " + report.documentCount + " profile documents.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
