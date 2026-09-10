import { execFile as execFileCallback } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const username = process.env.PROFILE_USERNAME ?? "KS-GG-AI";
const token = process.env.GITHUB_TOKEN;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const execFile = promisify(execFileCallback);
const publicApiHeaders = {
  Accept: "application/vnd.github+json",
  "User-Agent": "KS-GG-AI-profile-metrics",
};
const apiHeaders = {
  ...publicApiHeaders,
  ...(token ? { Authorization: "Bearer " + token } : {}),
};

async function fetchJson(url) {
  let failureStatus = "network error";
  try {
    const response = await fetch(url, { headers: apiHeaders });
    if (response.ok) return response.json();
    failureStatus = response.status;

    if (token && (response.status === 401 || response.status === 403)) {
      const fallback = await fetch(url, { headers: publicApiHeaders });
      if (fallback.ok) return fallback.json();
      failureStatus = fallback.status;
    }
  } catch {
    failureStatus = "network error";
  }

  try {
    const endpoint = new URL(url);
    const { stdout } = await execFile("gh", ["api", endpoint.pathname.slice(1) + endpoint.search], { encoding: "utf8" });
    return JSON.parse(stdout);
  } catch {
    throw new Error("GitHub API request failed (" + failureStatus + "): " + url);
  }
}

async function readTextIfPresent(file) {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return null;
    throw error;
  }
}

async function fetchOwnedRepositories() {
  const repositories = [];
  for (let page = 1; ; page += 1) {
    const batch = await fetchJson(
      "https://api.github.com/users/" + encodeURIComponent(username) + "/repos?type=owner&sort=updated&per_page=100&page=" + page,
    );
    repositories.push(...batch);
    if (batch.length < 100) return repositories;
  }
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character]);
}

function svgFor(metrics) {
  const items = [
    ["PUBLIC REPOS", metrics.publicRepositories],
    ["FOLLOWERS", metrics.followers],
    ["FOLLOWING", metrics.following],
    ["STARS RECEIVED", metrics.starsReceived],
  ];
  const cards = items.map(([label, value], index) => {
    const x = index % 2 === 0 ? 26 : 293;
    const y = index < 2 ? 58 : 119;
    const accent = ["#A78BFA", "#67E8F9", "#A7F3D0", "#F9A8D4"][index];
    return [
      '<rect x="' + x + '" y="' + y + '" width="251" height="47" rx="11" fill="#111827" stroke="#293244"/>',
      '<circle cx="' + (x + 20) + '" cy="' + (y + 23) + '" r="5" fill="' + accent + '"/>',
      '<text x="' + (x + 37) + '" y="' + (y + 19) + '" fill="#9AA4BA" font-family="Arial, Helvetica, sans-serif" font-size="9" font-weight="700" letter-spacing="1">' + label + '</text>',
      '<text x="' + (x + 37) + '" y="' + (y + 36) + '" fill="#F5F3FF" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">' + String(value).padStart(2, "0") + '</text>',
    ].join("");
  }).join("");
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="570" height="190" viewBox="0 0 570 190" fill="none" role="img" aria-labelledby="title desc">',
    '<title id="title">' + escapeXml(username) + ' GitHub profile snapshot</title>',
    '<desc id="desc">Public GitHub profile metrics collected from the GitHub API.</desc>',
    '<defs><linearGradient id="bg" x1="0" y1="0" x2="570" y2="190" gradientUnits="userSpaceOnUse"><stop stop-color="#161126"/><stop offset=".56" stop-color="#101926"/><stop offset="1" stop-color="#101C1D"/></linearGradient></defs>',
    '<rect x=".5" y=".5" width="569" height="189" rx="20" fill="url(#bg)" stroke="#30354A"/>',
    '<text x="26" y="30" fill="#F5F3FF" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700">GITHUB SNAPSHOT</text>',
    '<text x="26" y="46" fill="#8C96AA" font-family="Arial, Helvetica, sans-serif" font-size="9" letter-spacing=".8">PROFILE METRICS · LAST UPDATED</text>',
    '<circle cx="523" cy="32" r="5" fill="#A7F3D0"/><circle cx="523" cy="32" r="10" stroke="#A7F3D0" stroke-opacity=".28"/>',
    cards,
    '<text x="26" y="174" fill="#7E8AA1" font-family="Arial, Helvetica, sans-serif" font-size="9" letter-spacing=".45">UPDATED ' + escapeXml(metrics.generatedAt.slice(0, 10)) + ' · GITHUB API</text>',
    '</svg>',
  ].join("\n");
}

const user = await fetchJson("https://api.github.com/users/" + encodeURIComponent(username));
const repositories = await fetchOwnedRepositories();
const nextMetrics = {
  username,
  publicRepositories: user.public_repos ?? 0,
  followers: user.followers ?? 0,
  following: user.following ?? 0,
  starsReceived: repositories.reduce((total, repository) => total + (repository.stargazers_count ?? 0), 0),
};

const dataDirectory = path.join(root, "data");
const assetsDirectory = path.join(root, "assets");
const metricsPath = path.join(dataDirectory, "profile-metrics.json");
const snapshotPath = path.join(assetsDirectory, "profile-snapshot.svg");
const existingMetricsText = await readTextIfPresent(metricsPath);
const existingMetrics = existingMetricsText ? JSON.parse(existingMetricsText) : null;
const metricKeys = Object.keys(nextMetrics);
const metricsChanged = !existingMetrics || metricKeys.some((key) => existingMetrics[key] !== nextMetrics[key]);
const metrics = metricsChanged
  ? { ...nextMetrics, generatedAt: new Date().toISOString() }
  : existingMetrics;
const metricsText = JSON.stringify(metrics, null, 2) + "\n";
const snapshot = svgFor(metrics);
const existingSnapshot = await readTextIfPresent(snapshotPath);

await mkdir(dataDirectory, { recursive: true });
await mkdir(assetsDirectory, { recursive: true });
if (existingMetricsText !== metricsText) await writeFile(metricsPath, metricsText);
if (existingSnapshot !== snapshot) await writeFile(snapshotPath, snapshot);
console.log(JSON.stringify({ ...metrics, metricsChanged }));
