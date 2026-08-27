import "./style.css";
import { World } from "./world";
import { Renderer } from "./render";
import { attachInput } from "./input";
import * as audio from "./audio";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const ctx = canvas.getContext("2d", { alpha: false })!;
const overlay = document.getElementById("start") as HTMLElement;
const playBtn = document.getElementById("play") as HTMLButtonElement;
const muteBtn = document.getElementById("mute") as HTMLButtonElement;
const probe = document.getElementById("probe") as HTMLElement;

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

const world = new World({
  onEat: (s) => audio.playNote(s.score - 1),
  onBump: () => audio.playClip(),
  onKill: () => audio.playKill(),
});

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

playBtn.addEventListener("click", () => {
  audio.unlock();
  audio.playStart();
  world.reset();
  started = true;
  overlay.classList.add("gone");
});

muteBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  audio.unlock();
  const next = !audio.isMuted();
  audio.setMuted(next);
  muteBtn.textContent = next ? "🔇" : "🔊";
  muteBtn.setAttribute("aria-label", next ? "Turn sound on" : "Turn sound off");
});

window.addEventListener("resize", resize);
window.addEventListener("orientationchange", () => setTimeout(resize, 120));
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) last = performance.now();
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
