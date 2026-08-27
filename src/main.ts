import "./style.css";
import { World } from "./world";
import { Renderer } from "./render";
import { attachInput } from "./input";
import * as audio from "./audio";
import * as music from "./music";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d", { alpha: false })!;
const overlay = document.getElementById("start") as HTMLElement;
const playBtn = document.getElementById("play") as HTMLButtonElement;
const muteBtn = document.getElementById("mute") as HTMLButtonElement;
const probe = document.getElementById("probe") as HTMLElement;
const nameInput = document.getElementById("name") as HTMLInputElement;
const trackRow = document.getElementById("tracks") as HTMLElement;
const overOverlay = document.getElementById("over") as HTMLElement;
const finalScore = document.getElementById("finalscore") as HTMLElement;
const bestEl = document.getElementById("best") as HTMLElement;
const againBtn = document.getElementById("again") as HTMLButtonElement;

const BASE = import.meta.env.BASE_URL;
const NAME_KEY = "noodle.name";
const BEST_KEY = "noodle.best";

const store = {
  get(k: string, fallback: string) {
    try { return localStorage.getItem(k) ?? fallback; } catch { return fallback; }
  },
  set(k: string, v: string) {
    try { localStorage.setItem(k, v); } catch { /* private browsing */ }
  },
};

function tidyName(raw: string) {
  const t = raw.trim().toUpperCase().slice(0, 10);
  return t || "YOU";
}

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
  return {
    top: parseFloat(cs.paddingTop) || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
  };
}

const world = new World(
  {
    onEat: (s) => audio.playNote(s.score - 1),
    onHit: () => audio.playLifeLost(),
    onKill: () => audio.playKill(),
    onGameOver: (score) => {
      audio.playGameOver();
      const best = Math.max(score, Number(store.get(BEST_KEY, "0")) || 0);
      store.set(BEST_KEY, String(best));
      finalScore.textContent = String(score);
      bestEl.textContent = String(best);
      overOverlay.classList.remove("gone");
    },
  },
  tidyName(store.get(NAME_KEY, "YOU")),
);

const renderer = new Renderer();
const input = attachInput(canvas, () => ({ w, h, safeBottom: insets().bottom }), audio.unlock);

let started = false;
let last = performance.now();

function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const player = world.player;
  if (started) {
    if (input.angle !== null) player.targetAngle = input.angle;
    player.boosting = input.boosting;
  } else {
    player.think(dt, world.pellets, world.snakes);
  }

  world.update(dt, now);
  renderer.draw(ctx, w, h, dpr, world, input, insets());
  requestAnimationFrame(frame);
}

function beginRun() {
  audio.unlock();
  audio.playStart();
  const name = tidyName(nameInput.value);
  store.set(NAME_KEY, name);
  nameInput.value = name === "YOU" ? "" : name;
  world.playerName = name;
  world.reset();
  input.angle = null;
  started = true;
  overlay.classList.add("gone");
  overOverlay.classList.add("gone");
  if (music.currentId()) music.select(BASE, music.currentId());
}

playBtn.addEventListener("click", beginRun);
againBtn.addEventListener("click", beginRun);

muteBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  audio.unlock();
  const next = !audio.isMuted();
  audio.setMuted(next);
  muteBtn.textContent = next ? "🔇" : "🔊";
  music.setMuted(next);
  muteBtn.setAttribute("aria-label", next ? "Turn sound on" : "Turn sound off");
});

window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => setTimeout(resize, 120));
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) last = performance.now();
});

nameInput.value = (() => {
  const n = store.get(NAME_KEY, "YOU");
  return n === "YOU" ? "" : n;
})();
bestEl.textContent = store.get(BEST_KEY, "0");

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
  // Dev-only handle so automated checks can read game state.
  (window as unknown as { __noodle: unknown }).__noodle = { world, input, start: () => { started = true; } };
}

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
  });
}
