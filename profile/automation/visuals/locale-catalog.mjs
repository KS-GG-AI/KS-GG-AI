import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory = path.dirname(fileURLToPath(import.meta.url));
const source = JSON.parse(readFileSync(path.join(directory, "visual-locales.json"), "utf8"));

if (!Number.isInteger(source.version) || !Array.isArray(source.locales) || source.locales.length === 0) {
  throw new Error("Visual locale catalog is invalid.");
}

export const visualLocaleVersion = source.version;
export const visualLocales = source.locales;
export const visualLocaleByCode = new Map(visualLocales.map((locale) => [locale.code, locale]));

export function getVisualLocale(code = "en") {
  const locale = visualLocaleByCode.get(code);
  if (!locale) throw new Error("Unknown visual locale: " + code);
  return locale;
}

export function localeAssetReference(code, section, file, localDocument = false) {
  const prefix = localDocument ? "../../assets" : "./profile/assets";
  return prefix + "/locales/" + code + "/" + section + "/" + file;
}
