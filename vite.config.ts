import { defineConfig } from "vite";

// base is set at build time so the same source deploys to a GitHub Pages
// subpath (/noodle/) or to a domain root (/) without edits.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  build: { target: "es2020", assetsInlineLimit: 0 },
});
