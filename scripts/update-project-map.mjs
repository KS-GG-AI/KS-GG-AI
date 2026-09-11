import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const readmeNames = [
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
const renderVersion = 2;

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

function laneHeader(x, label, accent) {
  return [
    '<rect x="' + x + '" y="198" width="420" height="46" rx="14" fill="#111827" stroke="' + accent + '" stroke-opacity=".52"/>',
    '<circle cx="' + (x + 24) + '" cy="221" r="6" fill="' + accent + '"/>',
    '<text x="' + (x + 40) + '" y="217" fill="#F5F3FF" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700" letter-spacing=".65">' + escapeXml(label) + '</text>',
    '<text x="' + (x + 40) + '" y="233" fill="#9AA4BA" font-family="Arial, Helvetica, sans-serif" font-size="9" letter-spacing=".75">WORKSPACE LANE</text>',
  ].join("");
}

function projectCard(x, y, title, subtitle, accent) {
  return [
    '<rect x="' + x + '" y="' + y + '" width="420" height="52" rx="13" fill="#10121F" stroke="#293244"/>',
    '<rect x="' + x + '" y="' + y + '" width="4" height="52" rx="2" fill="' + accent + '"/>',
    '<text x="' + (x + 22) + '" y="' + (y + 23) + '" fill="#F5F3FF" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="700">' + escapeXml(title) + '</text>',
    '<text x="' + (x + 22) + '" y="' + (y + 39) + '" fill="#9AA4BA" font-family="Arial, Helvetica, sans-serif" font-size="9" letter-spacing=".65">' + escapeXml(subtitle) + '</text>',
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
  const rowCount = Math.max(publicCards.length, privateCards.length);
  const cardBottom = 264 + (rowCount - 1) * 62 + 52;
  const footerLineY = cardBottom + 30;
  const footerTextY = footerLineY + 20;
  const svgHeight = Math.max(380, footerTextY + 14);
  const lowerGlowY = Math.max(282, svgHeight - 72);
  const publicCardMarkup = publicCards.map((project, index) => projectCard(28, 264 + index * 62, project.name, project.language, "#67E8F9")).join("");
  const privateCardMarkup = privateCards.map((project, index) => projectCard(512, 264 + index * 62, project.title, project.subtitle, "#F9A8D4")).join("");
  const privateLaneLabel = snapshot.private.status === "connected"
    ? "PRIVATE · MASKED · " + countLabel(snapshot.private.count)
    : "PRIVATE · MASKED";
  const updatedDate = String(snapshot.generatedAt ?? "").slice(0, 10);

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="' + svgHeight + '" viewBox="0 0 960 ' + svgHeight + '" fill="none" role="img" aria-labelledby="title desc">',
    '<title id="title">' + escapeXml(snapshot.username) + ' project map</title>',
    '<desc id="desc">A project topology that separates public projects from intentionally masked private work.</desc>',
    '<defs><linearGradient id="background" x1="22" y1="10" x2="938" y2="' + (svgHeight - 10) + '" gradientUnits="userSpaceOnUse"><stop stop-color="#17112B"/><stop offset=".54" stop-color="#101926"/><stop offset="1" stop-color="#0E1D1D"/></linearGradient><filter id="glow" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="24"/></filter></defs>',
    '<rect width="960" height="' + svgHeight + '" rx="24" fill="url(#background)"/>',
    '<circle cx="872" cy="68" r="84" fill="#7C3AED" fill-opacity=".16" filter="url(#glow)"/><circle cx="110" cy="' + lowerGlowY + '" r="94" fill="#06B6D4" fill-opacity=".1" filter="url(#glow)"/>',
    '<text x="30" y="39" fill="#F5F3FF" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">PROJECT MAP</text>',
    '<text x="30" y="57" fill="#9AA4BA" font-family="Arial, Helvetica, sans-serif" font-size="9" letter-spacing="1">PUBLIC SURFACES · MASKED PRIVATE WORK</text>',
    '<rect x="790" y="22" width="140" height="30" rx="15" fill="#0B1020" fill-opacity=".72" stroke="#67E8F9" stroke-opacity=".34"/><circle cx="810" cy="37" r="5" fill="#A7F3D0"/><text x="824" y="41" fill="#EDE9FE" font-family="Arial, Helvetica, sans-serif" font-size="10" font-weight="700">AUTO SYNC</text>',
    '<rect x="300" y="82" width="360" height="72" rx="18" fill="#111827" stroke="#A78BFA" stroke-opacity=".62"/><rect x="301" y="83" width="358" height="70" rx="17" fill="#131225"/>',
    '<circle cx="334" cy="118" r="12" fill="#A78BFA" fill-opacity=".2" stroke="#C4B5FD" stroke-opacity=".65"/><path d="M328 118H340M334 112V124" stroke="#DDD6FE" stroke-width="2" stroke-linecap="round"/>',
    '<text x="362" y="113" fill="#F5F3FF" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700">' + escapeXml(snapshot.username) + ' · WORKSPACE</text>',
    '<text x="362" y="132" fill="#AFA6C8" font-family="Arial, Helvetica, sans-serif" font-size="10" letter-spacing=".8">PROJECT TOPOLOGY · PROFILE VIEW</text>',
    '<path d="M480 154V177M238 177H722M238 177V198M722 177V198" stroke="#4C4668" stroke-width="1.5" stroke-linecap="round"/>',
    laneHeader(28, "PUBLIC · " + countLabel(snapshot.publicProjects.length), "#67E8F9"),
    laneHeader(512, privateLaneLabel, "#F9A8D4"),
    publicCardMarkup,
    privateCardMarkup,
    '<path d="M28 ' + footerLineY + 'H932" stroke="#32364D" stroke-width="1"/>',
    '<text x="30" y="' + footerTextY + '" fill="#8C96AA" font-family="Arial, Helvetica, sans-serif" font-size="9" letter-spacing=".55">PUBLIC METADATA ONLY · PRIVATE ENTRIES INTENTIONALLY REDACTED</text>',
    '<text x="849" y="' + footerTextY + '" fill="#A7F3D0" font-family="Arial, Helvetica, sans-serif" font-size="9" text-anchor="end">STATE UPDATED ' + escapeXml(updatedDate) + '</text>',
    '</svg>',
  ].join("\n");
}

async function readJsonIfPresent(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return null;
    throw error;
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

async function fetchRepositoryPages(url, token) {
  const repositories = [];
  for (let page = 1; ; page += 1) {
    const separator = url.includes("?") ? "&" : "?";
    const response = await fetch(url + separator + "per_page=100&page=" + page, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "KS-GG-AI-project-map",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
    });
    if (!response.ok) throw new Error("GitHub API request failed (HTTP " + response.status + ").");
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error("GitHub API returned an unexpected repository payload.");
    repositories.push(...batch);
    if (batch.length < 100) return repositories;
  }
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
  const accountName = username.toLocaleLowerCase("en-US");
  const ownedRepositories = repositories.filter((repository) => {
    const owner = String(repository?.owner?.login ?? "").toLocaleLowerCase("en-US");
    return owner === accountName;
  });
  const publicProjects = ownedRepositories
    .filter((repository) => !repository.private)
    .map((repository) => ({ name: repository.name, language: repository.language }));
  const privateRepositoryCount = privateToken
    ? ownedRepositories.filter((repository) => repository.private).length
    : 0;
  const semanticState = createProjectState({
    username,
    publicProjects,
    privateSyncEnabled: Boolean(privateToken),
    privateRepositoryCount,
  });
  const dataPath = path.join(root, "data", "project-map.json");
  const existing = await readJsonIfPresent(dataPath);
  const existingSemantic = existing
    ? {
      schemaVersion: existing.schemaVersion,
      renderVersion: existing.renderVersion,
      username: existing.username,
      publicProjects: existing.publicProjects,
      private: existing.private,
    }
    : null;
  const changed = JSON.stringify(existingSemantic) !== JSON.stringify(semanticState);
  const snapshot = changed
    ? { ...semanticState, revision: revisionFor(semanticState), generatedAt: new Date().toISOString() }
    : existing;
  const assetsDirectory = path.join(root, "assets");
  await mkdir(path.dirname(dataPath), { recursive: true });
  await mkdir(assetsDirectory, { recursive: true });
  await writeIfChanged(dataPath, JSON.stringify(snapshot, null, 2) + "\n");
  await writeIfChanged(path.join(assetsDirectory, "project-map.svg"), renderProjectMap(snapshot));
  for (const name of readmeNames) {
    const file = path.join(root, name);
    const updated = updateReadmeRevision(await readFile(file, "utf8"), snapshot.revision);
    await writeIfChanged(file, updated);
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
  console.log(JSON.stringify(result));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
