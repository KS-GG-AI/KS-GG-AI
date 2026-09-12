import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createFramePainter, encodeGif } from "./profile-gif-utils.mjs";

function createToolboxAnimation() {
  const width = 960;
  const height = 252;
  const { createFrame, fillRect, fillRoundedRect, drawText } = createFramePainter(width, height, 3);
  const groups = [
    { name: "WRITE", detail: "CODE AND SCRIPT", tools: ["TYPESCRIPT", "JAVASCRIPT", "PYTHON"], accent: 4 },
    { name: "BUILD", detail: "RUNTIME AND UI", tools: ["NODE JS", "REACT", "NEXT JS"], accent: 5 },
    { name: "CONNECT", detail: "APIS AND FLOWS", tools: ["REST API", "SQL", "MCP"], accent: 6 },
    { name: "SHIP", detail: "DELIVERY FLOW", tools: ["GIT HUB", "DOCKER", "ACTIONS"], accent: 7 },
  ];
  const transitions = [[0, 1], [1, 2], [2, 3], [3, 2], [2, 1], [1, 0]];

  function makeFrame(from, to, step, totalSteps) {
    const progress = step / (totalSteps - 1);
    const active = progress < 0.5 ? from : to;
    const frame = createFrame();
    fillRoundedRect(frame, 0, 0, width, height, 22, 3);
    fillRoundedRect(frame, 1, 1, width - 2, height - 2, 21, 1);
    fillRoundedRect(frame, 2, 2, width - 4, height - 4, 20, 1);
    drawText(frame, "TOOLBOX", 30, 23, 8, 3);
    drawText(frame, "A WORKING SET FOR THE WHOLE FLOW", 30, 51, 9, 2);
    fillRect(frame, 30, 76, 900, 1, 14);
    fillRoundedRect(frame, 754, 20, 176, 30, 15, 2);
    fillRoundedRect(frame, 755, 21, 174, 28, 14, 1);
    fillRoundedRect(frame, 773, 31, 7, 7, 4, groups[active].accent);
    drawText(frame, "NOW " + groups[active].name, 796, 28, 8, 2);

    groups.forEach((group, index) => {
      const x = 28 + index * 226;
      const isActive = index === active;
      fillRoundedRect(frame, x, 91, 206, 134, 16, isActive ? group.accent : 2);
      fillRoundedRect(frame, x + 1, 92, 204, 132, 15, isActive ? 1 : 0);
      drawText(frame, group.name, x + 18, 108, isActive ? 8 : 9, 3);
      drawText(frame, group.detail, x + 18, 136, isActive ? group.accent : 9, 2);
      group.tools.forEach((tool, toolIndex) => {
        const toolY = 153 + toolIndex * 24;
        fillRoundedRect(frame, x + 18, toolY, 170, 20, 7, isActive ? 3 : 2);
        fillRoundedRect(frame, x + 19, toolY + 1, 168, 18, 6, isActive ? 1 : 0);
        drawText(frame, tool, x + 29, toolY + 4, isActive ? 8 : 9, 2);
      });
    });

    const fromX = 131 + from * 226;
    const toX = 131 + to * 226;
    const markerX = Math.round(fromX + (toX - fromX) * progress);
    fillRoundedRect(frame, markerX - 6, 73, 12, 7, 4, groups[active].accent);
    fillRect(frame, markerX - 2, 75, 4, 3, 8);
    return frame;
  }

  const frames = [];
  const totalSteps = 7;
  for (const [from, to] of transitions) {
    for (let step = 0; step < totalSteps; step += 1) {
      frames.push({ pixels: makeFrame(from, to, step, totalSteps), delay: 7 });
    }
  }
  return { width, height, frames };
}

