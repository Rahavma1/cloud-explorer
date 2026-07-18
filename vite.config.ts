import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { CONFIG } from "./src/config.ts";
import { generateOgImage } from "./scripts/generate-og-image.ts";

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Generates public/og-image.png from CONFIG on every dev/build start, and
// fills in the __OG_TITLE__/__OG_DESCRIPTION__ placeholders in index.html.
// See scripts/generate-og-image.ts for why this can't just be drawn live in
// the browser.
function ogImagePlugin(): Plugin {
  return {
    name: "og-image",
    async buildStart() {
      try {
        await generateOgImage();
      } catch (err) {
        // Cosmetic feature - never let a failure here (e.g. the poster URL
        // being unreachable, or a font/canvas hiccup) block the real build.
        this.warn(`Skipping OG image generation: ${(err as Error).message}`);
      }
    },
    transformIndexHtml(html) {
      const title = escapeHtml(`${CONFIG.name}'s Cloud Explorer Badge`);
      const description = escapeHtml(
        `My favorite ${CONFIG.favorite.category} is ${CONFIG.favorite.title}. ${CONFIG.funFact}`,
      );
      return html
        .replaceAll("__OG_TITLE__", title)
        .replaceAll("__OG_DESCRIPTION__", description);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ogImagePlugin()],
})
