import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const readmeEntries = [
  {
    file: "README.md",
    locale: "en",
    projectRoadmapReference: "./profile/assets/locales/en/maps/project-roadmap.svg",
    developmentRoadmapReference: "./profile/assets/locales/en/maps/development-roadmap.svg",
  },
  {
    file: "profile/content/locales/ko.md",
    locale: "ko",
    projectRoadmapReference: "../../assets/locales/ko/maps/project-roadmap.svg",
    developmentRoadmapReference: "../../assets/locales/ko/maps/development-roadmap.svg",
  },
  {
    file: "profile/content/locales/zh-CN.md",
    locale: "zh-CN",
    projectRoadmapReference: "../../assets/locales/zh-CN/maps/project-roadmap.svg",
    developmentRoadmapReference: "../../assets/locales/zh-CN/maps/development-roadmap.svg",
  },
  {
    file: "profile/content/locales/es.md",
    locale: "es",
    projectRoadmapReference: "../../assets/locales/es/maps/project-roadmap.svg",
    developmentRoadmapReference: "../../assets/locales/es/maps/development-roadmap.svg",
  },
  {
    file: "profile/content/locales/hi.md",
    locale: "hi",
    projectRoadmapReference: "../../assets/locales/hi/maps/project-roadmap.svg",
    developmentRoadmapReference: "../../assets/locales/hi/maps/development-roadmap.svg",
  },
  {
    file: "profile/content/locales/ar.md",
    locale: "ar",
    projectRoadmapReference: "../../assets/locales/ar/maps/project-roadmap.svg",
    developmentRoadmapReference: "../../assets/locales/ar/maps/development-roadmap.svg",
  },
  {
    file: "profile/content/locales/pt-BR.md",
    locale: "pt-BR",
    projectRoadmapReference: "../../assets/locales/pt-BR/maps/project-roadmap.svg",
    developmentRoadmapReference: "../../assets/locales/pt-BR/maps/development-roadmap.svg",
  },
  {
    file: "profile/content/locales/ru.md",
    locale: "ru",
    projectRoadmapReference: "../../assets/locales/ru/maps/project-roadmap.svg",
    developmentRoadmapReference: "../../assets/locales/ru/maps/development-roadmap.svg",
  },
  {
    file: "profile/content/locales/fr.md",
    locale: "fr",
    projectRoadmapReference: "../../assets/locales/fr/maps/project-roadmap.svg",
    developmentRoadmapReference: "../../assets/locales/fr/maps/development-roadmap.svg",
  },
  {
    file: "profile/content/locales/id.md",
    locale: "id",
    projectRoadmapReference: "../../assets/locales/id/maps/project-roadmap.svg",
    developmentRoadmapReference: "../../assets/locales/id/maps/development-roadmap.svg",
  },
];
export const readmeNames = readmeEntries.map(({ file }) => file);

const renderVersion = 3;
const svgWidth = 480;
const requestTimeoutMs = 12_000;
const maxRequestAttempts = 3;
const maxRetryDelayMs = 5_000;
const maxProjectItemsPerLane = 2;
const maxDevelopmentItemsPerStage = 1;

type RoadmapLocaleCopy = {
  projectTitle: string;
  projectSubtitle: string;
  projectDescription: string;
  developmentTitle: string;
  developmentSubtitle: string;
  developmentDescription: string;
  autoRefresh: string;
  flowView: string;
  publicItem: string;
  noPublicItems: string;
  noIssue: string;
  more: string;
  publicOnly: string;
  stateAsOf: string;
  lanes: Record<"now" | "next" | "later", string>;
  stages: Record<"plan" | "build" | "verify" | "ship", string>;
};

type VisualLocale = {
  code: string;
  direction: "ltr" | "rtl";
  fontFamily: string;
  roadmaps: RoadmapLocaleCopy;
};

type VisualLocaleCatalog = {
  version: number;
  locales: VisualLocale[];
};

const visualCatalogPath = fileURLToPath(new URL("../../visuals/visual-locales.json", import.meta.url));
const visualCatalog = JSON.parse(readFileSync(visualCatalogPath, "utf8")) as VisualLocaleCatalog;
if (!Number.isInteger(visualCatalog.version) || !Array.isArray(visualCatalog.locales) || visualCatalog.locales.length === 0) {
  throw new Error("Visual locale catalog is invalid.");
}
const visualLocaleVersion = visualCatalog.version;
const visualLocales = visualCatalog.locales;

