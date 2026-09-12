import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { getVisualLocale, visualLocaleVersion, visualLocales } from "../visuals/locale-catalog.mjs";

export const readmeEntries = [
  {
    file: "README.md",
    locale: "en",
    assetReference: "./profile/assets/locales/en/maps/project-map.svg",
    typingReference: "./profile/assets/locales/en/motion/typing.gif",
  },
  {
    file: "profile/content/locales/ko.md",
    locale: "ko",
    assetReference: "../../assets/locales/ko/maps/project-map.svg",
    typingReference: "../../assets/locales/ko/motion/typing.gif",
  },
  {
    file: "profile/content/locales/zh-CN.md",
    locale: "zh-CN",
    assetReference: "../../assets/locales/zh-CN/maps/project-map.svg",
    typingReference: "../../assets/locales/zh-CN/motion/typing.gif",
  },
  {
    file: "profile/content/locales/es.md",
    locale: "es",
    assetReference: "../../assets/locales/es/maps/project-map.svg",
    typingReference: "../../assets/locales/es/motion/typing.gif",
  },
  {
    file: "profile/content/locales/hi.md",
    locale: "hi",
    assetReference: "../../assets/locales/hi/maps/project-map.svg",
    typingReference: "../../assets/locales/hi/motion/typing.gif",
  },
  {
    file: "profile/content/locales/ar.md",
    locale: "ar",
    assetReference: "../../assets/locales/ar/maps/project-map.svg",
    typingReference: "../../assets/locales/ar/motion/typing.gif",
  },
  {
    file: "profile/content/locales/pt-BR.md",
    locale: "pt-BR",
    assetReference: "../../assets/locales/pt-BR/maps/project-map.svg",
    typingReference: "../../assets/locales/pt-BR/motion/typing.gif",
  },
  {
    file: "profile/content/locales/ru.md",
    locale: "ru",
    assetReference: "../../assets/locales/ru/maps/project-map.svg",
    typingReference: "../../assets/locales/ru/motion/typing.gif",
  },
  {
    file: "profile/content/locales/fr.md",
    locale: "fr",
    assetReference: "../../assets/locales/fr/maps/project-map.svg",
    typingReference: "../../assets/locales/fr/motion/typing.gif",
  },
  {
    file: "profile/content/locales/id.md",
    locale: "id",
    assetReference: "../../assets/locales/id/maps/project-map.svg",
    typingReference: "../../assets/locales/id/motion/typing.gif",
  },
];
export const readmeNames = readmeEntries.map(({ file }) => file);
const maxVisibleProjects = 3;
const renderVersion = 5;
const svgWidth = 480;
const requestTimeoutMs = 12_000;
const maxRequestAttempts = 3;
const maxRetryDelayMs = 5_000;

function cleanText(value, fallback, limit) {
  const text = String(value ?? fallback).replace(/\s+/g, " ").trim();
  const characters = Array.from(text || fallback);
  return characters.length > limit ? characters.slice(0, limit - 1).join("") + "…" : characters.join("");
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]);
}

function countLabel(value) {
  return String(value).padStart(2, "0");
}

export function privateProjectLabel(index) {
  return "PRIVATE · ███ · " + countLabel(index);
}

function normalizePublicProject(project) {
  return {
    name: cleanText(project.name, "PUBLIC PROJECT", 36),
    language: cleanText(project.language, "REPOSITORY", 24),
  };
}

export function createProjectState({ username, publicProjects, privateSyncEnabled, privateRepositoryCount }) {
  const normalizedPublicProjects = publicProjects
    .map(normalizePublicProject)
    .sort((left, right) => left.name.localeCompare(right.name, "en"));
  const privateCount = Math.max(0, Number(privateRepositoryCount) || 0);

  return {
    schemaVersion: 1,
    renderVersion,
    visualLocaleVersion,
    username: cleanText(username, "KS-GG-AI", 40),
    publicProjects: normalizedPublicProjects,
    private: privateSyncEnabled
      ? {
        status: "connected",
        count: privateCount,
        labels: Array.from({ length: Math.min(privateCount, maxVisibleProjects) }, (_, index) => privateProjectLabel(index + 1)),
      }
      : {
        status: "protected",
        count: null,
        labels: [],
      },
  };
}

function revisionFor(state) {
  return createHash("sha256").update(JSON.stringify(state)).digest("hex").slice(0, 12);
}

