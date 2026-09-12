import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";
import gifenc from "gifenc";
import { getVisualLocale, visualLocales } from "./locale-catalog.mjs";

const { GIFEncoder, applyPalette, quantize } = gifenc;

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const commonTools = [
  ["TypeScript", "JavaScript", "Python"],
  ["Node.js", "React", "Next.js"],
  ["REST API", "SQL", "MCP"],
  ["Git / GitHub", "Docker", "GitHub Actions"],
];
const stackTools = [
  ["TypeScript", "JavaScript", "Python", "Go", "Java", "C#", "C++", "C", "PHP", "Rust", "Bash", "HTML", "CSS", "SQL"],
  ["React", "Next.js", "Vite", "Tailwind CSS", "Figma", "Vercel"],
  ["Node.js", "Express", "FastAPI", "Flask", "Django", "GraphQL", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Prisma", "MCP"],
  ["Docker", "Kubernetes", "AWS", "Google Cloud", "Azure", "Cloudflare", "Nginx", "Linux", "GitHub Actions", "Terraform", "Git", "GitLab"],
];
const accents = [
  { border: "#A78BFA", fill: "#151222", ink: "#C4B5FD", soft: "#928BAA" },
  { border: "#67E8F9", fill: "#101B22", ink: "#A5F3FC", soft: "#83A2AC" },
  { border: "#F9A8D4", fill: "#151320", ink: "#FBCFE8", soft: "#A694AF" },
  { border: "#A7F3D0", fill: "#101A1B", ink: "#BBF7D0", soft: "#89AAA4" },
];

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]);
}

function text(value, { x, y, fill = "#F5F3FF", size = 14, weight = 400, anchor = "start", family, letterSpacing, direction = "ltr" }) {
  const spacing = letterSpacing === undefined ? "" : ' letter-spacing="' + letterSpacing + '"';
  return '<text x="' + x + '" y="' + y + '" fill="' + fill + '" font-family="' + escapeXml(family) + '" font-size="' + size + '" font-weight="' + weight + '" text-anchor="' + anchor + '" direction="' + direction + '" unicode-bidi="plaintext"' + spacing + ">" + escapeXml(value) + "</text>";
}

function compactSize(value, standard, minimum) {
  return Math.max(minimum, standard - Math.max(0, Array.from(value).length - 18) * 0.45);
}

function typography(locale) {
  return { family: locale.fontFamily, direction: locale.direction, rtl: locale.direction === "rtl" };
}

function frameSvg({ width, height, title, description, direction = "ltr", markup }) {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + " " + height + '" fill="none" role="img" aria-labelledby="title desc" direction="' + direction + '">',
    '<title id="title">' + escapeXml(title) + "</title>",
    '<desc id="desc">' + escapeXml(description) + "</desc>",
    markup,
    "</svg>",
  ].join("\n");
}

