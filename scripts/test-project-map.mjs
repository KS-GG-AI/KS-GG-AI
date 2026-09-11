import assert from "node:assert/strict";
import { createProjectState, privateProjectLabel, renderProjectMap } from "./update-project-map.mjs";

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
assert.equal(state.renderVersion, 3);
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

console.log("Project map generator tests: PASS");
