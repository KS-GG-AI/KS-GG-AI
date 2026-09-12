import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFramePainter, encodeGif } from "./profile-gif-utils.mjs";

const width = 960;
const height = 532;
const { createFrame, fillRect, fillRoundedRect, drawText } = createFramePainter(width, height, 2);

const cards = [
  {
    title: "LANGUAGES",
    subtitle: "FOUNDATIONS AND MARKUP",
    footer: "LANGUAGE FOUNDATIONS",
    x: 28,
    y: 98,
    accent: 4,
    tones: [4, 7, 5, 6],
    rows: [
      ["TYPESCRIPT", "JAVASCRIPT", "PYTHON"],
      ["GO", "JAVA", "C#", "C++", "C"],
      ["PHP", "RUST", "BASH", "HTML", "CSS"],
      ["SQL"],
    ],
  },
  {
    title: "SERVICES DATA",
    subtitle: "APIS DATA AUTOMATION",
    footer: "LLMS MCP AUTOMATION",
    x: 492,
    y: 98,
    accent: 5,
    tones: [6, 5, 4, 6],
    rows: [
      ["NODE.JS", "EXPRESS", "FASTAPI"],
      ["FLASK", "DJANGO", "GRAPHQL"],
      ["POSTGRESQL", "MYSQL", "MONGODB"],
      ["REDIS", "PRISMA", "MCP"],
    ],
  },
  {
    title: "INTERFACES PRODUCT",
    subtitle: "SURFACES AND FEEDBACK",
    footer: "USABLE SURFACES FAST FEEDBACK",
    x: 28,
    y: 304,
    accent: 7,
    tones: [5, 4, 7, 5],
    rows: [
      ["REACT", "NEXT.JS", "VITE", "TAILWIND"],
      ["FIGMA", "VERCEL"],
      [],
      [],
    ],
  },
  {
    title: "DELIVERY OPS",
    subtitle: "RELEASE AND OPERATIONS",
    footer: "GITHUB ACTIONS TERRAFORM",
    x: 492,
    y: 304,
    accent: 6,
    tones: [5, 4, 7, 6],
    rows: [
      ["DOCKER", "KUBERNETES", "AWS"],
      ["GOOGLE CLOUD", "AZURE", "CLOUDFLARE"],
      ["NGINX", "LINUX", "GIT", "GITLAB"],
      ["ANSIBLE", "UBUNTU"],
    ],
  },
];

function chipWidth(label) {
  return label.length * 12 + 16;
}

function cardChipCount(card) {
  return card.rows.reduce((total, row) => total + row.length, 0);
}

function drawChip(frame, label, x, y, tone, activeTone, focused) {
  const chipW = chipWidth(label);
  fillRoundedRect(frame, x, y, chipW, 22, 7, focused ? activeTone : tone);
  fillRoundedRect(frame, x + 1, y + 1, chipW - 2, 20, 6, focused ? 1 : 0);
  drawText(frame, label, x + 8, y + 4, focused ? 8 : 9, 2);
  return x + chipW + 8;
}

function drawStatusNetwork(frame, from, to, progress, accent) {
  const nodes = [
    { x: 878, y: 29 },
    { x: 914, y: 29 },
    { x: 914, y: 47 },
    { x: 878, y: 47 },
  ];
  fillRoundedRect(frame, 844, 20, 88, 36, 18, 2);
  fillRoundedRect(frame, 845, 21, 86, 34, 17, 1);
  fillRect(frame, 878, 29, 36, 1, 14);
  fillRect(frame, 914, 29, 1, 18, 14);
  fillRect(frame, 878, 47, 36, 1, 14);
  fillRect(frame, 878, 29, 1, 18, 14);
  nodes.forEach((node) => fillRoundedRect(frame, node.x - 3, node.y - 3, 7, 7, 4, 3));
  const fromNode = nodes[from];
  const toNode = nodes[to];
  const markerX = Math.round(fromNode.x + (toNode.x - fromNode.x) * progress);
  const markerY = Math.round(fromNode.y + (toNode.y - fromNode.y) * progress);
  fillRoundedRect(frame, markerX - 5, markerY - 5, 11, 11, 6, accent);
  fillRect(frame, markerX - 1, markerY - 1, 3, 3, 8);
}

