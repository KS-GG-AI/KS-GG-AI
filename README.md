<div align="center">

<p>
  <picture>
    <source media="(max-width: 840px)" srcset="./profile/assets/locales/en/identity/hero-compact.svg" />
    <img src="./profile/assets/locales/en/identity/hero.svg" alt="KS-GG-AI — clear interfaces, connected workflows, and reliable systems." width="78%" />
  </picture>
  <picture>
    <img src="./profile/assets/identity/avatar.gif" alt="Animated KS-GG-AI monogram." width="20%" />
  </picture>
</p>

<p>
  <strong>Building ideas with code, curiosity, and care.</strong><br />
  <sub>Clear interfaces · connected workflows · reliable systems.</sub>
</p>

<p>
  <strong>🇺🇸 English</strong> ·
  <a href="./profile/content/locales/ko.md">🇰🇷 한국어</a> ·
  <a href="./profile/content/locales/zh-CN.md">🇨🇳 中文</a> ·
  <a href="./profile/content/locales/es.md">🇪🇸 Español</a> ·
  <a href="./profile/content/locales/hi.md">🇮🇳 हिन्दी</a><br />
  <a href="./profile/content/locales/ar.md">🇸🇦 العربية</a> ·
  <a href="./profile/content/locales/pt-BR.md">🇧🇷 Português</a> ·
  <a href="./profile/content/locales/ru.md">🇷🇺 Русский</a> ·
  <a href="./profile/content/locales/fr.md">🇫🇷 Français</a> ·
  <a href="./profile/content/locales/id.md">🇮🇩 Bahasa Indonesia</a>
</p>

<p>
  <a href="https://github.com/KS-GG-AI/KS-GG-AI/releases"><img src="https://img.shields.io/badge/Release-v0.4.0-A78BFA?style=flat-square&logo=github&labelColor=161126" alt="Latest Release" /></a>
  <img src="https://img.shields.io/badge/Architecture-Distributed%20Homelab%20%26%20Edge-A7F3D0?style=flat-square&labelColor=161126" alt="Architecture" />
  <img src="https://img.shields.io/badge/Protocols-HTTP%2F2%20%7C%20HTTP%2F3%20QUIC-F9A8D4?style=flat-square&labelColor=161126" alt="Protocols" />
  <img src="https://img.shields.io/badge/Focus-Systems%20Hardening%20%26%20Automation-67E8F9?style=flat-square&labelColor=161126" alt="Focus" />
</p>

</div>

## About

I turn early ideas into useful product surfaces, connected tools, and workflows that stay understandable as they grow.

<p align="center">
  <picture>
    <img src="./profile/assets/locales/en/motion/typing.gif" alt="Animated typing: crafting useful things, clear systems, and careful work." width="100%" />
  </picture>
</p>

### What I build

- **Product surfaces** — Interfaces and flows that make the next action obvious
- **Connected work** — APIs, integrations, and automation that reduce routine hand-offs
- **Built to evolve** — Small foundations that stay easy to test, change, and maintain

### How I work

- **Clarity first** — Make the next step obvious.
- **Stay curious** — Leave room to discover better ways.
- **Keep improving** — Let small iterations add up.

<p align="center"><sub>Make it useful. Make it clear. Keep making it better.</sub></p>

## Stack

A practical working set, grouped by the job it helps with rather than treated as a checklist.

- **Foundation** — TypeScript, JavaScript, Python, Go
- **Product surfaces** — React, Next.js, Vite, Tailwind CSS, Figma
- **Connected systems** — Node.js, REST APIs, PostgreSQL, MCP
- **Delivery & reliability** — Git, Docker, GitHub Actions, cloud platforms

<details>
<summary><strong>Explore the visual stack</strong></summary>

<br />

<p><strong>Core toolkit</strong></p>

<picture>
  <source media="(max-width: 840px)" srcset="./profile/assets/locales/en/visuals/toolbox-compact.svg" />
  <img src="./profile/assets/locales/en/visuals/toolbox.svg" alt="Core toolkit organized around writing, building, connecting, and shipping software." width="100%" />
</picture>

<p><strong>Technical map</strong></p>

<picture>
  <source media="(max-width: 840px)" srcset="./profile/assets/locales/en/visuals/technology-stack-compact.svg" />
  <img src="./profile/assets/locales/en/visuals/technology-stack.svg" alt="Technical map of languages, services and data, interfaces and product, plus delivery and operations." width="100%" />
</picture>

<p><strong>In motion</strong></p>

<picture>
  <source media="(max-width: 840px)" srcset="./profile/assets/locales/en/motion/technology-stack-compact.gif" />
  <img src="./profile/assets/locales/en/motion/technology-stack.gif" alt="Animated technical map." width="100%" />
</picture>

- **Languages & markup** — TypeScript, JavaScript, Python, Go, Java, C#, C++, C, PHP, Rust, Bash, HTML, CSS, SQL
- **Services, data & automation** — Node.js, Express, FastAPI, Flask, Django, GraphQL, PostgreSQL, MySQL, MongoDB, Redis, Prisma, LLMs, MCP, automation
- **Interfaces & product** — React, Next.js, Vite, Tailwind CSS, Figma, Vercel
- **Delivery & operations** — Docker, Kubernetes, AWS, Google Cloud, Azure, Cloudflare, Nginx, Linux, GitHub Actions, Terraform, Git, GitLab, Ansible, Ubuntu