function getVisualLocale(code: string): VisualLocale {
  const locale = visualLocales.find((candidate) => candidate.code === code);
  if (!locale) throw new Error("Unknown visual locale: " + code);
  return locale;
}

const projectLaneDefinitions = [
  { id: "now", label: "NOW", sourceLabel: "roadmap:now", accent: "#67E8F9" },
  { id: "next", label: "NEXT", sourceLabel: "roadmap:next", accent: "#C4B5FD" },
  { id: "later", label: "LATER", sourceLabel: "roadmap:later", accent: "#A7F3D0" },
] as const;

const developmentStageDefinitions = [
  { id: "plan", label: "PLAN", sourceLabel: "stage:plan", accent: "#C4B5FD" },
  { id: "build", label: "BUILD", sourceLabel: "stage:build", accent: "#67E8F9" },
  { id: "verify", label: "VERIFY", sourceLabel: "stage:verify", accent: "#F9A8D4" },
  { id: "ship", label: "SHIP", sourceLabel: "stage:ship", accent: "#A7F3D0" },
] as const;

type ProjectLaneId = (typeof projectLaneDefinitions)[number]["id"];
type DevelopmentStageId = (typeof developmentStageDefinitions)[number]["id"];

export type RoadmapItem = {
  repository: string;
  number: number;
  title: string;
  updatedAt: string;
};

export type PublicIssue = RoadmapItem & {
  labels: string[];
};

export type PublicRepository = {
  name: string;
};

type ProjectLane = {
  id: ProjectLaneId;
  label: string;
  sourceLabel: string;
  count: number;
  items: RoadmapItem[];
};

type DevelopmentStage = {
  id: DevelopmentStageId;
  label: string;
  sourceLabel: string;
  count: number;
  items: RoadmapItem[];
};

export type RoadmapSnapshot = {
  schemaVersion: 1;
  renderVersion: number;
  visualLocaleVersion: number;
  username: string;
  source: {
    repositoryCount: number;
    openIssueCount: number;
    trackedIssueCount: number;
    visibility: "public-only";
  };
  projectRoadmap: {
    lanes: ProjectLane[];
  };
  developmentRoadmap: {
    stages: DevelopmentStage[];
  };
  revision?: string;
  generatedAt?: string;
};

export type HttpResponse = {
  ok: boolean;
  status: number;
  headers: {
    get(name: string): string | null;
  };
  json(): Promise<unknown>;
};

export type FetchImplementation = (url: string, init: RequestInit) => Promise<HttpResponse>;

export type FetchOptions = {
  fetchImplementation?: FetchImplementation;
  waitFor?: (milliseconds: number) => Promise<void>;
  requestTimeoutMs?: number;
  maxRequestAttempts?: number;
};

export type UpdateRoadmapsOptions = {
  root: string;
  username: string;
  token?: string;
  apiBaseUrl?: string;
  fetchOptions?: FetchOptions;
  now?: () => Date;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function cleanText(value: unknown, fallback: string, limit: number): string {
  const normalized = String(value ?? fallback).replace(/\s+/g, " ").trim() || fallback;
  const characters = Array.from(normalized);
  return characters.length > limit ? characters.slice(0, limit - 1).join("") + "…" : characters.join("");
}

export function escapeXml(value: unknown): string {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character] ?? character);
}

function countLabel(value: number): string {
  return String(value).padStart(2, "0");
}

function revisionFor(snapshot: RoadmapSnapshot): string {
  return createHash("sha256").update(JSON.stringify(semanticSnapshot(snapshot))).digest("hex").slice(0, 12);
}

function normalizedLabelNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((label) => {
    if (typeof label === "string") return [label.trim().toLocaleLowerCase("en-US")];
    if (!isRecord(label)) return [];
    const name = stringValue(label.name);
    return name ? [name.trim().toLocaleLowerCase("en-US")] : [];
  }).filter(Boolean);
}

function issueSort(left: RoadmapItem, right: RoadmapItem): number {
  return right.updatedAt.localeCompare(left.updatedAt)
    || left.repository.localeCompare(right.repository, "en")
    || left.number - right.number;
}

