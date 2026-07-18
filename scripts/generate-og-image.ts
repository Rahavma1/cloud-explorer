// Generates public/og-image.png from CONFIG at build time, so sharing the
// badge's URL (e.g. on LinkedIn) shows a rich preview card instead of a
// blank link. Runs as a Vite plugin hook (see vite.config.ts) - LinkedIn's
// crawler doesn't execute JavaScript, so this can't be drawn live in the
// browser; it has to be a real static image already sitting on disk.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  SiAlibabacloud,
  SiDocker,
  SiGit,
  SiGithub,
  SiGithubactions,
  SiKubernetes,
  SiLinux,
} from "react-icons/si";
import {
  createCanvas,
  GlobalFonts,
  Path2D,
  loadImage,
  type SKRSContext2D,
} from "@napi-rs/canvas";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { CONFIG } from "../src/config.ts";
import { LOGOS } from "../src/logos.ts";

// The stack this course teaches (see curriculum/5day) - shown as a 2x3 icon
// grid on the card. Each brand's own color where there is one; plain white
// for marks that are inherently monochrome.
const TECH_STACK = [
  { Icon: SiGit, color: "#f05032" },
  { Icon: SiDocker, color: "#2496ed" },
  { Icon: SiKubernetes, color: "#326ce5" },
  { Icon: SiGithub, color: "#ffffff" },
  { Icon: SiGithubactions, color: "#2088ff" },
  { Icon: SiLinux, color: "#ffffff" },
];

const SPONSOR_LOGOS = [LOGOS.majal, LOGOS.sccc, LOGOS.azm];

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WIDTH = 1200;
const HEIGHT = 630;
const FONT_FAMILY = "Space Grotesk";

// Alpine (the Docker build stage) ships with no fonts at all, so relying on
// a system font would silently render blank/tofu glyphs there. Bundling and
// explicitly registering one font file guarantees identical output on every
// student's machine and inside the container.
let fontRegistered = false;
function ensureFont() {
  if (fontRegistered) return;
  GlobalFonts.registerFromPath(
    path.join(__dirname, "../assets-src/SpaceGrotesk.ttf"),
    FONT_FAMILY,
  );
  fontRegistered = true;
}

function roundedRect(
  ctx: SKRSContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// react-icons ships each icon as a React component; rendering it to static
// markup gives back a plain <svg> string we can pull viewBox/path data out
// of - no need for a full SVG rasterizer just to draw one or two glyphs.
function drawReactIcon(
  ctx: SKRSContext2D,
  Icon: Parameters<typeof createElement>[0],
  x: number,
  y: number,
  size: number,
  color: string,
) {
  const markup = renderToStaticMarkup(createElement(Icon));
  const viewBoxMatch = markup.match(/viewBox="([\d.\s-]+)"/);
  const paths = [...markup.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);
  if (!viewBoxMatch || paths.length === 0) return;
  const [vbX, vbY, vbW, vbH] = viewBoxMatch[1].trim().split(/\s+/).map(Number);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / Math.max(vbW, vbH), size / Math.max(vbW, vbH));
  ctx.translate(-vbX, -vbY);
  ctx.fillStyle = color;
  for (const d of paths) ctx.fill(new Path2D(d));
  ctx.restore();
}