function localizedText(locale, value, x, y, options = {}) {
  const rtl = locale.direction === "rtl";
  const anchor = options.anchor ?? "start";
  return '<text x="' + x + '" y="' + y + '" fill="' + (options.fill ?? "#F5F3FF") + '" font-family="' + escapeXml(locale.fontFamily) + '" font-size="' + (options.size ?? 13) + '" font-weight="' + (options.weight ?? 400) + '" text-anchor="' + anchor + '" direction="' + locale.direction + '" unicode-bidi="plaintext"' + (options.letterSpacing === undefined ? "" : ' letter-spacing="' + options.letterSpacing + '"') + ">" + escapeXml(value) + "</text>";
}

function laneHeader(y, label, description, accent, locale) {
  const rtl = locale.direction === "rtl";
  const textX = rtl ? 416 : 64;
  return [
    '<rect x="24" y="' + y + '" width="432" height="40" rx="13" fill="#111827" stroke="' + accent + '" stroke-opacity=".52"/>',
    '<circle cx="' + (rtl ? 432 : 48) + '" cy="' + (y + 20) + '" r="5" fill="' + accent + '"/>',
    localizedText(locale, label, textX, y + 18, { size: 13, weight: 700, letterSpacing: ".35" }),
    localizedText(locale, description, textX, y + 32, { fill: "#9AA4BA", size: 8, letterSpacing: ".3" }),
  ].join("");
}

function projectCard(y, title, subtitle, accent, locale) {
  const rtl = locale.direction === "rtl";
  const textX = rtl ? 414 : 66;
  return [
    '<rect x="42" y="' + y + '" width="396" height="52" rx="13" fill="#10121F" stroke="#293244"/>',
    '<rect x="' + (rtl ? 434 : 42) + '" y="' + y + '" width="4" height="52" rx="2" fill="' + accent + '"/>',
    localizedText(locale, title, textX, y + 23, { size: 16, weight: 700 }),
    localizedText(locale, subtitle, textX, y + 40, { fill: "#9AA4BA", size: 10, letterSpacing: ".2" }),
  ].join("");
}

function visiblePublicCards(projects, locale) {
  const labels = locale.projectMap;
  if (projects.length === 0) return [{ name: labels.noPublicTitle, language: labels.noPublicSubtitle }];
  if (projects.length <= maxVisibleProjects) return projects;
  return [
    ...projects.slice(0, maxVisibleProjects - 1),
    { name: "+ " + String(projects.length - (maxVisibleProjects - 1)) + " " + labels.more, language: labels.publicDescription },
  ];
}

function visiblePrivateCards(privateState, locale) {
  const labels = locale.projectMap;
  const privateLabel = (index) => labels.private + " · ███ · " + countLabel(index);
  if (privateState.status !== "connected") {
    return [{ title: labels.privateWorkTitle, subtitle: labels.privateWorkSubtitle }];
  }
  if (privateState.count === 0) {
    return [{ title: labels.noPrivateTitle, subtitle: labels.noPrivateSubtitle }];
  }
  if (privateState.count <= maxVisibleProjects) {
    return privateState.labels.map((_, index) => ({ title: privateLabel(index + 1), subtitle: labels.privateHiddenSubtitle }));
  }
  return [
    ...privateState.labels.slice(0, maxVisibleProjects - 1).map((_, index) => ({ title: privateLabel(index + 1), subtitle: labels.privateHiddenSubtitle })),
    { title: labels.private + " · ███ · + " + String(privateState.count - (maxVisibleProjects - 1)), subtitle: labels.additionalPrivateSubtitle },
  ];
}