export function renderHeroSvg(localeCode) {
  const locale = getVisualLocale(localeCode);
  const { family, direction, rtl } = typography(locale);
  const titleX = rtl ? 1128 : 72;
  const titleAnchor = "start";
  const iconX = rtl ? 1074 : 72;
  const badgeX = rtl ? 77 : 935;
  const badgeTextX = rtl ? 145 : 978;
  const badgeAnchor = "start";
  const iconMarkX = iconX + 27;
  const eyebrowSize = compactSize(locale.hero.eyebrow, 17, 12);
  const badgeSize = compactSize(locale.hero.status, 14, 10);
  return frameSvg({
    width: 1200,
    height: 300,
    title: "KS-GG-AI — " + locale.hero.eyebrow,
    description: locale.hero.status,
    direction,
    markup: [
      '<defs><linearGradient id="bg" x1="72" y1="18" x2="1120" y2="290" gradientUnits="userSpaceOnUse"><stop stop-color="#17112B"/><stop offset=".52" stop-color="#241642"/><stop offset="1" stop-color="#0D1020"/></linearGradient><linearGradient id="glow" x1="204" y1="48" x2="978" y2="246" gradientUnits="userSpaceOnUse"><stop stop-color="#C4B5FD"/><stop offset=".45" stop-color="#8B5CF6"/><stop offset="1" stop-color="#38BDF8"/></linearGradient><filter id="blur" x="-30%" y="-50%" width="160%" height="200%"><feGaussianBlur stdDeviation="34"/></filter></defs>',
      '<rect width="1200" height="300" rx="22" fill="url(#bg)"/><circle cx="1054" cy="60" r="120" fill="#7C3AED" fill-opacity=".22" filter="url(#blur)"/><circle cx="192" cy="246" r="108" fill="#0EA5E9" fill-opacity=".13" filter="url(#blur)"/>',
      '<path d="M0 235C160 186 270 270 435 219C598 170 712 105 866 149C1014 191 1089 133 1200 93" stroke="url(#glow)" stroke-opacity=".42" stroke-width="1.5"/><g fill="#DDD6FE" fill-opacity=".75"><circle cx="79" cy="67" r="2"/><circle cx="149" cy="112" r="1.5"/><circle cx="1053" cy="209" r="2"/><circle cx="1116" cy="152" r="1.5"/><circle cx="959" cy="90" r="1.5"/></g>',
      '<rect x="' + iconX + '" y="75" width="54" height="54" rx="16" fill="#A78BFA" fill-opacity=".16" stroke="#C4B5FD" stroke-opacity=".55"/><path d="M' + (iconMarkX - 10) + ' 102H' + (iconMarkX + 10) + 'M' + iconMarkX + ' 92V112" stroke="#DDD6FE" stroke-width="3" stroke-linecap="round"/>',
      text("KS-GG-AI", { x: titleX, y: 177, size: 54, weight: 700, family, anchor: titleAnchor, direction }),
      text(locale.hero.eyebrow, { x: titleX, y: 211, size: eyebrowSize, weight: 600, family, anchor: titleAnchor, direction, letterSpacing: rtl ? ".7" : "2.2" }),
      '<g transform="translate(' + badgeX + ' 179)"><rect width="188" height="48" rx="24" fill="#0B1020" fill-opacity=".6" stroke="#A78BFA" stroke-opacity=".3"/><circle cx="' + (rtl ? 162 : 26) + '" cy="24" r="6" fill="#A7F3D0"/>' + text(locale.hero.status, { x: badgeTextX - badgeX, y: 30, fill: "#EDE9FE", size: badgeSize, weight: 600, family, anchor: badgeAnchor, direction }) + "</g>",
    ].join("\n"),
  });
}

function toolboxCard(locale, group, tools, x, index) {
  const { family, direction, rtl } = typography(locale);
  const cardWidth = index === 3 ? 232 : 212;
  const accent = accents[index];
  const edge = rtl ? x + cardWidth - 18 : x + 18;
  const anchor = "start";
  const toolWidth = cardWidth - 62;
  return [
    '<rect x="' + x + '" y="91" width="' + cardWidth + '" height="134" rx="16" fill="' + accent.fill + '" stroke="' + accent.border + '" stroke-opacity=".45"/>',
    text(group.label, { x: edge, y: 119, fill: accent.ink, size: compactSize(group.label, 11, 8), weight: 700, family, anchor, direction, letterSpacing: ".9" }),
    text(group.detail, { x: edge, y: 136, fill: accent.soft, size: compactSize(group.detail, 9, 7), family, anchor, direction, letterSpacing: ".45" }),
    ...tools.map((tool, toolIndex) => {
      const y = 150 + toolIndex * 26;
      const toolX = rtl ? x + cardWidth - 18 - toolWidth : x + 18;
      return '<rect x="' + toolX + '" y="' + y + '" width="' + toolWidth + '" height="22" rx="7" fill="#111827" stroke="' + accent.border + '" stroke-opacity=".18"/>'
        + text(tool, { x: rtl ? toolX + toolWidth - 10 : toolX + 10, y: y + 15, fill: "#EDE9FE", size: 10, weight: 700, family, anchor, direction });
    }),
  ].join("\n");
}

