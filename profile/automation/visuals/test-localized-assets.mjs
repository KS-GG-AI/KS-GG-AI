import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { localeAssetReference, visualLocales } from "./locale-catalog.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const documents = new Map([
  ["en", "README.md"],
  ...visualLocales.filter(({ code }) => code !== "en").map(({ code }) => [code, "profile/content/locales/" + code + ".md"]),
]);
const assets = [
  ["identity", "hero.svg"],
  ["motion", "typing.gif"],
  ["visuals", "toolbox.svg"],
  ["visuals", "technology-stack.svg"],
  ["motion", "technology-stack.gif"],
  ["maps", "project-map.svg"],
  ["maps", "project-roadmap.svg"],
  ["maps", "development-roadmap.svg"],
];
const compactAssets = [
  ["identity", "hero.svg", "hero-compact.svg"],
  ["visuals", "toolbox.svg", "toolbox-compact.svg"],
  ["visuals", "technology-stack.svg", "technology-stack-compact.svg"],
  ["motion", "technology-stack.gif", "technology-stack-compact.gif"],
];
const compactAssetKeys = new Set(compactAssets.map(([section, file]) => section + "/" + file));

function gifFrameCount(data) {
  let frames = 0;
  for (let index = 0; index < data.length - 2; index += 1) {
    if (data[index] === 0x21 && data[index + 1] === 0xf9 && data[index + 2] === 0x04) frames += 1;
  }
  return frames;
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertNonInteractivePicture(markdown, source, document) {
  const escapedSource = escapeRegularExpression(source) + '(?:\\?[^"\\s]*)?';
  const picture = new RegExp(
    '<picture>\\s*(?:<source\\s+[^>]*\\/?>\\s*)*<img\\s+[^>]*src="' + escapedSource + '"[^>]*\\/?>\\s*<\\/picture>',
    "s",
  );
  const linkedPicture = new RegExp(
    '<a\\b[^>]*>\\s*<picture>\\s*(?:<source\\s+[^>]*\\/?>\\s*)*<img\\s+[^>]*src="' + escapedSource + '"',
    "s",
  );
  assert.match(markdown, picture, document + " must render " + source + " inside a picture element.");
  assert.doesNotMatch(markdown, linkedPicture, document + " must not link " + source + " to an asset page.");
}

function assertCompactPicture(markdown, source, compactSource, document) {
  const escapedSource = escapeRegularExpression(source) + '(?:\\?[^"\\s]*)?';
  const escapedCompactSource = escapeRegularExpression(compactSource);
  const picture = new RegExp(
    '<picture>\\s*<source\\s+media="\\(max-width: 840px\\)"\\s+srcset="' + escapedCompactSource + '"\\s*\\/?>\\s*<img\\s+[^>]*src="' + escapedSource + '"[^>]*\\/?>\\s*<\\/picture>',
    "s",
  );
  const linkedPicture = new RegExp(
    '<a\\b[^>]*>\\s*<picture>\\s*<source\\s+media="\\(max-width: 840px\\)"\\s+srcset="' + escapedCompactSource + '"\\s*\\/?>\\s*<img\\s+[^>]*src="' + escapedSource + '"',
    "s",
  );
  assert.match(markdown, picture, document + " must use the compact visual below 840px.");
  assert.doesNotMatch(markdown, linkedPicture, document + " must not link " + source + " to an asset page.");
}

for (const locale of visualLocales) {
  const document = documents.get(locale.code);
  assert.ok(document, locale.code + " must have a localized document.");
  const markdown = await readFile(path.join(root, document), "utf8");
  for (const [section, file] of assets) {
    const assetPath = path.join(root, "profile", "assets", "locales", locale.code, section, file);
    const content = await readFile(assetPath);
    assert.ok(content.length > 256, locale.code + " must include " + section + "/" + file + ".");
    const reference = localeAssetReference(locale.code, section, file, locale.code !== "en");
    assert.ok(markdown.includes(reference), document + " must reference its own " + section + "/" + file + ".");
    if (!compactAssetKeys.has(section + "/" + file)) assertNonInteractivePicture(markdown, reference, document);
    if (file.endsWith(".gif")) {
      assert.equal(content.subarray(0, 6).toString("ascii"), "GIF89a");
      assert.ok(gifFrameCount(content) > 12, locale.code + " must contain an animated " + file + ".");
    } else {
      const svg = content.toString("utf8");
      assert.match(svg, /role="img"/);
      if (locale.direction === "rtl") assert.match(svg, /direction="rtl"/);
    }
  }
  for (const [section, file, compactFile] of compactAssets) {
    const compactPath = path.join(root, "profile", "assets", "locales", locale.code, section, compactFile);
    const compactContent = await readFile(compactPath);
    const reference = localeAssetReference(locale.code, section, file, locale.code !== "en");
    const compactReference = localeAssetReference(locale.code, section, compactFile, locale.code !== "en");
    assert.ok(compactContent.length > 256, locale.code + " must include " + section + "/" + compactFile + ".");
    assertCompactPicture(markdown, reference, compactReference, document);
    if (compactFile.endsWith(".gif")) {
      assert.equal(compactContent.subarray(0, 6).toString("ascii"), "GIF89a");
      assert.ok(gifFrameCount(compactContent) > 12, locale.code + " must contain an animated " + compactFile + ".");
    } else {
      const svg = compactContent.toString("utf8");
      assert.match(svg, /role="img"/);
      if (locale.direction === "rtl") assert.match(svg, /direction="rtl"/);
    }
  }
  const hero = await readFile(path.join(root, "profile", "assets", "locales", locale.code, "identity", "hero.svg"), "utf8");
  const stack = await readFile(path.join(root, "profile", "assets", "locales", locale.code, "visuals", "technology-stack.svg"), "utf8");
  assert.ok(hero.includes(locale.hero.eyebrow), locale.code + " hero text must be localized.");
  assert.ok(stack.includes(locale.stack.title), locale.code + " technology map title must be localized.");
  const avatarReference = locale.code === "en" ? "./profile/assets/identity/avatar.gif" : "../../assets/identity/avatar.gif";
  assertNonInteractivePicture(markdown, avatarReference, document);
}

for (const [section, file] of assets.slice(0, 5)) {
  const legacy = await readFile(path.join(root, "profile", "assets", section, file));
  const english = await readFile(path.join(root, "profile", "assets", "locales", "en", section, file));
  assert.deepEqual(legacy, english, "English compatibility asset must mirror the en locale: " + section + "/" + file);
}

console.log("Localized visual asset checks passed.");
