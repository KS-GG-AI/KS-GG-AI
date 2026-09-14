import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface LabeledGroup {
  label: string;
  detail: string;
}

export interface VisualLocale {
  code: string;
  direction: "ltr" | "rtl";
  fontFamily: string;
  hero: { eyebrow: string; status: string };
  typing: { label: string; prefix: string; phrases: string[]; footer: string };
  toolbox: { title: string; subtitle: string; badge: string; groups: LabeledGroup[] };
  stack: { title: string; subtitle: string; footer: string; groups: LabeledGroup[] };
}

interface VisualLocaleSource {
  version: number;
  locales: VisualLocale[];
}

// Compiled output lives in dist/, one level below the catalog file.
const directory = path.dirname(fileURLToPath(import.meta.url));
const source = JSON.parse(readFileSync(path.join(directory, "..", "visual-locales.json"), "utf8")) as VisualLocaleSource;

if (!Number.isInteger(source.version) || !Array.isArray(source.locales) || source.locales.length === 0) {
  throw new Error("Visual locale catalog is invalid.");
}

export const visualLocaleVersion = source.version;
export const visualLocales = source.locales;
export const visualLocaleByCode = new Map(visualLocales.map((locale) => [locale.code, locale]));

export function getVisualLocale(code = "en"): VisualLocale {
  const locale = visualLocaleByCode.get(code);
  if (!locale) throw new Error("Unknown visual locale: " + code);
  return locale;
}

export function localeAssetReference(code: string, section: string, file: string, localDocument = false): string {
  const prefix = localDocument ? "../../assets" : "./profile/assets";
  return prefix + "/locales/" + code + "/" + section + "/" + file;
}
