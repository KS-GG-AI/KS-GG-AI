import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createProjectState,
  fetchRepositoryPages,
  isValidProjectSnapshot,
  privateProjectLabel,
  readmeEntries,
  readmeNames,
  renderProjectMap,
  selectProjectRepositories,
} from "./update.mjs";

function response(status, payload, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get(name) {
        return headers[name.toLowerCase()] ?? null;
      },
    },
    json: async () => payload,
  };
}

const privateRepositoryName = "confidential-product-internal";
const state = createProjectState({
  username: "KS-GG-AI",
  publicProjects: [
    { name: "KS-GG-AI", language: "TypeScript" },
    { name: "tools & <systems>", language: "Node.js" },
  ],
  privateSyncEnabled: true,
  privateRepositoryCount: 4,
});
const snapshot = { ...state, revision: "test-revision", generatedAt: "2026-09-10T00:00:00.000Z" };
const serialized = JSON.stringify(snapshot);
const svg = renderProjectMap(snapshot);

assert.equal(privateProjectLabel(1), "PRIVATE · ███ · 01");
assert.equal(privateProjectLabel(12), "PRIVATE · ███ · 12");
assert.equal(state.private.count, 4);
assert.equal(state.private.labels.length, 3);
assert.equal(state.renderVersion, 4);
assert.doesNotMatch(serialized, new RegExp(privateRepositoryName, "i"));
assert.doesNotMatch(svg, new RegExp(privateRepositoryName, "i"));
assert.match(svg, /tools &amp; &lt;systems&gt;/);
assert.match(svg, /PRIVATE · ███ · 01/);
assert.match(svg, /PRIVATE · ███ · \+ 2/);
assert.match(svg, /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
assert.match(svg, /height="596" viewBox="0 0 480 596"/);
assert.match(svg, /STATE UPDATED 2026-09-10/);

const compactState = createProjectState({
  username: "KS-GG-AI",
  publicProjects: [{ name: "KS-GG-AI", language: "JavaScript" }],
  privateSyncEnabled: false,
  privateRepositoryCount: 0,
});
const compactSvg = renderProjectMap({ ...compactState, revision: "compact", generatedAt: "2026-09-10T00:00:00.000Z" });

assert.match(compactSvg, /height="420" viewBox="0 0 480 420"/);
assert.match(compactSvg, /M24 382H456/);

const selected = selectProjectRepositories([
  { name: "active-project", language: "JavaScript", owner: { login: "KS-GG-AI" }, private: false, fork: false, archived: false },
  { name: "forked-project", language: "JavaScript", owner: { login: "KS-GG-AI" }, private: false, fork: true, archived: false },
  { name: "archived-project", language: "JavaScript", owner: { login: "KS-GG-AI" }, private: false, fork: false, archived: true },
  { name: "private-project", language: "JavaScript", owner: { login: "KS-GG-AI" }, private: true, fork: false, archived: false },
  { name: "other-account", language: "JavaScript", owner: { login: "other" }, private: false, fork: false, archived: false },
], "KS-GG-AI", true);
assert.deepEqual(selected.publicProjects, [{ name: "active-project", language: "JavaScript" }]);
assert.equal(selected.privateRepositoryCount, 1);

const validatedSnapshot = { ...compactState, revision: "0123456789ab", generatedAt: "2026-09-10T00:00:00.000Z" };
assert.equal(isValidProjectSnapshot(validatedSnapshot), true);
assert.equal(isValidProjectSnapshot({ ...validatedSnapshot, revision: "invalid" }), false);
assert.equal(isValidProjectSnapshot({ ...validatedSnapshot, private: { status: "protected", count: 0, labels: [] } }), false);

const pagedResponses = [
  response(200, Array.from({ length: 100 }, (_, index) => ({ name: "project-" + index }))),
  response(200, [{ name: "project-100" }]),
];
const pagedRequests = [];
const pagedRepositories = await fetchRepositoryPages("https://example.test/repos", "", {
  fetchImplementation: async (url, request) => {
    pagedRequests.push({ url, request });
    return pagedResponses.shift();
  },
  waitFor: async () => {},
});
assert.equal(pagedRepositories.length, 101);
assert.match(pagedRequests[0].url, /per_page=100&page=1$/);
assert.match(pagedRequests[1].url, /per_page=100&page=2$/);
assert.equal(pagedRequests[0].request.signal.aborted, false);

let retryAttempts = 0;
const retryDelays = [];
await fetchRepositoryPages("https://example.test/retry", "", {
  fetchImplementation: async () => {
    retryAttempts += 1;
    return retryAttempts === 1
      ? response(429, [], { "retry-after": "1" })
      : response(200, []);
  },
  waitFor: async (milliseconds) => retryDelays.push(milliseconds),
});
assert.equal(retryAttempts, 2);
assert.deepEqual(retryDelays, [1_000]);

let offlineAttempts = 0;
const offlineDelays = [];
await assert.rejects(
  fetchRepositoryPages("https://example.test/offline", "", {
    fetchImplementation: async () => {
      offlineAttempts += 1;
      throw new Error("offline");
    },
    waitFor: async (milliseconds) => offlineDelays.push(milliseconds),
  }),
  /GitHub API request failed/,
);
assert.equal(offlineAttempts, 3);
assert.deepEqual(offlineDelays, [500, 1_000]);

let deniedAttempts = 0;
await assert.rejects(
  fetchRepositoryPages("https://example.test/denied", "", {
    fetchImplementation: async () => {
      deniedAttempts += 1;
      return response(401, []);
    },
    waitFor: async () => {},
  }),
  /HTTP 401/,
);
assert.equal(deniedAttempts, 1);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const persistedSnapshot = JSON.parse(await readFile(path.join(root, "profile", "data", "project-map.json"), "utf8"));
const persistedSvg = await readFile(path.join(root, "profile", "assets", "maps", "project-map.svg"), "utf8");
assert.equal(renderProjectMap(persistedSnapshot), persistedSvg);
for (const { file, assetReference, typingReference } of readmeEntries) {
  const readme = await readFile(path.join(root, file), "utf8");
  const expression = new RegExp(assetReference.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\?v=([A-Za-z0-9-]+)", "g");
  const revisions = [...readme.matchAll(expression)].map((match) => match[1]);
  assert.deepEqual(revisions, [persistedSnapshot.revision]);
  const disclosureCount = (readme.match(/<details>/g) ?? []).length;
  assert.equal(disclosureCount, 2);
  assert.equal((readme.match(/<\/details>/g) ?? []).length, disclosureCount);
  assert.equal((readme.match(/<summary>/g) ?? []).length, disclosureCount);
  const selfReference = file === "README.md" ? "./README.md" : "./" + path.basename(file);
  assert.equal(readme.includes('href="' + selfReference + '"'), false);
  assert.ok(readme.indexOf('<img src="' + typingReference + '"') > readme.indexOf("</div>"));
}

console.log("Project map generator tests: PASS");