</details>

## Projects

Public work stays easy to browse; private work stays intentionally masked. The organization map shows private repositories only as masked labels, and the roadmaps refresh from public issue data only.

### Featured Systems & Solutions

<table>
  <tr>
    <td width="50%" valign="top">
      <h4>🛡️ <a href="https://github.com/KS-GG-AI/adguardhome-homelab-stack">adguardhome-homelab-stack</a></h4>
      <p><em>Production-grade, hardened AdGuard Home stack with ZRAM, TCP BBR, HTTP/2 & HTTP/3 (QUIC/DoQ), and multi-node standalone resilience.</em></p>
      <p>
        <a href="https://github.com/KS-GG-AI/adguardhome-homelab-stack/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" /></a>
        <img src="https://img.shields.io/badge/HTTP%2F2%20%7C%20HTTP%2F3-QUIC-orange.svg" alt="HTTP/2 & HTTP/3" />
        <img src="https://img.shields.io/badge/Linux-ZRAM%20%2B%20BBR-purple.svg" alt="Kernel Tuning" />
      </p>
      <ul>
        <li><strong>⚡ Performance</strong>: 1GB ZRAM (zstd) swap (swappiness 180, page-cluster 0) + 7.5MB UDP socket buffers</li>
        <li><strong>🔒 Protocols</strong>: HTTP/2 Web UI on port 443 + DNS-over-QUIC (DoQ) & DoT on port 853 with 20-year TLS</li>
        <li><strong>🏛️ Resilience</strong>: Zero-SPOF standalone node isolation with 1-second fast DNS failover</li>
        <li><strong>🌐 Routing</strong>: ByeDPI SOCKS5 proxy + Python PAC daemon for smart domain dispatching</li>
        <li><strong>🌍 Multilingual</strong>: 10 localized editions (<a href="https://github.com/KS-GG-AI/adguardhome-homelab-stack/blob/main/locales/ko.md">한국어</a>, 中文, Español, etc.)</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h4>🗺️ <a href="https://github.com/KS-GG-AI/github-org-map-public">github-org-map-public</a></h4>
      <p><em>Automated, scheduled workspace & privacy-preserving repository map for GitHub accounts and organizations.</em></p>
      <p>
        <a href="https://github.com/KS-GG-AI/github-org-map-public/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" /></a>
        <img src="https://img.shields.io/badge/Automation-GitHub%20Actions-2088FF.svg" alt="GitHub Actions" />
        <img src="https://img.shields.io/badge/Format-SVG%20%2B%20GIF-success.svg" alt="SVG and GIF" />
      </p>
      <ul>
        <li><strong>🔄 Automation</strong>: Daily scheduled GitHub Actions workflow with zero-token secrets leakage</li>
        <li><strong>🛡️ Privacy</strong>: Intentionally masks private repository identifiers while visualizing architecture</li>
        <li><strong>🎨 Visualization</strong>: Dynamic SVG diagrams and animated GIF generation across all accounts</li>
      </ul>
    </td>
  </tr>
</table>

[Browse public repositories](https://github.com/KS-GG-AI?tab=repositories) · [Browse public tracked issues](https://github.com/issues?q=user%3AKS-GG-AI+is%3Aissue+is%3Aopen)

<details>
<summary><strong>Explore projects and roadmaps</strong></summary>

<br />

<p><strong>Organization map</strong></p>

<p>
  <a href="https://github.com/KS-GG-AI/github-org-map-public">
    <picture>
      <img src="https://raw.githubusercontent.com/KS-GG-AI/github-org-map-public/main/org-map.svg" alt="Organization map showing the KS-GG-AI workspace, public projects, and intentionally masked private work." width="480" />
    </picture>
  </a>
</p>

<sub>Private repositories appear only as masked labels.</sub>

<p><strong>Project roadmap</strong></p>

<picture>
  <img src="./profile/assets/locales/en/maps/project-roadmap.svg?v=a7d09f789e26" alt="Public project roadmap split into now, next, and later lanes." width="480" />
</picture>

<p><strong>Development roadmap</strong></p>

<picture>
  <img src="./profile/assets/locales/en/maps/development-roadmap.svg?v=a7d09f789e26" alt="Public development roadmap split into plan, build, verify, and ship stages." width="480" />
</picture>

<sub>Uses public GitHub issues only. Add one <code>roadmap:*</code> label and one <code>stage:*</code> label to a public issue to make it appear.</sub>

</details>

## Contact

For public work, feedback, or a closer look at the implementation, these are the clearest starting points.

[GitHub profile](https://github.com/KS-GG-AI) · [Public repositories](https://github.com/KS-GG-AI?tab=repositories) · [Open an issue](https://github.com/KS-GG-AI/KS-GG-AI/issues/new) · [Profile source](https://github.com/KS-GG-AI/KS-GG-AI)
