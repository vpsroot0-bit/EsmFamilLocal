import Sound from 'react-native-sound';
import { loadSettings } from './settings';

Sound.setCategory('Playback', false);

type SoundKey = 'start' | 'stop' | 'tick' | 'win' | 'join';

const FILES: Record<SoundKey, string> = {
  start: 'start.mp3',
  stop: 'stop.mp3',
  tick: 'tick.mp3',
  win: 'win.mp3',
  join: 'join.mp3',
};

const cache: Partial<Record<SoundKey, Sound>> = {};
let enabled = true;

export async function initSounds(): Promise<void> {
  try {
    const s = await loadSettings();
    enabled = s.soundEnabled;
  } catch {
    enabled = true;
  }

  // Preload all sounds. Failures are silent (e.g. missing asset in dev).
  (Object.keys(FILES) as SoundKey[]).forEach((key) => {
    const snd = new Sound(FILES[key], Sound.MAIN_BUNDLE, (err) => {
      if (err) {
        // eslint-disable-next-line no-console
        console.warn(`[sounds] failed to load ${FILES[key]}:`, err.message);
        return;
      }
      snd.setVolume(0.85);
      cache[key] = snd;
    });
  });
}

export function setSoundEnabled(v: boolean): void {
  enabled = !!v;
}

export function play(key: SoundKey): void {
  if (!enabled) return;
  const snd = cache[key];
  if (!snd) return;
  try {
    snd.stop(() => {
      snd.play();
    });
  } catch {
    /* ignore */
  }
}

export function release(): void {
  (Object.keys(cache) as SoundKey[]).forEach((k) => {
    try { cache[k]?.release(); } catch { /* ignore */ }
    delete cache[k];
  });
}
