import { ARENA } from "./skins";
import { ARENA_RADIUS, START_LIVES, type Snake, type World } from "./world";
import { boostButton, MAX_STICK, type InputState } from "./input";

const FONT = "ui-rounded, system-ui, -apple-system, 'Segoe UI', sans-serif";

export type Insets = { top: number; bottom: number };

function makeHexPattern(R: number): HTMLCanvasElement {
  const w = Math.sqrt(3) * R;
  const h = 3 * R;
  const c = document.createElement("canvas");
  c.width = Math.ceil(w);
  c.height = Math.ceil(h);
  const x = c.getContext("2d")!;
  x.fillStyle = ARENA.ground;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = ARENA.hex;
  x.lineWidth = 2;
  const hex = (cx: number, cy: number) => {
    x.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 90);
      const px = cx + R * Math.cos(a);
      const py = cy + R * Math.sin(a);
      if (i === 0) x.moveTo(px, py);
      else x.lineTo(px, py);
    }
    x.closePath();
    x.stroke();
  };
  for (const [cx, cy] of [[w / 2, 0], [w / 2, h], [0, h / 2], [w, h / 2], [w / 2, h / 2 + h]] as const) {
    hex(cx, cy);
  }
  return c;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, filled: boolean) {
  const h = w * 0.92;
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.42);
  ctx.bezierCurveTo(x - w * 0.62, y - h * 0.06, x - w * 0.30, y - h * 0.58, x, y - h * 0.20);
  ctx.bezierCurveTo(x + w * 0.30, y - h * 0.58, x + w * 0.62, y - h * 0.06, x, y + h * 0.42);
  ctx.closePath();
  ctx.lineJoin = "round";
  ctx.lineWidth = 3;
  ctx.strokeStyle = ARENA.hudShadow;
  ctx.stroke();
  ctx.fillStyle = filled ? "#FF5D5D" : "rgba(255,255,255,0.22)";
  ctx.fill();
}