export function renderToolboxSvg(localeCode) {
  const locale = getVisualLocale(localeCode);
  const { family, direction, rtl } = typography(locale);
  const positions = rtl ? [720, 476, 252, 28] : [28, 252, 476, 700];
  const headerX = rtl ? 930 : 30;
  const headerAnchor = "start";
  const badgeX = rtl ? 28 : 760;
  const badgeDotX = rtl ? 179 : 781;
  const badgeTextX = rtl ? 164 : 796;
  const badgeAnchor = "start";
  return frameSvg({
    width: 960,
    height: 252,
    title: locale.toolbox.title,
    description: locale.toolbox.subtitle,
    direction,
    markup: [
      '<defs><linearGradient id="surface" x1="0" y1="0" x2="960" y2="252" gradientUnits="userSpaceOnUse"><stop stop-color="#14111F"/><stop offset=".55" stop-color="#101720"/><stop offset="1" stop-color="#0D1919"/></linearGradient><linearGradient id="rule" x1="28" y1="0" x2="932" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="#A78BFA" stop-opacity=".7"/><stop offset=".52" stop-color="#67E8F9" stop-opacity=".55"/><stop offset="1" stop-color="#A7F3D0" stop-opacity=".5"/></linearGradient></defs>',
      '<rect x=".5" y=".5" width="959" height="251" rx="22" fill="url(#surface)" stroke="#31364A"/><path d="M28 76H932" stroke="url(#rule)" stroke-width="1.25"/>',
      text(locale.toolbox.title, { x: headerX, y: 39, size: compactSize(locale.toolbox.title, 18, 13), weight: 700, family, anchor: headerAnchor, direction }),
      text(locale.toolbox.subtitle, { x: headerX, y: 61, fill: "#A7A2B7", size: compactSize(locale.toolbox.subtitle, 11, 8), family, anchor: headerAnchor, direction, letterSpacing: ".45" }),
      '<rect x="' + badgeX + '" y="23" width="172" height="30" rx="15" fill="#121A26" stroke="#344056"/><circle cx="' + badgeDotX + '" cy="38" r="4" fill="#F9A8D4"/>',
      text(locale.toolbox.badge, { x: badgeTextX, y: 42, fill: "#D9E4F5", size: compactSize(locale.toolbox.badge, 10, 7), weight: 700, family, anchor: badgeAnchor, direction }),
      ...locale.toolbox.groups.map((group, index) => toolboxCard(locale, group, commonTools[index], positions[index], index)),
    ].join("\n"),
  });
}

function chipRows(chips, x, y, width, accent) {
  const rows = [];
  let cursorX = x;
  let cursorY = y;
  for (const chip of chips) {
    const chipWidth = Math.min(width, Math.max(36, chip.length * 7 + 18));
    if (cursorX + chipWidth > x + width) {
      cursorX = x;
      cursorY += 32;
    }
    rows.push('<rect x="' + cursorX + '" y="' + cursorY + '" width="' + chipWidth + '" height="23" rx="7" fill="#111827" stroke="' + accent.border + '" stroke-opacity=".24"/>');
    rows.push('<text x="' + (cursorX + chipWidth / 2) + '" y="' + (cursorY + 15) + '" fill="#EDE9FE" font-family="Noto Sans, Segoe UI, Arial, sans-serif" font-size="10" font-weight="700" text-anchor="middle">' + escapeXml(chip) + "</text>");
    cursorX += chipWidth + 8;
  }
  return rows.join("\n");
}

