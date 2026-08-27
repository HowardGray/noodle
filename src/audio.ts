/**
 * Every apple plays the next note up a major pentatonic scale, so a good run
 * composes a little tune and nothing you can play sounds wrong.
 */
const ROOT = 261.63; // C4
const PENTATONIC = [0, 2, 4, 7, 9]; // major pentatonic, in semitones
const OCTAVES = 3;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function setMuted(v: boolean) {
  muted = v;
  if (master && ctx) master.gain.setTargetAtTime(v ? 0 : 0.9, ctx.currentTime, 0.02);
}

/** iOS will not make a sound until this runs inside a real user gesture. */
export function unlock() {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
}

function freqForStep(step: number): number {
  const wrapped = ((step % (PENTATONIC.length * OCTAVES)) + PENTATONIC.length * OCTAVES) % (PENTATONIC.length * OCTAVES);
  const degree = PENTATONIC[wrapped % PENTATONIC.length]!;
  const octave = Math.floor(wrapped / PENTATONIC.length);
  return ROOT * Math.pow(2, (degree + 12 * octave) / 12);
}

type ToneOptions = { freq: number; dur: number; gain: number; type: OscillatorType; glideTo?: number };

function tone({ freq, dur, gain, type, glideTo }: ToneOptions) {
  if (!ctx || !master || muted) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (glideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(glideTo, now + dur);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(gain, now + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(Math.min(6000, freq * 6), now);

  osc.connect(env).connect(filter).connect(master);
  osc.start(now);
  osc.stop(now + dur + 0.05);
}

/** The scale note for the nth apple. */
export function playNote(step: number) {
  const f = freqForStep(step);
  tone({ freq: f, dur: 0.55, gain: 0.22, type: "triangle" });
  tone({ freq: f * 2, dur: 0.32, gain: 0.06, type: "sine" });
}

/** A soft descending blip for biting your own tail. Never harsh. */
export function playClip() {
  tone({ freq: 320, dur: 0.28, gain: 0.16, type: "sine", glideTo: 150 });
}

/** A low, warm note for starting a run. */
export function playStart() {
  tone({ freq: ROOT / 2, dur: 0.7, gain: 0.16, type: "triangle" });
  tone({ freq: ROOT, dur: 0.5, gain: 0.1, type: "sine" });
}

/** A bright little three-note flourish when a bot bursts. */
export function playKill() {
  const base = ROOT * 1.5;
  [0, 4, 7].forEach((semi, i) => {
    setTimeout(() => tone({ freq: base * Math.pow(2, semi / 12), dur: 0.4, gain: 0.16, type: "triangle" }), i * 70);
  });
}

/** Two soft descending notes for losing a life. Disappointed, not punishing. */
export function playLifeLost() {
  tone({ freq: ROOT * 1.2, dur: 0.22, gain: 0.17, type: "triangle" });
  setTimeout(() => tone({ freq: ROOT * 0.9, dur: 0.34, gain: 0.15, type: "triangle" }), 130);
}

/** A gentle falling phrase at the end of a run. Never a buzzer. */
export function playGameOver() {
  [9, 7, 4, 0].forEach((semi, i) => {
    setTimeout(() => tone({ freq: ROOT * Math.pow(2, semi / 12), dur: 0.5, gain: 0.16, type: "triangle" }), i * 170);
  });
}

/** A rising flourish for winning a round. */
export function playWin() {
  [0, 4, 7, 12].forEach((semi, i) => {
    setTimeout(() => {
      tone({ freq: ROOT * Math.pow(2, semi / 12), dur: 0.5, gain: 0.18, type: "triangle" });
      tone({ freq: ROOT * 2 * Math.pow(2, semi / 12), dur: 0.3, gain: 0.06, type: "sine" });
    }, i * 130);
  });
}