export function selectPublicRepositories(records: unknown[], username: string): PublicRepository[] {
  const account = username.toLocaleLowerCase("en-US");
  const names = new Set<string>();

  for (const record of records) {
    if (!isRecord(record)) continue;
    const owner = isRecord(record.owner) ? stringValue(record.owner.login) : null;
    const name = stringValue(record.name);
    if (!owner || !name) continue;
    if (owner.toLocaleLowerCase("en-US") !== account) continue;
    if (record.private === true || record.fork === true || record.archived === true || record.disabled === true) continue;
    names.add(cleanText(name, "PUBLIC REPOSITORY", 80));
  }

  return [...names].sort((left, right) => left.localeCompare(right, "en")).map((name) => ({ name }));
}

export function normalizePublicIssues(records: unknown[], repository: string): PublicIssue[] {
  const issues: PublicIssue[] = [];
  for (const record of records) {
    if (!isRecord(record) || "pull_request" in record) continue;
    const number = record.number;
    const title = stringValue(record.title);
    const updatedAt = stringValue(record.updated_at);
    if (typeof number !== "number" || !Number.isSafeInteger(number) || !title || !updatedAt || Number.isNaN(Date.parse(updatedAt))) continue;
    issues.push({
      repository: cleanText(repository, "PUBLIC REPOSITORY", 38),
      number,
      title: cleanText(title, "UNTITLED PUBLIC ISSUE", 34),
      updatedAt,
      labels: normalizedLabelNames(record.labels),
    });
  }
  return issues.sort(issueSort);
}

function responseHeader(response: HttpResponse, name: string): string | null {
  return response.headers.get(name);
}

function retryDelay(response: HttpResponse | null, attempt: number): number {
  const retryAfter = response ? responseHeader(response, "retry-after") : null;
  const seconds = retryAfter === null ? Number.NaN : Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(Math.round(seconds * 1_000), maxRetryDelayMs);
  if (retryAfter) {
    const retryAt = Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) return Math.min(Math.max(0, retryAt - Date.now()), maxRetryDelayMs);
  }

  const rateLimitReset = response ? responseHeader(response, "x-ratelimit-reset") : null;
  const resetAt = rateLimitReset === null ? Number.NaN : Number(rateLimitReset);
  if (Number.isFinite(resetAt) && resetAt > 0) return Math.min(Math.max(0, resetAt * 1_000 - Date.now()), maxRetryDelayMs);
  return Math.min(500 * (2 ** attempt), maxRetryDelayMs);
}

function isRetryableResponse(response: HttpResponse): boolean {
  return response.status === 408
    || response.status === 429
    || response.status === 502
    || response.status === 503
    || response.status === 504
    || (response.status === 403 && responseHeader(response, "x-ratelimit-remaining") === "0");
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchWithRetry(url: string, headers: Record<string, string>, options: FetchOptions): Promise<HttpResponse> {
  const nativeFetch: FetchImplementation = async (requestUrl, init) => fetch(requestUrl, init);
  const fetchImplementation = options.fetchImplementation ?? nativeFetch;
  const waitFor = options.waitFor ?? wait;
  const timeoutMs = options.requestTimeoutMs ?? requestTimeoutMs;
  const attempts = Math.max(1, options.maxRequestAttempts ?? maxRequestAttempts);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: HttpResponse | null = null;
    try {
      response = await fetchImplementation(url, { headers, signal: controller.signal });
    } catch {
      lastError = new Error(controller.signal.aborted ? "GitHub API request timed out." : "GitHub API request failed.");
    } finally {
      clearTimeout(timeout);
    }

    if (response?.ok) return response;
    if (response) lastError = new Error("GitHub API request failed (HTTP " + response.status + ").");
    if (attempt === attempts - 1 || (response && !isRetryableResponse(response))) throw lastError ?? new Error("GitHub API request failed.");
    await waitFor(retryDelay(response, attempt));
  }

  throw lastError ?? new Error("GitHub API request failed.");
}