function stackCard(locale, group, index, position, activeIndex) {
  const { family, direction, rtl } = typography(locale);
  const accent = accents[index];
  const active = activeIndex === index;
  const x = position.x;
  const y = position.y;
  const width = 440;
  const edge = rtl ? x + width - 20 : x + 20;
  const anchor = "start";
  const titleSize = compactSize(group.label, 16, 11);
  const detailSize = compactSize(group.detail, 10, 7);
  return [
    '<rect x="' + x + '" y="' + y + '" width="440" height="186" rx="18" fill="' + accent.fill + '" stroke="' + accent.border + '" stroke-opacity="' + (active ? ".98" : ".45") + '" stroke-width="' + (active ? "2" : "1") + '"/>',
    '<circle cx="' + (rtl ? x + 411 : x + 29) + '" cy="' + (y + 29) + '" r="13" fill="' + accent.border + '" fill-opacity="' + (active ? ".34" : ".16") + '"/><path d="M' + (rtl ? x + 406 : x + 24) + " " + (y + 29) + "h10M" + (rtl ? x + 411 : x + 29) + " " + (y + 24) + "v10\" stroke=\"" + accent.ink + '" stroke-width="1.5" stroke-linecap="round"/>',
    text(group.label, { x: edge, y: y + 25, size: titleSize, weight: 700, family, anchor, direction }),
    text(group.detail, { x: edge, y: y + 45, fill: accent.soft, size: detailSize, family, anchor, direction, letterSpacing: ".25" }),
    chipRows(stackTools[index], x + 20, y + 66, 400, accent),
    '<path d="M' + (x + 20) + " " + (y + 164) + "H" + (x + 420) + '" stroke="' + accent.border + '" stroke-opacity="' + (active ? ".68" : ".28") + '" stroke-width="1.25"/>',
  ].join("\n");
}

export function renderTechnologyStackSvg(localeCode, activeIndex = null, motionStep = 0) {
  const locale = getVisualLocale(localeCode);
  const { family, direction, rtl } = typography(locale);
  const positions = rtl
    ? [{ x: 492, y: 98 }, { x: 28, y: 98 }, { x: 492, y: 304 }, { x: 28, y: 304 }]
    : [{ x: 28, y: 98 }, { x: 492, y: 98 }, { x: 28, y: 304 }, { x: 492, y: 304 }];
  const headerX = rtl ? 928 : 32;
  const headerAnchor = "start";
  const motionAccent = activeIndex === null ? "#67E8F9" : accents[activeIndex].border;
  const markerX = 842 + Math.round((motionStep % 5) * 16);
  return frameSvg({
    width: 960,
    height: 532,
    title: locale.stack.title,
    description: locale.stack.subtitle,
    direction,
    markup: [
      '<defs><linearGradient id="bg" x1="0" y1="0" x2="960" y2="532" gradientUnits="userSpaceOnUse"><stop stop-color="#11101B"/><stop offset="1" stop-color="#0C151A"/></linearGradient><linearGradient id="accent" x1="28" y1="0" x2="932" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="#A78BFA"/><stop offset=".5" stop-color="#67E8F9"/><stop offset="1" stop-color="#A7F3D0"/></linearGradient></defs>',
      '<rect x=".5" y=".5" width="959" height="531" rx="24" fill="url(#bg)" stroke="#2B3141"/><path d="M28 78H932" stroke="url(#accent)" stroke-opacity=".45"/>',
      text(locale.stack.title, { x: headerX, y: 43, size: compactSize(locale.stack.title, 19, 13), weight: 700, family, anchor: headerAnchor, direction }),
      text(locale.stack.subtitle, { x: headerX, y: 65, fill: "#918BAA", size: compactSize(locale.stack.subtitle, 10, 7), family, anchor: headerAnchor, direction, letterSpacing: ".35" }),
      '<g><rect x="836" y="23" width="96" height="30" rx="15" fill="#101827" stroke="#344056"/><path d="M852 38H916" stroke="#4F6178" stroke-width="1.25"/><circle cx="' + markerX + '" cy="38" r="5" fill="' + motionAccent + '"/><circle cx="916" cy="38" r="3" fill="#F9A8D4"/></g>',
      ...locale.stack.groups.map((group, index) => stackCard(locale, group, index, positions[index], activeIndex)),
      '<path d="M28 506H932" stroke="#344056"/><circle cx="' + (rtl ? 904 : 56) + '" cy="516" r="4" fill="#A7F3D0"/>',
      text(locale.stack.footer, { x: rtl ? 884 : 76, y: 520, fill: "#B4B1C5", size: compactSize(locale.stack.footer, 10, 7), weight: 700, family, anchor: "start", direction, letterSpacing: ".28" }),
    ].join("\n"),
  });
}

