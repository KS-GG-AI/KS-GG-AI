import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const username = process.env.PROFILE_USERNAME ?? "KS-GG-AI";
const token = process.env.GITHUB_TOKEN;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiHeaders = {
  Accept: "application/vnd.github+json",
  "User-Agent": "KS-GG-AI-profile-metrics",
  ...(token ? { Authorization: "Bearer " + token } : {}),
};

async function fetchJson(url) {
  const response = await fetch(url, { headers: apiHeaders });
  if (!response.ok) throw new Error("GitHub API request failed (" + response.status + "): " + url);
  return response.json();
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
    '<desc id="desc">Automated profile metrics refreshed from the GitHub API.</desc>',
    '<defs><linearGradient id="bg" x1="0" y1="0" x2="570" y2="190" gradientUnits="userSpaceOnUse"><stop stop-color="#161126"/><stop offset=".56" stop-color="#101926"/><stop offset="1" stop-color="#101C1D"/></linearGradient></defs>',
    '<rect x=".5" y=".5" width="569" height="189" rx="20" fill="url(#bg)" stroke="#30354A"/>',
    '<text x="26" y="30" fill="#F5F3FF" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700">GITHUB SNAPSHOT</text>',
    '<text x="26" y="46" fill="#8C96AA" font-family="Arial, Helvetica, sans-serif" font-size="9" letter-spacing=".8">AUTOMATICALLY REFRESHED PROFILE METRICS</text>',
    '<circle cx="523" cy="32" r="5" fill="#A7F3D0"/><circle cx="523" cy="32" r="10" stroke="#A7F3D0" stroke-opacity=".28"/>',
    cards,
    '<text x="26" y="174" fill="#7E8AA1" font-family="Arial, Helvetica, sans-serif" font-size="9" letter-spacing=".45">SYNCED ' + escapeXml(metrics.generatedAt.slice(0, 10)) + ' · GITHUB ACTIONS</text>',
    '</svg>',
  ].join("\n");
}

const user = await fetchJson("https://api.github.com/users/" + encodeURIComponent(username));
const repositories = await fetchJson("https://api.github.com/users/" + encodeURIComponent(username) + "/repos?type=owner&sort=updated&per_page=100");
const metrics = {
  username,
  publicRepositories: user.public_repos ?? 0,
  followers: user.followers ?? 0,
  following: user.following ?? 0,
  starsReceived: repositories.reduce((total, repository) => total + (repository.stargazers_count ?? 0), 0),
  generatedAt: new Date().toISOString(),
};

await mkdir(path.join(root, "data"), { recursive: true });
await writeFile(path.join(root, "data", "profile-metrics.json"), JSON.stringify(metrics, null, 2) + "\n");
await writeFile(path.join(root, "assets", "profile-snapshot.svg"), svgFor(metrics));
console.log(JSON.stringify(metrics));