function drawCard(frame, card, index, activeIndex, focusedChip, pulse) {
  const active = index === activeIndex;
  fillRoundedRect(frame, card.x, card.y, 440, 186, 18, active ? card.accent : 2);
  fillRoundedRect(frame, card.x + 1, card.y + 1, 438, 184, 17, active ? 1 : 0);

  fillRoundedRect(frame, card.x + 20, card.y + 17, 26, 26, 13, active ? card.accent : 3);
  fillRect(frame, card.x + 27, card.y + 29, 12, 2, active ? 8 : 9);
  fillRect(frame, card.x + 32, card.y + 24, 2, 12, active ? 8 : 9);
  drawText(frame, card.title, card.x + 58, card.y + 16, active ? 8 : 9, 3);
  drawText(frame, card.subtitle, card.x + 58, card.y + 47, active ? card.accent : 9, 2);

  for (let index = 0; index < 3; index += 1) {
    fillRoundedRect(
      frame,
      card.x + 396 + index * 8,
      card.y + 22,
      5,
      5,
      3,
      active && index <= pulse ? card.accent : 3,
    );
  }

  let chipIndex = 0;
  card.rows.forEach((row, rowIndex) => {
    let cursor = card.x + 20;
    const chipY = card.y + 66 + rowIndex * 24;
    row.forEach((label) => {
      const tone = card.tones[chipIndex % card.tones.length];
      cursor = drawChip(frame, label, cursor, chipY, tone, card.accent, active && chipIndex === focusedChip);
      chipIndex += 1;
    });
  });

  fillRect(frame, card.x + 20, card.y + 164, 400, 1, active ? card.accent : 14);
  drawText(frame, card.footer, card.x + 20, card.y + 171, active ? 8 : 9, 2);
}

function createFrameForStep(from, to, step, totalSteps, segmentIndex) {
  const progress = step / totalSteps;
  const activeIndex = progress < 0.5 ? from : to;
  const activeCard = cards[activeIndex];
  const isLastFrame = segmentIndex === 3 && step === totalSteps - 1;
  const focusedChip = isLastFrame
    ? 0
    : (segmentIndex * 3 + step) % cardChipCount(activeCard);
  const pulse = isLastFrame ? 0 : step % 3;
  const frame = createFrame();

  fillRoundedRect(frame, 0, 0, width, height, 24, 3);
  fillRoundedRect(frame, 1, 1, width - 2, height - 2, 23, 1);
  fillRoundedRect(frame, 2, 2, width - 4, height - 4, 22, 1);
  drawText(frame, "TECHNICAL MAP", 32, 26, 8, 3);
  drawText(frame, "LANGUAGES SERVICES INTERFACES DELIVERY", 32, 59, 9, 2);
  fillRect(frame, 28, 78, 904, 1, 14);
  drawStatusNetwork(frame, from, to, progress, activeCard.accent);

  cards.forEach((card, index) => drawCard(frame, card, index, activeIndex, focusedChip, pulse));

  fillRect(frame, 28, 508, 904, 1, 14);
  drawText(frame, "FOUR WORKING AREAS ONE CONNECTED SYSTEM", 32, 514, 9, 2);
  fillRoundedRect(frame, 860, 515, 7, 7, 4, activeCard.accent);
  fillRoundedRect(frame, 878, 515, 7, 7, 4, 5);
  fillRoundedRect(frame, 896, 515, 7, 7, 4, 6);

  return frame;
}

const route = [0, 1, 3, 2, 0];
const totalSteps = 10;
const frames = [];
for (let segmentIndex = 0; segmentIndex < route.length - 1; segmentIndex += 1) {
  for (let step = 0; step < totalSteps; step += 1) {
    frames.push({
      pixels: createFrameForStep(route[segmentIndex], route[segmentIndex + 1], step, totalSteps, segmentIndex),
      delay: 12,
    });
  }
}

const directory = path.dirname(fileURLToPath(import.meta.url));
const target = path.resolve(directory, "../../assets/motion/technology-stack.gif");
await mkdir(path.dirname(target), { recursive: true });
await writeFile(target, encodeGif(frames, width, height));
console.log("Wrote " + target + " (" + frames.length + " frames)");