export function renderTypingSvg(localeCode, phrase, caretVisible) {
  const locale = getVisualLocale(localeCode);
  const { family, direction, rtl } = typography(locale);
  const width = 800;
  const height = 144;
  const prompt = rtl ? locale.typing.prefix + phrase : locale.typing.prefix + phrase;
  const promptSize = locale.code === "ar" || locale.code === "hi" ? 21 : 25;
  const lineStart = rtl ? 744 : 56;
  const anchor = "start";
  const estimatedWidth = Math.min(620, Array.from(prompt).length * promptSize * 0.57);
  const caretX = rtl ? Math.max(62, lineStart - estimatedWidth - 5) : Math.min(736, lineStart + estimatedWidth + 6);
  return frameSvg({
    width,
    height,
    title: locale.typing.label,
    description: locale.typing.footer,
    direction,
    markup: [
      '<defs><linearGradient id="panel" x1="0" y1="0" x2="800" y2="144" gradientUnits="userSpaceOnUse"><stop stop-color="#17112B"/><stop offset=".55" stop-color="#111827"/><stop offset="1" stop-color="#0E1D1D"/></linearGradient></defs>',
      '<rect width="800" height="144" rx="20" fill="url(#panel)"/><rect x="1" y="1" width="798" height="142" rx="19" stroke="#343B53" fill="none"/>',
      '<circle cx="38" cy="28" r="4" fill="#F9A8D4"/><circle cx="53" cy="28" r="4" fill="#FDE68A"/><circle cx="68" cy="28" r="4" fill="#6EE7B7"/>',
      text(locale.typing.label, { x: rtl ? 736 : 90, y: 32, fill: "#B8B2D0", size: 9, weight: 700, family, anchor, direction, letterSpacing: ".8" }),
      '<path d="M30 49H770" stroke="#424B66"/>',
      '<rect x="30" y="63" width="740" height="44" rx="11" fill="#0C1320" stroke="#27334A"/><rect x="44" y="75" width="3" height="20" rx="1.5" fill="#A7F3D0"/>',
      text(prompt, { x: lineStart, y: 91, fill: "#F5F3FF", size: promptSize, weight: 600, family, anchor, direction }),
      caretVisible ? '<rect x="' + caretX + '" y="70" width="3" height="27" rx="1.5" fill="#67E8F9"/>' : "",
      '<path d="M34 121H654" stroke="#35415A"/><path d="M654 121H716" stroke="#67E8F9"/><circle cx="731" cy="121" r="4" fill="#F9A8D4"/>',
      text(locale.typing.footer, { x: rtl ? 736 : 56, y: 136, fill: "#A7A2B7", size: compactSize(locale.typing.footer, 9, 7), weight: 700, family, anchor, direction, letterSpacing: ".45" }),
    ].join("\n"),
  });
}

async function writeIfChanged(file, value) {
  let existing = null;
  try {
    existing = await readFile(file);
  } catch (error) {
    if (!error || typeof error !== "object" || error.code !== "ENOENT") throw error;
  }
  const output = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
  if (!existing || !existing.equals(output)) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, output);
  }
}