export function renderProjectMap(snapshot, localeCode = "en") {
  const locale = getVisualLocale(localeCode);
  const labels = locale.projectMap;
  const rtl = locale.direction === "rtl";
  const publicCards = visiblePublicCards(snapshot.publicProjects, locale);
  const privateCards = visiblePrivateCards(snapshot.private, locale);
  const cardHeight = 52;
  const cardStep = 60;
  const publicCardsTop = 188;
  const publicCardBottom = publicCardsTop + (publicCards.length - 1) * cardStep + cardHeight;
  const privateHeaderY = publicCardBottom + 18;
  const privateCardsTop = privateHeaderY + 50;
  const privateCardBottom = privateCardsTop + (privateCards.length - 1) * cardStep + cardHeight;
  const footerLineY = privateCardBottom + 22;
  const footerTextY = footerLineY + 20;
  const svgHeight = Math.max(420, footerTextY + 14);
  const lowerGlowY = Math.max(282, svgHeight - 72);
  const publicCardMarkup = publicCards.map((project, index) => projectCard(publicCardsTop + index * cardStep, project.name, project.language, "#67E8F9", locale)).join("");
  const privateCardMarkup = privateCards.map((project, index) => projectCard(privateCardsTop + index * cardStep, project.title, project.subtitle, "#F9A8D4", locale)).join("");
  const privateLaneLabel = snapshot.private.status === "connected"
    ? labels.private + " · " + labels.masked + " · " + countLabel(snapshot.private.count)
    : labels.private + " · " + labels.masked;
  const updatedDate = String(snapshot.generatedAt ?? "").slice(0, 10);
  const badgeWidth = Math.max(107, Math.min(154, 36 + Array.from(labels.autoSync).length * 7));
  const badgeX = rtl ? 24 : 456 - badgeWidth;
  const badgeTextX = rtl ? badgeX + badgeWidth - 12 : badgeX + 29;
  const workspaceTextX = rtl ? 404 : 76;

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + svgWidth + '" height="' + svgHeight + '" viewBox="0 0 ' + svgWidth + ' ' + svgHeight + '" fill="none" role="img" aria-labelledby="title desc" direction="' + locale.direction + '">',
    '<title id="title">' + escapeXml(labels.title) + '</title>',
    '<desc id="desc">' + escapeXml(labels.description) + '</desc>',
    '<defs><linearGradient id="background" x1="22" y1="10" x2="' + (svgWidth - 14) + '" y2="' + (svgHeight - 10) + '" gradientUnits="userSpaceOnUse"><stop stop-color="#17112B"/><stop offset=".54" stop-color="#101926"/><stop offset="1" stop-color="#0E1D1D"/></linearGradient><filter id="glow" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="24"/></filter></defs>',
    '<rect width="' + svgWidth + '" height="' + svgHeight + '" rx="24" fill="url(#background)"/>',
    '<circle cx="426" cy="62" r="62" fill="#7C3AED" fill-opacity=".16" filter="url(#glow)"/><circle cx="58" cy="' + lowerGlowY + '" r="74" fill="#06B6D4" fill-opacity=".1" filter="url(#glow)"/>',
    localizedText(locale, labels.title, rtl ? 456 : 24, 30, { size: 17, weight: 700 }),
    localizedText(locale, labels.subtitle, rtl ? 456 : 24, 46, { fill: "#9AA4BA", size: 8, letterSpacing: ".35" }),
    '<rect x="' + badgeX + '" y="17" width="' + badgeWidth + '" height="24" rx="12" fill="#0B1020" fill-opacity=".72" stroke="#67E8F9" stroke-opacity=".34"/><circle cx="' + (rtl ? badgeX + badgeWidth - 12 : badgeX + 18) + '" cy="29" r="4" fill="#A7F3D0"/>' + localizedText(locale, labels.autoSync, badgeTextX, 32, { fill: "#EDE9FE", size: 8, weight: 700, anchor: "start" }),
    '<rect x="24" y="66" width="432" height="54" rx="16" fill="#111827" stroke="#A78BFA" stroke-opacity=".62"/><rect x="25" y="67" width="430" height="52" rx="15" fill="#131225"/>',
    '<circle cx="' + (rtl ? 428 : 52) + '" cy="93" r="11" fill="#A78BFA" fill-opacity=".2" stroke="#C4B5FD" stroke-opacity=".65"/><path d="M' + (rtl ? 422 : 46) + ' 93H' + (rtl ? 434 : 58) + 'M' + (rtl ? 428 : 52) + ' 87V99" stroke="#DDD6FE" stroke-width="2" stroke-linecap="round"/>',
    localizedText(locale, snapshot.username + " · " + labels.workspace, workspaceTextX, 90, { size: 14, weight: 700 }),
    localizedText(locale, labels.workspaceDetail, workspaceTextX, 107, { fill: "#AFA6C8", size: 8, letterSpacing: ".25" }),
    '<path d="M240 120V138" stroke="#4C4668" stroke-width="1.5" stroke-linecap="round"/>',
    laneHeader(138, labels.public + " · " + countLabel(snapshot.publicProjects.length), labels.publicDescription, "#67E8F9", locale),
    laneHeader(privateHeaderY, privateLaneLabel, labels.privateDescription, "#F9A8D4", locale),
    publicCardMarkup,
    privateCardMarkup,
    '<path d="M24 ' + footerLineY + 'H456" stroke="#32364D" stroke-width="1"/>',
    localizedText(locale, labels.footerPublic + " · " + labels.footerPrivate, rtl ? 456 : 24, footerTextY, { fill: "#8C96AA", size: 8, letterSpacing: ".15" }),
    localizedText(locale, labels.stateUpdated + " " + updatedDate, rtl ? 24 : 456, footerTextY, { fill: "#A7F3D0", size: 8, anchor: "end" }),
    '</svg>',
  ].join("\n");
}

