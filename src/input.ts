export type Stick = { ox: number; oy: number; x: number; y: number };

export type InputState = {
  angle: number | null;
  boosting: boolean;
  stick: Stick | null;
};

export type Controls = {
  p1: InputState;
  p2: InputState;
  setTwoPlayer(on: boolean): void;
};

export const MAX_STICK = 58;

/** Bottom-right, thumb-sized, and in the same place every time. */
export function boostButton(w: number, h: number, safeBottom: number) {
  const r = Math.max(46, Math.min(66, w * 0.13));
  return { x: w - r - 26, y: h - r - 26 - safeBottom, r };
}

const blank = (): InputState => ({ angle: null, boosting: false, stick: null });

const ARROWS: Record<string, number> = {
  ArrowUp: -Math.PI / 2, ArrowDown: Math.PI / 2, ArrowLeft: Math.PI, ArrowRight: 0,
};
const WASD: Record<string, number> = {
  KeyW: -Math.PI / 2, KeyS: Math.PI / 2, KeyA: Math.PI, KeyD: 0,
};

export function attachInput(
  el: HTMLElement,
  getSize: () => { w: number; h: number; safeBottom: number },
  onGesture: () => void,
): Controls {
  const p1 = blank();
  const p2 = blank();
  let twoPlayer = false;

  // --- touch / mouse joystick, player one only for now ---
  let stickId: number | null = null;
  let boostId: number | null = null;

  const onBoost = (x: number, y: number) => {
    const { w, h, safeBottom } = getSize();
    const b = boostButton(w, h, safeBottom);
    return Math.hypot(x - b.x, y - b.y) < b.r * 1.35;
  };

  el.addEventListener("pointerdown", (e) => {
    onGesture();
    el.setPointerCapture(e.pointerId);
    if (boostId === null && onBoost(e.clientX, e.clientY)) {
      boostId = e.pointerId;
      p1.boosting = true;
      return;
    }
    if (stickId === null) {
      stickId = e.pointerId;
      p1.stick = { ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY };
    }
  });

  el.addEventListener("pointermove", (e) => {
    if (e.pointerId !== stickId || !p1.stick) return;
    let dx = e.clientX - p1.stick.ox;
    let dy = e.clientY - p1.stick.oy;
    const d = Math.hypot(dx, dy);
    if (d > MAX_STICK) {
      dx = (dx / d) * MAX_STICK;
      dy = (dy / d) * MAX_STICK;
    }
    p1.stick.x = p1.stick.ox + dx;
    p1.stick.y = p1.stick.oy + dy;
    if (d > 8) p1.angle = Math.atan2(dy, dx);
  });

  const release = (e: PointerEvent) => {
    if (e.pointerId === stickId) {
      stickId = null;
      p1.stick = null;
    }
    if (e.pointerId === boostId) {
      boostId = null;
      p1.boosting = false;
    }
  };
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);

  // --- keyboard: arrows + space is player one, WASD + left shift is player two ---
  const isTyping = (t: EventTarget | null) =>
    t instanceof HTMLElement &&
    (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

  window.addEventListener("keydown", (e) => {
    if (isTyping(e.target)) return;

    const arrow = ARROWS[e.code];
    if (arrow !== undefined) {
      onGesture();
      p1.angle = arrow;
      e.preventDefault();
      return;
    }
    const wasd = WASD[e.code];
    if (wasd !== undefined) {
      onGesture();
      (twoPlayer ? p2 : p1).angle = wasd;
      e.preventDefault();
      return;
    }
    if (e.code === "Space") {
      p1.boosting = true;
      e.preventDefault();
      return;
    }
    if (e.code === "ShiftLeft") {
      (twoPlayer ? p2 : p1).boosting = true;
      e.preventDefault();
    }
  });

  window.addEventListener("keyup", (e) => {
    if (isTyping(e.target)) return;
    if (e.code === "Space") p1.boosting = false;
    if (e.code === "ShiftLeft") (twoPlayer ? p2 : p1).boosting = false;
  });

  document.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  document.addEventListener("gesturestart", (e) => e.preventDefault());

  return {
    p1,
    p2,
    setTwoPlayer(on: boolean) {
      twoPlayer = on;
      p2.angle = null;
      p2.boosting = false;
    },
  };
}
