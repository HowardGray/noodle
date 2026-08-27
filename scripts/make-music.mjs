#!/usr/bin/env node
/**
 * Generates the background tracks with the ElevenLabs Music API and writes them
 * into public/music/, then rewrites tracks.json so the in-game picker sees them.
 *
 * Run it yourself, commit the result. A static site cannot call this API at
 * runtime without shipping the API key to every visitor.
 *
 *   ELEVENLABS_API_KEY=sk_... npm run music
 */
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "music");
const LENGTH_MS = 60_000;

const TRACKS = [
  {
    id: "meadow",
    title: "Meadow",
    prompt:
      "Cheerful instrumental loop for a children's arcade game. Bright marimba and soft synth bells, " +
      "major pentatonic, gentle bouncing rhythm, warm and friendly, no vocals, no drums, seamless loop.",
  },
  {
    id: "arcade",
    title: "Arcade",
    prompt:
      "Upbeat playful chiptune loop, 8-bit square and triangle leads, major key, bouncy and fun, " +
      "moderate tempo, no vocals, seamless loop for a snake arcade game.",
  },
  {
    id: "deepsea",
    title: "Deep Sea",
    prompt:
      "Calm dreamy underwater instrumental loop, soft bells, warm pads, slow gentle pulse, " +
      "curious and friendly rather than tense, no vocals, seamless loop.",
  },
  {
    id: "raceday",
    title: "Race Day",
    prompt:
      "Energetic light electronic instrumental loop, driving but friendly, clean bass and plucky synths, " +
      "major key, brisk tempo, suitable for a children's game, no vocals, seamless loop.",
  },
];

const key = process.env.ELEVENLABS_API_KEY;
if (!key) {
  console.error("Set ELEVENLABS_API_KEY first. See https://elevenlabs.io/app/settings/api-keys");
  process.exit(1);
}

await mkdir(OUT, { recursive: true });
const made = [];

for (const track of TRACKS) {
  process.stdout.write(`${track.id} … `);
  const res = await fetch("https://api.elevenlabs.io/v1/music", {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: track.prompt,
      model_id: "music_v2",
      music_length_ms: LENGTH_MS,
      output_format: "mp3_44100_128",
    }),
  });

  if (!res.ok) {
    console.error(`failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
    continue;
  }

  const file = `${track.id}.mp3`;
  await writeFile(join(OUT, file), Buffer.from(await res.arrayBuffer()));
  made.push({ id: track.id, title: track.title, file });
  console.log("ok");
}

await writeFile(join(OUT, "tracks.json"), `${JSON.stringify({ tracks: made }, null, 2)}\n`);
console.log(`\nWrote ${made.length} track(s) and tracks.json. Commit public/music/ to ship them.`);
