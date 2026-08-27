import { SKINS, PLAYER_SKIN, PELLET_COLOURS, BOT_NAMES, type Skin } from "./skins";

export const ARENA_RADIUS = 1500;
export const BOT_COUNT = 9;
export const START_SEGMENTS = 12;
export const MIN_SEGMENTS = 8;

const BASE_SPEED = 165;
const BOOST_SPEED = 285;
const TURN_RATE = 3.6;        // radians per second
const BOOST_COST = 3.2;       // segments per second while boosting
const PATH_SAMPLE = 4;        // world units between recorded path points
const BUMP_LOSS = 5;          // segments dropped when the player bumps a snake
const BUMP_GRACE = 800;       // ms of safety after a bump, so it never repeats

export type Vec = { x: number; y: number };
export type Pellet = Vec & { r: number; colour: string; value: number };

let nextId = 1;

export class Snake {
  id = nextId++;
  x: number;
  y: number;
  angle: number;
  targetAngle: number;
  segments = START_SEGMENTS;
  boosting = false;
  score = 0;
  dead = false;
  graceUntil = 0;
  bumpFlash = 0;
  readonly isPlayer: boolean;
  readonly skin: Skin;
  readonly name: string;

  path: Vec[] = [];
  private beadCache: Vec[] = [];
  private boostDebt = 0;
  private wander = 0;
  private wanderTimer = 0;

  constructor(x: number, y: number, angle: number, skin: Skin, name: string, isPlayer = false) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.targetAngle = angle;
    this.skin = skin;
    this.name = name;
    this.isPlayer = isPlayer;
    for (let i = 0; i < 200; i++) {
      this.path.push({ x: x - Math.cos(angle) * i * PATH_SAMPLE, y: y - Math.sin(angle) * i * PATH_SAMPLE });
    }
    this.refreshBeads();
  }

  get radius() {
    return 11 + Math.min(15, this.segments * 0.055);
  }

  get spacing() {
    return this.radius * 0.62;
  }

  /** Bead centres from head to tail. Recomputed once a frame, then read many times. */
  beads(): Vec[] {
    return this.beadCache;
  }

  refreshBeads() {
    const out: Vec[] = [];
    const step = this.spacing;
    let need = 0;
    let travelled = 0;
    for (let i = 1; i < this.path.length && out.length < this.segments; i++) {
      const a = this.path[i - 1]!;
      const b = this.path[i]!;
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      if (d <= 0) continue;
      while (need <= travelled + d && out.length < this.segments) {
        const t = (need - travelled) / d;
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
        need += step;
      }
      travelled += d;
    }
    while (out.length < this.segments) out.push({ x: this.x, y: this.y });
    this.beadCache = out;
  }

  update(dt: number, now: number) {
    // turn toward the target, shortest way round
    let diff = this.targetAngle - this.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const max = TURN_RATE * dt;
    this.angle += Math.max(-max, Math.min(max, diff));

    const canBoost = this.segments > MIN_SEGMENTS + 2;
    const boosting = this.boosting && canBoost;
    const speed = boosting ? BOOST_SPEED : BASE_SPEED;

    if (boosting) {
      this.boostDebt += BOOST_COST * dt;
      while (this.boostDebt >= 1 && this.segments > MIN_SEGMENTS) {
        this.boostDebt -= 1;
        this.segments -= 1;
      }
    } else {
      this.boostDebt = 0;
    }

    this.x += Math.cos(this.angle) * speed * dt;
    this.y += Math.sin(this.angle) * speed * dt;

    // The wall never kills. It just will not let you through.
    const dist = Math.hypot(this.x, this.y);
    const limit = ARENA_RADIUS - this.radius;
    if (dist > limit) {
      const k = limit / dist;
      this.x *= k;
      this.y *= k;
      if (!this.isPlayer) this.targetAngle = Math.atan2(-this.y, -this.x);
    }

    const head = this.path[0]!;
    if (Math.hypot(this.x - head.x, this.y - head.y) >= PATH_SAMPLE) {
      this.path.unshift({ x: this.x, y: this.y });
    }
    const maxPath = Math.ceil((this.segments * this.spacing) / PATH_SAMPLE) + 8;
    if (this.path.length > maxPath) this.path.length = maxPath;

    if (this.bumpFlash > 0) this.bumpFlash = Math.max(0, this.bumpFlash - dt * 1000);
    void now;
  }

  /** Simple, cheerful, slightly incompetent. Bots dying is half the fun. */
  think(dt: number, pellets: Pellet[], others: Snake[]) {
    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.wanderTimer = 1.2 + Math.random() * 2.2;
      this.wander = (Math.random() - 0.5) * 1.8;
      this.boosting = Math.random() < 0.18;
    }

    let best: Pellet | null = null;
    let bestD = 420;
    for (const p of pellets) {
      const d = Math.hypot(p.x - this.x, p.y - this.y);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }

    let desired = best
      ? Math.atan2(best.y - this.y, best.x - this.x)
      : this.angle + this.wander * dt;

    // nudge away from anything large just ahead
    const aheadX = this.x + Math.cos(this.angle) * 90;
    const aheadY = this.y + Math.sin(this.angle) * 90;
    outer: for (const other of others) {
      if (other === this || other.dead) continue;
      for (const b of other.beads()) {
        if (Math.hypot(b.x - aheadX, b.y - aheadY) < other.radius + this.radius + 14) {
          desired = this.angle + (Math.random() < 0.5 ? 1 : -1) * 1.3;
          break outer;
        }
      }
    }

    if (Math.hypot(this.x, this.y) > ARENA_RADIUS - 220) {
      desired = Math.atan2(-this.y, -this.x);
    }
    this.targetAngle = desired;
  }
}