function crown(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const h = w * 0.72;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y + h / 2);
  ctx.lineTo(x - w / 2, y - h / 2);
  ctx.lineTo(x - w / 4, y);
  ctx.lineTo(x, y - h * 0.62);
  ctx.lineTo(x + w / 4, y);
  ctx.lineTo(x + w / 2, y - h / 2);
  ctx.lineTo(x + w / 2, y + h / 2);
  ctx.closePath();
  ctx.lineJoin = "round";
  ctx.lineWidth = 3;
  ctx.strokeStyle = ARENA.hudShadow;
  ctx.stroke();
  ctx.fillStyle = "#FFE14D";
  ctx.fill();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, fill: string, align: CanvasTextAlign = "center") {
  ctx.font = `800 ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(3, size * 0.24);
  ctx.strokeStyle = ARENA.hudShadow;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

export class Renderer {
  private pattern: CanvasPattern | null = null;
  private hexTile = makeHexPattern(46);

  draw(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    dpr: number,
    world: World,
    input: InputState,
    insets: Insets,
  ) {
    const players = world.players;
    let camX = 0;
    let camY = 0;
    for (const p of players) {
      camX += p.x;
      camY += p.y;
    }
    camX /= players.length;
    camY /= players.length;

    let spread = 0;
    let biggest = 0;
    for (const p of players) {
      spread = Math.max(spread, Math.hypot(p.x - camX, p.y - camY) * 2);
      biggest = Math.max(biggest, p.segments);
    }
    // One camera holds everyone: pull back far enough to frame the pair.
    const view = Math.max(640 + Math.min(560, biggest * 2.2), spread * 1.25 + 280);
    const scale = Math.min(w, h) / view;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = ARENA.fog;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-camX, -camY);

    const halfW = w / 2 / scale;
    const halfH = h / 2 / scale;
    const left = camX - halfW;
    const top = camY - halfH;
    const right = camX + halfW;
    const bottom = camY + halfH;

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, ARENA_RADIUS, 0, Math.PI * 2);
    ctx.clip();
    if (!this.pattern) this.pattern = ctx.createPattern(this.hexTile, "repeat");
    ctx.fillStyle = this.pattern ?? ARENA.ground;
    ctx.fillRect(left, top, right - left, bottom - top);
    ctx.restore();

    ctx.strokeStyle = ARENA.edge;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(0, 0, ARENA_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    for (const p of world.pellets) {
      if (p.x < left - 20 || p.x > right + 20 || p.y < top - 20 || p.y > bottom + 20) continue;
      ctx.fillStyle = p.colour;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.beginPath();
      ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const bot of world.bots) this.drawSnake(ctx, bot, left, top, right, bottom);
    for (const p of players) this.drawSnake(ctx, p, left, top, right, bottom);

    ctx.restore();

    const toScreen = (x: number, y: number) => ({
      x: w / 2 + (x - camX) * scale,
      y: h / 2 + (y - camY) * scale,
    });
    // Names live in the world, so keep them out of the HUD band and on screen.
    const hudFloor = insets.top + 74;
    for (const s of world.snakes) {
      const p = toScreen(s.x, s.y);
      const ly = p.y - s.radius * scale - 15;
      if (p.x < -60 || p.x > w + 60 || ly < hudFloor || ly > h - insets.bottom - 20) continue;
      const lx = Math.max(44, Math.min(w - 44, p.x));
      label(ctx, s.name, lx, ly, s.isPlayer ? 15 : 13, s.isPlayer ? "#FFE14D" : "#FFFFFF");
    }

    this.drawHud(ctx, w, h, world, input, insets);
  }

  private drawSnake(ctx: CanvasRenderingContext2D, s: Snake, left: number, top: number, right: number, bottom: number) {
    const beads = s.beads();
    const r = s.radius;
    const colours = s.skin.body;
    const flash = s.bumpFlash > 0 ? s.bumpFlash / 400 : 0;

    for (let i = beads.length - 1; i >= 0; i--) {
      const b = beads[i]!;
      if (b.x < left - r * 2 || b.x > right + r * 2 || b.y < top - r * 2 || b.y > bottom + r * 2) continue;
      ctx.fillStyle = colours[Math.floor(i / 3) % colours.length]!;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fill();
      if (flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${flash * 0.55})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // head
    const hr = r * 1.1;
    ctx.fillStyle = colours[0]!;
    ctx.beginPath();
    ctx.arc(s.x, s.y, hr, 0, Math.PI * 2);
    ctx.fill();

    const dx = Math.cos(s.angle);
    const dy = Math.sin(s.angle);
    const px = -dy;
    const py = dx;
    for (const side of [-1, 1]) {
      const ex = s.x + px * side * hr * 0.46 + dx * hr * 0.34;
      const ey = s.y + py * side * hr * 0.46 + dy * hr * 0.34;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(ex, ey, hr * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = s.skin.eye;
      ctx.beginPath();
      ctx.arc(ex + dx * hr * 0.13, ey + dy * hr * 0.13, hr * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }

    if (s.boosting) {
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = hr * 0.16;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(s.x + dx * hr * 0.5, s.y + dy * hr * 0.5, hr * 0.28, s.angle - 1.0, s.angle + 1.0);
      ctx.stroke();
    }
  }

  private drawHud(ctx: CanvasRenderingContext2D, w: number, h: number, world: World, input: InputState, insets: Insets) {
    const player = world.player;

    label(ctx, String(world.score), w / 2, insets.top + 34, 46, "#FFFFFF");

    for (let i = 0; i < START_LIVES; i++) {
      heart(ctx, 24 + i * 24, insets.top + 82, 17, i < world.lives);
    }

    // How far through the round you are. Fills up, then you have won.
    const bw = Math.min(190, w * 0.44);
    const bx = (w - bw) / 2;
    const by = insets.top + 62;
    const frac = Math.max(0, Math.min(1, world.score / world.config.target));
    ctx.fillStyle = "rgba(12,46,52,0.38)";
    roundRect(ctx, bx, by, bw, 11, 5.5);
    ctx.fill();
    if (frac > 0) {
      ctx.fillStyle = frac >= 1 ? "#7CE8C8" : "#FFE14D";
      roundRect(ctx, bx, by, Math.max(11, bw * frac), 11, 5.5);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2;
    roundRect(ctx, bx, by, bw, 11, 5.5);
    ctx.stroke();
    label(ctx, `ROUND ${world.round}`, w / 2, by + 27, 12, "rgba(255,255,255,0.92)");

    const board = [...world.snakes].sort((a, b) => b.segments - a.segments).slice(0, 5);
    const rx = w - 14;
    let ry = insets.top + 20;
    crown(ctx, rx - 134, ry, 13);
    for (let i = 0; i < board.length; i++) {
      const s = board[i]!;
      const fill = s.isPlayer ? "#FFE14D" : "#FFFFFF";
      label(ctx, `${i + 1}`, rx - 120, ry, 13, fill, "left");
      label(ctx, s.name, rx - 102, ry, 13, fill, "left");
      label(ctx, String(s.segments), rx, ry, 13, fill, "right");
      ry += 19;
    }

    // minimap
    const mr = 42;
    const mx = 20 + mr;
    const my = h - insets.bottom - 26 - mr;
    ctx.fillStyle = "rgba(12,46,52,0.42)";
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();
    const mmap = (x: number, y: number) => ({ x: mx + (x / ARENA_RADIUS) * mr, y: my + (y / ARENA_RADIUS) * mr });
    for (const s of world.bots) {
      const p = mmap(s.x, s.y);
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    const pp = mmap(player.x, player.y);
    ctx.fillStyle = "#FFE14D";
    ctx.beginPath();
    ctx.arc(pp.x, pp.y, 3.6, 0, Math.PI * 2);
    ctx.fill();

    // joystick
    if (input.stick) {
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.beginPath();
      ctx.arc(input.stick.ox, input.stick.oy, MAX_STICK, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.beginPath();
      ctx.arc(input.stick.x, input.stick.y, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(46,127,138,0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // boost
    const b = boostButton(w, h, insets.bottom);
    ctx.fillStyle = input.boosting ? "rgba(255,225,77,0.55)" : "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = input.boosting ? "#2E7F8A" : "#FFFFFF";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const off of [-9, 5]) {
      ctx.beginPath();
      ctx.moveTo(b.x - 11, b.y + off + 6);
      ctx.lineTo(b.x, b.y + off - 4);
      ctx.lineTo(b.x + 11, b.y + off + 6);
      ctx.stroke();
    }
  }
}
