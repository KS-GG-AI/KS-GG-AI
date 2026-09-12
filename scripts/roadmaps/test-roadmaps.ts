import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  cleanText,
  createRoadmapState,
  fetchPublicRoadmapSource,
  fetchPaginated,
  isValidRoadmapSnapshot,
  normalizePublicIssues,
  readmeNames,
  renderDevelopmentRoadmap,
  renderProjectRoadmap,
  selectPublicRepositories,
  updateRoadmaps,
  type HttpResponse,
} from "./update-roadmaps.js";

function response(status: number, payload: unknown, headers: Record<string, string> = {}): HttpResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name: string): string | null {
        return headers[name.toLocaleLowerCase("en-US")] ?? null;
      },
    },
    async json(): Promise<unknown> {
      return payload;
    },
  };
}

const publicRepositories = selectPublicRepositories([
  { name: "KS-GG-AI", owner: { login: "KS-GG-AI" }, private: false, fork: false, archived: false, disabled: false },
  { name: "archived", owner: { login: "KS-GG-AI" }, private: false, fork: false, archived: true, disabled: false },
  { name: "fork", owner: { login: "KS-GG-AI" }, private: false, fork: true, archived: false, disabled: false },
  { name: "private", owner: { login: "KS-GG-AI" }, private: true, fork: false, archived: false, disabled: false },
  { name: "other-account", owner: { login: "other" }, private: false, fork: false, archived: false, disabled: false },
], "KS-GG-AI");
assert.deepEqual(publicRepositories, [{ name: "KS-GG-AI" }]);

const privateTitle = "confidential internal roadmap item";
const issues = normalizePublicIssues([
  { number: 10, title: "Build <public> route", updated_at: "2026-09-12T00:00:00Z", labels: [{ name: "roadmap:now" }, { name: "stage:build" }] },
  { number: 11, title: "Verify public flow", updated_at: "2026-09-11T00:00:00Z", labels: [{ name: "roadmap:next" }, { name: "stage:verify" }] },
  { number: 12, title: "Later cleanup", updated_at: "2026-09-10T00:00:00Z", labels: [{ name: "roadmap:later" }, { name: "stage:ship" }] },
  { number: 13, title: "Planning item", updated_at: "2026-09-09T00:00:00Z", labels: [{ name: "stage:plan" }] },
  { number: 14, title: "Pull request", updated_at: "2026-09-08T00:00:00Z", labels: [], pull_request: {} },
  { number: 15, title: privateTitle, updated_at: "2026-09-07T00:00:00Z", labels: [] },
], "KS-GG-AI");
assert.equal(issues.length, 5);
assert.equal(issues.some((issue) => issue.number === 14), false);

