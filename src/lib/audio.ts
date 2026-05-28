import { Howl } from "howler";

type SoundName = "clue" | "success" | "click" | "scan";

const soundSources: Record<SoundName, string> = {
  clue: "/assets/audio/clue.wav",
  success: "/assets/audio/success.wav",
  click: "/assets/audio/click.wav",
  scan: "/assets/audio/scan.wav",
};

const cache = new Map<SoundName, Howl>();

export function playSound(name: SoundName) {
  try {
    let howl = cache.get(name);
    if (!howl) {
      howl = new Howl({ src: [soundSources[name]], volume: name === "success" ? 0.42 : 0.28 });
      cache.set(name, howl);
    }
    howl.play();
  } catch {
    // Audio should never block investigation flow.
  }
}