export type WorldEvents = {
  onEat: (snake: Snake) => void;
  onBump: () => void;
  onKill: () => void;
};

export class World {
  player: Snake;
  bots: Snake[] = [];
  pellets: Pellet[] = [];

  constructor(private events: WorldEvents) {
    this.player = new Snake(0, 0, 0, PLAYER_SKIN, "YOU", true);
    this.reset();
  }

  get snakes(): Snake[] {
    return [this.player, ...this.bots];
  }

  reset() {
    this.player = new Snake(0, 0, 0, PLAYER_SKIN, "YOU", true);
    this.bots = [];
    this.pellets = [];
    for (let i = 0; i < BOT_COUNT; i++) this.spawnBot();
    for (let i = 0; i < 380; i++) this.spawnPellet();
  }

  private randomPoint(minR = 0): Vec {
    const a = Math.random() * Math.PI * 2;
    const r = minR + Math.sqrt(Math.random()) * (ARENA_RADIUS - 120 - minR);
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }

  spawnPellet(at?: Vec, value = 1) {
    const p = at ?? this.randomPoint();
    this.pellets.push({
      x: p.x,
      y: p.y,
      r: value > 1 ? 9 : 6,
      colour: PELLET_COLOURS[Math.floor(Math.random() * PELLET_COLOURS.length)]!,
      value,
    });
  }

  spawnBot() {
    const p = this.randomPoint(420);
    const skin = SKINS[1 + Math.floor(Math.random() * (SKINS.length - 1))]!;
    const taken = new Set(this.bots.map((b) => b.name));
    const free = BOT_NAMES.filter((n) => !taken.has(n));
    const pool = free.length ? free : BOT_NAMES;
    const name = pool[Math.floor(Math.random() * pool.length)]!;
    const bot = new Snake(p.x, p.y, Math.random() * Math.PI * 2, skin, name);
    bot.segments = START_SEGMENTS + Math.floor(Math.random() * 30);
    this.bots.push(bot);
  }

  update(dt: number, now: number) {
    for (const s of this.snakes) s.update(dt, now);
    for (const s of this.snakes) s.refreshBeads();
    for (const bot of this.bots) bot.think(dt, this.pellets, this.snakes);

    this.eatPellets(this.player);
    for (const bot of this.bots) this.eatPellets(bot);

    this.collide(now);

    while (this.pellets.length < 380) this.spawnPellet();
    while (this.bots.length < BOT_COUNT) this.spawnBot();
  }

  private eatPellets(s: Snake) {
    const reach = s.radius + 10;
    for (let i = this.pellets.length - 1; i >= 0; i--) {
      const p = this.pellets[i]!;
      if (Math.hypot(p.x - s.x, p.y - s.y) < reach) {
        this.pellets.splice(i, 1);
        s.segments += p.value;
        s.score += p.value;
        if (s.isPlayer) this.events.onEat(s);
      }
    }
  }

  private collide(now: number) {
    // A bot that runs into anyone's body bursts into sweets.
    for (const bot of this.bots) {
      for (const other of this.snakes) {
        if (other === bot) continue;
        if (this.headHitsBody(bot, other)) {
          this.burst(bot);
          if (other.isPlayer) this.events.onKill();
          break;
        }
      }
    }
    this.bots = this.bots.filter((b) => !b.dead);

    // The player cannot die. Bumping costs a little length and pushes you off.
    if (now > this.player.graceUntil) {
      for (const bot of this.bots) {
        if (this.headHitsBody(this.player, bot)) {
          this.player.segments = Math.max(MIN_SEGMENTS, this.player.segments - BUMP_LOSS);
          this.player.graceUntil = now + BUMP_GRACE;
          this.player.bumpFlash = 400;
          this.player.angle += Math.PI * 0.6;
          this.player.targetAngle = this.player.angle;
          this.player.x -= Math.cos(this.player.angle) * 6;
          this.player.y -= Math.sin(this.player.angle) * 6;
          this.events.onBump();
          break;
        }
      }
    }
  }

  private headHitsBody(head: Snake, body: Snake): boolean {
    const reach = head.radius * 0.8 + body.radius * 0.85;
    const beads = body.beads();
    // skip the first few beads so grazing a head-on pass is forgiving
    for (let i = 3; i < beads.length; i++) {
      const b = beads[i]!;
      if (Math.hypot(b.x - head.x, b.y - head.y) < reach) return true;
    }
    return false;
  }

  private burst(s: Snake) {
    s.dead = true;
    const beads = s.beads();
    for (let i = 0; i < beads.length; i += 2) {
      const b = beads[i]!;
      this.spawnPellet({ x: b.x + (Math.random() - 0.5) * 18, y: b.y + (Math.random() - 0.5) * 18 }, 2);
    }
  }
}