export async function fetchPaginated(url: string, token: string, options: FetchOptions = {}): Promise<unknown[]> {
  const values: unknown[] = [];
  for (let page = 1; ; page += 1) {
    const separator = url.includes("?") ? "&" : "?";
    const response = await fetchWithRetry(url + separator + "per_page=100&page=" + page, {
      Accept: "application/vnd.github+json",
      "User-Agent": "KS-GG-AI-public-roadmaps",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    }, options);
    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error("GitHub API returned an unexpected paginated payload.");
    values.push(...batch);
    if (batch.length < 100) return values;
  }
}

export async function fetchPublicRoadmapSource(
  username: string,
  token: string,
  apiBaseUrl = "https://api.github.com",
  fetchOptions: FetchOptions = {},
): Promise<{ repositories: PublicRepository[]; issues: PublicIssue[] }> {
  const apiBase = apiBaseUrl.replace(/\/$/, "");
  const records = await fetchPaginated(
    apiBase + "/users/" + encodeURIComponent(username) + "/repos?type=owner&sort=updated",
    token,
    fetchOptions,
  );
  const repositories = selectPublicRepositories(records, username);
  const issueGroups = await Promise.all(repositories.map(async ({ name }) => {
    const issues = await fetchPaginated(
      apiBase + "/repos/" + encodeURIComponent(username) + "/" + encodeURIComponent(name) + "/issues?state=open",
      token,
      fetchOptions,
    );
    return normalizePublicIssues(issues, name);
  }));
  return { repositories, issues: issueGroups.flat().sort(issueSort) };
}

function categorizedItems<T extends { sourceLabel: string; id: string }>(definitions: readonly T[], issues: PublicIssue[]): Map<string, RoadmapItem[]> {
  const grouped = new Map<string, RoadmapItem[]>(definitions.map((definition) => [definition.id, []]));
  for (const issue of issues) {
    const target = definitions.find((definition) => issue.labels.includes(definition.sourceLabel));
    if (target) grouped.get(target.id)?.push({
      repository: issue.repository,
      number: issue.number,
      title: issue.title,
      updatedAt: issue.updatedAt,
    });
  }
  for (const items of grouped.values()) items.sort(issueSort);
  return grouped;
}

export function createRoadmapState({
  username,
  repositories,
  issues,
}: {
  username: string;
  repositories: PublicRepository[];
  issues: PublicIssue[];
}): RoadmapSnapshot {
  const projectItems = categorizedItems(projectLaneDefinitions, issues);
  const developmentItems = categorizedItems(developmentStageDefinitions, issues);
  const trackedIssueCount = issues.filter((issue) => (
    projectLaneDefinitions.some((definition) => issue.labels.includes(definition.sourceLabel))
    || developmentStageDefinitions.some((definition) => issue.labels.includes(definition.sourceLabel))
  )).length;

  return {
    schemaVersion: 1,
    renderVersion,
    visualLocaleVersion,
    username: cleanText(username, "KS-GG-AI", 40),
    source: {
      repositoryCount: repositories.length,
      openIssueCount: issues.length,
      trackedIssueCount,
      visibility: "public-only",
    },
    projectRoadmap: {
      lanes: projectLaneDefinitions.map((definition) => {
        const items = projectItems.get(definition.id) ?? [];
        return {
          id: definition.id,
          label: definition.label,
          sourceLabel: definition.sourceLabel,
          count: items.length,
          items: items.slice(0, maxProjectItemsPerLane),
        };
      }),
    },
    developmentRoadmap: {
      stages: developmentStageDefinitions.map((definition) => {
        const items = developmentItems.get(definition.id) ?? [];
        return {
          id: definition.id,
          label: definition.label,
          sourceLabel: definition.sourceLabel,
          count: items.length,
          items: items.slice(0, maxDevelopmentItemsPerStage),
        };
      }),
    },
  };
}

function isRoadmapItem(value: unknown): value is RoadmapItem {
  return isRecord(value)
    && typeof value.repository === "string"
    && Number.isSafeInteger(value.number)
    && typeof value.title === "string"
    && typeof value.updatedAt === "string"
    && !Number.isNaN(Date.parse(value.updatedAt));
}

function isLane(value: unknown, validIds: readonly string[]): boolean {
  return isRecord(value)
    && typeof value.id === "string"
    && validIds.includes(value.id)
    && typeof value.label === "string"
    && typeof value.sourceLabel === "string"
    && typeof value.count === "number"
    && Number.isInteger(value.count)
    && value.count >= 0
    && Array.isArray(value.items)
    && value.items.length <= maxProjectItemsPerLane
    && value.items.length <= value.count
    && value.items.every(isRoadmapItem);
}

