import "./style.css";
import { World } from "./world";
import { Renderer } from "./render";
import { attachInput } from "./input";
import { SKINS, type Skin } from "./skins";
import * as progress from "./progress";
import * as audio from "./audio";
import * as music from "./music";

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const canvas = $<HTMLCanvasElement>("game");
const ctx = canvas.getContext("2d", { alpha: false })!;
const probe = $("probe");
const muteBtn = $<HTMLButtonElement>("mute");

const startOverlay = $("start");
const nameInput = $<HTMLInputElement>("name");
const skinRow = $("skins");
const trackRow = $("tracks");
const roundLine = $("roundline");
const playBtn = $<HTMLButtonElement>("play");

const wonOverlay = $("won");
const wonRound = $("wonround");
const wonPrompt = $("wonprompt");
const rewardRow = $("rewards");
const nextBtn = $<HTMLButtonElement>("next");

const overOverlay = $("over");
const finalScore = $("finalscore");
const bestEl = $("best");
const againBtn = $<HTMLButtonElement>("again");

const BASE = import.meta.env.BASE_URL;

let saved = progress.load();
const skinByName = (n: string) => SKINS.find((s) => s.name === n) ?? SKINS[0]!;

let w = 0;
let h = 0;
let dpr = 1;

function resize() {
  dpr = Math.min(3, window.devicePixelRatio || 1);
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
}

function insets() {
  const cs = getComputedStyle(probe);
  return { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0 };
}

const world = new World(
  {
    onEat: (s) => audio.playNote(s.score - 1),
    onHit: () => audio.playLifeLost(),
    onKill: () => audio.playKill(),
    onWin: (score) => {
      audio.playWin();
      bankBest(score);
      saved.round = Math.min(progress.MAX_ROUND + 99, saved.round + 1);
      saved.fails = 0;
      progress.save(saved);
      showWin();
    },
    onGameOver: (score) => {
      audio.playGameOver();
      bankBest(score);
      saved.fails += 1;
      progress.save(saved);
      finalScore.textContent = String(score);
      bestEl.textContent = String(saved.best);
      overOverlay.classList.remove("gone");
    },
  },
  progress.roundConfig(saved.round, saved.fails),
  skinByName(saved.skin),
  saved.name,
);
world.round = saved.round;

const renderer = new Renderer();
const input = attachInput(canvas, () => ({ w, h, safeBottom: insets().bottom }), audio.unlock);

let started = false;
let last = performance.now();

function bankBest(score: number) {
  if (score > saved.best) saved.best = score;
}

function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const player = world.player;
  if (started && !world.over && !world.won) {
    if (input.angle !== null) player.targetAngle = input.angle;
    player.boosting = input.boosting;
  } else if (!started) {
    player.think(dt, world.pellets, world.snakes);
  }

  world.update(dt, now);
  renderer.draw(ctx, w, h, dpr, world, input, insets());
  requestAnimationFrame(frame);
}

/** A few beads and a face, so a five-year-old can choose by looking. */
function skinPreview(skin: Skin, size = 66): HTMLCanvasElement {
  const c = document.createElement("canvas");
  const scale = 2;
  c.width = size * scale;
  c.height = 40 * scale;
  c.style.width = `${size}px`;
  c.style.height = "40px";
  const x = c.getContext("2d")!;
  x.scale(scale, scale);
  const r = 11;
  for (let i = 5; i >= 0; i--) {
    x.fillStyle = skin.body[Math.floor(i / 2) % skin.body.length]!;
    x.beginPath();
    x.arc(8 + i * 8.5, 20 + Math.sin(i * 0.9) * 3.5, r, 0, Math.PI * 2);
    x.fill();
  }
  const hx = 8 + 5 * 8.5;
  const hy = 20 + Math.sin(5 * 0.9) * 3.5;
  for (const side of [-1, 1]) {
    x.fillStyle = "#fff";
    x.beginPath();
    x.arc(hx + 4, hy + side * 4.6, 3.6, 0, Math.PI * 2);
    x.fill();
    x.fillStyle = skin.eye;
    x.beginPath();
    x.arc(hx + 5.4, hy + side * 4.6, 1.9, 0, Math.PI * 2);
    x.fill();
  }
  return c;
}