const state = createRoadmapState({ username: "KS-GG-AI", repositories: publicRepositories, issues });
const snapshot = { ...state, revision: "a1b2c3d4e5f6", generatedAt: "2026-09-12T00:00:00.000Z" };
const projectSvg = renderProjectRoadmap(snapshot);
const developmentSvg = renderDevelopmentRoadmap(snapshot);
const emptySnapshot = {
  ...createRoadmapState({ username: "KS-GG-AI", repositories: publicRepositories, issues: [] }),
  revision: "a1b2c3d4e5f6",
  generatedAt: "2026-09-12T00:00:00.000Z",
};
assert.equal(state.source.repositoryCount, 1);
assert.equal(state.source.openIssueCount, 5);
assert.equal(state.source.trackedIssueCount, 4);
assert.equal(state.projectRoadmap.lanes.find((lane) => lane.id === "now")?.items[0]?.number, 10);
assert.equal(state.developmentRoadmap.stages.find((stage) => stage.id === "plan")?.items[0]?.number, 13);
assert.match(projectSvg, /Build &lt;public&gt; route/);
assert.match(renderProjectRoadmap(emptySnapshot), /No public issue with roadmap:next/);
assert.match(renderDevelopmentRoadmap(emptySnapshot), /No public issue with stage:build/);
assert.doesNotMatch(projectSvg, new RegExp(privateTitle, "i"));
assert.doesNotMatch(developmentSvg, /<script|onload=|https:\/\//i);
assert.equal(isValidRoadmapSnapshot(snapshot), true);
assert.equal(isValidRoadmapSnapshot({ ...snapshot, revision: "broken" }), false);
assert.equal(isValidRoadmapSnapshot({
  ...snapshot,
  source: { ...snapshot.source, trackedIssueCount: snapshot.source.openIssueCount + 1 },
}), false);

const longCjkTitle = "공개로드맵을위한아주긴다국어이슈제목이카드경계를넘지않아야합니다";
const cjkSnapshot = {
  ...createRoadmapState({
    username: "KS-GG-AI",
    repositories: publicRepositories,
    issues: normalizePublicIssues([
      { number: 88, title: longCjkTitle, updated_at: "2026-09-12T00:00:00Z", labels: [{ name: "roadmap:now" }, { name: "stage:build" }] },
    ], "KS-GG-AI"),
  }),
  revision: "a1b2c3d4e5f6",
  generatedAt: "2026-09-12T00:00:00.000Z",
};
const cjkSvg = renderProjectRoadmap(cjkSnapshot);
assert.match(cjkSvg, new RegExp(cleanText(longCjkTitle, "UNTITLED PUBLIC ISSUE", 20)));
assert.doesNotMatch(cjkSvg, new RegExp(longCjkTitle));

const overflowIssues = normalizePublicIssues([
  { number: 21, title: "First", updated_at: "2026-09-12T00:00:00Z", labels: [{ name: "roadmap:now" }, { name: "stage:build" }] },
  { number: 22, title: "Second", updated_at: "2026-09-11T00:00:00Z", labels: [{ name: "roadmap:now" }, { name: "stage:build" }] },
  { number: 23, title: "Third", updated_at: "2026-09-10T00:00:00Z", labels: [{ name: "roadmap:now" }, { name: "stage:build" }] },
], "KS-GG-AI");
const overflowSnapshot = {
  ...createRoadmapState({ username: "KS-GG-AI", repositories: publicRepositories, issues: overflowIssues }),
  revision: "a1b2c3d4e5f6",
  generatedAt: "2026-09-12T00:00:00.000Z",
};
assert.match(renderProjectRoadmap(overflowSnapshot), /03 PUBLIC ITEMS · \+1 MORE/);
assert.match(renderDevelopmentRoadmap(overflowSnapshot), /03 PUBLIC ITEMS · \+2 MORE/);

const retryResponses = [
  response(429, [], { "retry-after": "0" }),
  response(200, [{ page: 1 }]),
];
const waits: number[] = [];
const paginated = await fetchPaginated("https://api.example.test/resources", "", {
  fetchImplementation: async () => retryResponses.shift() ?? response(500, []),
  waitFor: async (milliseconds) => { waits.push(milliseconds); },
});
assert.deepEqual(paginated, [{ page: 1 }]);
assert.deepEqual(waits, [0]);
await assert.rejects(
  fetchPaginated("https://api.example.test/resources", "", {
    fetchImplementation: async () => response(401, { message: "Bad credentials" }),
  }),
  /HTTP 401/,
);

const publicSourceUrls: string[] = [];
const publicSource = await fetchPublicRoadmapSource("KS-GG-AI", "", "https://api.example.test", {
  fetchImplementation: async (url) => {
    publicSourceUrls.push(url);
    if (url.includes("/users/KS-GG-AI/repos?")) {
      return response(200, [
        { name: "KS-GG-AI", owner: { login: "KS-GG-AI" }, private: false, fork: false, archived: false, disabled: false },
        { name: "private-repository", owner: { login: "KS-GG-AI" }, private: true, fork: false, archived: false, disabled: false },
        { name: "forked-repository", owner: { login: "KS-GG-AI" }, private: false, fork: true, archived: false, disabled: false },
        { name: "archived-repository", owner: { login: "KS-GG-AI" }, private: false, fork: false, archived: true, disabled: false },
      ]);
    }
    if (url.includes("/repos/KS-GG-AI/KS-GG-AI/issues?")) return response(200, []);
    throw new Error("Unexpected source request: " + url);
  },
});
assert.deepEqual(publicSource.repositories, [{ name: "KS-GG-AI" }]);
assert.deepEqual(publicSource.issues, []);
assert.equal(publicSourceUrls.some((url) => url.includes("private-repository/issues")), false);
assert.equal(publicSourceUrls.some((url) => url.includes("forked-repository/issues")), false);
assert.equal(publicSourceUrls.some((url) => url.includes("archived-repository/issues")), false);

const tempRoot = await mkdtemp(path.join(os.tmpdir(), "ks-gg-ai-roadmaps-"));
try {
  await mkdir(path.join(tempRoot, "data"), { recursive: true });
  await writeFile(path.join(tempRoot, "data", "roadmap-state.json"), "sentinel-data\n", "utf8");
  const validReadme = '<img src="./assets/project-roadmap.svg?v=old" />\n<img src="./assets/development-roadmap.svg?v=old" />\n';
  await Promise.all(readmeNames.map(async (name) => writeFile(
    path.join(tempRoot, name),
    name === "README.ko.md" ? "broken README" : validReadme,
    "utf8",
  )));
  await assert.rejects(updateRoadmaps({
    root: tempRoot,
    username: "KS-GG-AI",
    apiBaseUrl: "https://api.example.test",
    fetchOptions: {
      fetchImplementation: async (url) => (
        url.includes("/repos?")
          ? response(200, [{ name: "KS-GG-AI", owner: { login: "KS-GG-AI" }, private: false, fork: false, archived: false, disabled: false }])
          : response(200, [])
      ),
    },
  }), /README\.ko\.md/);
  assert.equal(await readFile(path.join(tempRoot, "data", "roadmap-state.json"), "utf8"), "sentinel-data\n");
  await assert.rejects(readFile(path.join(tempRoot, "assets", "project-roadmap.svg"), "utf8"), { code: "ENOENT" });
} finally {
  await rm(tempRoot, { recursive: true, force: true });
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const localSnapshot = JSON.parse(await readFile(path.join(root, "data", "roadmap-state.json"), "utf8")) as unknown;
assert.ok(isValidRoadmapSnapshot(localSnapshot));
assert.equal(await readFile(path.join(root, "assets", "project-roadmap.svg"), "utf8"), renderProjectRoadmap(localSnapshot));
assert.equal(await readFile(path.join(root, "assets", "development-roadmap.svg"), "utf8"), renderDevelopmentRoadmap(localSnapshot));

for (const name of readmeNames) {
  const text = await readFile(path.join(root, name), "utf8");
  assert.equal((text.match(/<details>/g) ?? []).length, 5, name + " must have five disclosure panels.");
  assert.equal((text.match(/\.\/assets\/project-roadmap\.svg\?v=[A-Za-z0-9-]+/g) ?? []).length, 1, name + " must reference one project roadmap.");
  assert.equal((text.match(/\.\/assets\/development-roadmap\.svg\?v=[A-Za-z0-9-]+/g) ?? []).length, 1, name + " must reference one development roadmap.");
}

const roadmapWorkflow = await readFile(path.join(root, ".github", "workflows", "refresh-roadmaps.yml"), "utf8");
const projectMapWorkflow = await readFile(path.join(root, ".github", "workflows", "refresh-project-map.yml"), "utf8");
assert.match(roadmapWorkflow, /contents: write\s+issues: read/);
assert.match(roadmapWorkflow, /group: profile-readme-assets/);
assert.match(roadmapWorkflow, /npm ci --ignore-scripts/);
assert.match(roadmapWorkflow, /git add -- assets\/project-roadmap\.svg assets\/development-roadmap\.svg data\/roadmap-state\.json/);
assert.match(roadmapWorkflow, /actions\/checkout@[a-f0-9]{40}/);
assert.match(roadmapWorkflow, /actions\/setup-node@[a-f0-9]{40}/);
assert.match(projectMapWorkflow, /group: profile-readme-assets/);

console.log("Roadmap generator checks passed.");