function isStage(value: unknown, validIds: readonly string[]): boolean {
  return isRecord(value)
    && typeof value.id === "string"
    && validIds.includes(value.id)
    && typeof value.label === "string"
    && typeof value.sourceLabel === "string"
    && typeof value.count === "number"
    && Number.isInteger(value.count)
    && value.count >= 0
    && Array.isArray(value.items)
    && value.items.length <= maxDevelopmentItemsPerStage
    && value.items.length <= value.count
    && value.items.every(isRoadmapItem);
}

export function isValidRoadmapSnapshot(value: unknown): value is RoadmapSnapshot {
  if (!isRecord(value) || value.schemaVersion !== 1 || value.renderVersion !== renderVersion || value.visualLocaleVersion !== visualLocaleVersion) return false;
  if (typeof value.username !== "string" || value.username.length === 0) return false;
  if (!isRecord(value.source)) return false;
  const repositoryCount = value.source.repositoryCount;
  const openIssueCount = value.source.openIssueCount;
  const trackedIssueCount = value.source.trackedIssueCount;
  if (!isNonNegativeInteger(repositoryCount)
    || !isNonNegativeInteger(openIssueCount)
    || !isNonNegativeInteger(trackedIssueCount)
    || trackedIssueCount > openIssueCount
    || value.source.visibility !== "public-only") return false;
  if (!isRecord(value.projectRoadmap) || !Array.isArray(value.projectRoadmap.lanes)
    || value.projectRoadmap.lanes.length !== projectLaneDefinitions.length
    || !value.projectRoadmap.lanes.every((lane) => isLane(lane, projectLaneDefinitions.map(({ id }) => id)))) return false;
  if (!isRecord(value.developmentRoadmap) || !Array.isArray(value.developmentRoadmap.stages)
    || value.developmentRoadmap.stages.length !== developmentStageDefinitions.length
    || !value.developmentRoadmap.stages.every((stage) => isStage(stage, developmentStageDefinitions.map(({ id }) => id)))) return false;
  return typeof value.revision === "string"
    && /^[a-f0-9]{12}$/.test(value.revision)
    && typeof value.generatedAt === "string"
    && !Number.isNaN(Date.parse(value.generatedAt));
}

function semanticSnapshot(snapshot: RoadmapSnapshot): Omit<RoadmapSnapshot, "revision" | "generatedAt"> {
  const { revision: _revision, generatedAt: _generatedAt, ...semantic } = snapshot;
  return semantic;
}

function localizedText(
  locale: VisualLocale,
  value: string,
  x: number,
  y: number,
  options: { fill?: string; size?: number; weight?: number; anchor?: "start" | "end"; letterSpacing?: string } = {},
): string {
  const anchor = options.anchor ?? "start";
  return '<text x="' + x + '" y="' + y + '" fill="' + (options.fill ?? "#F5F3FF") + '" font-family="' + escapeXml(locale.fontFamily) + '" font-size="' + (options.size ?? 14) + '" font-weight="' + (options.weight ?? 400) + '" text-anchor="' + anchor + '" direction="' + locale.direction + '" unicode-bidi="plaintext"' + (options.letterSpacing === undefined ? "" : ' letter-spacing="' + options.letterSpacing + '"') + ">" + escapeXml(value) + "</text>";
}

function svgStart(locale: VisualLocale, title: string, description: string, height: number): string[] {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + svgWidth + '" height="' + height + '" viewBox="0 0 ' + svgWidth + ' ' + height + '" fill="none" role="img" aria-labelledby="title desc" direction="' + locale.direction + '">',
    '<title id="title">' + escapeXml(title) + '</title>',
    '<desc id="desc">' + escapeXml(description) + '</desc>',
    '<defs><linearGradient id="surface" x1="0" y1="0" x2="480" y2="390" gradientUnits="userSpaceOnUse"><stop stop-color="#17112B"/><stop offset=".54" stop-color="#101926"/><stop offset="1" stop-color="#0D1E1D"/></linearGradient><filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="28"/></filter></defs>',
    '<rect x=".5" y=".5" width="479" height="' + (height - 1) + '" rx="22" fill="url(#surface)" stroke="#30354A"/>',
    '<circle cx="424" cy="62" r="62" fill="#7C3AED" fill-opacity=".14" filter="url(#glow)"/><circle cx="54" cy="' + (height - 42) + '" r="66" fill="#06B6D4" fill-opacity=".09" filter="url(#glow)"/>',
  ];
}

