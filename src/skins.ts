export type Skin = {
  name: string;
  body: string[];   // repeating bead colours
  eye: string;
};

/** Bright, banded, candy-coloured — the Snake.io wardrobe. */
export const SKINS: Skin[] = [
  { name: "Rainbow", body: ["#FF5D5D", "#FFA23E", "#FFE14D", "#5FD86B", "#4FB8FF", "#9B6BFF"], eye: "#1B2430" },
  { name: "Tiger", body: ["#FFB020", "#2B2B2B"], eye: "#1B2430" },
  { name: "Mint", body: ["#7CE8C8", "#3FBF9C"], eye: "#1B2430" },
  { name: "Bubblegum", body: ["#FF8FC8", "#FFD1E8"], eye: "#1B2430" },
  { name: "Storm", body: ["#5B7CFA", "#8FA8FF", "#C7D4FF"], eye: "#1B2430" },
  { name: "Lava", body: ["#FF4D3D", "#FF8A2B", "#FFD23E"], eye: "#1B2430" },
  { name: "Grape", body: ["#9B6BFF", "#6C3FD1"], eye: "#1B2430" },
  { name: "Lime", body: ["#B7F542", "#6FBF1E"], eye: "#1B2430" },
  { name: "Ocean", body: ["#2FD3E8", "#1C8FB5"], eye: "#1B2430" },
  { name: "Cocoa", body: ["#C98A5B", "#8A5A34"], eye: "#1B2430" },
];

export const PLAYER_SKIN = SKINS[0]!;

export const ARENA = {
  ground: "#4FB3BF",
  groundAlt: "#46A6B2",
  hex: "#59BEC9",
  edge: "#2E7F8A",
  fog: "#2E7F8A",
  hud: "#FFFFFF",
  hudShadow: "rgba(12, 46, 52, 0.55)",
};

/** Pellets are sweets. Small, bright, high contrast against the teal. */
export const PELLET_COLOURS = [
  "#FF5D5D", "#FFD23E", "#5FD86B", "#4FB8FF",
  "#FF8FC8", "#9B6BFF", "#FFA23E", "#7CE8C8",
];

export const BOT_NAMES = [
  "Pip", "Bramble", "Noodle", "Sprout", "Tumble", "Mango", "Biscuit", "Fig",
  "Waffle", "Pebble", "Sunny", "Doodle", "Gus", "Bean", "Mo", "Poppy",
];
