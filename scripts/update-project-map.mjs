import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const readmeNames = [
  "README.md",
  "README.ko.md",
  "README.zh-CN.md",
  "README.es.md",
  "README.hi.md",
  "README.ar.md",
  "README.pt-BR.md",
  "README.ru.md",
  "README.fr.md",
  "README.id.md",
];
const maxVisibleProjects = 3;
const renderVersion = 4;
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

function laneHeader(y, label, description, accent) {
  return [
    '<rect x="24" y="' + y + '" width="432" height="40" rx="13" fill="#111827" stroke="' + accent + '" stroke-opacity=".52"/>',
    '<circle cx="48" cy="' + (y + 20) + '" r="5" fill="' + accent + '"/>',
    '<text x="64" y="' + (y + 18) + '" fill="#F5F3FF" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700" letter-spacing=".6">' + escapeXml(label) + '</text>',
    '<text x="64" y="' + (y + 32) + '" fill="#9AA4BA" font-family="Arial, Helvetica, sans-serif" font-size="8" letter-spacing=".7">' + escapeXml(description) + '</text>',
  ].join("");
}

function projectCard(y, title, subtitle, accent) {
  return [
    '<rect x="42" y="' + y + '" width="396" height="52" rx="13" fill="#10121F" stroke="#293244"/>',
    '<rect x="42" y="' + y + '" width="4" height="52" rx="2" fill="' + accent + '"/>',
    '<text x="66" y="' + (y + 23) + '" fill="#F5F3FF" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700">' + escapeXml(title) + '</text>',
    '<text x="66" y="' + (y + 40) + '" fill="#9AA4BA" font-family="Arial, Helvetica, sans-serif" font-size="10" letter-spacing=".5">' + escapeXml(subtitle) + '</text>',
  ].join("");
}

function visiblePublicCards(projects) {
  if (projects.length === 0) return [{ name: "NO PUBLIC PROJECTS", language: "PUBLIC LANE READY" }];
  if (projects.length <= maxVisibleProjects) return projects;
  return [
    ...projects.slice(0, maxVisibleProjects - 1),
    { name: "+ " + String(projects.length - (maxVisibleProjects - 1)) + " MORE", language: "PUBLIC PROJECTS" },
  ];
}

function visiblePrivateCards(privateState) {
  if (privateState.status !== "connected") {
    return [{ title: "PRIVATE WORK", subtitle: "MASKED BY DEFAULT" }];
  }
  if (privateState.count === 0) {
    return [{ title: "NO PRIVATE PROJECTS", subtitle: "CONNECTED SCOPE" }];
  }
  if (privateState.count <= maxVisibleProjects) {
    return privateState.labels.map((label) => ({ title: label, subtitle: "NAME AND METADATA HIDDEN" }));
  }
  return [
    ...privateState.labels.slice(0, maxVisibleProjects - 1).map((label) => ({ title: label, subtitle: "NAME AND METADATA HIDDEN" })),
    { title: "PRIVATE · ███ · + " + String(privateState.count - (maxVisibleProjects - 1)), subtitle: "ADDITIONAL PROJECTS HIDDEN" },
  ];
}

