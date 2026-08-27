import { SKINS } from "./skins";

const KEY = "noodle.progress";
export const MAX_ROUND = 10;
/** Three losses on the same round and it quietly gets easier. He is never told. */
export const EASE_AFTER = 3;

export type Saved = {
  round: number;
  unlocked: string[];
  skin: string;
  best: number;
  name: string;
  name2: string;
  twoPlayer: boolean;
  fails: number;
};

const DEFAULTS: Saved = {
  round: 1,
  unlocked: [SKINS[0]!.name],
  skin: SKINS[0]!.name,
  best: 0,
  name: "YOU",
  name2: "P2",
  twoPlayer: false,
  fails: 0,
};

export function load(): Saved {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<Saved>;
    const unlocked = Array.isArray(parsed.unlocked) && parsed.unlocked.length
      ? parsed.unlocked.filter((n) => SKINS.some((s) => s.name === n))
      : [...DEFAULTS.unlocked];
    return {
      round: Math.max(1, Number(parsed.round) || 1),
      unlocked: unlocked.length ? unlocked : [...DEFAULTS.unlocked],
      skin: unlocked.includes(parsed.skin ?? "") ? parsed.skin! : unlocked[0]!,
      best: Math.max(0, Number(parsed.best) || 0),
      name: typeof parsed.name === "string" && parsed.name ? parsed.name : DEFAULTS.name,
      name2: typeof parsed.name2 === "string" && parsed.name2 ? parsed.name2 : DEFAULTS.name2,
      twoPlayer: parsed.twoPlayer === true,
      fails: Math.max(0, Number(parsed.fails) || 0),
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function save(s: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private browsing */
  }
}

export type RoundConfig = { target: number; bots: number; hunterRate: number; eased: boolean };

/** Round 1 is close to unloseable on purpose — it is the tutorial. */
export function roundConfig(round: number, fails: number): RoundConfig {
  const eased = fails >= EASE_AFTER;
  const target = 10 + round * 5;
  const bots = Math.min(16, 7 + round);
  const hunterRate = Math.min(0.65, 0.16 + round * 0.05);
  return eased
    ? { target: Math.round(target * 0.75), bots: Math.max(6, bots - 3), hunterRate: Math.max(0.1, hunterRate - 0.18), eased }
    : { target, bots, hunterRate, eased };
}

/** Three locked skins to choose between, or fewer near the end. */
export function offerSkins(unlocked: string[], count = 3) {
  const locked = SKINS.filter((s) => !unlocked.includes(s.name));
  const pool = [...locked];
  const out: typeof SKINS = [];
  while (out.length < count && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]!);
  }
  return out;
}