function svgFooter(snapshot: RoadmapSnapshot, y: number, locale: VisualLocale): string[] {
  const copy = locale.roadmaps;
  const rtl = locale.direction === "rtl";
  return [
    '<path d="M24 ' + (y - 18) + 'H456" stroke="#30354A"/>',
    localizedText(locale, copy.publicOnly, rtl ? 456 : 24, y, { fill: "#A7F3D0", size: 10, weight: 700 }),
    localizedText(locale, copy.stateAsOf + " " + String(snapshot.generatedAt).slice(0, 10), rtl ? 24 : 456, y, { fill: "#98A2B8", size: 10, anchor: "end" }),
    '</svg>',
  ];
}

function issueLine(item: RoadmapItem): string {
  return "#" + item.number + " · " + cleanText(item.title, "UNTITLED PUBLIC ISSUE", 20);
}

function itemHeadline(count: number, hiddenItemCount: number, copy: RoadmapLocaleCopy): string {
  if (count === 0) return copy.noPublicItems;
  return countLabel(count) + " " + copy.publicItem + (hiddenItemCount > 0 ? " · +" + hiddenItemCount + " " + copy.more : "");
}

function emptyIssueText(sourceLabel: string, copy: RoadmapLocaleCopy): string {
  return cleanText(copy.noIssue + " " + sourceLabel, copy.noIssue, 42);
}

export function renderProjectRoadmap(snapshot: RoadmapSnapshot, localeCode = "en"): string {
  const locale = getVisualLocale(localeCode);
  const copy = locale.roadmaps;
  const rtl = locale.direction === "rtl";
  const railX = rtl ? 428 : 52;
  const cardX = rtl ? 24 : 76;
  const cardTextX = rtl ? 386 : 94;
  const cardAnchor = "start";
  const badgeX = rtl ? 24 : 334;
  const badgeTextX = rtl ? 444 : 365;
  const badgeAnchor = "start";
  const height = 400;
  const markup = svgStart(
    locale,
    copy.projectTitle,
    copy.projectDescription,
    height,
  );
  markup.push(
    localizedText(locale, copy.projectTitle, rtl ? 456 : 24, 31, { size: 18, weight: 700 }),
    localizedText(locale, copy.projectSubtitle, rtl ? 456 : 24, 49, { fill: "#AAB2C4", size: 10, letterSpacing: ".25" }),
    '<rect x="' + badgeX + '" y="18" width="122" height="28" rx="14" fill="#0B1020" stroke="#67E8F9" stroke-opacity=".4"/><circle cx="' + (rtl ? 126 : 353) + '" cy="32" r="4" fill="#A7F3D0"/>' + localizedText(locale, copy.autoRefresh, badgeTextX, 36, { fill: "#EDE9FE", size: 9, weight: 700, anchor: badgeAnchor }),
    '<path d="M' + railX + ' 96V330" stroke="#4C4668" stroke-width="2" stroke-linecap="round"/>',
  );

  snapshot.projectRoadmap.lanes.forEach((lane, index) => {
    const definition = projectLaneDefinitions.find(({ id }) => id === lane.id);
    const accent = definition?.accent ?? "#67E8F9";
    const y = 112 + index * 78;
    const hiddenItemCount = lane.count - lane.items.length;
    const headline = itemHeadline(lane.count, hiddenItemCount, copy);
    const laneName = copy.lanes[lane.id];
    markup.push(
      '<circle cx="' + railX + '" cy="' + y + '" r="9" fill="#111827" stroke="' + accent + '" stroke-width="2"/><circle cx="' + railX + '" cy="' + y + '" r="3" fill="' + accent + '"/>',
      '<rect x="' + cardX + '" y="' + (y - 34) + '" width="380" height="72" rx="15" fill="#111827" stroke="' + accent + '" stroke-opacity=".45"/>',
      localizedText(locale, laneName, cardTextX, y - 12, { fill: accent, size: 14, weight: 700, anchor: cardAnchor }),
      localizedText(locale, headline, cardTextX, y + 2, { fill: "#AAB2C4", size: 9, anchor: cardAnchor, letterSpacing: ".2" }),
    );
    if (lane.items.length === 0) {
      markup.push(localizedText(locale, emptyIssueText(lane.sourceLabel, copy), cardTextX, y + 22, { fill: "#D4D4E8", size: 12, anchor: cardAnchor }));
    } else {
      lane.items.forEach((item, itemIndex) => {
        markup.push(localizedText(locale, issueLine(item), cardTextX, y + 20 + itemIndex * 17, { size: 12, anchor: cardAnchor }));
      });
    }
  });

  markup.push(...svgFooter(snapshot, 378, locale));
  return markup.join("\n");
}