export function renderProjectMap(snapshot) {
  const publicCards = visiblePublicCards(snapshot.publicProjects);
  const privateCards = visiblePrivateCards(snapshot.private);
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
  const publicCardMarkup = publicCards.map((project, index) => projectCard(publicCardsTop + index * cardStep, project.name, project.language, "#67E8F9")).join("");
  const privateCardMarkup = privateCards.map((project, index) => projectCard(privateCardsTop + index * cardStep, project.title, project.subtitle, "#F9A8D4")).join("");
  const privateLaneLabel = snapshot.private.status === "connected"
    ? "PRIVATE · MASKED · " + countLabel(snapshot.private.count)
    : "PRIVATE · MASKED";
  const updatedDate = String(snapshot.generatedAt ?? "").slice(0, 10);

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + svgWidth + '" height="' + svgHeight + '" viewBox="0 0 ' + svgWidth + ' ' + svgHeight + '" fill="none" role="img" aria-labelledby="title desc">',
    '<title id="title">' + escapeXml(snapshot.username) + ' project map</title>',
    '<desc id="desc">A project topology that separates public projects from intentionally masked private work.</desc>',
    '<defs><linearGradient id="background" x1="22" y1="10" x2="' + (svgWidth - 14) + '" y2="' + (svgHeight - 10) + '" gradientUnits="userSpaceOnUse"><stop stop-color="#17112B"/><stop offset=".54" stop-color="#101926"/><stop offset="1" stop-color="#0E1D1D"/></linearGradient><filter id="glow" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="24"/></filter></defs>',
    '<rect width="' + svgWidth + '" height="' + svgHeight + '" rx="24" fill="url(#background)"/>',
    '<circle cx="426" cy="62" r="62" fill="#7C3AED" fill-opacity=".16" filter="url(#glow)"/><circle cx="58" cy="' + lowerGlowY + '" r="74" fill="#06B6D4" fill-opacity=".1" filter="url(#glow)"/>',
    '<text x="24" y="30" fill="#F5F3FF" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700">PROJECT MAP</text>',
    '<text x="24" y="46" fill="#9AA4BA" font-family="Arial, Helvetica, sans-serif" font-size="8" letter-spacing=".9">PUBLIC SURFACES · MASKED PRIVATE WORK</text>',
    '<rect x="349" y="17" width="107" height="24" rx="12" fill="#0B1020" fill-opacity=".72" stroke="#67E8F9" stroke-opacity=".34"/><circle cx="367" cy="29" r="4" fill="#A7F3D0"/><text x="378" y="32" fill="#EDE9FE" font-family="Arial, Helvetica, sans-serif" font-size="8" font-weight="700">AUTO SYNC</text>',
    '<rect x="24" y="66" width="432" height="54" rx="16" fill="#111827" stroke="#A78BFA" stroke-opacity=".62"/><rect x="25" y="67" width="430" height="52" rx="15" fill="#131225"/>',
    '<circle cx="52" cy="93" r="11" fill="#A78BFA" fill-opacity=".2" stroke="#C4B5FD" stroke-opacity=".65"/><path d="M46 93H58M52 87V99" stroke="#DDD6FE" stroke-width="2" stroke-linecap="round"/>',
    '<text x="76" y="90" fill="#F5F3FF" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700">' + escapeXml(snapshot.username) + ' · WORKSPACE</text>',
    '<text x="76" y="107" fill="#AFA6C8" font-family="Arial, Helvetica, sans-serif" font-size="8" letter-spacing=".75">PROJECT TOPOLOGY · PROFILE VIEW</text>',
    '<path d="M240 120V138" stroke="#4C4668" stroke-width="1.5" stroke-linecap="round"/>',
    laneHeader(138, "PUBLIC · " + countLabel(snapshot.publicProjects.length), "VISIBLE PROJECTS", "#67E8F9"),
    laneHeader(privateHeaderY, privateLaneLabel, "PROTECTED LANE", "#F9A8D4"),
    publicCardMarkup,
    privateCardMarkup,
    '<path d="M24 ' + footerLineY + 'H456" stroke="#32364D" stroke-width="1"/>',
    '<text x="24" y="' + footerTextY + '" fill="#8C96AA" font-family="Arial, Helvetica, sans-serif" font-size="8" letter-spacing=".35">PUBLIC METADATA ONLY · PRIVATE ENTRIES REDACTED</text>',
    '<text x="456" y="' + footerTextY + '" fill="#A7F3D0" font-family="Arial, Helvetica, sans-serif" font-size="8" text-anchor="end">STATE UPDATED ' + escapeXml(updatedDate) + '</text>',
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
    username: snapshot.username,
    publicProjects: snapshot.publicProjects,
    private: snapshot.private,
  };
}

export function isValidProjectSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return false;
  if (snapshot.schemaVersion !== 1 || snapshot.renderVersion !== renderVersion) return false;
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

function updateReadmeRevision(text, revision) {
  const expression = /(\.\/assets\/project-map\.svg)\?v=[A-Za-z0-9-]+/g;
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
  const dataPath = path.join(root, "data", "project-map.json");
  const existing = await readJsonIfPresent(dataPath);
  const existingSemantic = isValidProjectSnapshot(existing) ? semanticSnapshot(existing) : null;
  const changed = JSON.stringify(existingSemantic) !== JSON.stringify(semanticState);
  const snapshot = changed
    ? { ...semanticState, revision: revisionFor(semanticState), generatedAt: new Date().toISOString() }
    : existing;
  const readmeUpdates = await Promise.all(readmeNames.map(async (name) => {
    const file = path.join(root, name);
    return { file, text: updateReadmeRevision(await readFile(file, "utf8"), snapshot.revision) };
  }));
  const assetsDirectory = path.join(root, "assets");
  await mkdir(path.dirname(dataPath), { recursive: true });
  await mkdir(assetsDirectory, { recursive: true });
  await writeIfChanged(dataPath, JSON.stringify(snapshot, null, 2) + "\n");
  await writeIfChanged(path.join(assetsDirectory, "project-map.svg"), renderProjectMap(snapshot));
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
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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