function createLanguageAnimation() {
  const width = 960;
  const height = 240;
  const { createFrame, fillRect, fillRoundedRect, drawText } = createFramePainter(width, height, 2);
  const languages = [
    "KOREAN", "ENGLISH", "CHINESE", "SPANISH", "HINDI",
    "ARABIC", "PORTUGUESE", "RUSSIAN", "FRENCH", "INDONESIAN",
  ];
  const order = [0, 1, 2, 3, 4, 9, 8, 7, 6, 5, 0];

  function position(index) {
    const row = index < 5 ? 0 : 1;
    const column = index % 5;
    return { x: 28 + column * 180, y: 96 + row * 48 };
  }

  function makeFrame(from, to, step, totalSteps) {
    const progress = step / (totalSteps - 1);
    const active = progress < 0.5 ? from : to;
    const frame = createFrame();
    fillRoundedRect(frame, 0, 0, width, height, 22, 3);
    fillRoundedRect(frame, 1, 1, width - 2, height - 2, 21, 1);
    fillRoundedRect(frame, 2, 2, width - 4, height - 4, 20, 1);
    drawText(frame, "PROFILE LANGUAGES", 30, 23, 8, 3);
    drawText(frame, "TEN LOCAL VIEWS ONE SHARED CONTEXT", 30, 51, 9, 2);
    fillRect(frame, 28, 77, 904, 1, 14);
    fillRoundedRect(frame, 752, 20, 180, 30, 15, 2);
    fillRoundedRect(frame, 753, 21, 178, 28, 14, 1);
    fillRoundedRect(frame, 771, 31, 7, 7, 4, 6);
    drawText(frame, "TEN VIEWS LIVE", 794, 28, 8, 2);

    languages.forEach((language, index) => {
      const { x, y } = position(index);
      const isActive = index === active;
      fillRoundedRect(frame, x, y, 164, 34, 10, isActive ? 5 : 2);
      fillRoundedRect(frame, x + 1, y + 1, 162, 32, 9, isActive ? 1 : 0);
      drawText(frame, language, x + 18, y + 10, isActive ? 8 : 9, 2);
    });

    const start = position(from);
    const end = position(to);
    const markerX = Math.round(start.x + 21 + (end.x - start.x) * progress);
    const markerY = Math.round(start.y + 7 + (end.y - start.y) * progress);
    fillRoundedRect(frame, markerX - 6, markerY - 4, 12, 9, 4, 5);
    fillRect(frame, markerX - 2, markerY - 1, 4, 3, 8);
    drawText(frame, "KOREAN AND ENGLISH START THE PROFILE", 30, 204, 9, 2);
    drawText(frame, "MORE VIEWS MAKE SHARING EASIER", 510, 204, 9, 2);
    return frame;
  }

  const frames = [];
  const totalSteps = 4;
  for (let index = 0; index < order.length - 1; index += 1) {
    for (let step = 0; step < totalSteps; step += 1) {
      frames.push({ pixels: makeFrame(order[index], order[index + 1], step, totalSteps), delay: 8 });
    }
  }
  return { width, height, frames };
}

function createFocusAnimation() {
  const width = 570;
  const height = 180;
  const { createFrame, fillRect, fillRoundedRect, drawText } = createFramePainter(width, height, 2);
  const chips = [
    { name: "TYPESCRIPT", x: 26, width: 145, accent: 4 },
    { name: "PYTHON", x: 181, width: 95, accent: 5 },
    { name: "NODE JS", x: 286, width: 100, accent: 6 },
    { name: "DOCKER", x: 396, width: 110, accent: 7 },
  ];
  const transitions = [[0, 1], [1, 2], [2, 3], [3, 2], [2, 1], [1, 0]];

  function makeFrame(from, to, step, totalSteps) {
    const progress = step / (totalSteps - 1);
    const active = progress < 0.5 ? from : to;
    const frame = createFrame();
    fillRoundedRect(frame, 0, 0, width, height, 18, 3);
    fillRoundedRect(frame, 1, 1, width - 2, height - 2, 17, 1);
    drawText(frame, "TECHNOLOGY FOCUS", 30, 24, 9, 2);
    drawText(frame, "CURRENT WORKING SET", 30, 44, 9, 1);
    fillRoundedRect(frame, 432, 21, 108, 24, 12, 2);
    fillRoundedRect(frame, 433, 22, 106, 22, 11, 1);
    fillRoundedRect(frame, 447, 30, 6, 6, 3, chips[active].accent);
    drawText(frame, "ACTIVE", 466, 29, 8, 1);

    chips.forEach((chip, index) => {
      const isActive = index === active;
      fillRoundedRect(frame, chip.x, 62, chip.width, 34, 17, isActive ? chip.accent : 2);
      fillRoundedRect(frame, chip.x + 1, 63, chip.width - 2, 32, 16, isActive ? 1 : 0);
      drawText(frame, chip.name, chip.x + 13, 72, isActive ? 8 : 9, 2);
    });

    fillRect(frame, 28, 118, 514, 1, 14);
    const fromX = chips[from].x + Math.round(chips[from].width / 2);
    const toX = chips[to].x + Math.round(chips[to].width / 2);
    const markerX = Math.round(fromX + (toX - fromX) * progress);
    fillRoundedRect(frame, markerX - 5, 115, 10, 7, 4, chips[active].accent);
    fillRect(frame, markerX - 1, 117, 2, 3, 8);
    drawText(frame, "DESIGN SYSTEMS AUTOMATION CLOUD", 30, 142, 9, 2);
    return frame;
  }

  const frames = [];
  const totalSteps = 7;
  for (const [from, to] of transitions) {
    for (let step = 0; step < totalSteps; step += 1) {
      frames.push({ pixels: makeFrame(from, to, step, totalSteps), delay: 7 });
    }
  }
  return { width, height, frames };
}

const directory = path.dirname(fileURLToPath(import.meta.url));
const assetsDirectory = path.resolve(directory, "../../assets/motion");
const animations = [
  ["toolbox.gif", createToolboxAnimation()],
  ["language-map.gif", createLanguageAnimation()],
  ["technology-focus.gif", createFocusAnimation()],
];

await mkdir(assetsDirectory, { recursive: true });
for (const [name, animation] of animations) {
  const target = path.join(assetsDirectory, name);
  await writeFile(target, encodeGif(animation.frames, animation.width, animation.height));
  console.log("Wrote " + target + " (" + animation.frames.length + " frames)");
}