export function renderDevelopmentRoadmap(snapshot: RoadmapSnapshot, localeCode = "en"): string {
  const locale = getVisualLocale(localeCode);
  const copy = locale.roadmaps;
  const rtl = locale.direction === "rtl";
  const railX = rtl ? 428 : 52;
  const cardX = rtl ? 24 : 76;
  const cardTextX = rtl ? 386 : 94;
  const cardAnchor = "start";
  const badgeX = rtl ? 24 : 346;
  const badgeTextX = rtl ? 444 : 377;
  const badgeAnchor = "start";
  const height = 420;
  const markup = svgStart(
    locale,
    copy.developmentTitle,
    copy.developmentDescription,
    height,
  );
  markup.push(
    localizedText(locale, copy.developmentTitle, rtl ? 456 : 24, 31, { size: 18, weight: 700 }),
    localizedText(locale, copy.developmentSubtitle, rtl ? 456 : 24, 49, { fill: "#AAB2C4", size: 10, letterSpacing: ".25" }),
    '<rect x="' + badgeX + '" y="18" width="110" height="28" rx="14" fill="#0B1020" stroke="#C4B5FD" stroke-opacity=".42"/><circle cx="' + (rtl ? 126 : 365) + '" cy="32" r="4" fill="#67E8F9"/>' + localizedText(locale, copy.flowView, badgeTextX, 36, { fill: "#EDE9FE", size: 9, weight: 700, anchor: badgeAnchor }),
    '<path d="M' + railX + ' 96V342" stroke="#4C4668" stroke-width="2" stroke-linecap="round"/>',
  );

  snapshot.developmentRoadmap.stages.forEach((stage, index) => {
    const definition = developmentStageDefinitions.find(({ id }) => id === stage.id);
    const accent = definition?.accent ?? "#67E8F9";
    const y = 106 + index * 62;
    const hiddenItemCount = stage.count - stage.items.length;
    const headline = itemHeadline(stage.count, hiddenItemCount, copy);
    const item = stage.items[0];
    const stageName = copy.stages[stage.id];
    markup.push(
      '<circle cx="' + railX + '" cy="' + y + '" r="9" fill="#111827" stroke="' + accent + '" stroke-width="2"/><circle cx="' + railX + '" cy="' + y + '" r="3" fill="' + accent + '"/>',
      '<rect x="' + cardX + '" y="' + (y - 27) + '" width="380" height="58" rx="14" fill="#111827" stroke="' + accent + '" stroke-opacity=".42"/>',
      localizedText(locale, stageName, cardTextX, y - 8, { fill: accent, size: 14, weight: 700, anchor: cardAnchor }),
      localizedText(locale, headline, cardTextX, y + 5, { fill: "#AAB2C4", size: 9, anchor: cardAnchor, letterSpacing: ".2" }),
      localizedText(locale, item ? issueLine(item) : emptyIssueText(stage.sourceLabel, copy), cardTextX, y + 22, { size: 12, anchor: cardAnchor }),
    );
  });

  markup.push(...svgFooter(snapshot, 398, locale));
  return markup.join("\n");
}