async function encodeGif(frameMarkup, width, height, delays) {
  const rasterFrames = [];
  for (const svg of frameMarkup) {
    const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    if (info.width !== width || info.height !== height) throw new Error("Unexpected GIF frame dimensions.");
    rasterFrames.push(data);
  }
  const palette = quantize(rasterFrames[0], 64, { format: "rgb444" });
  const gif = GIFEncoder();
  rasterFrames.forEach((data, index) => {
    gif.writeFrame(applyPalette(data, palette, "rgb444"), width, height, {
      palette: index === 0 ? palette : undefined,
      delay: delays[index],
      repeat: index === 0 ? 0 : undefined,
    });
  });
  gif.finish();
  return Buffer.from(gif.bytes());
}

function typingFrames(locale) {
  const frames = [];
  const delays = [];
  for (const phrase of locale.typing.phrases) {
    const characters = Array.from(phrase);
    for (let index = 1; index <= characters.length; index += 1) {
      frames.push(renderTypingSvg(locale.code, characters.slice(0, index).join(""), true));
      delays.push(72);
    }
    for (let hold = 0; hold < 4; hold += 1) {
      frames.push(renderTypingSvg(locale.code, phrase, hold % 2 === 0));
      delays.push(180);
    }
    for (let index = characters.length - 1; index >= 0; index -= 1) {
      frames.push(renderTypingSvg(locale.code, characters.slice(0, index).join(""), true));
      delays.push(46);
    }
  }
  return { frames, delays };
}

function stackFrames(locale) {
  const frames = [];
  const delays = [];
  for (let activeIndex = 0; activeIndex < 4; activeIndex += 1) {
    for (let step = 0; step < 5; step += 1) {
      frames.push(renderTechnologyStackSvg(locale.code, activeIndex, activeIndex * 5 + step));
      delays.push(step === 4 ? 240 : 92);
    }
  }
  return { frames, delays };
}

function localizedTarget(locale, section, file) {
  return path.join(root, "profile", "assets", "locales", locale.code, section, file);
}

async function writeLocaleAssets(locale) {
  const hero = renderHeroSvg(locale.code);
  const toolbox = renderToolboxSvg(locale.code);
  const stack = renderTechnologyStackSvg(locale.code);
  const typing = typingFrames(locale);
  const animatedStack = stackFrames(locale);
  await Promise.all([
    writeIfChanged(localizedTarget(locale, "identity", "hero.svg"), hero),
    writeIfChanged(localizedTarget(locale, "visuals", "toolbox.svg"), toolbox),
    writeIfChanged(localizedTarget(locale, "visuals", "technology-stack.svg"), stack),
    encodeGif(typing.frames, 800, 144, typing.delays).then((value) => writeIfChanged(localizedTarget(locale, "motion", "typing.gif"), value)),
    encodeGif(animatedStack.frames, 960, 532, animatedStack.delays).then((value) => writeIfChanged(localizedTarget(locale, "motion", "technology-stack.gif"), value)),
  ]);
}

async function writeEnglishCompatibilityAssets() {
  const english = getVisualLocale("en");
  const copy = async (section, file, destination) => writeIfChanged(
    path.join(root, "profile", "assets", section, destination),
    await readFile(localizedTarget(english, section, file)),
  );
  await Promise.all([
    copy("identity", "hero.svg", "hero.svg"),
    copy("visuals", "toolbox.svg", "toolbox.svg"),
    copy("visuals", "technology-stack.svg", "technology-stack.svg"),
    copy("motion", "typing.gif", "typing.gif"),
    copy("motion", "technology-stack.gif", "technology-stack.gif"),
  ]);
}

export async function generateLocalizedVisualAssets() {
  for (const locale of visualLocales) await writeLocaleAssets(locale);
  await writeEnglishCompatibilityAssets();
  return { locales: visualLocales.map(({ code }) => code) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = await generateLocalizedVisualAssets();
  console.log("Generated localized visual assets for " + result.locales.join(", ") + ".");
}