// Shrinks the font size until `text` fits within maxWidth, so arbitrarily
// long names/titles never overflow the card.
function fitFontSize(
  ctx: SKRSContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  weight: string,
) {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px "${FONT_FAMILY}"`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

export async function generateOgImage() {
  ensureFont();

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // Background gradient - same colors as the live badge's aurora background.
  const colors =
    CONFIG.gradientColors.length > 0
      ? CONFIG.gradientColors
      : ["#4F46E5", "#8B5CF6", "#06B6D4"];
  const bg = ctx.createLinearGradient(0, HEIGHT, WIDTH, 0);
  colors.forEach((color, i) => {
    bg.addColorStop(colors.length === 1 ? 0 : i / (colors.length - 1), color);
  });
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Glassy card panel, echoing the badge's own frosted look.
  const pad = 56;
  roundedRect(ctx, pad, pad, WIDTH - pad * 2, HEIGHT - pad * 2, 32);
  ctx.fillStyle = "rgba(20, 18, 32, 0.45)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const textX = pad + 56;
  const gridW = 220;
  const gridH = 300;
  const gridX = WIDTH - pad - 56 - gridW;
  const gridY = HEIGHT / 2 - gridH / 2 + 10;
  const maxTextWidth = gridX - textX - 32;

  // Sponsor logos - same white chips the live badge uses, since these
  // logos ship without transparent backgrounds. Tall enough that a
  // two-line lockup (e.g. "SCCC" + "by stc" stacked) still reads clearly -
  // a fixed height that only fit a single text line would squeeze a
  // two-line mark's letterforms into half the vertical room, reading as
  // squashed even though its overall aspect ratio is preserved exactly.
  const logoY = pad + 34;
  const logoH = 56;
  let logoX = textX;
  for (const src of SPONSOR_LOGOS) {
    try {
      const logo = await loadImage(src);
      const aspect = logo.width / logo.height;
      const innerH = logoH - 14;
      const innerW = innerH * aspect;
      const chipW = innerW + 24;
      roundedRect(ctx, logoX, logoY, chipW, logoH, 8);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.drawImage(
        logo,
        logoX + (chipW - innerW) / 2,
        logoY + (logoH - innerH) / 2,
        innerW,
        innerH,
      );
      logoX += chipW + 14;
    } catch (err) {
      console.warn(
        `[generate-og-image] Skipping a sponsor logo: ${(err as Error).message}`,
      );
    }
  }

  // Everything below is positioned relative to the bottom of the logo row,
  // so a taller/shorter logoH never needs re-tuning the rest of the layout.
  const contentTop = logoY + logoH;

  // Eyebrow
  ctx.fillStyle = "rgba(245, 245, 247, 0.7)";
  ctx.font = `600 22px "${FONT_FAMILY}"`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("CLOUD EXPLORER", textX, contentTop + 50);

  // Name (shrinks to fit)
  const name = CONFIG.name.trim() || "Cloud Explorer";
  const nameSize = fitFontSize(ctx, name, maxTextWidth, 64, 36, "700");
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${nameSize}px "${FONT_FAMILY}"`;
  ctx.fillText(name, textX, contentTop + 126);

  // Subtitle
  ctx.fillStyle = "rgba(245, 245, 247, 0.75)";
  ctx.font = `400 26px "${FONT_FAMILY}"`;
  ctx.fillText("Majal x AZM · Cloud Computing Week · Aug 2 - 6", textX, contentTop + 170);

  // Tech-stack icon grid, in the card's right column: 2 columns x 3 rows,
  // one icon per cell.
  const gridCols = 2;
  const gridRows = 3;
  const cellW = gridW / gridCols;
  const cellH = gridH / gridRows;
  const cellIconSize = Math.min(cellW, cellH) * 0.4;
  TECH_STACK.forEach(({ Icon, color }, i) => {
    const col = i % gridCols;
    const row = Math.floor(i / gridCols);
    const cellX = gridX + col * cellW;
    const cellY = gridY + row * cellH;
    roundedRect(ctx, cellX + 8, cellY + 8, cellW - 16, cellH - 16, 14);
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawReactIcon(
      ctx,
      Icon,
      cellX + cellW / 2 - cellIconSize / 2,
      cellY + cellH / 2 - cellIconSize / 2,
      cellIconSize,
      color,
    );
  });

  // Bottom stamp, mirroring the badge's own "Alibaba Cloud" pill.
  const stampY = contentTop + 270;
  const stampH = 56;
  roundedRect(ctx, textX, stampY, 430, stampH, 16);
  ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  drawReactIcon(ctx, SiAlibabacloud, textX + 20, stampY + 16, 24, "#ff6a00");
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 20px "${FONT_FAMILY}"`;
  ctx.fillText("Learning Cloud Computing", textX + 56, stampY + stampH / 2 + 7);

  const outPath = path.join(__dirname, "../public/og-image.png");
  writeFileSync(outPath, canvas.toBuffer("image/png"));
  return outPath;
}