function refreshStart() {
  const cfg = progress.roundConfig(saved.round, saved.fails);
  roundLine.textContent = `ROUND ${saved.round} · ${cfg.target} TO WIN`;

  skinRow.replaceChildren();
  for (const name of saved.unlocked) {
    const skin = skinByName(name);
    const b = document.createElement("button");
    b.type = "button";
    b.className = "skin";
    b.setAttribute("aria-label", skin.name);
    b.setAttribute("aria-pressed", String(name === saved.skin));
    b.append(skinPreview(skin, 58));
    b.addEventListener("click", () => {
      saved.skin = name;
      progress.save(saved);
      for (const other of skinRow.querySelectorAll(".skin")) other.setAttribute("aria-pressed", "false");
      b.setAttribute("aria-pressed", "true");
    });
    skinRow.append(b);
  }
  skinRow.classList.toggle("shown", saved.unlocked.length > 1);
}

function beginRound() {
  audio.unlock();
  audio.playStart();
  const name = tidyName(nameInput.value);
  saved.name = name;
  progress.save(saved);
  nameInput.value = name === "YOU" ? "" : name;
  syncPlayEnabled();

  world.playerName = name;
  world.round = saved.round;
  world.reset(progress.roundConfig(saved.round, saved.fails), skinByName(saved.skin));

  input.angle = null;
  started = true;
  startOverlay.classList.add("gone");
  wonOverlay.classList.add("gone");
  overOverlay.classList.add("gone");
  if (music.currentId()) music.select(BASE, music.currentId());
}

function showWin() {
  wonRound.textContent = String(world.round);
  const offers = progress.offerSkins(saved.unlocked);
  rewardRow.replaceChildren();

  if (!offers.length) {
    wonPrompt.textContent = "You have them all";
    rewardRow.classList.remove("shown");
    nextBtn.disabled = false;
  } else {
    wonPrompt.textContent = "Pick your new snake";
    rewardRow.classList.add("shown");
    nextBtn.disabled = true;
    for (const skin of offers) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "reward";
      b.setAttribute("aria-label", skin.name);
      b.setAttribute("aria-pressed", "false");
      b.append(skinPreview(skin, 78));
      b.addEventListener("click", () => {
        if (!saved.unlocked.includes(skin.name)) saved.unlocked.push(skin.name);
        saved.skin = skin.name;
        progress.save(saved);
        for (const other of rewardRow.querySelectorAll(".reward")) other.setAttribute("aria-pressed", "false");
        b.setAttribute("aria-pressed", "true");
        nextBtn.disabled = false;
        audio.playNote(2);
      });
      rewardRow.append(b);
    }
  }
  refreshStart();
  wonOverlay.classList.remove("gone");
}

function tidyName(raw: string) {
  return raw.trim().toUpperCase().slice(0, 10) || "YOU";
}

playBtn.addEventListener("click", beginRound);
againBtn.addEventListener("click", beginRound);
nextBtn.addEventListener("click", beginRound);

muteBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  audio.unlock();
  const next = !audio.isMuted();
  audio.setMuted(next);
  music.setMuted(next);
  muteBtn.textContent = next ? "🔇" : "🔊";
  muteBtn.setAttribute("aria-label", next ? "Turn sound on" : "Turn sound off");
});

window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => setTimeout(resize, 120));
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) last = performance.now();
});

function syncPlayEnabled() {
  playBtn.disabled = nameInput.value.trim().length === 0;
}
nameInput.addEventListener("input", syncPlayEnabled);

nameInput.value = saved.name === "YOU" ? "" : saved.name;
syncPlayEnabled();
bestEl.textContent = String(saved.best);
refreshStart();

void music.loadTracks(BASE).then((tracks) => {
  if (!tracks.length) return;
  const chosen = music.saved();
  const make = (id: string | null, text: string) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "track";
    b.textContent = text;
    b.setAttribute("aria-pressed", String(chosen === id));
    b.addEventListener("click", () => {
      audio.unlock();
      music.select(BASE, id);
      for (const other of trackRow.querySelectorAll(".track")) other.setAttribute("aria-pressed", "false");
      b.setAttribute("aria-pressed", "true");
    });
    return b;
  };
  trackRow.append(make(null, "None"), ...tracks.map((t) => make(t.id, t.title)));
  trackRow.classList.add("shown");
  if (chosen) music.select(BASE, chosen);
});

resize();
requestAnimationFrame(frame);

if (import.meta.env.DEV) {
  (window as unknown as { __noodle: unknown }).__noodle = {
    world,
    input,
    progress: () => saved,
    resetProgress: () => {
      saved = { round: 1, unlocked: [SKINS[0]!.name], skin: SKINS[0]!.name, best: 0, name: "YOU", fails: 0 };
      progress.save(saved);
      refreshStart();
    },
  };
}

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(`${BASE}sw.js`).then((reg) => {
      // Pick up a new build the next time the app is opened, not weeks later.
      void reg.update();
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    });
  });
}