async function readJsonIfPresent(file) {
  let text;
  try {
    text = await readFile(file, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return null;
    throw error;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function writeIfChanged(file, value) {
  let existing = null;
  try {
    existing = await readFile(file, "utf8");
  } catch (error) {
    if (!error || typeof error !== "object" || error.code !== "ENOENT") throw error;
  }
  if (existing !== value) await writeFile(file, value, "utf8");
}

function responseHeader(response, name) {
  return response.headers?.get?.(name) ?? null;
}

function retryDelay(response, attempt) {
  const retryAfter = response ? responseHeader(response, "retry-after") : null;
  const seconds = retryAfter === null ? Number.NaN : Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(Math.round(seconds * 1_000), maxRetryDelayMs);
  if (retryAfter) {
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) return Math.min(Math.max(0, date - Date.now()), maxRetryDelayMs);
  }

  const rateLimitReset = response ? responseHeader(response, "x-ratelimit-reset") : null;
  const resetAt = rateLimitReset === null ? Number.NaN : Number(rateLimitReset);
  if (Number.isFinite(resetAt) && resetAt > 0) {
    return Math.min(Math.max(0, resetAt * 1_000 - Date.now()), maxRetryDelayMs);
  }

  return Math.min(500 * (2 ** attempt), maxRetryDelayMs);
}

function isRetryableResponse(response) {
  const status = response.status;
  return status === 408
    || status === 429
    || status === 502
    || status === 503
    || status === 504
    || (status === 403 && responseHeader(response, "x-ratelimit-remaining") === "0");
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchWithRetry(url, headers, options) {
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const waitFor = options.waitFor ?? wait;
  const timeoutMs = options.requestTimeoutMs ?? requestTimeoutMs;
  const attempts = Math.max(1, options.maxRequestAttempts ?? maxRequestAttempts);
  let lastError = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    try {
      response = await fetchImplementation(url, { headers, signal: controller.signal });
    } catch {
      lastError = new Error(controller.signal.aborted ? "GitHub API request timed out." : "GitHub API request failed.");
    } finally {
      clearTimeout(timeout);
    }

    if (response?.ok) return response;
    if (response) lastError = new Error("GitHub API request failed (HTTP " + response.status + ").");
    if (attempt === attempts - 1 || (response && !isRetryableResponse(response))) throw lastError;
    await waitFor(retryDelay(response, attempt));
  }

  throw lastError ?? new Error("GitHub API request failed.");
}

export async function fetchRepositoryPages(url, token, options = {}) {
  const repositories = [];
  for (let page = 1; ; page += 1) {
    const separator = url.includes("?") ? "&" : "?";
    const response = await fetchWithRetry(url + separator + "per_page=100&page=" + page, {
      Accept: "application/vnd.github+json",
      "User-Agent": "KS-GG-AI-project-map",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    }, options);
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error("GitHub API returned an unexpected repository payload.");
    repositories.push(...batch);
    if (batch.length < 100) return repositories;
  }
}

export function selectProjectRepositories(repositories, username, privateSyncEnabled) {
  const accountName = username.toLocaleLowerCase("en-US");
  const ownedRepositories = repositories.filter((repository) => {
    const owner = String(repository?.owner?.login ?? "").toLocaleLowerCase("en-US");
    return owner === accountName;
  });
  return {
    publicProjects: ownedRepositories
      .filter((repository) => !repository.private && !repository.fork && !repository.archived)
      .map((repository) => ({ name: repository.name, language: repository.language })),
    privateRepositoryCount: privateSyncEnabled
      ? ownedRepositories.filter((repository) => repository.private).length
      : 0,
  };
}

function semanticSnapshot(snapshot) {
  return {
    schemaVersion: snapshot.schemaVersion,
    renderVersion: snapshot.renderVersion,
    visualLocaleVersion: snapshot.visualLocaleVersion,
    username: snapshot.username,
    publicProjects: snapshot.publicProjects,
    private: snapshot.private,
  };
}

export function isValidProjectSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return false;
  if (snapshot.schemaVersion !== 1 || snapshot.renderVersion !== renderVersion || snapshot.visualLocaleVersion !== visualLocaleVersion) return false;
  if (typeof snapshot.username !== "string" || snapshot.username.length === 0) return false;
  if (!Array.isArray(snapshot.publicProjects) || !snapshot.publicProjects.every((project) => (
    project
    && typeof project.name === "string"
    && typeof project.language === "string"
  ))) return false;
  if (!snapshot.private || typeof snapshot.private !== "object" || !Array.isArray(snapshot.private.labels)) return false;
  if (snapshot.private.status === "protected" && (snapshot.private.count !== null || snapshot.private.labels.length !== 0)) return false;
  if (snapshot.private.status === "connected" && (
    !Number.isInteger(snapshot.private.count)
    || snapshot.private.count < 0
    || snapshot.private.labels.length !== Math.min(snapshot.private.count, maxVisibleProjects)
    || !snapshot.private.labels.every((label) => typeof label === "string")
  )) return false;
  if (snapshot.private.status !== "protected" && snapshot.private.status !== "connected") return false;
  return /^[a-f0-9]{12}$/.test(snapshot.revision ?? "") && !Number.isNaN(Date.parse(snapshot.generatedAt ?? ""));
}

function escapeRegularExpression(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function updateReadmeRevision(text, assetReference, revision) {
  const expression = new RegExp("(" + escapeRegularExpression(assetReference) + ")\\?v=[A-Za-z0-9-]+", "g");
  const matches = [...text.matchAll(expression)];
  if (matches.length !== 1) throw new Error("Each localized README must contain one project-map SVG reference.");
  return text.replace(expression, "$1?v=" + revision);
}

export async function updateProjectMap({ root, username, privateToken }) {
  const repositories = privateToken
    ? await fetchRepositoryPages("https://api.github.com/user/repos?affiliation=owner&visibility=all&sort=updated", privateToken)
    : await fetchRepositoryPages("https://api.github.com/users/" + encodeURIComponent(username) + "/repos?type=owner&sort=updated", "");
  const { publicProjects, privateRepositoryCount } = selectProjectRepositories(repositories, username, Boolean(privateToken));
  const semanticState = createProjectState({
    username,
    publicProjects,
    privateSyncEnabled: Boolean(privateToken),
    privateRepositoryCount,
  });
  const dataPath = path.join(root, "profile", "data", "project-map.json");
  const existing = await readJsonIfPresent(dataPath);
  const existingSemantic = isValidProjectSnapshot(existing) ? semanticSnapshot(existing) : null;
  const changed = JSON.stringify(existingSemantic) !== JSON.stringify(semanticState);
  const snapshot = changed
    ? { ...semanticState, revision: revisionFor(semanticState), generatedAt: new Date().toISOString() }
    : existing;
  const readmeUpdates = await Promise.all(readmeEntries.map(async ({ file: readmePath, assetReference }) => {
    const file = path.join(root, readmePath);
    return { file, text: updateReadmeRevision(await readFile(file, "utf8"), assetReference, snapshot.revision) };
  }));
  const assetsDirectory = path.join(root, "profile", "assets", "maps");
  await mkdir(path.dirname(dataPath), { recursive: true });
  await mkdir(assetsDirectory, { recursive: true });
  await writeIfChanged(dataPath, JSON.stringify(snapshot, null, 2) + "\n");
  await Promise.all([
    writeIfChanged(path.join(assetsDirectory, "project-map.svg"), renderProjectMap(snapshot, "en")),
    ...visualLocales.map(async ({ code }) => {
      const localeDirectory = path.join(root, "profile", "assets", "locales", code, "maps");
      await mkdir(localeDirectory, { recursive: true });
      await writeIfChanged(path.join(localeDirectory, "project-map.svg"), renderProjectMap(snapshot, code));
    }),
  ]);
  for (const update of readmeUpdates) {
    await writeIfChanged(update.file, update.text);
  }
  return {
    changed,
    publicProjectCount: snapshot.publicProjects.length,
    privateMode: snapshot.private.status,
    privateProjectCount: snapshot.private.count,
    revision: snapshot.revision,
  };
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const result = await updateProjectMap({
    root,
    username: process.env.PROFILE_USERNAME ?? "KS-GG-AI",
    privateToken: process.env.PROFILE_REPOSITORY_READ_TOKEN?.trim() ?? "",
  });
  console.log(JSON.stringify({
    changed: result.changed,
    publicProjectCount: result.publicProjectCount,
    revision: result.revision,
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
