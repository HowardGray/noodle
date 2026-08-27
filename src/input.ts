export type Stick = { ox: number; oy: number; x: number; y: number };

export type InputState = {
  angle: number | null;
  boosting: boolean;
  stick: Stick | null;
};

export const MAX_STICK = 58;

/** Bottom-right, thumb-sized, and in the same place every time. */
export function boostButton(w: number, h: number, safeBottom: number) {
  const r = Math.max(46, Math.min(66, w * 0.13));
  return { x: w - r - 26, y: h - r - 26 - safeBottom, r };
}

export function attachInput(
  el: HTMLElement,
  getSize: () => { w: number; h: number; safeBottom: number },
  onGesture: () => void,
): InputState {
  const state: InputState = { angle: null, boosting: false, stick: null };
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
      state.boosting = true;
      return;
    }
    if (stickId === null) {
      stickId = e.pointerId;
      state.stick = { ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY };
    }
  });

  el.addEventListener("pointermove", (e) => {
    if (e.pointerId !== stickId || !state.stick) return;
    let dx = e.clientX - state.stick.ox;
    let dy = e.clientY - state.stick.oy;
    const d = Math.hypot(dx, dy);
    if (d > MAX_STICK) {
      dx = (dx / d) * MAX_STICK;
      dy = (dy / d) * MAX_STICK;
    }
    state.stick.x = state.stick.ox + dx;
    state.stick.y = state.stick.oy + dy;
    if (d > 8) state.angle = Math.atan2(dy, dx);
  });

  const release = (e: PointerEvent) => {
    if (e.pointerId === stickId) {
      stickId = null;
      state.stick = null;
    }
    if (e.pointerId === boostId) {
      boostId = null;
      state.boosting = false;
    }
  };
  el.addEventListener("pointerup", release);
  el.addEventListener("pointercancel", release);

  const KEY_ANGLE: Record<string, number> = {
    ArrowUp: -Math.PI / 2, ArrowDown: Math.PI / 2, ArrowLeft: Math.PI, ArrowRight: 0,
    w: -Math.PI / 2, s: Math.PI / 2, a: Math.PI, d: 0,
  };
  const isTyping = (t: EventTarget | null) =>
    t instanceof HTMLElement &&
    (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);

  window.addEventListener("keydown", (e) => {
    // W, A, S, D and space steer the snake — but not while a name is being typed.
    if (isTyping(e.target)) return;
    onGesture();
    if (e.key === " " || e.key === "Shift") { state.boosting = true; e.preventDefault(); return; }
    const a = KEY_ANGLE[e.key];
    if (a !== undefined) { state.angle = a; e.preventDefault(); }
  });
  window.addEventListener("keyup", (e) => {
    if (isTyping(e.target)) return;
    if (e.key === " " || e.key === "Shift") state.boosting = false;
  });

  document.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  document.addEventListener("gesturestart", (e) => e.preventDefault());

  return state;
}