async function readJsonIfPresent(file: string): Promise<unknown | null> {
  let text: string;
  try {
    text = await readFile(file, "utf8");
  } catch (error) {
    if (isRecord(error) && error.code === "ENOENT") return null;
    throw error;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function writeIfChanged(file: string, value: string): Promise<void> {
  let existing: string | null = null;
  try {
    existing = await readFile(file, "utf8");
  } catch (error) {
    if (!isRecord(error) || error.code !== "ENOENT") throw error;
  }
  if (existing !== value) await writeFile(file, value, "utf8");
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function updateReadmeReferences(
  text: string,
  entry: (typeof readmeEntries)[number],
  revision: string,
): string {
  const assets = [
    entry.projectRoadmapReference,
    entry.developmentRoadmapReference,
  ];
  return assets.reduce((updated, assetReference) => {
    const expression = new RegExp("(" + escapeRegularExpression(assetReference) + ")\\?v=[A-Za-z0-9-]+", "g");
    const matches = [...updated.matchAll(expression)];
    if (matches.length !== 1) throw new Error("Each localized README must contain one roadmap SVG reference.");
    return updated.replace(expression, "$1?v=" + revision);
  }, text);
}

export async function updateRoadmaps({
  root,
  username,
  token = "",
  apiBaseUrl,
  fetchOptions,
  now = () => new Date(),
}: UpdateRoadmapsOptions): Promise<{
  changed: boolean;
  publicRepositoryCount: number;
  publicIssueCount: number;
  trackedIssueCount: number;
  revision: string;
}> {
  const source = await fetchPublicRoadmapSource(username, token.trim(), apiBaseUrl, fetchOptions);
  const semanticState = createRoadmapState({ username, ...source });
  const dataPath = path.join(root, "profile", "data", "roadmap-state.json");
  const existing = await readJsonIfPresent(dataPath);
  const existingSemantic = isValidRoadmapSnapshot(existing) ? semanticSnapshot(existing) : null;
  const changed = JSON.stringify(existingSemantic) !== JSON.stringify(semanticState);
  const snapshot: RoadmapSnapshot = changed
    ? { ...semanticState, revision: revisionFor(semanticState), generatedAt: now().toISOString() }
    : existing as RoadmapSnapshot;
  const projectSvg = renderProjectRoadmap(snapshot, "en");
  const developmentSvg = renderDevelopmentRoadmap(snapshot, "en");
  const readmeUpdates = await Promise.all(readmeEntries.map(async (entry) => {
    const file = path.join(root, entry.file);
    try {
      return { file, text: updateReadmeReferences(await readFile(file, "utf8"), entry, snapshot.revision ?? "") };
    } catch (error) {
      const message = error instanceof Error ? error.message : "README validation failed.";
      throw new Error(entry.file + ": " + message);
    }
  }));

  const assetsDirectory = path.join(root, "profile", "assets", "maps");
  await mkdir(path.dirname(dataPath), { recursive: true });
  await mkdir(assetsDirectory, { recursive: true });
  await writeIfChanged(dataPath, JSON.stringify(snapshot, null, 2) + "\n");
  await Promise.all([
    writeIfChanged(path.join(assetsDirectory, "project-roadmap.svg"), projectSvg),
    writeIfChanged(path.join(assetsDirectory, "development-roadmap.svg"), developmentSvg),
    ...visualLocales.map(async ({ code }) => {
      const localeDirectory = path.join(root, "profile", "assets", "locales", code, "maps");
      await mkdir(localeDirectory, { recursive: true });
      await Promise.all([
        writeIfChanged(path.join(localeDirectory, "project-roadmap.svg"), renderProjectRoadmap(snapshot, code)),
        writeIfChanged(path.join(localeDirectory, "development-roadmap.svg"), renderDevelopmentRoadmap(snapshot, code)),
      ]);
    }),
  ]);
  for (const update of readmeUpdates) await writeIfChanged(update.file, update.text);

  return {
    changed,
    publicRepositoryCount: snapshot.source.repositoryCount,
    publicIssueCount: snapshot.source.openIssueCount,
    trackedIssueCount: snapshot.source.trackedIssueCount,
    revision: snapshot.revision ?? "",
  };
}

async function main(): Promise<void> {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
  const result = await updateRoadmaps({
    root,
    username: process.env.PROFILE_USERNAME ?? "KS-GG-AI",
    token: process.env.GITHUB_TOKEN ?? "",
  });
  console.log(JSON.stringify(result));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
